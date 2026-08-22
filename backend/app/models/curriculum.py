from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="topics")
    questions = relationship("QuizQuestion", back_populates="topic", cascade="all, delete-orphan")
    masteries = relationship("StudentTopicMastery", back_populates="topic", cascade="all, delete-orphan")
    fingerprints = relationship("ConfusionFingerprint", back_populates="topic", cascade="all, delete-orphan")
    recommendations = relationship("LearningRecommendation", back_populates="topic", cascade="all, delete-orphan")
    misconceptions = relationship("Misconception", back_populates="topic", cascade="all, delete-orphan")

    # Self-referential prerequisite relationships
    prerequisites = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.topic_id",
        back_populates="topic",
        cascade="all, delete-orphan"
    )
    required_by = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.prerequisite_id",
        back_populates="prerequisite",
        cascade="all, delete-orphan"
    )

class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    prerequisite_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="prerequisites")
    prerequisite = relationship("Topic", foreign_keys=[prerequisite_id], back_populates="required_by")
