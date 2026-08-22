from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    badge_icon = Column(String, default="Award") # Lucide-react icon name
    xp_reward = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_achievements = relationship("StudentAchievement", back_populates="achievement", cascade="all, delete-orphan")

class StudentAchievement(Base):
    __tablename__ = "student_achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="student_achievements")
