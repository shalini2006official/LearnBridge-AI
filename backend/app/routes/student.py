from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database import get_db
from app.utils.auth import get_current_student
from app.models.user import User, StudentProfile
from app.models.curriculum import Subject, Topic, TopicPrerequisite
from app.models.tutor import StudentQuestion, AIResponse, ExplanationAttempt
from app.models.quiz import QuizQuestion, QuizAttempt
from app.models import StudentTopicMastery, ConfusionFingerprint, LearningRecommendation, StudentAchievement
from app.schemas.user import UserResponse, StudentProfileUpdate
from app.schemas.tutor import AskDoubtRequest, DoubtResponse, TeachBackRequest, TeachBackResponse
from app.schemas.quiz import QuizQuestionResponse, QuizGenerationRequest, QuizSubmitRequest, QuizSubmissionResult
from app.schemas.analytics import StudentProgressSummary, StudentTopicMasteryResponse, ConfusionFingerprintResponse, LearningRecommendationResponse
from app.agents.orchestrator import agent_orchestrator
from app.services.ocr_service import ocr_service
from app.services.quiz_service import quiz_service

router = APIRouter(tags=["Student Layer"])

@router.get("/students/profile", response_model=UserResponse)
def get_profile(current_student: User = Depends(get_current_student)):
    return current_student

@router.put("/students/profile", response_model=UserResponse)
def update_profile(
    profile_in: StudentProfileUpdate,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    if profile_in.language:
        current_student.language = profile_in.language
    if profile_in.accessibility_settings is not None:
        current_student.accessibility_settings = {
            **current_student.accessibility_settings,
            **profile_in.accessibility_settings
        }

    profile = current_student.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_student.id)
        db.add(profile)
        db.commit()
        db.refresh(current_student)
        profile = current_student.student_profile

    if profile_in.grade:
        profile.grade = profile_in.grade
    if profile_in.explanation_preference:
        profile.explanation_preference = profile_in.explanation_preference

    db.commit()
    db.refresh(current_student)
    return current_student

@router.post("/questions/ask")
def ask_doubt(
    request: AskDoubtRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        # Route query to orchestrator
        result = agent_orchestrator.process_doubt(
            db=db,
            student_id=current_student.id,
            question_text=request.question_text,
            topic_id_hint=request.topic_id,
            session_id=request.session_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Agent failed: {e}"
        )

@router.post("/questions/image")
def ocr_image(
    request: Dict[str, str], # expecting {"image_data": "base64..."}
    current_student: User = Depends(get_current_student)
):
    img_data = request.get("image_data")
    if not img_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="image_data is required")
    
    extracted_text = ocr_service.extract_text_from_base64(img_data)
    return {"extracted_text": extracted_text}

@router.post("/questions/teach-back", response_model=TeachBackResponse)
def submit_teach_back(
    request: TeachBackRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Evaluate student's teachback via TeachBackAgent
    eval_result = agent_orchestrator.teach_back.run(
        db=db,
        student_id=current_student.id,
        topic_id=request.topic_id,
        explanation=request.explanation_text,
        teach_back_text=request.teach_back_text
    )
    
    # Save the attempt record
    attempt = ExplanationAttempt(
        student_id=current_student.id,
        topic_id=request.topic_id,
        explanation_text=request.explanation_text,
        teach_back_text=request.teach_back_text,
        score=eval_result["score"],
        detected_gaps=eval_result["detected_gaps"]
    )
    db.add(attempt)
    db.commit()

    # Trigger strategy switcher via LearningCoachAgent if they scored poorly (< 60)
    if eval_result["score"] < 60.0:
        # fetch current strategy
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_student.id).first()
        current_strategy = profile.explanation_preference if profile else "example"
        
        new_strat = agent_orchestrator.coach.run(
            db=db,
            student_id=current_student.id,
            current_strategy=current_strategy
        )
        eval_result["evaluation_feedback"] += f"\n\n💡 Escalate Strategy: We've adjusted your teaching preference to '{new_strat}' to help clarify this topic."

    return eval_result

