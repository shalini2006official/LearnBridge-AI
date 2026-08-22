from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "student" # student or teacher
    language: str = "en"

class UserCreate(UserBase):
    password: str
    grade: Optional[str] = "college"
    explanation_preference: Optional[str] = "example"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class StudentProfileResponse(BaseModel):
    grade: Optional[str] = None
    explanation_preference: str = "example"
    confidence_history: List[Any] = []

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    language: str
    accessibility_settings: Dict[str, Any]
    created_at: datetime
    student_profile: Optional[StudentProfileResponse] = None

    class Config:
        from_attributes = True

class StudentProfileUpdate(BaseModel):
    grade: Optional[str] = None
    explanation_preference: Optional[str] = None
    language: Optional[str] = None
    accessibility_settings: Optional[Dict[str, Any]] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
