from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ScholarshipProfileUpdate(BaseModel):
    income_bracket: Optional[int] = None
    category: Optional[str] = None
    region: Optional[str] = None
    field_of_interest: Optional[str] = None

class ScholarshipResponse(BaseModel):
    id: int
    name: str
    provider: str
    grade_criteria: Optional[str] = None
    income_criteria: Optional[int] = None
    category_criteria: Optional[str] = None
    region_criteria: Optional[str] = None
    field_criteria: Optional[str] = None
    award_amount: float
    required_documents: List[str]
    deadline: datetime
    official_link: Optional[str] = None

    class Config:
        from_attributes = True

class ScholarshipMatchResponse(BaseModel):
    id: int
    scholarship: ScholarshipResponse
    matched_criteria: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