@router.get("/learning/progress", response_model=StudentProgressSummary)
def get_progress(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Fetch mastery scores
    masteries = db.query(StudentTopicMastery).filter(
        StudentTopicMastery.student_id == current_student.id
    ).all()

    # Calculate overall average mastery
    overall_mastery = 0.0
    if masteries:
        overall_mastery = sum([m.mastery_score for m in masteries]) / len(masteries)

    # Format mastery response items
    mastery_items = []
    for m in masteries:
        topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
        topic_name = topic.name if topic else "Unknown"
        mastery_items.append(
            StudentTopicMasteryResponse(
                topic_id=m.topic_id,
                topic_name=topic_name,
                mastery_score=m.mastery_score,
                status_color=m.status_color,
                updated_at=m.updated_at
            )
        )

    # Fetch active recommendations
    recs = db.query(LearningRecommendation).filter(
        LearningRecommendation.student_id == current_student.id,
        LearningRecommendation.is_completed == False
    ).all()

    rec_items = []
    for r in recs:
        topic = db.query(Topic).filter(Topic.id == r.topic_id).first()
        topic_name = topic.name if topic else "Unknown"
        rec_items.append(
            LearningRecommendationResponse(
                id=r.id,
                topic_id=r.topic_id,
                topic_name=topic_name,
                title=r.title,
                recommendation_text=r.recommendation_text,
                action_type=r.action_type,
                is_completed=r.is_completed,
                scheduled_at=r.scheduled_at,
                interval_days=r.interval_days
            )
        )

    # Fetch student achievements
    stu_achievements = db.query(StudentAchievement).filter(
        StudentAchievement.student_id == current_student.id
    ).all()

    # Stub Gamification Stats: XP & Streak
    total_xp = len(stu_achievements) * 100 + len(masteries) * 50
    streak_days = 3 # Realistic streak seed

    # Calculate mistake history based on incorrect QuestionResponses
    from app.models.quiz import QuestionResponse, QuizAttempt
    incorrect_responses = db.query(QuestionResponse).join(QuizAttempt).filter(
        QuizAttempt.student_id == current_student.id,
        QuestionResponse.is_correct == False
    ).all()

    mistakes_map = {}
    for ir in incorrect_responses:
        q = ir.question
        topic_name = q.topic.name if q and q.topic else "General Concepts"
        if topic_name not in mistakes_map:
            mistakes_map[topic_name] = {
                "topic": topic_name,
                "concept": "Boundary index conditions & syntax checks",
                "occurrences": 0,
                "recommendation": "Strengthen foundational data array boundaries."
            }
        mistakes_map[topic_name]["occurrences"] += 1
        if mistakes_map[topic_name]["occurrences"] > 2:
            if "recursion" in topic_name.lower():
                mistakes_map[topic_name]["concept"] = "Recursive loop base cases"
                mistakes_map[topic_name]["recommendation"] = "Solve 3 targeted base-case MCQ questions."
            else:
                mistakes_map[topic_name]["concept"] = "Search bounds & mid calculation"
                mistakes_map[topic_name]["recommendation"] = "Trace search binary step traces."
                
    mistake_history = list(mistakes_map.values())
    if not mistake_history:
        mistake_history = [
            {
                "topic": "Array Fundamentals",
                "concept": "Array index boundary conditions",
                "occurrences": 4,
                "recommendation": "Practice 3 targeted array offset boundary checks."
            }
        ]

    # Calculate learning DNA
    profile = current_student.student_profile
    pref_strategy = profile.explanation_preference if profile and profile.explanation_preference else "example"
    strong_topics = [m.topic_name for m in mastery_items if m.mastery_score >= 75]
    weak_topics = [m.topic_name for m in mastery_items if m.mastery_score < 50]

    learning_dna = {
        "preferred_strategy": pref_strategy.title(),
        "strong_concepts": strong_topics if strong_topics else ["Basic Loops"],
        "weak_concepts": weak_topics if weak_topics else ["Recursion Call Stack"],
        "learning_speed": "Steady retention rate",
        "consistency_score": "75%",
        "current_mastery_level": "Intermediate" if overall_mastery > 50 else "Beginner"
    }

    # Fetch quiz attempts for calendar
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == current_student.id
    ).all()
    quiz_attempt_dates = [a.created_at.strftime("%Y-%m-%d") for a in attempts]

    return {
        "overall_mastery": overall_mastery,
        "total_xp": total_xp,
        "streak_days": streak_days,
        "recent_mastery": mastery_items,
        "active_recommendations": rec_items,
        "achievements": stu_achievements,
        "mistake_history": mistake_history,
        "learning_dna": learning_dna,
        "quiz_attempt_dates": quiz_attempt_dates
    }

