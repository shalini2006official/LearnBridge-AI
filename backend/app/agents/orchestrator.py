import json
import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.user import User, StudentProfile
from app.models.curriculum import Topic, Subject
from app.models.tutor import StudentQuestion, AIResponse
from app.models.analytics import ConfusionFingerprint, StudentTopicMastery, Misconception, LearningRecommendation
from app.models.gamification import Achievement, StudentAchievement
from app.services.ai_service import ai_service
from app.rag.vector_store import vector_store
from app.services.llm_service import llm_service

logger = logging.getLogger("learnbridge.agents.orchestrator")

def parse_llm_json(raw_text: str) -> Dict[str, Any]:
    """
    Strips markdown and parses raw text into a clean dict to avoid raw JSON rendering in the chat screen.
    """
    raw_clean = raw_text.strip()
    if raw_clean.startswith("```json"):
        raw_clean = raw_clean[7:]
    if raw_clean.startswith("```"):
        raw_clean = raw_clean[3:]
    if raw_clean.endswith("```"):
        raw_clean = raw_clean[:-3]
    raw_clean = raw_clean.strip()

    try:
        data = json.loads(raw_clean)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Regex fallback if LLM wraps JSON keys in plain text
    exp_match = re.search(r'"explanation"\s*:\s*"(.*?)"', raw_clean, re.DOTALL)
    if exp_match:
        val = exp_match.group(1).replace('\\"', '"').replace('\\n', '\n')
        return {
            "explanation": val,
            "strategy": "example",
            "topic": "General",
            "citation": "LearnBridge Sources",
            "is_grounded": True
        }

    # Fallback to direct text
    return {
        "explanation": raw_text,
        "strategy": "example",
        "topic": "General",
        "citation": "LearnBridge Sources",
        "is_grounded": True
    }

def get_gfg_link(topic_name: str) -> str:
    gfg_mappings = {
        "recursion": "[GeeksforGeeks - Recursion](https://www.geeksforgeeks.org/recursion/)",
        "binary search": "[GeeksforGeeks - Binary Search](https://www.geeksforgeeks.org/binary-search/)",
        "array fundamentals": "[GeeksforGeeks - Array Data Structure](https://www.geeksforgeeks.org/array-data-structure/)",
        "strings": "[GeeksforGeeks - String Data Structure](https://www.geeksforgeeks.org/string-data-structure/)",
        "linked lists": "[GeeksforGeeks - Linked List Data Structure](https://www.geeksforgeeks.org/linked-list-data-structure/)",
        "stacks": "[GeeksforGeeks - Stack Data Structure](https://www.geeksforgeeks.org/stack-data-structure/)",
        "queues": "[GeeksforGeeks - Queue Data Structure](https://www.geeksforgeeks.org/queue-data-structure/)",
        "trees": "[GeeksforGeeks - Tree Data Structure](https://www.geeksforgeeks.org/tree-data-structure/)",
        "graphs": "[GeeksforGeeks - Graph Data Structure](https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/)",
        "algorithms": "[GeeksforGeeks - Fundamentals of Algorithms](https://www.geeksforgeeks.org/fundamentals-of-algorithms/)"
    }
    name_lower = topic_name.lower()
    for key, link in gfg_mappings.items():
        if key in name_lower or name_lower in key:
            return link
    
    # Search fallback for custom topics
    clean_name = topic_name.replace(" ", "+")
    return f"[GeeksforGeeks - {topic_name.title()}](https://www.geeksforgeeks.org/search?q={clean_name})"

def get_yt_link(topic_name: str) -> str:
    yt_mappings = {
        "recursion": "[YouTube - Recursion Tutorial](https://www.youtube.com/results?search_query=recursion+programming+tutorial)",
        "binary search": "[YouTube - Binary Search Tutorial](https://www.youtube.com/results?search_query=binary+search+programming+tutorial)",
        "array fundamentals": "[YouTube - Array Fundamentals Tutorial](https://www.youtube.com/results?search_query=array+data+structure+tutorial)",
        "strings": "[YouTube - Strings Tutorial](https://www.youtube.com/results?search_query=strings+programming+tutorial)",
        "linked lists": "[YouTube - Linked Lists Tutorial](https://www.youtube.com/results?search_query=linked+list+data+structure+tutorial)",
        "stacks": "[YouTube - Stack Tutorial](https://www.youtube.com/results?search_query=stack+data+structure+tutorial)",
        "queues": "[YouTube - Queue Tutorial](https://www.youtube.com/results?search_query=queue+data+structure+tutorial)",
        "trees": "[YouTube - Tree Data Structure Tutorial](https://www.youtube.com/results?search_query=tree+data+structure+tutorial)",
        "graphs": "[YouTube - Graph Data Structure Tutorial](https://www.youtube.com/results?search_query=graph+data+structure+tutorial)",
        "algorithms": "[YouTube - Algorithms Course](https://www.youtube.com/results?search_query=algorithms+programming+course)"
    }
    name_lower = topic_name.lower()
    for key, link in yt_mappings.items():
        if key in name_lower or name_lower in key:
            return link
    clean_name = topic_name.replace(" ", "+")
    return f"[YouTube - {topic_name.title()} Video](https://www.youtube.com/results?search_query={clean_name}+tutorial)"


