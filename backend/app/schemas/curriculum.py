from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PrerequisiteResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class TopicResponse(TopicBase):
    id: int
    subject_id: int
    prerequisites: List[PrerequisiteResponse] = []

    class Config:
        from_attributes = True

class SubjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    topics: List[TopicResponse] = []

    class Config:
        from_attributes = True
