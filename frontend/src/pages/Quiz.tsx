import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { type Topic, type QuizQuestion, type QuizSubmissionResult } from '../types';
import { 
  Award, Play, Clock, CheckCircle, XCircle, AlertCircle, 
  Sparkles, BookOpen, RefreshCw
} from 'lucide-react';

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isExamMode, setIsExamMode] = useState(false);
  
  // State variables for active quiz
  const [quizActive, setQuizActive] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [durations, setDurations] = useState<Record<number, number>>({});
  
  // Scoring results state
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  
  // Timers
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const graph = await api.getKnowledgeGraph();
        if (graph && graph.length > 0) {
          const allTopics = graph.flatMap((s: any) => s.topics);
          setTopics(allTopics);
          if (allTopics.length > 0) {
            setSelectedTopicId(allTopics[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load topics", err);
      }
    };
    fetchTopics();
    return () => stopTimer();
  }, []);

  const startTimer = (durationSeconds: number) => {
    stopTimer();
    setSecondsRemaining(durationSeconds);
    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          handleQuizSubmitForce();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedTopicId) return;
    setLoading(true);
    setError('');
    setResult(null);
    setAnswers({});
    setDurations({});
    setCurrentIdx(0);
    
    try {
      const quizQuestions = await api.generateQuiz(selectedTopicId, numQuestions, isExamMode);
      
      setQuestions(quizQuestions);
      setQuizActive(true);
      startTimeRef.current = Date.now();
      
      if (isExamMode) {
        // 2 minutes per question
        startTimer(numQuestions * 120);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize quiz. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const qId = questions[currentIdx].id;
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    setDurations(prev => ({ ...prev, [qId]: (prev[qId] || 0) + timeSpent }));
    
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      startTimeRef.current = Date.now();
    }
  };

  const handleQuizSubmitForce = () => {
    stopTimer();
    setQuizActive(false);
    submitAnswers([]);
  };

  const handleQuizSubmit = () => {
    stopTimer();
    setQuizActive(false);

    // Calculate final time spent on last question
    const qId = questions[currentIdx].id;
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const updatedDurations = { ...durations, [qId]: (durations[qId] || 0) + timeSpent };

    const responsesPayload = questions.map(q => ({
      question_id: q.id,
      student_answer: answers[q.id] || '',
      confidence_rating: 3,
      duration_seconds: updatedDurations[q.id] || 15
    }));

    submitAnswers(responsesPayload);
  };

  const submitAnswers = async (payload: any[]) => {
    setLoading(true);
    setError('');
    try {
      const finalPayload = payload.length > 0 ? payload : questions.map(q => ({
        question_id: q.id,
        student_answer: answers[q.id] || '',
        confidence_rating: 3,
        duration_seconds: durations[q.id] || 30
      }));

      const res = await api.submitQuiz(finalPayload, isExamMode);
      setResult(res);
    } catch (err) {
      setError('Error submitting quiz answers.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up text-[#17233C]">
      
      {/* 1. Quiz Settings View */}
      {!quizActive && !result && (
        <div className="p-6 md:p-8 rounded-3xl border border-[#E5E7EB] bg-white shadow-glass space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFF9F3] p-2.5 rounded-2xl text-[#F26B0F]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-[#17233C]">Adaptive Practice Arena</h3>
              <p className="text-xs text-[#52627A] font-bold">Personalized testing sandbox that scales question difficulty to match your mastery.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pick Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17233C] uppercase tracking-wider">Target Topic</label>
                <select
                  value={selectedTopicId || ''}
                  onChange={(e) => setSelectedTopicId(Number(e.target.value))}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#F26B0F] focus:ring-1 focus:ring-[#F26B0F]/20 text-[#17233C] cursor-pointer"
                >
                  {topics.map(t => (
                    <option key={t.id} value={t.id} className="text-[#17233C]">{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17233C] uppercase tracking-wider">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#F26B0F] focus:ring-1 focus:ring-[#F26B0F]/20 text-[#17233C] cursor-pointer"
                >
                  <option value={3} className="text-[#17233C]">3 Questions (Express)</option>
                  <option value={5} className="text-[#17233C]">5 Questions (Standard)</option>
                  <option value={10} className="text-[#17233C]">10 Questions (Complete)</option>
                </select>
              </div>
            </div>

            {/* Exam Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9F3] border border-[#FF8A1F]/15">
              <div className="space-y-1">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-[#17233C]">
                  <Clock className="w-4 h-4 text-[#F26B0F]" />
                  Exam Simulation Mode
                </h4>
                <p className="text-[10px] text-[#52627A] font-extrabold leading-relaxed">Timed challenge. Scaffolded hints and difficulty adaptations are disabled.</p>
              </div>
              <input
                type="checkbox"
                checked={isExamMode}
                onChange={(e) => setIsExamMode(e.target.checked)}
                className="w-4 h-4 text-[#F26B0F] border-[#64748B] rounded focus:ring-[#F26B0F] cursor-pointer accent-[#F26B0F]"
              />
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Initializing Arena...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Launch Practice Arena
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Quiz View */}
      {quizActive && questions.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl border border-[#E5E7EB] bg-white shadow-glass space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F26B0F]">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <p className="text-xs text-[#52627A] font-bold capitalize">Difficulty: {questions[currentIdx].difficulty}</p>
            </div>
            
            {isExamMode && (
              <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(secondsRemaining)}
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h4 className="text-base md:text-lg font-extrabold leading-relaxed text-[#17233C]">{questions[currentIdx].question_text}</h4>

            {/* MCQ Options Rendering */}
            {questions[currentIdx].question_type === 'MCQ' && questions[currentIdx].options && (
              <div className="grid grid-cols-1 gap-3 pt-2">
                {questions[currentIdx].options.map((opt) => {
                  const qId = questions[currentIdx].id;
                  const isSelected = answers[qId] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers(prev => ({ ...prev, [qId]: opt }))}
                      className={`w-full text-left py-3.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#FFF9F3] border-[#F26B0F] text-[#F26B0F] shadow-sm' 
                          : 'bg-white hover:bg-[#FFF9F3]/40 border-[#CBD5E1] text-[#17233C]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Coding/Text Input Rendering */}
            {questions[currentIdx].question_type !== 'MCQ' && (
              <textarea
                placeholder="Type your answer or code block here..."
                value={answers[questions[currentIdx].id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: e.target.value }))}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-[#F26B0F] focus:ring-1 focus:ring-[#F26B0F]/20 min-h-[120px] resize-none text-[#17233C] font-semibold"
              />
            )}
          </div>

          {/* Next/Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!answers[questions[currentIdx].id]}
                className="bg-[#F26B0F] hover:bg-[#D95D0B] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-sm"
              >
                NEXT →
              </button>
            ) : (
              <button
                onClick={handleQuizSubmit}
                disabled={!answers[questions[currentIdx].id]}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-extrabold py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-sm"
              >
                SUBMIT QUIZ
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Quiz Results View */}
      {result && (
        <div className="space-y-6">
          {/* Results Score Banner */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-center space-y-3 relative overflow-hidden shadow-md text-white">
            <Sparkles className="w-8 h-8 text-yellow-200 mx-auto" />
            <h3 className="font-extrabold text-2xl">Quiz Evaluation Completed</h3>
            
            <div className="inline-flex bg-white/20 border border-white/30 px-6 py-2 rounded-full mt-2">
              <span className="font-black text-3.5xl font-mono">
                {result.score}%
              </span>
            </div>
            
            <p className="text-brand-50 text-xs mt-2 font-bold uppercase tracking-wider">
              {result.is_exam_simulation ? 'Simulation attempt recorded.' : 'Mastery thresholds updated.'}
            </p>
          </div>

          {/* Interactive EdTech Diagnostic & Next Actions Panel */}
          <div className="p-6 rounded-3xl border border-[#CBD5E1] bg-[#FFF9F3]/30 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-[#17233C] flex items-center gap-1.5 border-b border-[#FF8A1F]/10 pb-2">
              <Sparkles className="w-4.5 h-4.5 text-[#F26B0F]" />
              Interactive Diagnostic Feedback
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">What You Did Well</span>
                <p className="text-xs font-bold text-[#17233C]">
                  {result.score >= 70 
                    ? "Excellent syntax alignment and logical tracing flow. Your core structures are solid!" 
                    : "Great patience analyzing complex conditions. Your foundation is taking shape!"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#FF8A1F]/10 space-y-1">
                <span className="text-[9px] font-black text-[#F26B0F] uppercase tracking-wider">Needs Improvement</span>
                <p className="text-xs font-bold text-[#17233C]">
                  {result.score < 100 
                    ? "Carefully trace boundary indices and recursive call loops to avoid overflow execution errors."
                    : "Zero logic errors detected! Ready to attempt high complexity challenge items."}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-100 space-y-1">
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider">Common Mistake</span>
                <p className="text-xs font-bold text-[#17233C]">
                  {result.misconceptions_detected.length > 0 
                    ? `Pitfall: ${result.misconceptions_detected[0]} conditions.` 
                    : "Infinite base-loop triggers or off-by-one array index boundary counts."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => navigate('/chat')}
                className="bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] text-xs font-bold py-2 px-4.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                Review Weak Area
              </button>
              <button
                onClick={handleStartQuiz}
                className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-2 px-4.5 rounded-xl shadow-sm border-none cursor-pointer flex items-center gap-1.5 transition-all"
              >
                Practice Again
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="bg-white border border-[#CBD5E1] hover:bg-[#FFF9F3]/30 text-[#17233C] text-xs font-bold py-2 px-4.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                Learn Concept
              </button>
              <button
                onClick={() => navigate('/notes')}
                className="bg-white border border-[#CBD5E1] hover:bg-[#FFF9F3]/30 text-[#17233C] text-xs font-bold py-2 px-4.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                Generate Notes
              </button>
            </div>
          </div>

          {/* Diagnostics and Recommendations */}
          {(result.misconceptions_detected.length > 0 || result.actionable_recommendations.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Misconceptions */}
              {result.misconceptions_detected.length > 0 && (
                <div className="p-5 rounded-2xl border border-rose-200/60 bg-rose-50/30 space-y-3">
                  <h4 className="font-bold text-sm text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5" />
                    Misconceptions Diagnosed
                  </h4>
                  <ul className="text-xs text-[#52627A] space-y-1.5 list-disc pl-4 font-semibold">
                    {result.misconceptions_detected.map((m, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-bold text-rose-800">{m}</span>: wrong-answer pattern identified.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.actionable_recommendations.length > 0 && (
                <div className="p-5 rounded-2xl border border-[#FF8A1F]/15 bg-[#FFF9F3] space-y-3">
                  <h4 className="font-bold text-sm text-[#F26B0F] flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5" />
                    Actionable Recommendations
                  </h4>
                  <ul className="text-xs text-[#52627A] space-y-1.5 font-semibold">
                    {result.actionable_recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-relaxed flex gap-2">
                        <span className="text-[#FF8A1F] font-bold">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Question Breakdown List */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-[#17233C]">Detailed Question Analysis</h4>
            
            {result.details.map((item, idx) => (
              <div 
                key={item.question_id}
                className={`p-6 rounded-2xl border bg-white shadow-glass space-y-4 ${
                  item.is_correct ? 'border-emerald-500/25' : 'border-rose-500/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <h5 className="font-bold text-xs md:text-sm leading-relaxed text-[#17233C]">{idx + 1}. {item.question_text}</h5>
                  {item.is_correct ? (
                    <span className="flex-shrink-0 text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                      <XCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[#64748B] uppercase tracking-wider text-[9px] font-bold">Your Answer</span>
                    <p className="font-mono mt-1 text-[#17233C] bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      {item.student_answer || '[No Answer Provided]'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#64748B] uppercase tracking-wider text-[9px] font-bold">Correct Answer</span>
                    <p className="font-mono mt-1 text-[#17233C] bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      {item.correct_answer}
                    </p>
                  </div>
                </div>

                {item.explanation && (
                  <div className="p-3 bg-[#FFF9F3] rounded-xl text-xs text-[#52627A] leading-relaxed border border-[#FF8A1F]/15 font-semibold">
                    <span className="font-bold block mb-1 text-[#F26B0F]">AI Explanation:</span>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <button
            onClick={() => setResult(null)}
            className="w-full bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
          >
            Start Another Practice Session
          </button>
        </div>
      )}
    </div>
  );
};
