from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class StudentQuestion(Base):
    __tablename__ = "student_questions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    question_text = Column(Text, nullable=False)
    image_path = Column(String, nullable=True)
    voice_path = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="questions")
    ai_response = relationship("AIResponse", back_populates="question", uselist=False, cascade="all, delete-orphan")

class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("student_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    response_text = Column(Text, nullable=False)
    explanation_strategy = Column(String, nullable=False) # technical, analogy, example, visual
    source_citation = Column(Text, nullable=True) # grounded source docs
    is_grounded = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    question = relationship("StudentQuestion", back_populates="ai_response")

class ExplanationAttempt(Base):
    __tablename__ = "explanation_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    explanation_text = Column(Text, nullable=False) # System's explanation
    teach_back_text = Column(Text, nullable=False)   # Student's response
    score = Column(Float, default=0.0)              # score 0 to 100
    detected_gaps = Column(JSON, default=list)      # list of specific gaps identified
    created_at = Column(DateTime, default=datetime.utcnow)
