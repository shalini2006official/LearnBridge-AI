from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")  # 'student' or 'teacher'
    language = Column(String, default="en")   # 'en', 'hi', 'ta', 'kn', 'te', 'ml'
    accessibility_settings = Column(JSON, default=dict) # e.g., font_size, high_contrast, lite_mode
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    questions = relationship("StudentQuestion", back_populates="student")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    masteries = relationship("StudentTopicMastery", back_populates="student")
    confusion_fingerprints = relationship("ConfusionFingerprint", back_populates="student")
    recommendations = relationship("LearningRecommendation", back_populates="student")
    achievements = relationship("StudentAchievement", back_populates="student")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    grade = Column(String, nullable=True) # e.g., 'college', 'highschool'
    explanation_preference = Column(String, default="example") # 'technical', 'analogy', 'example', 'visual'
    confidence_history = Column(JSON, default=list) # records confidence over time
    income_bracket = Column(Integer, nullable=True) # self-reported max income
    category = Column(String, nullable=True)         # merit, need, disability, etc.
    region = Column(String, nullable=True)           # home region state/country
    field_of_interest = Column(String, nullable=True)# CS, Math, Physics, etc.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
