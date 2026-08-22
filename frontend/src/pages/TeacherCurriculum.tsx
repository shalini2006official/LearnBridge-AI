import React, { useState } from 'react';
import { api } from '../services/api';
import { Markdown } from '../components/Markdown';
import { Sparkles, RefreshCw, Copy, Download, BookOpen } from 'lucide-react';

export const TeacherCurriculum: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('college');
  const [duration, setDuration] = useState('1 hour lecture');
  const [loading, setLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setCurriculum(null);
    try {
      const stylePrompt = `lesson plan for ${gradeLevel} students, duration: ${duration}, with objectives, lecture outline, code snippet examples, and 3 classroom review questions`;
      const res = await api.generateNotes(topic, stylePrompt);
      setCurriculum(res.content);
    } catch (err) {
      alert('Failed to generate curriculum. Verify Ollama or cloud LLM connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!curriculum) return;
    navigator.clipboard.writeText(curriculum);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-[#17233C] animate-slide-up max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            AI Lesson & Curriculum Builder
          </h2>
          <p className="text-xs text-white/90 font-bold">Generate custom lecture modules, lesson slides structure, and checkpoints using advanced tutoring models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5 h-fit">
          <div>
            <h3 className="font-extrabold text-sm text-[#17233C]">Curriculum Settings</h3>
            <p className="text-[10px] text-[#52627A] font-bold">Configure parameters for LLM educational plan generation.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 font-bold text-xs text-[#17233C]">
            <div className="space-y-1.5">
              <label className="uppercase tracking-wider">Lesson Topic</label>
              <input
                type="text"
                placeholder="e.g. Binary Search Trees, Array Sorting..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="uppercase tracking-wider">Target Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer"
              >
                <option value="high school">High School (Fundamentals)</option>
                <option value="college">College Undergraduate (Standard)</option>
                <option value="advanced postgraduate">Advanced Postgraduate (Research)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="uppercase tracking-wider">Duration Format</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer"
              >
                <option value="1 hour lecture">1 Hour Lecture Session</option>
                <option value="3 hour seminar">3 Hour Seminar / Lab</option>
                <option value="1 week module">1 Week Comprehensive Module</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] disabled:bg-slate-200 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Generating Lesson Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  Build Lesson Plan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#F26B0F]"></div>
              <div>
                <h4 className="font-extrabold text-sm">Structuring Lesson Material</h4>
                <p className="text-[10px] text-[#52627A] font-bold mt-0.5">Assembling objectives, outlines, code examples, and classroom assessment prompts.</p>
              </div>
            </div>
          ) : curriculum ? (
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between select-text">
              <div>
                <div className="flex items-center justify-between border-b pb-4 mb-4 flex-wrap gap-2 print:hidden">
                  <div className="space-y-0.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#FFF9F3] text-[#F26B0F] uppercase tracking-wider border border-[#FF8A1F]/15">
                      Classroom Material
                    </span>
                    <h3 className="font-extrabold text-lg mt-1 text-[#17233C]">Topic: {topic}</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="bg-white border border-[#CBD5E1] hover:bg-[#FFF9F3]/30 text-[#17233C] text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#F26B0F]" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-2 px-4.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                    >
                      <Download className="w-4 h-4 text-white fill-white" />
                      Print / Save as PDF
                    </button>
                  </div>
                </div>

                <div className="text-xs leading-relaxed font-sans space-y-4 font-semibold text-[#17233C]">
                  <Markdown text={curriculum} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-[#64748B] font-bold uppercase tracking-widest print:hidden">
                <span>LearnBridge Staff Sandbox</span>
                <span>Generated via Local educational LLM</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-[#FF8A1F]/30 bg-[#FFF9F3]/10 flex flex-col items-center justify-center text-center min-h-[400px] space-y-3">
              <BookOpen className="w-12 h-12 text-[#FF8A1F]/40 animate-pulse" />
              <h4 className="font-extrabold text-base">Interactive Curriculum Board</h4>
              <p className="text-xs text-[#52627A] max-w-sm font-semibold leading-relaxed">
                Configure your lecture module topic and grading criteria on the left, then click "Build Lesson Plan" to trigger AI generation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
