from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ClassStudentResponse(BaseModel):
    student_id: int
    name: str
    email: str
    overall_mastery: float
    status_color: str # green, yellow, red, white (🟢, 🟡, 🔴, ⚪)
    completed_topics: List[str] = []

class ClassResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    student_count: int

    class Config:
        from_attributes = True

class ClassDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    students: List[ClassStudentResponse]

    class Config:
        from_attributes = True

class ClassroomPulse(BaseModel):
    on_track_count: int
    needs_attention_count: int
    high_risk_count: int

class RadarGroup(BaseModel):
    sub_issue: str # e.g. "Base case definition"
    description: str
    student_count: int
    students: List[Dict[str, Any]] # list of {"id": int, "name": str}

class ClassroomRadarResponse(BaseModel):
    topic_id: int
    topic_name: str
    radar_groups: List[RadarGroup]

class InterventionResponse(BaseModel):
    id: int
    class_id: int
    topic_id: int
    topic_name: str
    title: str
    issue_description: str
    suggested_action: str
    action_materials: List[Any]
    affected_students: List[Any]
    status: str # pending, accepted, modified, dismissed
    created_at: datetime

    class Config:
        from_attributes = True

class InterventionUpdateStatus(BaseModel):
    status: str # accepted, modified, dismissed
