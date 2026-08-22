from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    students = relationship("ClassStudent", back_populates="class_obj", cascade="all, delete-orphan")
    insights = relationship("TeacherInsight", back_populates="class_obj", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="class_obj", cascade="all, delete-orphan")

class ClassStudent(Base):
    __tablename__ = "class_students"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    class_obj = relationship("Class", back_populates="students")
    student = relationship("User", foreign_keys=[student_id])

class TeacherInsight(Base):
    __tablename__ = "teacher_insights"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    insight_text = Column(Text, nullable=False)
    alert_level = Column(String, default="low") # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    class_obj = relationship("Class", back_populates="insights")
    topic = relationship("Topic")

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    issue_description = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    action_materials = Column(JSON, default=list) # Recommended books, video links, specific markdown chunks
    affected_students = Column(JSON, default=list)  # list of JSON objects: {"id": student_id, "name": student_name}
    status = Column(String, default="pending") # pending, accepted, modified, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    class_obj = relationship("Class", back_populates="interventions")
    topic = relationship("Topic")
