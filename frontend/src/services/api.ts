const API_BASE = 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text() || 'Registration failed');
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text() || 'Login failed');
    return res.json();
  },

  // Student Profile
  async getProfile() {
    const res = await fetch(`${API_BASE}/students/profile`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch(`${API_BASE}/students/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // AI Tutor / Doubt Solving
  async askDoubt(questionText: string, topicId?: number, sessionId?: string) {
    const res = await fetch(`${API_BASE}/questions/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question_text: questionText, topic_id: topicId, session_id: sessionId }),
    });
    if (!res.ok) throw new Error('Failed to submit question');
    return res.json();
  },

  async clearConversation() {
    const res = await fetch(`${API_BASE}/questions/clear`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear conversation');
    return res.json();
  },

  async researchUnknownTopic(topicName: string) {
    const res = await fetch(`${API_BASE}/learning/research?topic_name=${encodeURIComponent(topicName)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to research topic');
    return res.json();
  },

  async getVideoScript(topicName: string) {
    const res = await fetch(`${API_BASE}/learning/video-script?topic_name=${encodeURIComponent(topicName)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load video script');
    return res.json();
  },

  async ocrImage(base64Image: string) {
    const res = await fetch(`${API_BASE}/questions/image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image_data: base64Image }),
    });
    if (!res.ok) throw new Error('OCR failed');
    return res.json();
  },

  async submitTeachBack(data: { topic_id: number; explanation_text: string; teach_back_text: string }) {
    const res = await fetch(`${API_BASE}/questions/teach-back`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Teach back evaluation failed');
    return res.json();
  },

  // Progress and Graph
  async getProgress() {
    const res = await fetch(`${API_BASE}/learning/progress`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch progress metrics');
    return res.json();
  },

  async getKnowledgeGraph() {
    const res = await fetch(`${API_BASE}/learning/knowledge-graph`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  // Quiz Engine
  async generateQuiz(topicId: number, numQuestions: number = 5, isExam: boolean = false) {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic_id: topicId, num_questions: numQuestions, is_exam_simulation: isExam }),
    });
    if (!res.ok) throw new Error('Failed to generate adaptive quiz');
    return res.json();
  },

  async submitQuiz(responses: any[], isExam: boolean = false) {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ responses, is_exam_simulation: isExam }),
    });
    if (!res.ok) throw new Error('Failed to submit quiz');
    return res.json();
  },

  // Fingerprint & Recommendations
  async getConfusionFingerprint() {
    const res = await fetch(`${API_BASE}/confusion-fingerprint`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch confusion fingerprint');
    return res.json();
  },

  // Scholarship Matcher Endpoints
  async getAidMatches() {
    const res = await fetch(`${API_BASE}/aid/matches`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch scholarship matches');
    return res.json();
  },

  async updateAidProfile(data: any) {
    const res = await fetch(`${API_BASE}/aid/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update financial aid profile');
    return res.json();
  },

  async updateAidMatchStatus(matchId: number, status: 'suggested' | 'applied' | 'dismissed') {
    const res = await fetch(`${API_BASE}/aid/matches/${matchId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update scholarship match status');
    return res.json();
  },

  // Teacher Endpoints
  async getTeacherClasses() {
    const res = await fetch(`${API_BASE}/teacher/class-overview`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  async getTeacherClassDetail(classId: number) {
    const res = await fetch(`${API_BASE}/teacher/class-detail/${classId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch class details');
    return res.json();
  },

  async getTeacherClassPulse(classId: number) {
    const res = await fetch(`${API_BASE}/teacher/class-pulse/${classId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch class pulse');
    return res.json();
  },

  async getTeacherRadar(classId: number, topicId: number) {
    const res = await fetch(`${API_BASE}/teacher/topic-insights/${classId}/${topicId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch classroom radar');
    return res.json();
  },

  async getTeacherInterventions(classId: number) {
    const res = await fetch(`${API_BASE}/teacher/interventions/${classId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch interventions list');
    return res.json();
  },

  async updateInterventionStatus(interventionId: number, status: 'accepted' | 'modified' | 'dismissed') {
    const res = await fetch(`${API_BASE}/teacher/interventions/${interventionId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update intervention status');
    return res.json();
  },

  async removeStudentFromClass(classId: number, studentId: number) {
    const res = await fetch(`${API_BASE}/teacher/class/${classId}/student/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove student from class');
    return res.json();
  },

  // RAG Uploader
  async uploadRAGDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text() || 'Upload failed');
    return res.json();
  },

  async searchTopics(query: string) {
    const res = await fetch(`${API_BASE}/learning/search?query=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async addCustomTopic(topicName: string, subjectName: string) {
    const res = await fetch(`${API_BASE}/learning/add-topic`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic_name: topicName, subject_name: subjectName }),
    });
    if (!res.ok) throw new Error('Adding custom topic failed');
    return res.json();
  },

  async getNotes() {
    const res = await fetch(`${API_BASE}/notes`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  async generateNotes(topicName: string, notesStyle: string) {
    const res = await fetch(`${API_BASE}/notes/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topic_name: topicName, notes_style: notesStyle }),
    });
    if (!res.ok) throw new Error('Failed to generate notes');
    return res.json();
  },

  async getNoteDetail(id: number) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch note detail');
    return res.json();
  },

  async deleteNote(id: number) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  async downloadNotePDF(id: number, topicName: string) {
    const res = await fetch(`${API_BASE}/notes/${id}/download`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LearnBridge_${topicName.replace(/\s+/g, '_')}_notes.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
