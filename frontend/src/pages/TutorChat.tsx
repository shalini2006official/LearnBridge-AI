import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAccessibility } from '../hooks/useAccessibility';
import { Sparkles, BookOpen, ImageIcon, Mic, Send, RefreshCw, Volume2, VolumeX, CheckSquare } from 'lucide-react';
import { GroundedBadge } from '../components/GroundedBadge';
import { VideoLessonPlayer } from '../components/VideoLessonPlayer';
import { Markdown } from '../components/Markdown';

interface Topic {
  id: number;
  name: string;
}

interface ChatMessage {
  sender: 'tutor' | 'student';
  text: string;
  strategy?: string;
  citation?: string;
  isGrounded?: boolean;
  topicId?: number;
  topicName?: string;
  isTeachBackEvaluation?: boolean;
  isError?: boolean;
}

export const TutorChat: React.FC = () => {
  const navigate = useNavigate();
  const { settings, speakText, stopSpeaking, isSpeaking } = useAccessibility();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [strategy, setStrategy] = useState<string>('example');
  const [showVideoLesson, setShowVideoLesson] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // OCR and voice dictation states
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => Math.random().toString(36).substring(2) + Date.now().toString(36));

  // Teach-back states
  const [teachBackActive, setTeachBackActive] = useState(false);
  const [teachBackText, setTeachBackText] = useState('');
  const [lastExplanationText, setLastExplanationText] = useState('');
  const [teachBackTopicId, setTeachBackTopicId] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Load topics and welcome message
  useEffect(() => {
    const initChat = async () => {
      try {
        const graph = await api.getKnowledgeGraph();
        if (graph && graph.length > 0) {
          const allTopics: Topic[] = graph.flatMap((subj: any) => subj.topics);
          setTopics(allTopics);
          
          if (allTopics.length > 0) {
            setSelectedTopicId(allTopics[0].id);
            setTeachBackTopicId(allTopics[0].id);
            
            // Set strategy style from cached user details
            if (user?.explanation_preference) {
              setStrategy(user.explanation_preference);
            }

            setMessages([
              {
                sender: 'tutor',
                text: `Welcome! Type any educational question or ask a doubt below. You can also pick a target topic and select an explanation strategy from the options bar.\n\nTry selecting "analogy" or "visual" styles to explain complex structures!`,
                strategy: user?.explanation_preference || 'example'
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat initialization details", err);
      }
    };
    initChat();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset/Clear conversation memory
  const handleNewConversation = async () => {
    try {
      await api.clearConversation();
      const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      setConversationId(newId);
      setMessages([
        {
          sender: 'tutor',
          text: 'Hello! I am your AI learning companion. What would you like to explore today?',
          strategy: strategy
        }
      ]);
    } catch (err) {
      console.error("Failed to clear conversation history", err);
      const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      setConversationId(newId);
      // Soft reset anyway
      setMessages([
        {
          sender: 'tutor',
          text: 'Hello! I am your AI learning companion. What would you like to explore today?',
          strategy: strategy
        }
      ]);
    }
  };

  // Send message
  const handleSend = async (overrideText?: string) => {
    const textToSubmit = overrideText || inputText;
    if (!textToSubmit.trim()) return;

    setInputText('');
    setLoading(true);

    const topic = topics.find(t => t.id === selectedTopicId);
    const topicName = topic ? topic.name : '';

    // Append student message
    setMessages(prev => [...prev, {
      sender: 'student',
      text: textToSubmit
    }]);

    try {
      const response = await api.askDoubt(textToSubmit, selectedTopicId, conversationId);
      const explanationText = response.explanation || 'No explanation generated.';

      // Append tutor response
      setMessages(prev => [...prev, {
        sender: 'tutor',
        text: explanationText,
        strategy: response.strategy,
        citation: response.citation || 'Local Knowledge Base',
        isGrounded: response.is_grounded,
        topicId: selectedTopicId,
        topicName: response.topic_name || topicName
      }]);

      setLastExplanationText(explanationText);
      if (response.topic_id) {
        setTeachBackTopicId(response.topic_id);
      }

      if (settings.ttsEnabled) {
        speakText(explanationText);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'tutor',
        text: 'Something went wrong while preparing your lesson.',
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Sync strategy selection with student's profile settings
  const handleStrategyChange = async (newStrategy: string) => {
    setStrategy(newStrategy);
    try {
      await api.updateProfile({ explanation_preference: newStrategy });
      if (user) {
        user.explanation_preference = newStrategy;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.error("Failed to sync strategy preference with backend", err);
    }
  };

  // Quick Action toolbar helper
  const handleQuickAction = (actionType: 'explain' | 'example' | 'steps' | 'question' | 'translate' | 'full_concept') => {
    const currentTopicName = topics.find(t => t.id === selectedTopicId)?.name || 'this topic';
    let prompt = '';

    switch (actionType) {
      case 'explain':
        prompt = `Explain ${currentTopicName} simply.`;
        break;
      case 'full_concept':
        prompt = `Explain the full concept of ${currentTopicName} with explanation, code example, applications, syntax and references.`;
        break;
      case 'example':
        prompt = `Give me a real-world analogical example of ${currentTopicName}.`;
        break;
      case 'steps':
        prompt = `Break down the implementation of ${currentTopicName} step-by-step.`;
        break;
      case 'question':
        prompt = `Provide a multiple-choice practice question about ${currentTopicName}.`;
        break;
      case 'translate':
        const userLang = user?.language || 'en';
        const langMap: Record<string, string> = {
          en: 'English',
          hi: 'Hindi',
          ta: 'Tamil',
          te: 'Telugu',
          kn: 'Kannada',
          ml: 'Malayalam'
        };
        const targetLang = langMap[userLang] || 'English';
        prompt = `Explain ${currentTopicName} translated into ${targetLang} language.`;
        break;
    }
    
    handleSend(prompt);
  };

  // Triggered on doubt resolution image upload (Tesseract OCR)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        const ocrResult = await api.ocrImage(base64String);
        setInputText(ocrResult.extracted_text || '');
      } catch (err) {
        alert("Failed to analyze image file. Try a cleaner snapshot.");
      } finally {
        setOcrLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setOcrLoading(false);
      alert("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  // Dictate doubt with Web Speech API
  const handleMicrophone = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = user?.language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(prev => (prev ? prev + ' ' + speechToText : speechToText));
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleTeachBackSubmit = async () => {
    if (!teachBackText.trim()) return;
    try {
      const response = await api.submitTeachBack({
        topic_id: teachBackTopicId,
        explanation_text: lastExplanationText,
        teach_back_text: teachBackText
      });

      setMessages(prev => [...prev, {
        sender: 'tutor',
        text: `### 📊 Feynman Evaluation Feedback\n\n**Score**: ${response.score}/100\n\n${response.evaluation_feedback}\n\n**Detected Gaps**:\n${response.detected_gaps.map((g: string) => `- ${g}`).join('\n') || '- None! Excellent understanding.'}`,
        isTeachBackEvaluation: true
      }]);
      
      setTeachBackActive(false);
      setTeachBackText('');
    } catch (err) {
      alert("Failed to submit teach back evaluation. Make sure backend is active.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-3xl border border-[#FF8A1F]/15 shadow-glass overflow-hidden font-sans">
      
      {/* Top Options Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Target Topic</label>
          <select
            value={selectedTopicId || ''}
            onChange={(e) => setSelectedTopicId(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer shadow-sm"
          >
            <option value="">-- Optional Topic Filter --</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={handleNewConversation}
            className="text-[10px] font-extrabold bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            New Conversation
          </button>
        </div>
 
        {/* Strategy Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Strategy Style</label>
          <div className="flex bg-[#FFF9F3]/65 p-1 rounded-xl border border-[#FF8A1F]/15">
            {['technical', 'analogy', 'example', 'visual'].map(st => (
              <button
                key={st}
                onClick={() => handleStrategyChange(st)}
                className={`text-[9.5px] px-3.5 py-1.5 capitalize font-extrabold rounded-lg transition-all cursor-pointer border-none ${
                  strategy === st
                    ? 'bg-[#F26B0F] text-white shadow-sm'
                    : 'text-[#52627A] hover:text-[#17233C] bg-transparent'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 bg-[#FFF9F3]/10">
        {messages.map((msg, idx) => {
          const isTutor = msg.sender === 'tutor';
          return (
            <div key={idx} className={`flex gap-3.5 max-w-[85%] ${isTutor ? '' : 'ml-auto flex-row-reverse'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 transition-transform hover:scale-105 ${
                isTutor 
                  ? 'bg-gradient-to-tr from-[#FF8A1F] to-[#F26B0F] text-white shadow-[#FF8A1F]/20' 
                  : 'bg-white border border-[#FF8A1F]/25 text-[#17233C] flex items-center justify-center font-extrabold text-xs'
              }`}>
                {isTutor ? <Sparkles className="w-4 h-4 text-white" /> : <span>S</span>}
              </div>
 
              {/* Message box */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className={`p-4.5 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
                  isTutor 
                    ? 'bg-white border border-[#FF8A1F]/15 border-l-4 border-l-[#FF8A1F] text-[#17233C] rounded-tl-none' 
                    : 'bg-[#FF8A1F] text-white rounded-tr-none'
                }`}>
                  <Markdown text={msg.text} />
 
                  {/* Narration Speaker button */}
                  {isTutor && settings.ttsEnabled && !msg.isError && (
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.text)}
                      className="mt-3 p-1.5 rounded-lg bg-[#FF8A1F]/10 hover:bg-[#FF8A1F]/20 text-[#FF8A1F] flex items-center gap-1.5 text-[9px] font-extrabold transition-colors cursor-pointer border-none"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {isSpeaking ? 'Mute' : 'Speak Explanation'}
                    </button>
                  )}

                  {/* Friendly error handler choice buttons */}
                  {isTutor && msg.isError && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleSend(inputText || 'Explain again')}
                        className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border-none shadow-sm"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => navigate('/notes')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Use Saved Content
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.slice(0, -1))}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Continue Without AI
                      </button>
                    </div>
                  )}
                </div>
 
                {/* Grounded Citation details */}
                {isTutor && !msg.isError && (
                  <GroundedBadge citation={msg.citation} isGrounded={!!msg.isGrounded} />
                )}
 
                {/* Teachback activation prompt */}
                {isTutor && msg.topicId && !msg.isTeachBackEvaluation && !msg.isError && (
                  <button
                    onClick={() => setTeachBackActive(true)}
                    className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#FF8A1F] hover:text-[#F26B0F] hover:underline cursor-pointer border-none bg-transparent"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[#FF8A1F]" />
                    Verify with Feynman Teach-Back Check
                  </button>
                )}

                {/* Follow-up action items */}
                {isTutor && msg.topicName && !msg.isTeachBackEvaluation && !msg.isError && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      onClick={() => handleSend(`Explain ${msg.topicName} simply`)}
                      className="text-[9px] bg-white hover:bg-[#FFF9F3] border border-[#FF8A1F]/20 text-[#C8540A] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1"
                    >
                      <span>💡</span> Explain Simply
                    </button>
                    <button
                      onClick={() => handleSend(`Explain the full concept of ${msg.topicName} with explanation, code example, applications, syntax and references.`)}
                      className="text-[9px] bg-white hover:bg-[#FFF9F3] border border-[#FF8A1F]/20 text-[#C8540A] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1"
                    >
                      <span>📚</span> Full Concept
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF8A1F] to-[#F26B0F] text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-[#FF8A1F]/15 border-l-4 border-l-[#FF8A1F] text-[#17233C] p-4.5 rounded-2xl text-xs leading-relaxed flex items-center gap-2 rounded-tl-none shadow-sm">
              <div className="w-1.5 h-1.5 bg-[#FF8A1F] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#FF8A1F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#FF8A1F] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              <span className="text-[10px] text-[#52627A] font-bold">Synthesizing personalized pedagogy...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Teach Back text box */}
      {teachBackActive && (
        <div className="p-4 border-t border-[#FF8A1F]/15 bg-[#FFF9F3] space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FF8A1F]" />
            <h4 className="font-extrabold text-xs text-[#17233C]">Feynman Teach-Back Mode</h4>
            <p className="text-[10px] text-[#64748B] font-bold">Explain the concept back in your own words. The tutor will grade your completeness.</p>
          </div>
          <textarea
            placeholder="Type your explanation here..."
            value={teachBackText}
            onChange={(e) => setTeachBackText(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FF8A1F] min-h-[70px] resize-none text-[#17233C] font-semibold"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setTeachBackActive(false)}
              className="text-[10px] font-bold text-[#64748B] hover:text-[#17233C] cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              onClick={handleTeachBackSubmit}
              className="bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer border-none"
            >
              Submit Explanation
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="px-4 py-2 border-t border-slate-100/60 bg-white flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Quick Prompts:</span>
        <button
          onClick={() => handleQuickAction('explain')}
          className="text-[10px] font-bold px-3 py-1 rounded-full border border-[#FF8A1F]/20 text-[#FF8A1F] hover:bg-[#FFF9F3] cursor-pointer transition-all"
        >
          💡 Explain Simply
        </button>
        <button
          onClick={() => handleQuickAction('full_concept')}
          className="text-[10px] font-bold px-3 py-1 rounded-full border border-[#F26B0F]/20 text-[#F26B0F] hover:bg-[#FFF9F3] cursor-pointer transition-all flex items-center gap-1"
        >
          📚 Full Concept
        </button>
      </div>

      {/* Bottom Inputs */}
      <div className="p-4.5 border-t border-slate-200/50 flex items-center gap-3 bg-white relative">
        
        {/* Recording Visual Speech Wave indicator */}
        {isRecording && (
          <div className="absolute top-[-36px] left-4 flex items-center gap-1 bg-rose-500/10 border border-rose-500/35 px-3 py-1.5 rounded-full shadow-sm animate-pulse z-10">
            <span className="w-1.5 h-3.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            <span className="text-[10px] font-bold text-rose-500 ml-1.5">Voice Dictation Active...</span>
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#FF8A1F]/20 text-[#FF8A1F] transition-colors relative cursor-pointer shadow-sm"
          title="Upload Doubt Image (OCR)"
          disabled={ocrLoading}
        >
          {ocrLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF8A1F]" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </button>

        <button
          onClick={handleMicrophone}
          className={`p-3.5 rounded-xl border border-[#FF8A1F]/20 transition-all cursor-pointer shadow-sm ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/25 border-rose-500' 
              : 'bg-slate-50 hover:bg-slate-100 text-[#FF8A1F]'
          }`}
          title="Dictate Doubt (Voice Input)"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder="Ask any doubt... e.g. What does a base case do in recursion?"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4.5 text-xs focus:outline-none focus:border-[#FF8A1F] text-[#17233C] font-semibold shadow-inner"
        />

        <button
          onClick={() => handleSend()}
          className="p-3.5 rounded-xl bg-[#FF8A1F] hover:bg-[#F26B0F] text-white transition-all shadow-md cursor-pointer border-none flex items-center justify-center"
        >
          <Send className="w-4 h-4 text-white fill-white" />
        </button>
      </div>
      {showVideoLesson && (
        <VideoLessonPlayer
          topicName={topics.find(t => t.id === selectedTopicId)?.name || 'Recursion'}
          onClose={() => setShowVideoLesson(false)}
        />
      )}
    </div>
  );
};
