from app.database import Base
from app.models.user import User, StudentProfile
from app.models.curriculum import Subject, Topic, TopicPrerequisite
from app.models.documents import EducationalDocument, DocumentChunk
from app.models.tutor import StudentQuestion, AIResponse, ExplanationAttempt
from app.models.quiz import QuizQuestion, QuizAttempt, QuestionResponse
from app.models.analytics import StudentTopicMastery, ConfusionFingerprint, Misconception, LearningRecommendation
from app.models.teacher import Class, ClassStudent, TeacherInsight, Intervention
from app.models.gamification import Achievement, StudentAchievement
from app.models.scholarship import Scholarship, ScholarshipMatch
from app.models.notes import StudyNote

__all__ = [
    "Base",
    "User",
    "StudentProfile",
    "Subject",
    "Topic",
    "TopicPrerequisite",
    "EducationalDocument",
    "DocumentChunk",
    "StudentQuestion",
    "AIResponse",
    "ExplanationAttempt",
    "QuizQuestion",
    "QuizAttempt",
    "QuestionResponse",
    "StudentTopicMastery",
    "ConfusionFingerprint",
    "Misconception",
    "LearningRecommendation",
    "Class",
    "ClassStudent",
    "TeacherInsight",
    "Intervention",
    "Achievement",
    "StudentAchievement",
    "Scholarship",
    "ScholarshipMatch",
    "StudyNote",
]
