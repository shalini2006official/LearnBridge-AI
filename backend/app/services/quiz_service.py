import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.quiz import QuizQuestion, QuizAttempt, QuestionResponse
from app.models.analytics import StudentTopicMastery, ConfusionFingerprint, Misconception, LearningRecommendation
from app.models.curriculum import Topic

logger = logging.getLogger("learnbridge.quiz")

class QuizService:
    def generate_adaptive_quiz(
        self, db: Session, student_id: int, topic_id: int, num_questions: int = 5, is_exam: bool = False
    ) -> List[QuizQuestion]:
        """
        Retrieves questions based on current mastery level.
        Mastery < 40 -> Easy (70%), Medium (30%)
        Mastery 40-75 -> Medium (70%), Easy/Hard (30%)
        Mastery > 75 -> Hard (70%), Medium (30%)
        If is_exam is True: standard split regardless of mastery.
        """
        # Fetch current mastery
        mastery_record = db.query(StudentTopicMastery).filter(
            StudentTopicMastery.student_id == student_id,
            StudentTopicMastery.topic_id == topic_id
        ).first()
        
        mastery = mastery_record.mastery_score if mastery_record else 0.0

        # Query questions for the topic
        questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).all()
        
        if len(questions) < num_questions:
            # Dynamically generate extra questions using LLM
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            topic_name = topic.name if topic else "General Coding"
            try:
                from app.services.llm_service import llm_service
                import json
                needed_count = num_questions - len(questions)
                mcq_payload = llm_service.generate_quiz(topic_name, max(needed_count, 3), "medium")
                cleaned = mcq_payload.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                
                q_list = json.loads(cleaned.strip())
                for q_item in q_list:
                    opts = q_item.get("options", {})
                    if isinstance(opts, list) and len(opts) >= 4:
                        opt_a, opt_b, opt_c, opt_d = opts[0], opts[1], opts[2], opts[3]
                    elif isinstance(opts, dict):
                        opt_a = opts.get("A") or opts.get("a") or "Option A"
                        opt_b = opts.get("B") or opts.get("b") or "Option B"
                        opt_c = opts.get("C") or opts.get("c") or "Option C"
                        opt_d = opts.get("D") or opts.get("d") or "Option D"
                    else:
                        opt_a = "Option A"
                        opt_b = "Option B"
                        opt_c = "Option C"
                        opt_d = "Option D"
                        
                    db_q = QuizQuestion(
                        topic_id=topic_id,
                        question_text=q_item.get("question_text") or q_item.get("question") or "Identify correct behavior.",
                        options=[opt_a, opt_b, opt_c, opt_d],
                        correct_answer=q_item.get("correct_answer") or q_item.get("correct") or "A",
                        explanation=q_item.get("explanation", "Grounded fallback explanation details."),
                        difficulty="medium"
                    )
                    db.add(db_q)
                db.commit()
                # Re-query
                questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).all()
            except Exception as ex:
                logger.error(f"Failed to generate dynamic quiz questions via LLM: {ex}. Triggering OfflineFallbackService.")
                try:
                    from app.services.ai_service import OfflineFallbackService
                    fallback = OfflineFallbackService()
                    fallback_prompt = f"generate_quiz topic '{topic_name}' count {needed_count}"
                    mcq_payload = fallback.generate(fallback_prompt)
                    
                    cleaned = mcq_payload.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                        
                    q_list = json.loads(cleaned.strip())
                    for q_item in q_list:
                        opts = q_item.get("options", [])
                        if isinstance(opts, list) and len(opts) >= 4:
                            opt_a, opt_b, opt_c, opt_d = opts[0], opts[1], opts[2], opts[3]
                        else:
                            opt_a = "A) Constant access bounds."
                            opt_b = "B) Deprecated storage allocations."
                            opt_c = "C) Thread synchronization locks."
                            opt_d = "D) Factorial execution scaling."
                            
                        db_q = QuizQuestion(
                            topic_id=topic_id,
                            question_text=q_item.get("question_text") or "Identify correct design constraint.",
                            options=[opt_a, opt_b, opt_c, opt_d],
                            correct_answer=q_item.get("correct_answer") or "A",
                            explanation=q_item.get("explanation", "Correct selection verification description."),
                            difficulty="medium"
                        )
                        db.add(db_q)
                    db.commit()
                    # Re-query
                    questions = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).all()
                except Exception as inner_ex:
                    logger.error(f"Offline quiz fallback generation failed: {inner_ex}")
                
        if not questions:
            return []

        # If it's an exam simulation, just return a random sample of all questions
        if is_exam or len(questions) <= num_questions:
            import random
            return random.sample(questions, min(len(questions), num_questions))

        # Separate questions by difficulty
        easy_q = [q for q in questions if q.difficulty == "easy"]
        med_q = [q for q in questions if q.difficulty == "medium"]
        hard_q = [q for q in questions if q.difficulty == "hard"]

        # Default fallbacks if certain difficulty buckets are empty
        if not easy_q: easy_q = questions
        if not med_q: med_q = questions
        if not hard_q: hard_q = questions

        selected = []
        import random

        if mastery < 40.0:
            # Easy-scaffolded
            easy_count = int(num_questions * 0.7)
            med_count = num_questions - easy_count
            selected.extend(random.sample(easy_q, min(len(easy_q), easy_count)))
            selected.extend(random.sample(med_q, min(len(med_q), med_count)))
        elif mastery > 75.0:
            # Challenge-scaffolded
            hard_count = int(num_questions * 0.7)
            med_count = num_questions - hard_count
            selected.extend(random.sample(hard_q, min(len(hard_q), hard_count)))
            selected.extend(random.sample(med_q, min(len(med_q), med_count)))
        else:
            # Medium-scaffolded
            med_count = int(num_questions * 0.6)
            easy_count = int(num_questions * 0.2)
            hard_count = num_questions - med_count - easy_count
            selected.extend(random.sample(med_q, min(len(med_q), med_count)))
            selected.extend(random.sample(easy_q, min(len(easy_q), easy_count)))
            selected.extend(random.sample(hard_q, min(len(hard_q), hard_count)))

        # Fill up if we are short due to limited questions in some lists
        if len(selected) < num_questions:
            remaining = [q for q in questions if q not in selected]
            needed = num_questions - len(selected)
            selected.extend(random.sample(remaining, min(len(remaining), needed)))

        return selected[:num_questions]

    def evaluate_quiz_submission(
        self, db: Session, student_id: int, topic_id: int, responses: List[Dict[str, Any]], is_exam: bool = False
    ) -> Dict[str, Any]:
        """
        Submits and evaluates answers, tracks student confidence levels,
        maps wrong answers to misconception patterns, updates topic mastery score,
        and generates spaced-repetition schedules.
        """
        # Create QuizAttempt
        attempt = QuizAttempt(
            student_id=student_id,
            is_exam_simulation=is_exam,
            score=0.0
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        correct_count = 0
        total_questions = len(responses)
        details = []
        misconceptions_detected = []
        
        # Track confidence values for calibration diagnostic
        # overconfident = rating is high (4 or 5) but response is wrong
        # underconfident = rating is low (1 or 2) but response is correct
        overconfident_counts = 0
        underconfident_counts = 0
        total_confidence = 0

        for r in responses:
            question_id = r["question_id"]
            student_answer = r["student_answer"].strip()
            confidence_rating = r.get("confidence_rating", 3)
            duration = r.get("duration_seconds", 0)

            total_confidence += confidence_rating

            # Fetch question
            question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
            if not question:
                continue

            is_correct = (student_answer.lower() == question.correct_answer.lower())
            if is_correct:
                correct_count += 1
                if confidence_rating <= 2:
                    underconfident_counts += 1
            else:
                if confidence_rating >= 4:
                    overconfident_counts += 1

                # Diagnose misconception
                misconceptions = db.query(Misconception).filter(Misconception.topic_id == topic_id).all()
                for mis in misconceptions:
                    # Match answer contents to typical misconceptions
                    if mis.wrong_answer_pattern and mis.wrong_answer_pattern.lower() in student_answer.lower():
                        misconceptions_detected.append(mis.name)
                        break

            # Save QuestionResponse
            q_res = QuestionResponse(
                quiz_attempt_id=attempt.id,
                question_id=question_id,
                student_answer=student_answer,
                is_correct=is_correct,
                confidence_rating=confidence_rating,
                duration_seconds=duration
            )
            db.add(q_res)

            details.append({
                "question_id": question_id,
                "question_text": question.question_text,
                "student_answer": student_answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "explanation": question.explanation,
                "confidence_rating": confidence_rating
            })

        # Calculate final percentage
        percentage_score = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0
        attempt.score = percentage_score
        db.commit()

        # Update topic mastery score (rolling average weight)
        mastery = db.query(StudentTopicMastery).filter(
            StudentTopicMastery.student_id == student_id,
            StudentTopicMastery.topic_id == topic_id
        ).first()

        if not mastery:
            mastery = StudentTopicMastery(
                student_id=student_id,
                topic_id=topic_id,
                mastery_score=0.0
            )
            db.add(mastery)

        # Decay previous mastery and mix in new score
        previous_score = mastery.mastery_score
        mastery.mastery_score = (previous_score * 0.4) + (percentage_score * 0.6)
        
        # Color coding: 🟢 (green) >= 75, 🟡 (yellow) 40-75, 🔴 (red) < 40
        if mastery.mastery_score >= 75.0:
            mastery.status_color = "green"
        elif mastery.mastery_score >= 40.0:
            mastery.status_color = "yellow"
        else:
            mastery.status_color = "red"
        
        db.commit()

        # Update student confusion fingerprint calibration state
        calibration = "accurate"
        if overconfident_counts > underconfident_counts and overconfident_counts >= 1:
            calibration = "overconfident"
        elif underconfident_counts > overconfident_counts and underconfident_counts >= 1:
            calibration = "underconfident"

        fingerprint = db.query(ConfusionFingerprint).filter(
            ConfusionFingerprint.student_id == student_id,
            ConfusionFingerprint.topic_id == topic_id
        ).first()

        if not fingerprint:
            fingerprint = ConfusionFingerprint(
                student_id=student_id,
                topic_id=topic_id
            )
            db.add(fingerprint)

        fingerprint.calibration = calibration
        fingerprint.severity_percentage = float(100.0 - mastery.mastery_score)
        
        # Identify main issue
        if misconceptions_detected:
            fingerprint.primary_issue = misconceptions_detected[0]
            if len(misconceptions_detected) > 1:
                fingerprint.secondary_issue = misconceptions_detected[1]
        elif percentage_score < 100.0:
            fingerprint.primary_issue = "Boundary Case and Implementation Details"
        else:
            fingerprint.primary_issue = None
            fingerprint.secondary_issue = None

        db.commit()

        # Generate Actionable Spaced-Repetition Recommendation
        recommendations = []
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        topic_name = topic.name if topic else "Topic"

        if percentage_score < 75.0:
            # Create a review recommendation in 1 day (SuperMemo-2 level 1)
            days = 1
            rec = LearningRecommendation(
                student_id=student_id,
                topic_id=topic_id,
                title=f"Review Weaknesses: {topic_name}",
                recommendation_text=(
                    f"You scored {percentage_score:.1f}% in {topic_name}. "
                    f"Review the concept using Analogy/Example strategies. Focus on: "
                    f"{', '.join(misconceptions_detected) if misconceptions_detected else 'solving boundary case questions'}."
                ),
                action_type="review",
                is_completed=False,
                scheduled_at=datetime.utcnow() + timedelta(days=days),
                interval_days=days
            )
            db.add(rec)
            recommendations.append(rec.recommendation_text)
        else:
            # Mastered! Recommend advanced practice or next spaced interval in 7 days
            days = 7
            rec = LearningRecommendation(
                student_id=student_id,
                topic_id=topic_id,
                title=f"Spaced Re-Practice: {topic_name}",
                recommendation_text=(
                    f"Excellent job! Keep your knowledge active. Scheduled for spaced practice "
                    f"in {days} days to lock the concept into long-term memory."
                ),
                action_type="practice",
                is_completed=False,
                scheduled_at=datetime.utcnow() + timedelta(days=days),
                interval_days=days
            )
            db.add(rec)
            recommendations.append(rec.recommendation_text)

        db.commit()

        return {
            "attempt_id": attempt.id,
            "score": percentage_score,
            "is_exam_simulation": is_exam,
            "created_at": attempt.created_at,
            "details": details,
            "misconceptions_detected": misconceptions_detected,
            "actionable_recommendations": recommendations
        }

# Singleton instance
quiz_service = QuizService()
