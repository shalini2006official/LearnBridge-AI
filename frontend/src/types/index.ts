export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  language: string;
  accessibility_settings: {
    font_size: 'small' | 'medium' | 'large' | 'xlarge';
    high_contrast: boolean;
    lite_mode: boolean;
    tts_enabled?: boolean;
  };
  student_profile?: {
    grade: string;
    explanation_preference: 'technical' | 'analogy' | 'example' | 'visual';
    confidence_history: any[];
  };
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  topics: Topic[];
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
  mastery_score?: number;
  status_color?: 'green' | 'yellow' | 'red' | 'white';
  prerequisites: number[];
}

export interface QuizQuestion {
  id: number;
  topic_id: number;
  question_text: string;
  question_type: 'MCQ' | 'TF' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'CODING';
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionResponse {
  question_id: number;
  student_answer: string;
  confidence_rating: number;
  duration_seconds: number;
}

export interface QuestionResultDetail {
  question_id: number;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  confidence_rating?: number;
}

export interface QuizSubmissionResult {
  attempt_id: number;
  score: number;
  is_exam_simulation: boolean;
  created_at: string;
  details: QuestionResultDetail[];
  misconceptions_detected: string[];
  actionable_recommendations: string[];
}

export interface ConfusionFingerprint {
  topic_id: number;
  topic_name: string;
  primary_issue: string | null;
  secondary_issue: string | null;
  preferred_strategy: string;
  calibration: 'accurate' | 'overconfident' | 'underconfident';
  severity_percentage: number;
  misconceptions_matched: Array<{
    name: string;
    description: string;
    remedy: string;
  }>;
  updated_at: string;
}

export interface LearningRecommendation {
  id: number;
  topic_id: number;
  topic_name: string;
  title: string;
  recommendation_text: string;
  action_type: 'review' | 'practice' | 'prerequisite';
  is_completed: boolean;
  scheduled_at: string;
}

export interface Class {
  id: number;
  name: string;
  description?: string;
  student_count: number;
}

export interface ClassStudent {
  student_id: number;
  name: string;
  email: string;
  overall_mastery: number;
  status_color: 'green' | 'yellow' | 'red' | 'white';
  completed_topics?: string[];
}

export interface RadarGroup {
  sub_issue: string;
  description: string;
  student_count: number;
  students: Array<{ id: number; name: string }>;
}

export interface Intervention {
  id: number;
  class_id: number;
  topic_id: number;
  topic_name: string;
  title: string;
  issue_description: string;
  suggested_action: string;
  action_materials: string[];
  affected_students: Array<{ id: number; name: string }>;
  status: 'pending' | 'accepted' | 'modified' | 'dismissed';
  created_at: string;
}

export interface ClassroomRadarResponse {
  topic_id: number;
  topic_name: string;
  radar_groups: RadarGroup[];
}

export interface StudentProgressSummary {
  overall_mastery: number;
  total_xp: number;
  streak_days: number;
  recent_mastery: Array<{
    topic_id: number;
    topic_name: string;
    mastery_score: number;
    status_color: string;
    updated_at: string;
  }>;
  active_recommendations: LearningRecommendation[];
  achievements: Array<{
    id: number;
    achievement: {
      id: number;
      title: string;
      description: string;
      badge_icon: string;
      xp_reward: number;
    };
    earned_at: string;
  }>;
  mistake_history?: Array<{
    topic: string;
    concept: string;
    occurrences: number;
    recommendation: string;
  }>;
  learning_dna?: {
    preferred_strategy: string;
    strong_concepts: string[];
    weak_concepts: string[];
    learning_speed: string;
    consistency_score: string;
    current_mastery_level: string;
  };
  quiz_attempt_dates?: string[];
}

export interface Scholarship {
  id: number;
  name: string;
  provider: string;
  grade_criteria?: string;
  income_criteria?: number;
  category_criteria?: string;
  region_criteria?: string;
  field_criteria?: string;
  award_amount: number;
  required_documents: string[];
  deadline: string;
  official_link?: string;
}

export interface ScholarshipMatch {
  id: number;
  scholarship: Scholarship;
  matched_criteria?: string;
  status: 'suggested' | 'applied' | 'dismissed';
}

