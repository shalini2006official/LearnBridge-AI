from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class AskDoubtRequest(BaseModel):
    question_text: str
    topic_id: Optional[int] = None
    image_data: Optional[str] = None # Base64 encoded image string (optional)
    session_id: Optional[str] = None

class AIResponseData(BaseModel):
    id: int
    question_id: int
    response_text: str
    explanation_strategy: str
    source_citation: Optional[str] = None
    is_grounded: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DoubtResponse(BaseModel):
    id: int
    student_id: int
    topic_id: Optional[int] = None
    question_text: str
    image_path: Optional[str] = None
    created_at: datetime
    ai_response: Optional[AIResponseData] = None

    class Config:
        from_attributes = True

class TeachBackRequest(BaseModel):
    topic_id: int
    explanation_text: str
    teach_back_text: str

class TeachBackResponse(BaseModel):
    score: float
    detected_gaps: List[str]
    evaluation_feedback: str