# ==========================================
# 1. TUTOR AGENT
# ==========================================
class TutorAgent:
    """
    Generates dynamic, patient, and multi-scaffolded explanations.
    Uses: Simple Explanation, Analogy, Example (with code), Step-by-Step, Common Mistake.
    """
    def run(self, db: Session, student_id: int, question: str, topic_name: str, strategy: str, language: str, context: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        # Fetch the last 3 messages on the same session for conversational memory context
        history_str = ""
        try:
            query = db.query(StudentQuestion).filter(StudentQuestion.student_id == student_id)
            if session_id:
                query = query.filter(StudentQuestion.session_id == session_id)
            recent_q = query.order_by(StudentQuestion.created_at.desc()).limit(3).all()
            
            if recent_q:
                recent_q.reverse()
                history_parts = []
                for q in recent_q:
                    ai_res = db.query(AIResponse).filter(AIResponse.question_id == q.id).first()
                    ans_text = ai_res.response_text[:200] + "..." if ai_res else "..."
                    history_parts.append(f"Student: {q.question_text}\nTutor: {ans_text}")
                history_str = "\n\nRecent Conversation History Context:\n" + "\n".join(history_parts)
        except Exception as e:
            logger.warning(f"Failed to fetch conversation history: {e}")

        is_full = (strategy == "full_concept") or ("full concept" in question.lower())
        
        if is_full:
            prompt = (
                f"You are the LearnBridge Personal Tutor explaining the topic '{topic_name}' in comprehensive depth.\n"
                f"Question: {question}\n"
                f"Preferred Language: {language}\n"
                f"Grounded context: {context}\n"
                f"{history_str}\n\n"
                f"Format your response strictly using this teaching outline:\n"
                f"1. **Detailed Explanation**: Provide a massive, comprehensive, and detailed conceptual explanation (make it big!).\n"
                f"2. **Code Syntax Example**: Provide a complete, detailed syntax code block (in Python, Java, C, or C++) representing the concept.\n"
                f"3. **Real-world Applications**: List 3 practical real-world production applications where this concept is utilized.\n"
                f"4. **Additional Reference Guides**: Direct references to relevant tutorials and videos."
            )
        else:
            prompt = (
                f"You are the LearnBridge Personal Tutor explaining the topic '{topic_name}' simply.\n"
                f"Question: {question}\n"
                f"Preferred Language: {language}\n"
                f"Grounded context: {context}\n"
                f"{history_str}\n\n"
                f"Format your response strictly using this teaching outline:\n"
                f"1. **Simple Explanation**: Define the concept patiently using accessible terms.\n"
                f"2. **Real-world Analogy**: Compare it to a real-world everyday object or pattern.\n"
                f"3. **Code/Practical Example**: Write a clean syntax code block (in Python, Java, or SQL as appropriate) demonstrating this.\n"
                f"4. **Step-by-Step Trace**: Outline exactly how the logic executes sequentially.\n"
                f"5. **Common Mistake**: Point out a standard pitfall students struggle with.\n"
                f"6. **Quick Check Question**: Ask a supportive diagnostic question to verify their understanding.\n"
                f"7. **Next Learning Step**: Advise what concept they should master next."
            )
        
        system_prompt = "You are LearnBridge AI, an expert encouraging personal teacher. Deliver clear structured lessons."
        raw_res = llm_service.generate(prompt, system_prompt)
        return parse_llm_json(raw_res)


# ==========================================
# 2. RAG AGENT
# ==========================================
class RAGAgent:
    """
    Retrieves grounded context chunks from the local vector database with metadata filtering.
    """
    def run(self, query: str, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        results = vector_store.search(query, top_k=2)
        if not results:
            return {
                "context": "",
                "citations": "LearnBridge Sources",
                "is_grounded": False
            }

        context_parts = []
        sources = []
        for r in results:
            # Metadata filter comparison if provided
            if topic_filter and topic_filter.lower() not in r.get("source", "").lower() and topic_filter.lower() not in r.get("text", "").lower():
                continue
            context_parts.append(r["text"])
            sources.append(f"{r['source']} (Chunk {r['chunk_id']})")

        if not context_parts:
            # fallback to unfiltered list
            context_parts = [r["text"] for r in results]
            sources = [f"{r['source']} (Chunk {r['chunk_id']})" for r in results]

        return {
            "context": "\n\n".join(context_parts),
            "citations": "Sources used: " + ", ".join(set(sources)),
            "is_grounded": True
        }


# ==========================================
# 3. RESEARCH AGENT
# ==========================================
class ResearchAgent:
    """
    Researches unknown/uncataloged topics by synthesizing broader world knowledge and returning real source citations.
    """
    def run(self, topic_name: str) -> Dict[str, Any]:
        raw_res = llm_service.research_topic(topic_name)
        return parse_llm_json(raw_res)


# ==========================================
# 4. PRACTICE AGENT
# ==========================================
class PracticeAgent:
    """
    Generates dynamic, customized MCQ questions using the LLM for topics with low banks.
    """
    def run(self, topic_name: str, count: int, difficulty: str) -> str:
        return llm_service.generate_quiz(topic_name, count, difficulty)


# ==========================================
# 5. NOTES AGENT
# ==========================================
class NotesAgent:
    """
    Generates structured, styled Study Notes (Cheat Sheets, Revision, Exam, or Interview style).
    """
    def run(self, topic_name: str, style: str) -> str:
        return llm_service.generate_notes(topic_name, style)


# ==========================================
# 6. LEARNING COACH AGENT
# ==========================================
class LearningCoachAgent:
    """
    Detects confusion patterns, manages strategy escalation, and provides supportive feedback.
    """
    def detect_confusion(self, query: str) -> bool:
        confusion_signals = [
            "don't understand", "confused", "explain again", "make it simple",
            "too hard", "stuck", "still confused", "what does this mean", "i am lost"
        ]
        q_lower = query.lower()
        return any(sig in q_lower for sig in confusion_signals)

    def run(self, db: Session, student_id: int, current_strategy: str) -> str:
        strategies = ["technical", "analogy", "example", "visual"]
        try:
            curr_idx = strategies.index(current_strategy)
            new_strategy = strategies[(curr_idx + 1) % len(strategies)]
        except ValueError:
            new_strategy = "analogy"
            
        # Persist escalated strategy preference to profile
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
        if profile:
            profile.explanation_preference = new_strategy
            db.commit()
            
        return new_strategy


# ==========================================
# 7. TEACH-BACK AGENT
# ==========================================
class TeachBackAgent:
    """
    Grades Student Feynman teach-back descriptions (0-100) and extracts conceptual gaps.
    """
    def run(self, db: Session, student_id: int, topic_id: int, explanation: str, teach_back_text: str) -> Dict[str, Any]:
        raw_res = llm_service.evaluate_teach_back(explanation, teach_back_text)
        try:
            eval_result = json.loads(raw_res)
        except Exception:
            eval_result = parse_llm_json(raw_res)

        score = eval_result.get("score", 60.0)
        gaps = eval_result.get("detected_gaps", [])

        if gaps and topic_id:
            fingerprint = db.query(ConfusionFingerprint).filter(
                ConfusionFingerprint.student_id == student_id,
                ConfusionFingerprint.topic_id == topic_id
            ).first()
            if not fingerprint:
                fingerprint = ConfusionFingerprint(
                    student_id=student_id,
                    topic_id=topic_id,
                    preferred_strategy="example",
                    calibration="accurate"
                )
                db.add(fingerprint)
            
            fingerprint.primary_issue = gaps[0] if len(gaps) > 0 else None
            fingerprint.secondary_issue = gaps[1] if len(gaps) > 1 else None
            fingerprint.severity_percentage = float(100.0 - score)
            
            misconception = db.query(Misconception).filter(
                Misconception.topic_id == topic_id
            ).first()
            if misconception and gaps:
                fingerprint.misconceptions_matched = [misconception.id]

            db.commit()

        return eval_result


# ==========================================
# 8. KNOWLEDGE GRAPH AGENT
# ==========================================
class KnowledgeGraphAgent:
    """
    Tracks prerequisites, calculates optimal next steps, and maps nodes to green/yellow/red/white masteries.
    """
    def run(self, db: Session, student_id: int, current_topic_id: int) -> Dict[str, Any]:
        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student_id).all()
        # Find next logical node where score < 70 or not started
        next_recommended = "Arrays"
        for m in masteries:
            if m.mastery_score < 70:
                topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
                if topic:
                    next_recommended = topic.name
                    break
        return {
            "mastery_count": len(masteries),
            "next_recommended": next_recommended
        }


# ==========================================
# 9. CENTRAL AI ORCHESTRATOR
# ==========================================
class AgentOrchestrator:
    def __init__(self):
        self.tutor = TutorAgent()
        self.rag = RAGAgent()
        self.research = ResearchAgent()
        self.practice = PracticeAgent()
        self.notes = NotesAgent()
        self.coach = LearningCoachAgent()
        self.teach_back = TeachBackAgent()
        self.graph = KnowledgeGraphAgent()

    def process_doubt(self, db: Session, student_id: int, question_text: str, topic_id_hint: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        # 1. Fetch student preferences
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
        user = db.query(User).filter(User.id == student_id).first()
        
        pref_strategy = profile.explanation_preference if profile else "example"
        lang = user.language if user else "en"

        # Determine target topic: prioritize explicit question keywords first
        topic = None
        text_lower = question_text.lower()
        all_topics = db.query(Topic).all()
        for t in all_topics:
            t_name_lower = t.name.lower()
            # Match by topic name or description keywords
            if t_name_lower in text_lower or (t_name_lower.rstrip('s') in text_lower and len(t_name_lower) > 4):
                topic = t
                break

        # If no local topic matches, try to extract custom concept from common question prefixes
        custom_concept = None
        if not topic:
            prefixes = [
                "what is a ", "what is an ", "what is ",
                "explain a ", "explain an ", "explain ",
                "teach me a ", "teach me an ", "teach me ",
                "how does a ", "how does an ", "how does ",
                "why does a ", "why does ", "tell me about ",
                "give me code for ", "give me code of "
            ]
            clean_q = question_text.strip().strip("?").lower()
            for p in prefixes:
                if clean_q.startswith(p):
                    candidate = clean_q[len(p):].strip()
                    stopwords = {
                        "again", "it", "this", "that", "more", "simply", "please", "here", "there", "about",
                        "me", "us", "them", "code", "java", "python", "c", "c++", "tamil", "english",
                        "step-by-step", "visually", "now", "then", "why", "how", "what", "who", "where"
                    }
                    candidate_words = set(candidate.split())
                    if not candidate_words.issubset(stopwords) and len(candidate) > 2:
                        custom_concept = candidate.title()
                    break

        # Fallback to topic_id_hint if no explicit topic or custom concept found
        if not topic and not custom_concept and topic_id_hint:
            topic = db.query(Topic).filter(Topic.id == topic_id_hint).first()

        topic_name = topic.name if topic else (custom_concept if custom_concept else "General Education")

        # 2. Confusion Escalation check (Learning Coach Agent)
        is_confused = self.coach.detect_confusion(question_text)
        if is_confused:
            pref_strategy = self.coach.run(db, student_id, pref_strategy)
            logger.info(f"Coach Agent detected student confusion. Escalating strategy to {pref_strategy}.")

        # 3. Retrieve Context (RAG Agent)
        rag_info = self.rag.run(question_text, topic.name if topic else None)
        context = rag_info["context"]
        citation = rag_info["citations"]
        is_grounded = rag_info["is_grounded"]

        # 4. If RAG is empty and topic matches unknown searches, execute Research Agent
        if not is_grounded and not topic:
            # If it's a topic that looks like a search, trigger research agent
            research_info = self.research.run(topic_name)
            context = research_info.get("classification", "Educational research topic synthesis.")
            citation = "Researched Web Sources"
            is_grounded = True

        # Always append targeted GeeksforGeeks and YouTube reference links to citations
        gfg_link = get_gfg_link(topic_name)
        yt_link = get_yt_link(topic_name)
        if citation and citation != "Researched Web Sources":
            citation = f"{citation}, {gfg_link}, {yt_link}"
        else:
            citation = f"{gfg_link}, {yt_link}"

        # 5. Generate Tutor Lesson (Tutor Agent)
        expl_data = self.tutor.run(db, student_id, question_text, topic_name, pref_strategy, lang, context, session_id)

        # 6. Save question entry to DB
        q_entry = StudentQuestion(
            student_id=student_id,
            topic_id=topic.id if topic else None,
            question_text=question_text,
            session_id=session_id
        )
        db.add(q_entry)
        db.commit()
        db.refresh(q_entry)

        res_entry = AIResponse(
            question_id=q_entry.id,
            response_text=expl_data["explanation"],
            explanation_strategy=pref_strategy,
            source_citation=citation,
            is_grounded=is_grounded
        )
        db.add(res_entry)
        db.commit()

        # Update confusion fingerprint severity mapping
        if is_confused and topic:
            fingerprint = db.query(ConfusionFingerprint).filter(
                ConfusionFingerprint.student_id == student_id,
                ConfusionFingerprint.topic_id == topic.id
            ).first()
            if fingerprint:
                fingerprint.severity_percentage = min(fingerprint.severity_percentage + 15.0, 100.0)
                db.commit()

        return {
            "question_id": q_entry.id,
            "topic_id": topic.id if topic else None,
            "topic_name": topic_name,
            "explanation": expl_data["explanation"],
            "strategy": pref_strategy,
            "citation": citation,
            "is_grounded": is_grounded,
            "badges_earned": []
        }

agent_orchestrator = AgentOrchestrator()
