from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    provider = Column(String, nullable=False)
    grade_criteria = Column(String, nullable=True)     # e.g., 'college', 'highschool'
    income_criteria = Column(Integer, nullable=True)    # max household income allowed
    category_criteria = Column(String, nullable=True)  # merit, need, disability, community
    region_criteria = Column(String, nullable=True)    # e.g. 'Karnataka', 'National'
    field_criteria = Column(String, nullable=True)     # e.g. 'CS', 'Math', 'Physics'
    award_amount = Column(Float, default=0.0)
    required_documents = Column(JSON, default=list)    # list of required docs
    deadline = Column(DateTime, nullable=False)
    official_link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    matches = relationship("ScholarshipMatch", back_populates="scholarship", cascade="all, delete-orphan")

class ScholarshipMatch(Base):
    __tablename__ = "scholarship_matches"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    matched_criteria = Column(String, nullable=True)
    status = Column(String, default="suggested") # suggested, applied, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scholarship = relationship("Scholarship", back_populates="matches")
    student = relationship("User", foreign_keys=[student_id])
