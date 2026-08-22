from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class StudentTopicMastery(Base):
    __tablename__ = "student_topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    mastery_score = Column(Float, default=0.0) # 0 to 100
    status_color = Column(String, default="white") # green, yellow, red, white (🟢, 🟡, 🔴, ⚪)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="masteries")
    topic = relationship("Topic", back_populates="masteries")

class ConfusionFingerprint(Base):
    __tablename__ = "confusion_fingerprints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    primary_issue = Column(String, nullable=True) # e.g. "Base case"
    secondary_issue = Column(String, nullable=True) # e.g. "Recursive call order"
    preferred_strategy = Column(String, default="example")
    calibration = Column(String, default="accurate") # overconfident, underconfident, accurate
    severity_percentage = Column(Float, default=0.0) # 0 to 100 severity index of confusion
    misconceptions_matched = Column(JSON, default=list) # matched misconception IDs from library
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="confusion_fingerprints")
    topic = relationship("Topic", back_populates="fingerprints")

class Misconception(Base):
    __tablename__ = "misconceptions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False) # e.g. "Forgets base case"
    description = Column(Text, nullable=False)
    wrong_answer_pattern = Column(String, nullable=True) # text keyword or pattern
    remedial_explanation = Column(Text, nullable=False)

    # Relationships
    topic = relationship("Topic", back_populates="misconceptions")

class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    recommendation_text = Column(Text, nullable=False)
    action_type = Column(String, default="review") # review, practice, prerequisite
    is_completed = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    interval_days = Column(Integer, default=1) # SM-2 interval

    # Relationships
    student = relationship("User", back_populates="recommendations")
    topic = relationship("Topic", back_populates="recommendations")
