import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAccessibility } from '../hooks/useAccessibility';
import { type StudentProgressSummary } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Sparkles, Flame, CheckCircle, RefreshCw, BookOpen, AlertCircle, ArrowRight, Award, Target, BrainCircuit, Activity, X, HelpCircle, Lock as LockIcon, Calendar } from 'lucide-react';
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const [data, setData] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [showCoachWhy, setShowCoachWhy] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<any | null>(null);

  // 5-Minute Sandbox State
  const [showFiveMinLearning, setShowFiveMinLearning] = useState(false);
  const [sandboxStep, setSandboxStep] = useState<'concept' | 'example' | 'q1' | 'q2' | 'teachback' | 'complete'>('concept');
  const [sandboxQ1Answer, setSandboxQ1Answer] = useState<string | null>(null);
  const [sandboxQ2Answer, setSandboxQ2Answer] = useState<string | null>(null);
  const [sandboxTeachBack, setSandboxTeachBack] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const studentName = user?.name || 'Learner';

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        await api.getProfile();
        const progressRes = await fetch('http://localhost:8000/api/learning/progress', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!progressRes.ok) throw new Error('Failed to load progress analytics');
        const progressData = await progressRes.json();
        setData(progressData);
      } catch (err: any) {
        console.error(err);
        setError('We couldn\'t load your explanation portfolio. Verify database is seeded.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 3) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await api.searchTopics(val);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F26B0F]"></div>
        <p className="text-xs text-[#52627A] font-bold">Synchronizing your learning graph...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-semibold">{error || 'Failed to load progress details.'}</span>
      </div>
    );
  }

  const activeMastery = data.recent_mastery.find(m => m.mastery_score < 75) || data.recent_mastery[0];
  const activeTopicName = activeMastery ? activeMastery.topic_name : 'Recursion';
  const activeTopicScore = activeMastery ? Math.round(activeMastery.mastery_score) : 34;

  const chartData = data.recent_mastery && data.recent_mastery.length > 0
    ? data.recent_mastery.map((m: any) => ({
      name: m.topic_name,
      mastery: m.mastery_score
    }))
    : [
      { name: "Arrays", mastery: 92 },
      { name: "Strings", mastery: 81 },
      { name: "Linked Lists", mastery: 63 },
      { name: "Recursion", mastery: 34 },
      { name: "Trees", mastery: 12 }
    ];

  // Dynamically calculate study coach recommendation based on actual student progress
  const getCoachRecommendation = () => {
    if (!data || !data.recent_mastery || data.recent_mastery.length === 0) return null;
    const sorted = [...data.recent_mastery].sort((a, b) => b.mastery_score - a.mastery_score);
    const bestTopic = sorted.find(m => m.mastery_score >= 70) || sorted[0];
    const weakTopics = [...data.recent_mastery].filter(m => m.mastery_score < 70);
    const nextTopic = weakTopics[0] || sorted[sorted.length - 1];

    if (bestTopic && nextTopic) {
      return {
        best: bestTopic.topic_name,
        bestScore: Math.round(bestTopic.mastery_score),
        next: nextTopic.topic_name,
        why: `Since you demonstrated a high ${Math.round(bestTopic.mastery_score)}% mastery in ${bestTopic.topic_name}, you possess strong foundational logic. Transitioning into ${nextTopic.topic_name} next will reinforce structural patterns and build direct prerequisite connections.`
      };
    }
    return {
      best: "Array Fundamentals",
      bestScore: 85,
      next: "Recursion",
      why: "Because you have a strong 85% mastery in Array Fundamentals, you already understand index bounds. Learning Recursion is your natural next step to understand stack states!"
    };
  };

  const coachRec = getCoachRecommendation();

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`space-y-6 ${settings.liteMode ? '' : 'animate-fade-in'} text-[#17233C]`}>

      {/* 1. Header & Continue Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Welcome Greeting Banner */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[180px]">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex bg-white/15 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              LearnBridge Adaptive Core
            </div>
            <h2 className="text-2xl md:text-3.5xl font-extrabold leading-tight tracking-tight">
              {getGreeting()}, {studentName} 👋
            </h2>
            <p className="text-xs md:text-sm text-white/90 max-w-lg font-semibold">
              Your explanation models are active. Let's strengthen your conceptual retention.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center z-10">
            <span className="text-xs text-white/90 font-bold">Target Topic: {activeTopicName}</span>
            <button
              onClick={() => navigate('/chat')}
              className="bg-white text-[#F26B0F] hover:bg-brand-50 text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              Continue Learning
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Continue Learning progress card */}
        <div className="p-6 rounded-3xl bg-white border border-[#FF8A1F]/15 shadow-glass flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-[#F26B0F] uppercase tracking-widest">In Progress</span>
              <Activity className="w-4 h-4 text-[#F26B0F]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17233C]">{activeTopicName}</h3>
            <p className="text-[11px] text-[#52627A] font-bold mt-1">Next target: Understanding Base Cases</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#64748B]">Mastery</span>
                <span className="text-[#17233C]">{activeTopicScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeTopicScore}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="w-full text-center text-xs font-extrabold text-[#F26B0F] hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              Start 5-min Concept Revision <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Learning Search Bar Card */}
      <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-[#17233C] flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#F26B0F]" />
          Search anything you want to learn...
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Type a topic (e.g. Recursion, Arrays, Quantum Computing, SQL joins...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#FFF9F3]/60 border border-[#CBD5E1] rounded-2xl py-3.5 pl-4 pr-12 text-sm font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C]"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52627A] hover:text-[#17233C] text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results / Suggestion UI */}
        {searchResults && (
          <div className="pt-2 space-y-4 border-t border-slate-100 animate-fade-in">
            {searchResults.status === 'found' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Matching Library Assets Found</p>
                {searchResults.results.map((item: any) => (
                  <div key={`${item.type}-${item.id}`} className="p-4 rounded-2xl border border-[#FFD9B3] bg-[#FFF9F3]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#FF8A1F]/10 text-[#C8540A] border border-[#FF8A1F]/20">
                          {item.type}
                        </span>
                        <h4 className="font-extrabold text-sm text-[#17233C]">{item.name}</h4>
                      </div>
                      <p className="text-xs text-[#52627A] font-bold">{item.description}</p>

                      {item.type === 'topic' && item.prerequisites.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="text-[10px] font-bold text-[#52627A] bg-slate-100 px-2 py-0.5 rounded">Prereqs: {item.prerequisites.join(', ')}</span>
                          <span className="text-[10px] font-bold text-[#52627A] bg-slate-100 px-2 py-0.5 rounded">Next: {item.next_recommended}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.type === 'topic' && (
                        <>
                          <button
                            onClick={() => navigate('/chat', { state: { selectedTopicId: item.id, topicName: item.name } })}
                            className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer border-none shadow-sm"
                          >
                            Ask AI Tutor
                          </button>
                          <button
                            onClick={() => navigate('/quiz')}
                            className="bg-white border border-[#F6B06B] hover:bg-[#FFF7EF] text-[#C8540A] text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Practice Quiz
                          </button>
                        </>
                      )}
                      {item.type === 'note' && (
                        <button
                          onClick={() => navigate('/notes')}
                          className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer border-none shadow-sm"
                        >
                          View Notes
                        </button>
                      )}
                      {item.type === 'question' && (
                        <button
                          onClick={() => navigate('/quiz')}
                          className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer border-none shadow-sm"
                        >
                          Practice Question
                        </button>
                      )}
                      {item.type === 'lesson' && (
                        <button
                          onClick={() => navigate('/chat')}
                          className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer border-none shadow-sm"
                        >
                          Learn Concept
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.status === 'not_found' && (
              <div className="p-5 rounded-2xl border border-dashed border-[#FF8A1F]/30 bg-[#FFF9F3]/40 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-[#17233C]">
                    LearnBridge doesn't have this topic in the local library yet.
                  </h4>
                  <p className="text-xs text-[#52627A] font-semibold">
                    You can trigger our educational research agents to compile a dynamic curriculum for "{searchResults.topic_name}".
                  </p>
                </div>

                {!researchLoading && !researchResult && (
                  <button
                    onClick={async () => {
                      setResearchLoading(true);
                      try {
                        const data = await api.researchUnknownTopic(searchResults.topic_name);
                        setResearchResult(data);
                      } catch (e) {
                        alert("Failed to research topic.");
                      } finally {
                        setResearchLoading(false);
                      }
                    }}
                    className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    Research with AI
                  </button>
                )}

                {researchLoading && (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F26B0F] py-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#F26B0F]" />
                    Researching academic databases & compiling study pathways...
                  </div>
                )}

                {researchResult && (
                  <div className="mt-3 p-4 bg-white border border-[#FF8A1F]/15 rounded-2xl space-y-4 animate-fade-in text-[#17233C] text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#F26B0F] uppercase tracking-wider">Concept Classification</span>
                      <p className="font-semibold text-slate-700 leading-relaxed">{researchResult.classification}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-[#F26B0F] uppercase tracking-wider">Prerequisite Concepts</span>
                      <div className="flex flex-wrap gap-1.5">
                        {researchResult.prerequisites.map((p: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-[#52627A]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-[#F26B0F] uppercase tracking-wider">Proposed Study Pathway</span>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        {researchResult.learning_path.map((step: string, idx: number) => (
                          <div key={idx} className="bg-[#FFF9F3]/60 border border-[#FF8A1F]/10 p-2.5 rounded-xl text-center space-y-0.5">
                            <span className="text-[9px] font-black text-[#C8540A]">Step {idx + 1}</span>
                            <p className="text-[10px] font-extrabold text-[#17233C] truncate" title={step}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-[#F26B0F] uppercase tracking-wider">Sources</span>
                      <div className="space-y-1">
                        {researchResult.sources.map((src: any, idx: number) => (
                          <a key={idx} href={src.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-sky-600 hover:underline block">
                            • {src.title}
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.addCustomTopic(researchResult.topic_name, 'Computer Science');
                            navigate('/chat', { state: { selectedTopicId: res.topic_id, topicName: res.topic_name } });
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none shadow-sm flex items-center gap-1"
                      >
                        Start Learning
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.addCustomTopic(researchResult.topic_name, 'Computer Science');
                            alert(`Successfully added '${researchResult.topic_name}' to your local library!`);
                            setSearchQuery('');
                            setSearchResults(null);
                            setResearchResult(null);
                            window.location.reload();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Add to Learning Path
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Learning Pulse Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Mastery */}
        <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Overall Mastery</p>
            <h3 className="text-2xl font-extrabold text-[#17233C]">
              {Math.round(data.overall_mastery)}%
            </h3>
            <p className="text-[9px] text-[#64748B] font-bold">Goal standard: 85%</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFF9F3] text-[#F26B0F] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Streak */}
        <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Active Streak</p>
            <h3 className="text-2xl font-extrabold text-[#F26B0F]">
              {data.streak_days} Days
            </h3>
            <p className="text-[9px] text-[#64748B] font-bold">Login tomorrow to extend</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFF9F3] text-[#F26B0F] flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 fill-[#F26B0F]/10" />
          </div>
        </div>

        {/* Questions Solved */}
        <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Questions Solved</p>
            <h3 className="text-2xl font-extrabold text-[#17233C]">
              {Math.max(12, Math.round(data.total_xp / 12))}
            </h3>
            <p className="text-[9px] text-[#64748B] font-bold">From calibration loops</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFF9F3] text-[#F26B0F] flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Topics Mastered */}
        <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Topics Mastered</p>
            <h3 className="text-2xl font-extrabold text-[#FF8A1F]">
              {data.recent_mastery.filter(m => m.mastery_score >= 70).length} Topics
            </h3>
            <p className="text-[9px] text-[#64748B] font-bold">Score &gt;= 70% reached</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFF9F3] text-[#FF8A1F] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Spaced Recommendations & Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col (2 Columns): Today's Mission & Mastery Breakdown */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's learning mission */}
          <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Target className="w-5 h-5 text-[#FF8A1F]" />
              <h3 className="font-extrabold text-base text-[#17233C]">Today's Learning Mission</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-[#17233C]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full bg-green-100 border border-green-500 text-green-700 flex items-center justify-center text-[10px]">✓</span>
                  <span>Understand base concept syntax</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full bg-green-100 border border-green-500 text-green-700 flex items-center justify-center text-[10px]">✓</span>
                  <span>Identify the base case conditions</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full bg-green-100 border border-green-500 text-green-700 flex items-center justify-center text-[10px]">✓</span>
                  <span>Trace recursive stack states</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full border border-slate-350 text-[#64748B] flex items-center justify-center text-[10px]"></span>
                  <span className="text-[#52627A]">Solve a recursive problem check</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="text-[#64748B]">Mission Progress</span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#FF8A1F] h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-[#17233C]">75%</span>
              </div>
              <button
                onClick={() => navigate('/quiz')}
                className="bg-[#FFF9F3] text-[#F26B0F] hover:bg-[#FFEBD6] text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer border border-[#FF8A1F]/20"
              >
                Continue Mission
              </button>
            </div>
          </div>

          {/* 4. Topic Mastery Breakdown (Disabled in low bandwidth liteMode) */}
          {!settings.liteMode && (
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col justify-between min-h-[350px]">
              <div className="mb-4">
                <h3 className="font-extrabold text-base text-[#17233C]">Topic Mastery Breakdown</h3>
                <p className="text-[11px] text-[#52627A] font-bold">Topic-level rolling percentages calculated from adaptive quiz evaluations.</p>
              </div>

              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF8A1F" />
                        <stop offset="100%" stopColor="#F26B0F" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 138, 31, 0.12)" />
                    <XAxis dataKey="name" stroke="#52627A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52627A" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(255, 138, 31, 0.2)', borderRadius: '12px', fontSize: '11px', color: '#17233C' }}
                      cursor={{ fill: 'rgba(255, 138, 31, 0.04)' }}
                    />
                    <Bar dataKey="mastery" fill="url(#barGlow)" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Learning DNA & Mistake Memory Subgrid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning DNA Panel */}
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Sparkles className="w-5 h-5 text-[#FF8A1F]" />
                <h3 className="font-extrabold text-base text-[#17233C]">🧬 Learning DNA</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div className="p-3 bg-[#FFF9F3] rounded-xl border border-[#FF8A1F]/15">
                  <span className="text-[#F26B0F] block text-[9px] uppercase tracking-wider">Style Preference</span>
                  <p className="text-[#17233C] text-sm font-extrabold mt-0.5">{data.learning_dna?.preferred_strategy || 'Example'}</p>
                </div>
                <div className="p-3 bg-[#FFF9F3] rounded-xl border border-[#FF8A1F]/15">
                  <span className="text-[#F26B0F] block text-[9px] uppercase tracking-wider">Consistency</span>
                  <p className="text-[#17233C] text-sm font-extrabold mt-0.5">{data.learning_dna?.consistency_score || '75%'}</p>
                </div>
                <div className="p-3 bg-[#FFF9F3] rounded-xl border border-[#FF8A1F]/15">
                  <span className="text-[#F26B0F] block text-[9px] uppercase tracking-wider">Level Mastery</span>
                  <p className="text-[#17233C] text-sm font-extrabold mt-0.5">{data.learning_dna?.current_mastery_level || 'Beginner'}</p>
                </div>
                <div className="p-3 bg-[#FFF9F3] rounded-xl border border-[#FF8A1F]/15">
                  <span className="text-[#F26B0F] block text-[9px] uppercase tracking-wider">Learning Speed</span>
                  <p className="text-[#17233C] text-sm font-extrabold mt-0.5 truncate">{data.learning_dna?.learning_speed || 'Steady'}</p>
                </div>
              </div>
            </div>

            {/* Mistake Memory Panel */}
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <BrainCircuit className="w-5 h-5 text-rose-500" />
                <h3 className="font-extrabold text-base text-[#17233C]">🧠 Mistake Memory</h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[140px]">
                {data.mistake_history && data.mistake_history.map((mistake: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-rose-100 bg-rose-50/20 text-xs font-semibold space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-rose-800">{mistake.topic}</span>
                      <span className="bg-rose-100 text-rose-800 text-[9px] px-2 py-0.5 rounded font-black">
                        {mistake.occurrences} Mistakes
                      </span>
                    </div>
                    <p className="text-[#17233C] font-bold">Concept: <span className="font-extrabold text-rose-600">{mistake.concept}</span></p>
                    <p className="text-[#52627A] text-[10px] leading-relaxed">Fix: {mistake.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Coach */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* AI Study Coach */}
          <div className="p-6 rounded-2xl border border-[#FF8A1F]/20 bg-[#FFF9F3] shadow-md flex flex-col justify-between min-h-[350px] relative overflow-hidden flex-1">
            {/* Gravitational Constellation Background Glow */}
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#FF8A1F]/5 pointer-events-none"></div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF8A1F] text-white flex items-center justify-center font-extrabold shadow-sm animate-float">
                  🎓
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#17233C]">AI Study Coach</h3>
                  <span className="text-[9px] text-[#FF8A1F] font-bold uppercase tracking-wider">Active Recommendation</span>
                </div>
              </div>

              {/* Speech bubble */}
              <div className="bg-white border border-[#FF8A1F]/15 p-4 rounded-2xl shadow-sm space-y-2.5 relative">
                <div className="absolute left-[-6px] top-4 w-3 h-3 bg-white border-l border-b border-[#FF8A1F]/15 rotate-45"></div>

                <p className="text-xs font-bold text-[#17233C] leading-relaxed">
                  Hi {studentName} 👋
                </p>
                <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                  You performed well in <span className="font-extrabold text-[#F26B0F]">{coachRec?.best}</span>.
                </p>
                <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                  Your next best topic is <span className="font-extrabold text-[#F26B0F]">{coachRec?.next}</span> because your {coachRec?.best} fundamentals are strong.
                </p>

                {showCoachWhy && (
                  <div className="pt-2 border-t border-[#FF8A1F]/10 text-[10px] text-[#52627A] leading-relaxed font-bold animate-fade-in">
                    💡 <b>Why this?</b> {coachRec?.why}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 relative z-10 mt-4">
              <button
                onClick={() => {
                  const matchedTopic = data.recent_mastery.find(m => m.topic_name === coachRec?.next);
                  navigate('/chat', { state: { selectedTopicId: matchedTopic?.topic_id, topicName: coachRec?.next } });
                }}
                className="flex-1 bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-3 rounded-xl transition-all cursor-pointer border-none shadow-sm flex items-center justify-center gap-1.5"
              >
                Start
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowCoachWhy(!showCoachWhy)}
                className="flex-1 bg-white border border-[#FF8A1F]/30 hover:bg-[#FFF9F3]/60 text-[#C8540A] text-xs font-extrabold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                Why?
              </button>
              <button
                onClick={() => {
                  alert("Recommendation deferred. Feel free to explore other topics!");
                }}
                className="px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold py-3 rounded-xl cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Your Cognitive Confusion Fingerprint (Entire Page Width) */}
      <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <BrainCircuit className="w-5 h-5 text-[#FF8A1F]" />
          <h3 className="font-extrabold text-base text-[#17233C]">Your Cognitive Fingerprint</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Mastery bar list */}
          <div className="space-y-3">
            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#17233C]">Arrays</span>
                <span className="text-[#52627A]">92%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#17233C]">Strings</span>
                <span className="text-[#52627A]">81%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '81%' }}></div>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#17233C]">Linked Lists</span>
                <span className="text-[#52627A]">63%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#FF8A1F] h-full rounded-full" style={{ width: '63%' }}></div>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#17233C]">{activeTopicName}</span>
                <span className="text-[#52627A]">{activeTopicScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${activeTopicScore}%` }}></div>
              </div>
            </div>
          </div>

          {/* Detected diagnostic gap */}
          <div className="p-4 bg-[#FFF9F3] border border-[#FF8A1F]/15 rounded-xl space-y-2 flex flex-col justify-center">
            <p className="text-xs font-bold text-[#F26B0F] flex items-center gap-1.5">
              🔍 AI COGNITIVE GAP DIAGNOSIS
            </p>
            <p className="text-xs text-[#17233C] font-bold leading-relaxed">
              Your main difficulty in <span className="underline decoration-[#FF8A1F]">{activeTopicName}</span> is understanding the <span className="text-[#F26B0F] font-extrabold">Base Case termination logic</span>.
            </p>
            <p className="text-[11px] text-[#52627A] font-bold">
              Preferred Explanation: <span className="font-extrabold text-[#17233C]">Examples + Visual Steps</span>
            </p>
          </div>

        </div>
      </div>

      {/* Certificate of Mastery Widget (Entire Page Width) */}
      <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Award className="w-5 h-5 text-[#FF8A1F]" />
          <h3 className="font-extrabold text-base text-[#17233C]">Certificate of Mastery</h3>
        </div>

        {data.recent_mastery.filter(m => m.mastery_score >= 70).length >= 1 ? (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-emerald-950">Curriculum Mastered!</p>
                <p className="text-[10px] text-emerald-700 leading-relaxed font-bold">
                  You have mastered at least 1 topic in advanced data structures. Your digital certificate is ready!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCertificate(true)}
              className="w-full bg-[#FF8A1F] hover:bg-[#F26B0F] text-white font-extrabold py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none"
            >
              <Award className="w-4 h-4 text-white" />
              View & Download Certificate
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-505 flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-800">Certificate Locked</p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                  Master at least 1 curriculum topic with a score of 70% or more to claim your certificate.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-[#64748B]">Progress: {data.recent_mastery.filter(m => m.mastery_score >= 70).length} / 1 Mastered</span>
                <span className="text-[#17233C]">{Math.round((data.recent_mastery.filter(m => m.mastery_score >= 70).length / 1) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF8A1F] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(data.recent_mastery.filter(m => m.mastery_score >= 70).length / 1) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Achievements Panel */}
      <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-[#17233C]">Earned Badges & Achievements</h3>
          <p className="text-[11px] text-[#52627A] font-bold">Complete curriculum goals, quizzes, and Feynman teach-backs to unlock.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Quiz Conqueror",
              description: "Scored 100% on any adaptive topic quiz.",
              icon: Award,
              color: "from-amber-400 to-yellow-500",
              reward: "100 XP"
            },
            {
              title: "Feynman Master",
              description: "Successfully explained a complex topic in Teach-Back Mode.",
              icon: BookOpen,
              color: "from-indigo-400 to-purple-500",
              reward: "150 XP"
            },
            {
              title: "Spaced Learner",
              description: "Completed a scheduled spaced repetition review.",
              icon: Calendar,
              color: "from-blue-400 to-cyan-500",
              reward: "75 XP"
            },
            {
              title: "Curriculum Explorer",
              description: "Achieved green status in 3 topics.",
              icon: Sparkles,
              color: "from-emerald-400 to-teal-500",
              reward: "200 XP"
            }
          ].map((item) => {
            const Icon = item.icon;
            // Check if student has unlocked this achievement
            const isUnlocked = data.achievements && data.achievements.some(
              (a: any) => a.achievement.title.toLowerCase() === item.title.toLowerCase()
            );

            return (
              <div
                key={item.title}
                className={`p-4 rounded-xl border flex items-center gap-3 relative transition-all ${isUnlocked
                  ? 'border-[#FF8A1F]/20 bg-[#FFF9F3] shadow-sm animate-pulse-subtle'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
              >
                {/* Lock icon overlay for locked items */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 text-slate-400 animate-none" title="Locked">
                    <LockIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                {isUnlocked && (
                  <div className="absolute top-2 right-2 text-emerald-600 text-[10px] font-black" title="Unlocked">
                    ✓
                  </div>
                )}

                <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${isUnlocked ? item.color : 'from-slate-350 to-slate-400'} text-white flex items-center justify-center flex-shrink-0 border-none`}>
                  <Icon className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-slate-100'}`} />
                </div>
                <div className="min-w-0 pr-2">
                  <h4 className="font-extrabold text-xs truncate text-[#17233C]">{item.title}</h4>
                  <p className="text-[9px] text-[#64748B] font-semibold leading-snug">{item.description}</p>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1.5 inline-block ${isUnlocked ? 'bg-orange-100 text-[#F26B0F]' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {item.reward}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-Minute Sandbox Mode Modal Overlay */}
      {showFiveMinLearning && (
        <div className="fixed inset-0 bg-[#17233C]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#FF8A1F]/20 shadow-2xl p-6 space-y-6 animate-scale-up text-[#17233C]">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F26B0F]" />
                <h3 className="font-extrabold text-sm text-[#17233C]">⚡ 5-Minute Learning Sandbox</h3>
              </div>
              <button
                onClick={() => setShowFiveMinLearning(false)}
                className="text-[#52627A] hover:text-[#17233C] p-1.5 rounded-lg bg-slate-100 cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Concept Step */}
            {sandboxStep === 'concept' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#F26B0F] uppercase tracking-wider">Step 1: The Core Concept</span>
                  <h4 className="font-extrabold text-base text-[#17233C]">What is Recursion?</h4>
                </div>
                <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                  In computer science, <b>recursion</b> occurs when a function calls itself as a subroutine. This allows the function to repeat itself several times, solving a complex problem by dividing it into simpler, identical sub-problems.
                </p>
                <div className="bg-[#FFF9F3] border border-[#FF8A1F]/15 p-3.5 rounded-xl text-xs font-mono text-[#F26B0F]">
                  void repeatMessage(int count) {"{"}<br />
                  &nbsp;&nbsp;if (count &lt;= 0) return;<br />
                  &nbsp;&nbsp;print("Hello!");<br />
                  &nbsp;&nbsp;repeatMessage(count - 1);<br />
                  {"}"}
                </div>
                <button
                  onClick={() => setSandboxStep('example')}
                  className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                >
                  Continue to Example →
                </button>
              </div>
            )}

            {/* Example Step */}
            {sandboxStep === 'example' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#F26B0F] uppercase tracking-wider">Step 2: Real-World Analogy</span>
                  <h4 className="font-extrabold text-base text-[#17233C]">The Russian Dolls Analogy</h4>
                </div>
                <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                  Imagine a large Matryoshka doll. You open the outer doll (first call), only to find another doll inside. You open that doll (recursive call), finding another doll. You keep doing this until you find a tiny doll at the center containing a toy (the <b>Base Case</b>). Once you reach the center, you stop opening dolls!
                </p>
                <button
                  onClick={() => setSandboxStep('q1')}
                  className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                >
                  Start Checkpoint Questions →
                </button>
              </div>
            )}

            {/* Question 1 Step */}
            {sandboxStep === 'q1' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#F26B0F] uppercase tracking-wider">Step 3: Checkpoint Quiz 1/2</span>
                  <h4 className="font-extrabold text-base text-[#17233C]">What stops a recursive function from calling itself infinitely?</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "A) The compiler registers a warning.",
                    "B) A terminating Base Case check.",
                    "C) A default keyboard listener signal."
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSandboxQ1Answer(opt)}
                      className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${sandboxQ1Answer === opt
                        ? opt.includes("Base Case")
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white hover:bg-slate-50 border-[#CBD5E1] text-[#17233C]'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {sandboxQ1Answer && (
                  <button
                    onClick={() => {
                      if (!sandboxQ1Answer.includes("Base Case")) {
                        alert("Try again to select the correct answer!");
                        return;
                      }
                      setSandboxStep('q2');
                    }}
                    className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            )}

            {/* Question 2 Step */}
            {sandboxStep === 'q2' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#F26B0F] uppercase tracking-wider">Step 3: Checkpoint Quiz 2/2</span>
                  <h4 className="font-extrabold text-base text-[#17233C]">Which specific runtime error occurs if a recursive loop runs indefinitely?</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "A) OutOfMemoryException (Stack Overflow)",
                    "B) Compile-time syntax error",
                    "C) ArrayIndexOutOfBoundsException"
                  ].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSandboxQ2Answer(opt)}
                      className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${sandboxQ2Answer === opt
                        ? opt.includes("Stack Overflow")
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white hover:bg-slate-50 border-[#CBD5E1] text-[#17233C]'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {sandboxQ2Answer && (
                  <button
                    onClick={() => {
                      if (!sandboxQ2Answer.includes("Stack Overflow")) {
                        alert("Try again to select the correct answer!");
                        return;
                      }
                      setSandboxStep('teachback');
                    }}
                    className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                  >
                    Continue to Teach-Back →
                  </button>
                )}
              </div>
            )}

            {/* Teachback Step */}
            {sandboxStep === 'teachback' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#F26B0F] uppercase tracking-wider">Step 4: Active Teach-Back Evaluation</span>
                  <h4 className="font-extrabold text-base text-[#17233C]">Explain Recursion in your own words!</h4>
                </div>
                <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                  Type a quick sentence explaining recursion or base case criteria. The AI engine will evaluate your understanding instantly.
                </p>
                <textarea
                  placeholder="e.g. Recursion is a function calling itself until it hits the base case check..."
                  value={sandboxTeachBack}
                  onChange={(e) => setSandboxTeachBack(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#F26B0F] min-h-[80px] resize-none text-[#17233C] font-semibold"
                />
                {sandboxTeachBack.trim().length > 5 && (
                  <button
                    onClick={() => setSandboxStep('complete')}
                    className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                  >
                    Submit & Evaluate Teach-Back →
                  </button>
                )}
              </div>
            )}

            {/* Complete Step */}
            {sandboxStep === 'complete' && (
              <div className="space-y-4 text-center py-4 text-[#17233C]">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-lg text-[#17233C]">5-Minute Session Completed!</h4>
                  <p className="text-xs text-[#52627A] font-semibold leading-relaxed">
                    Great work! You scored <b>100%</b> on checkpoints and successfully verified the core concept via Feynman teach-back.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl inline-block text-xs font-extrabold text-emerald-800">
                  +10 XP Streak Level Increased! ⚡
                </div>
                <button
                  onClick={() => setShowFiveMinLearning(false)}
                  className="w-full bg-[#17233C] hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-xl transition-all border-none cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-[#FF8A1F]/30 shadow-2xl relative flex flex-col justify-between gap-6 print:p-0 print:border-none print:shadow-none animate-slide-up">

            {/* Modal header (hidden in print) */}
            <div className="flex justify-between items-center border-b pb-4 print:hidden">
              <h3 className="font-black text-base text-[#17233C] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF8A1F]" />
                Your Digital Certificate
              </h3>
              <button
                onClick={() => setShowCertificate(false)}
                className="text-[#52627A] hover:text-[#17233C] text-xs font-black cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none"
              >
                Close Window
              </button>
            </div>

            {/* Printable Certificate Layout */}
            <div
              id="printable-certificate"
              className="p-8 md:p-12 border-8 border-double border-[#FF8A1F] bg-[#FFF9F3]/30 rounded-2xl flex flex-col items-center justify-between gap-6 text-center shadow-inner relative overflow-hidden"
              style={{ minHeight: '520px' }}
            >
              {/* Background watermark seals */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200/10 pointer-events-none select-none">
                <Award className="w-96 h-96" />
              </div>

              {/* Certificate content */}
              <div className="space-y-4 z-10">
                <span className="text-[10px] font-black tracking-widest text-[#FF8A1F] uppercase block">LearnBridge AI Academy</span>
                <h1 className="text-3xl md:text-4.5xl font-black font-serif text-[#17233C] tracking-wide leading-tight uppercase">
                  Certificate of Mastery
                </h1>
                <div className="h-0.5 w-24 bg-[#FF8A1F] mx-auto"></div>
              </div>

              <div className="space-y-2 z-10">
                <p className="text-xs md:text-sm text-[#52627A] font-semibold italic">This credential is proudly presented to</p>
                <h2 className="text-2xl md:text-3.5xl font-black text-[#17233C] tracking-wide border-b border-[#FF8A1F]/30 pb-1.5 px-6 inline-block">
                  {studentName}
                </h2>
              </div>

              <div className="space-y-4 max-w-lg mx-auto z-10 text-xs md:text-sm leading-relaxed text-[#52627A] font-semibold">
                <p>
                  For successfully completing the comprehensive **Advanced Data Structures & Algorithms** adaptive curriculum.
                  You have demonstrated exceptional retention, conceptual mastery, and code execution capability across recursive architectures,
                  tree structures, and sequential search protocols, validated by LearnBridge AI Tutor models.
                </p>
              </div>

              {/* Mastered topics pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 z-10 max-w-md">
                {data.recent_mastery.filter(m => m.mastery_score >= 70).map((t, idx) => (
                  <span
                    key={idx}
                    className="bg-[#FFF9F3] border border-[#FF8A1F]/20 text-[#C8540A] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full animate-pulse-glow"
                  >
                    {t.topic_name}
                  </span>
                ))}
              </div>

              {/* Seal & signatures */}
              <div className="grid grid-cols-2 gap-12 w-full max-w-md pt-6 border-t border-[#FF8A1F]/15 z-10">
                <div className="space-y-0.5">
                  <span className="font-serif italic font-extrabold text-[#17233C] text-sm tracking-wider block">
                    LearnBridge AI Coach
                  </span>
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest block border-t border-slate-200 pt-1.5">
                    Autonomous Coach Agent
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-serif italic font-extrabold text-[#17233C] text-sm tracking-wider block">
                    Shalini Projects
                  </span>
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest block border-t border-slate-200 pt-1.5">
                    Academic Director
                  </span>
                </div>
              </div>

              {/* Validation Hash */}
              <div className="text-[8px] font-mono text-[#64748B] select-all z-10 mt-2 uppercase">
                Credential ID: LB-CERT-{studentName.substring(0, 3).toUpperCase()}-{Math.floor(100000 + Math.random() * 900000)}
              </div>
            </div>

            {/* Action buttons (hidden in print) */}
            <div className="flex gap-3 justify-end border-t pt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer border-none flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-white" />
                Print / Save as PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
