from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class StudentTopicMasteryResponse(BaseModel):
    topic_id: int
    topic_name: str
    mastery_score: float
    status_color: str # green, yellow, red, white (🟢, 🟡, 🔴, ⚪)
    updated_at: datetime

    class Config:
        from_attributes = True

class ConfusionFingerprintResponse(BaseModel):
    topic_id: int
    topic_name: str
    primary_issue: Optional[str] = None
    secondary_issue: Optional[str] = None
    preferred_strategy: str
    calibration: str
    severity_percentage: float
    misconceptions_matched: List[Any]
    updated_at: datetime

    class Config:
        from_attributes = True

class LearningRecommendationResponse(BaseModel):
    id: int
    topic_id: int
    topic_name: str
    title: str
    recommendation_text: str
    action_type: str
    is_completed: bool
    scheduled_at: datetime
    interval_days: int

    class Config:
        from_attributes = True

class AchievementResponse(BaseModel):
    id: int
    title: str
    description: str
    badge_icon: str
    xp_reward: int

    class Config:
        from_attributes = True

class StudentAchievementResponse(BaseModel):
    id: int
    achievement: AchievementResponse
    earned_at: datetime

    class Config:
        from_attributes = True

class StudentProgressSummary(BaseModel):
    overall_mastery: float
    total_xp: int
    streak_days: int
    recent_mastery: List[StudentTopicMasteryResponse]
    active_recommendations: List[LearningRecommendationResponse]
    achievements: List[StudentAchievementResponse]
    mistake_history: Optional[List[Any]] = None
    learning_dna: Optional[Any] = None
    quiz_attempt_dates: Optional[List[str]] = None
