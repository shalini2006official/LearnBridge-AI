from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class QuizQuestionResponse(BaseModel):
    id: int
    topic_id: int
    question_text: str
    question_type: str # MCQ, TF, FILL_BLANK, SHORT_ANSWER, CODING
    options: List[str]
    difficulty: str

    class Config:
        from_attributes = True

class QuizGenerationRequest(BaseModel):
    topic_id: int
    num_questions: int = 5
    is_exam_simulation: bool = False

class QuestionResponseRequest(BaseModel):
    question_id: int
    student_answer: str
    confidence_rating: Optional[int] = None # 1 to 5
    duration_seconds: int = 0

class QuizSubmitRequest(BaseModel):
    attempt_id: Optional[int] = None # Or generated on start
    responses: List[QuestionResponseRequest]
    is_exam_simulation: bool = False

class QuestionResultDetail(BaseModel):
    question_id: int
    question_text: str
    student_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    confidence_rating: Optional[int] = None

class QuizSubmissionResult(BaseModel):
    attempt_id: int
    score: float
    is_exam_simulation: bool
    created_at: datetime
    details: List[QuestionResultDetail]
    misconceptions_detected: List[str]
    actionable_recommendations: List[str]
