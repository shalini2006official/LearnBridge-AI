from pydantic import BaseModel
from datetime import datetime

class StudyNoteCreate(BaseModel):
    topic_name: str
    notes_style: str # quick, detailed, exam, interview, beginner, revision

class StudyNoteResponse(BaseModel):
    id: int
    topic_name: str
    notes_style: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