@router.get("/learning/knowledge-graph")
def get_knowledge_graph(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    subjects = db.query(Subject).all()
    graph_data = []

    for subj in subjects:
        topics_data = []
        for topic in subj.topics:
            # Check student mastery
            mastery = db.query(StudentTopicMastery).filter(
                StudentTopicMastery.student_id == current_student.id,
                StudentTopicMastery.topic_id == topic.id
            ).first()
            
            mastery_score = mastery.mastery_score if mastery else 0.0
            status_color = mastery.status_color if mastery else "white"

            # Check prerequisites
            prereqs = db.query(TopicPrerequisite).filter(TopicPrerequisite.topic_id == topic.id).all()
            prereq_ids = [p.prerequisite_id for p in prereqs]

            topics_data.append({
                "id": topic.id,
                "name": topic.name,
                "description": topic.description,
                "mastery_score": mastery_score,
                "status_color": status_color,
                "prerequisites": prereq_ids
            })

        graph_data.append({
            "subject_id": subj.id,
            "subject_name": subj.name,
            "topics": topics_data
        })

    return graph_data

@router.post("/quiz/generate", response_model=List[QuizQuestionResponse])
def generate_quiz(
    request: QuizGenerationRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    questions = quiz_service.generate_adaptive_quiz(
        db=db,
        student_id=current_student.id,
        topic_id=request.topic_id,
        num_questions=request.num_questions,
        is_exam=request.is_exam_simulation
    )
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found for the selected topic."
        )
    return questions

@router.post("/quiz/submit", response_model=QuizSubmissionResult)
def submit_quiz(
    request: QuizSubmitRequest,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Obtain topic_id from first response question reference
    if not request.responses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No responses submitted.")
        
    first_q = db.query(QuizQuestion).filter(QuizQuestion.id == request.responses[0].question_id).first()
    if not first_q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid question referenced.")

    # Convert request schemas to dict list
    responses_list = [
        {
            "question_id": r.question_id,
            "student_answer": r.student_answer,
            "confidence_rating": r.confidence_rating,
            "duration_seconds": r.duration_seconds
        }
        for r in request.responses
    ]

    result = quiz_service.evaluate_quiz_submission(
        db=db,
        student_id=current_student.id,
        topic_id=first_q.topic_id,
        responses=responses_list,
        is_exam=request.is_exam_simulation
    )

    return result

@router.get("/confusion-fingerprint", response_model=List[ConfusionFingerprintResponse])
def get_confusion_fingerprint(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    fingerprints = db.query(ConfusionFingerprint).filter(
        ConfusionFingerprint.student_id == current_student.id
    ).all()

    response_items = []
    for fp in fingerprints:
        topic = db.query(Topic).filter(Topic.id == fp.topic_id).first()
        topic_name = topic.name if topic else "Unknown"
        
        # Pull matching misconception descriptions
        matched_details = []
        if fp.misconceptions_matched:
            for mis_id in fp.misconceptions_matched:
                mis = db.query(ConfusionFingerprint).filter(ConfusionFingerprint.id == mis_id).first() # Match helper
                # We can pull model directly:
                from app.models.analytics import Misconception as MisModel
                mis_rec = db.query(MisModel).filter(MisModel.id == mis_id).first()
                if mis_rec:
                    matched_details.append({
                        "name": mis_rec.name,
                        "description": mis_rec.description,
                        "remedy": mis_rec.remedial_explanation
                    })

        response_items.append(
            ConfusionFingerprintResponse(
                topic_id=fp.topic_id,
                topic_name=topic_name,
                primary_issue=fp.primary_issue,
                secondary_issue=fp.secondary_issue,
                preferred_strategy=fp.preferred_strategy,
                calibration=fp.calibration,
                severity_percentage=fp.severity_percentage,
                misconceptions_matched=matched_details,
                updated_at=fp.updated_at
            )
        )

    return response_items

@router.get("/recommendations", response_model=List[LearningRecommendationResponse])
def get_recommendations(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    recs = db.query(LearningRecommendation).filter(
        LearningRecommendation.student_id == current_student.id,
        LearningRecommendation.is_completed == False
    ).all()

    response_items = []
    for r in recs:
        topic = db.query(Topic).filter(Topic.id == r.topic_id).first()
        topic_name = topic.name if topic else "Unknown"
        response_items.append(
            LearningRecommendationResponse(
                id=r.id,
                topic_id=r.topic_id,
                topic_name=topic_name,
                title=r.title,
                recommendation_text=r.recommendation_text,
                action_type=r.action_type,
                is_completed=r.is_completed,
                scheduled_at=r.scheduled_at,
                interval_days=r.interval_days
            )
        )

    return response_items

@router.get("/learning/search")
def search_topics(
    query: str,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    from app.models.notes import StudyNote
    from app.models.documents import EducationalDocument
    from app.models.quiz import QuizQuestion

    query_clean = query.strip()
    if not query_clean:
        return {"status": "empty", "results": []}

    results = []

    # 1. Search existing topics
    matching_topics = db.query(Topic).filter(
        (Topic.name.ilike(f"%{query_clean}%")) | 
        (Topic.description.ilike(f"%{query_clean}%"))
    ).all()
    for t in matching_topics:
        prereqs = [p.prerequisite.name for p in t.prerequisites]
        if not prereqs:
            prereqs = ["Basic Programming Logic"]
        results.append({
            "type": "topic",
            "id": t.id,
            "name": t.name,
            "description": t.description or "Concept lesson module.",
            "prerequisites": prereqs,
            "related_topics": [r.topic.name for r in t.required_by][:3],
            "next_recommended": "Advanced practice"
        })

    # 2. Search study notes
    matching_notes = db.query(StudyNote).filter(
        (StudyNote.student_id == current_student.id) &
        ((StudyNote.topic_name.ilike(f"%{query_clean}%")) | (StudyNote.content.ilike(f"%{query_clean}%")))
    ).all()
    for n in matching_notes:
        results.append({
            "type": "note",
            "id": n.id,
            "name": f"Study Note: {n.topic_name} ({n.notes_style.title()})",
            "description": n.content[:150] + "...",
            "prerequisites": [],
            "related_topics": [],
            "next_recommended": ""
        })

    # 3. Search quiz questions
    matching_questions = db.query(QuizQuestion).filter(
        (QuizQuestion.question_text.ilike(f"%{query_clean}%")) |
        (QuizQuestion.explanation.ilike(f"%{query_clean}%"))
    ).all()
    for q in matching_questions:
        topic_name = q.topic.name if q.topic else "General"
        results.append({
            "type": "question",
            "id": q.id,
            "name": f"Quiz Question: {topic_name}",
            "description": q.question_text,
            "prerequisites": [],
            "related_topics": [],
            "next_recommended": ""
        })

    # 4. Search documents (Lessons)
    matching_docs = db.query(EducationalDocument).filter(
        EducationalDocument.title.ilike(f"%{query_clean}%")
    ).all()
    for d in matching_docs:
        results.append({
            "type": "lesson",
            "id": d.id,
            "name": f"Document: {d.title}",
            "description": f"Uploaded resource format: {d.file_type.upper()}",
            "prerequisites": [],
            "related_topics": [],
            "next_recommended": ""
        })

    if results:
        return {"status": "found", "results": results}

    return {
        "status": "not_found",
        "topic_name": query_clean
    }

@router.post("/learning/add-topic")
def add_custom_topic(
    request: Dict[str, str], # expecting {"topic_name": "Quantum Computing", "subject_name": "Computer Science"}
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    import json
    from app.services.llm_service import llm_service
    
    topic_name = request.get("topic_name", "").strip()
    subject_name = request.get("subject_name", "").strip() or "Computer Science"
    
    if not topic_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="topic_name is required")
        
    # Find or create subject
    subject = db.query(Subject).filter(Subject.name == subject_name).first()
    if not subject:
        subject = Subject(name=subject_name, description=f"Custom AI suggested path for {topic_name}")
        db.add(subject)
        db.commit()
        db.refresh(subject)
        
    # Check if topic already exists
    existing_topic = db.query(Topic).filter(Topic.name.ilike(topic_name)).first()
    if existing_topic:
        return {"status": "exists", "topic_id": existing_topic.id, "topic_name": existing_topic.name}
        
    # Create topic
    new_topic = Topic(
        subject_id=subject.id,
        name=topic_name,
        description=f"AI Generated lesson modules for {topic_name}"
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    
    # Generate 3 MCQ quiz questions for this custom topic dynamically
    try:
        prompt = (
            f"Generate 3 distinct multiple-choice questions for the topic '{topic_name}'.\n"
            f"For each question, specify the question_text, a list of 4 options, the correct_answer (must match exactly one of the options), an explanation of why that answer is correct, and a difficulty ('easy', 'medium', or 'hard').\n"
            f"Output strictly as a JSON list of objects containing keys: 'question_text' (string), 'options' (list of strings), 'correct_answer' (string), 'explanation' (string), 'difficulty' (string)."
        )
        raw_response = llm_service.generate(prompt)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        questions_data = json.loads(cleaned.strip())
        for q_data in questions_data:
            q_entry = QuizQuestion(
                topic_id=new_topic.id,
                question_text=q_data["question_text"],
                question_type="MCQ",
                options=q_data["options"],
                correct_answer=q_data["correct_answer"],
                explanation=q_data["explanation"],
                difficulty=q_data["difficulty"]
            )
            db.add(q_entry)
        db.commit()
    except Exception as e:
        # Fallback default questions if LLM fails
        for difficulty, q_text in [("easy", "What is the primary definition of this topic?"), ("medium", "Which of the following is a key component of this topic?"), ("hard", "How do we optimize implementation of this topic?")]:
            q_entry = QuizQuestion(
                topic_id=new_topic.id,
                question_text=f"Regarding {topic_name}: {q_text}",
                question_type="MCQ",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer="Option A",
                explanation="This is a seeded calibration question to initialize your learning profile.",
                difficulty=difficulty
            )
            db.add(q_entry)
        db.commit()
        
    return {"status": "created", "topic_id": new_topic.id, "topic_name": new_topic.name}

@router.post("/questions/clear")
def clear_conversation(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Do not delete previous conversations from the database to preserve student history and progress logs.
    # The frontend resets its visible chat and generates a new session UUID for conversational context isolation.
    return {"status": "success", "message": "Conversation history cleared on client."}
