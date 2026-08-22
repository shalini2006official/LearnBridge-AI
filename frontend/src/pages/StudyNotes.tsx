import React, { useState, useEffect } from 'react';
import { Markdown } from '../components/Markdown';
import { api } from '../services/api';
import { type Topic } from '../types';
import { Download, FileText, Trash2, Copy, Sparkles, RefreshCw, Search, Bookmark } from 'lucide-react';

interface NoteItem {
  id: number;
  topic_name: string;
  notes_style: string;
  content: string;
  created_at: string;
}

export const StudyNotes: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicName, setSelectedTopicName] = useState('');
  const [notesStyle, setNotesStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const getStyleLabel = (style: string) => {
    const styleMap: Record<string, string> = {
      detailed: 'Detailed Notes',
      quick: 'Quick Cheat Sheet',
      exam: 'Exam Prep Guide',
      interview: 'Interview Questions',
      beginner: 'Beginner Overview',
      revision: '5-Min Revision Card'
    };
    return styleMap[style.toLowerCase()] || style;
  };

  useEffect(() => {
    fetchNotes();
    fetchTopics();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const graph = await api.getKnowledgeGraph();
      if (graph && graph.length > 0) {
        const allTopics = graph.flatMap((s: any) => s.topics);
        setTopics(allTopics);
        if (allTopics.length > 0) {
          setSelectedTopicName(allTopics[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicName) return;
    setGenerating(true);
    try {
      const newNote = await api.generateNotes(selectedTopicName, notesStyle);
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
    } catch (err) {
      alert('Failed to generate notes. Check LLM provider settings.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (note: NoteItem) => {
    try {
      await api.downloadNotePDF(note.id, `${note.topic_name} - ${getStyleLabel(note.notes_style)}`);
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete these study notes?')) return;
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (err) {
      alert('Failed to delete notes.');
    }
  };

  const filteredNotes = notes.filter(n =>
    n.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-[#17233C] animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#17233C]">📚 LearnBridge Notes Hub</h2>
          <p className="text-xs text-[#52627A] font-bold">Generate customized revision sheets and download them as interactive study PDFs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Generator & List */}
        <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-6 h-fit">
          {/* Note Generator */}
          <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-[#17233C] flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#F26B0F]" />
              Generate Study Notes
            </h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17233C] uppercase tracking-wider">Select Topic</label>
                <select
                  value={selectedTopicName}
                  onChange={(e) => setSelectedTopicName(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl py-2.5 px-3.5 text-xs font-bold focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer"
                >
                  {topics.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="Quantum Computing">Custom: Quantum Computing</option>
                  <option value="Machine Learning">Custom: Machine Learning</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17233C] uppercase tracking-wider">Format Style</label>
                <select
                  value={notesStyle}
                  onChange={(e) => setNotesStyle(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl py-2.5 px-3.5 text-xs font-bold focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer"
                >
                  <option value="detailed">Detailed Notes</option>
                  <option value="quick">Quick Cheat Sheet</option>
                  <option value="exam">Exam Prep Guide</option>
                  <option value="interview">Interview Questions</option>
                  <option value="beginner">Beginner Overview</option>
                  <option value="revision">5-Min Revision Card</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] disabled:bg-slate-200 text-white text-xs font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Guide...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" />
                    Generate AI Study Notes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-[#17233C] flex items-center gap-2">
              <Bookmark className="w-4.5 h-4.5 text-[#F26B0F]" />
              My Saved Guides
            </h3>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search note guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFF9F3]/60 border border-[#CBD5E1] rounded-xl py-2 pl-8 pr-4 text-xs font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C]"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-center text-xs text-[#64748B] py-4">Syncing guides...</p>
              ) : filteredNotes.length > 0 ? (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex justify-between items-center ${
                      selectedNote?.id === note.id
                        ? 'bg-[#FFF9F3] border-[#F26B0F] text-[#F26B0F]'
                        : 'bg-white border-slate-200 text-[#17233C] hover:bg-[#FFF9F3]/30'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate">{note.topic_name} - {getStyleLabel(note.notes_style)}</p>
                      <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">{getStyleLabel(note.notes_style)}</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadPDF(note); }}
                        className="p-1 rounded bg-white text-[#F26B0F] hover:bg-[#FFF9F3] border border-[#FF8A1F]/20 cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                        className="p-1 rounded bg-white text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                        title="Delete Notes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[10px] text-[#64748B] py-6">No study guides saved yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Detail Viewer */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4 min-h-[500px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-4 mb-4 flex-wrap gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FFF9F3] text-[#F26B0F] uppercase tracking-wider border border-[#FF8A1F]/15">
                      {getStyleLabel(selectedNote.notes_style)}
                    </span>
                    <h3 className="font-extrabold text-xl text-[#17233C] mt-1">{selectedNote.topic_name} - {getStyleLabel(selectedNote.notes_style)}</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(selectedNote.content)}
                      className="bg-white border border-[#CBD5E1] hover:bg-[#FFF9F3]/30 text-[#17233C] text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#F26B0F]" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(selectedNote)}
                      className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-2 px-4.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                    >
                      <Download className="w-4 h-4 text-white fill-white" />
                      Download PDF
                    </button>
                  </div>
                </div>

                <div className="text-xs leading-relaxed font-sans space-y-4 select-text">
                  <Markdown text={selectedNote.content} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-[#64748B] font-bold uppercase tracking-widest">
                <span>LearnBridge Notes Hub</span>
                <span>Sources: Local Knowledge Base & Cloud AI Grounding</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#FF8A1F]/30 bg-[#FFF9F3]/20 flex flex-col items-center justify-center text-center min-h-[500px] space-y-3">
              <FileText className="w-12 h-12 text-[#FF8A1F]/40 animate-pulse" />
              <h4 className="font-extrabold text-base">Select a Study Guide</h4>
              <p className="text-xs text-[#52627A] max-w-sm font-semibold leading-relaxed">
                Pick an existing study sheet from your library on the left, or generate new personalized exam preps using local-AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
