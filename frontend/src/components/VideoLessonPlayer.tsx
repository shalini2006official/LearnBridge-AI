import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, X, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface VideoLessonPlayerProps {
  topicName: string;
  onClose: () => void;
}

interface Scene {
  scene_number: number;
  title: string;
  scene_narration: string;
  scene_action_description: string;
  question_prompt?: {
    text: string;
    options: string[];
    correct: string;
    explanation: string;
  } | null;
}

export const VideoLessonPlayer: React.FC<VideoLessonPlayerProps> = ({ topicName, onClose }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch dynamic script from LLM endpoint on mount
  useEffect(() => {
    const fetchScript = async () => {
      setLoading(true);
      try {
        const scriptData = await api.getVideoScript(topicName);
        if (scriptData && scriptData.length > 0) {
          setScenes(scriptData);
        } else {
          throw new Error("Empty script payload returned.");
        }
      } catch (err: any) {
        console.error("Failed to load video script. Falling back to internal defaults.", err);
        const fallbackScenes: Scene[] = [
          {
            scene_number: 1,
            title: `Introduction to ${topicName}`,
            scene_narration: `Welcome to this LearnBridge interactive visual lesson on ${topicName}. Let's master the core concepts step by step.`,
            scene_action_description: `Animation explaining the base structure of ${topicName}.`,
            question_prompt: null
          },
          {
            scene_number: 2,
            title: "Practical Analogy",
            scene_narration: `Think of ${topicName} like a real-world concept. For instance, standing between two mirrors or organizing a stack of plates.`,
            scene_action_description: `Visual illustration of the real-world analogy.`,
            question_prompt: null
          },
          {
            scene_number: 3,
            title: "Interactive Checkpoint",
            scene_narration: "Let's check your understanding of this topic before we continue to the code walkthrough.",
            scene_action_description: `An interactive checkpoint challenge.`,
            question_prompt: {
              text: `What is a primary characteristic of ${topicName}?`,
              options: [
                "A) It is dynamically stored in linear elements.",
                "B) It is a key structure to optimize search and retrieval operations.",
                "C) It cannot be analyzed with standard bounds.",
                "D) It requires constant thread reboots."
              ],
              correct: "B) It is a key structure to optimize search and retrieval operations.",
              explanation: "Correct! These systems optimize calculations and data accessibility."
            }
          },
          {
            scene_number: 4,
            title: "Dynamic Summary",
            scene_narration: `In summary, remember to verify boundary conditions when working with ${topicName} to ensure safe execution.`,
            scene_action_description: `Summary of best practices and reference definitions.`,
            question_prompt: null
          }
        ];
        setScenes(fallbackScenes);
      } finally {
        setLoading(false);
      }
    };
    fetchScript();
  }, [topicName]);

  const currentScene = scenes[currentSceneIdx];
  const narration = currentScene ? (currentScene.scene_narration || (currentScene as any).narration || '') : '';
  const actionDescription = currentScene ? (currentScene.scene_action_description || (currentScene as any).scene_description || (currentScene as any).action_description || (currentScene as any).description || '') : '';

  // Speech synthesizer triggers when scene or settings change
  useEffect(() => {
    if (!currentScene) return;
    speakScene();
    return () => {
      cancelSpeech();
    };
  }, [currentSceneIdx, scenes, speechRate, voiceEnabled]);

  const speakScene = () => {
    cancelSpeech();
    if (!currentScene || !voiceEnabled || !synthRef.current) return;
    
    utteranceRef.current = new SpeechSynthesisUtterance(narration);
    utteranceRef.current.rate = speechRate;
    utteranceRef.current.onend = () => {
      // Check if current scene is not a checkpoint
      if (!currentScene.question_prompt) {
        // Auto-advance if playing
        if (isPlaying && currentSceneIdx < scenes.length - 1) {
          setTimeout(() => handleNext(), 1500);
        }
      }
    };
    synthRef.current.speak(utteranceRef.current);
  };

  const cancelSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleNext = () => {
    if (!currentScene) return;
    if (currentScene.question_prompt && answerResult !== 'correct') {
      alert("Please solve the checkpoint question correctly to unlock the next video scene.");
      return;
    }
    if (currentSceneIdx < scenes.length - 1) {
      setSelectedAnswer(null);
      setAnswerResult(null);
      setCurrentSceneIdx(prev => prev + 1);
      setProgress(((currentSceneIdx + 1) / (scenes.length - 1)) * 100);
    }
  };

  const handlePrev = () => {
    if (currentSceneIdx > 0) {
      setSelectedAnswer(null);
      setAnswerResult(null);
      setCurrentSceneIdx(prev => prev - 1);
      setProgress(((currentSceneIdx - 1) / (scenes.length - 1)) * 100);
    }
  };

  const handleReplay = () => {
    setSelectedAnswer(null);
    setAnswerResult(null);
    speakScene();
  };

  const handleAnswerSubmit = (opt: string) => {
    if (!currentScene || !currentScene.question_prompt) return;
    setSelectedAnswer(opt);

    if (opt.trim().toLowerCase() === currentScene.question_prompt.correct.trim().toLowerCase() ||
        opt.charAt(0) === currentScene.question_prompt.correct.charAt(0)) {
      setAnswerResult('correct');
      if (synthRef.current && voiceEnabled) {
        cancelSpeech();
        const successUtt = new SpeechSynthesisUtterance("Excellent! That is correct. Let's move forward.");
        successUtt.rate = speechRate;
        synthRef.current.speak(successUtt);
      }
    } else {
      setAnswerResult('incorrect');
      if (synthRef.current && voiceEnabled) {
        cancelSpeech();
        const failUtt = new SpeechSynthesisUtterance("That is incorrect. Please review the choices and try again.");
        failUtt.rate = speechRate;
        synthRef.current.speak(failUtt);
      }
    }
  };

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    if (nextVal) {
      setTimeout(() => speakScene(), 100);
    } else {
      cancelSpeech();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#17233C]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="w-96 bg-white rounded-3xl p-6 border border-[#FF8A1F]/20 shadow-2xl flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#F26B0F] animate-spin" />
          <p className="text-xs text-[#52627A] font-bold">Generating dynamic video pedagogical outline...</p>
        </div>
      </div>
    );
  }

  if (!currentScene) {
    return (
      <div className="fixed inset-0 bg-[#17233C]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="w-96 bg-white rounded-3xl p-6 border border-rose-500/20 shadow-2xl flex flex-col items-center justify-center space-y-3">
          <X className="w-8 h-8 text-rose-500" />
          <p className="text-xs text-[#52627A] font-bold text-center">Failed to load video script. Ensure database and AI configuration are seeded.</p>
          <button onClick={onClose} className="bg-[#F26B0F] text-white text-xs font-bold py-2 px-4 rounded-xl">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#17233C]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[550px] animate-scale-up">
        
        {/* Left Side: Dynamic Visual Canvas */}
        <div className="flex-1 bg-[#0b0f19] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-900 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-orange-400">
              Scene {currentSceneIdx + 1} of {scenes.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 cursor-pointer"
                title="Toggle Mute"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
              </button>
            </div>
          </div>

          {/* Interactive Screen Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
            
            {/* Visual type Checkpoint */}
            {currentScene.question_prompt ? (
              <div className="w-full space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 max-w-md animate-fade-in">
                <h4 className="font-extrabold text-xs md:text-sm leading-relaxed text-orange-400">{currentScene.question_prompt.text}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {currentScene.question_prompt.options.map((opt) => {
                    const isChosen = selectedAnswer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswerSubmit(opt)}
                        className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isChosen
                            ? answerResult === 'correct'
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                              : 'bg-rose-950/40 border-rose-500 text-rose-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answerResult === 'correct' && (
                  <p className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20 animate-fade-in">
                    ✓ {currentScene.question_prompt.explanation}
                  </p>
                )}
              </div>
            ) : (
              // Animation descriptions/drawings based on scene number
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-48 h-32 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent"></div>
                  
                  {currentSceneIdx % 2 === 0 ? (
                    // Recursive dolls / Stack lines visual mockup
                    <div className="flex flex-col items-center gap-1 animate-pulse">
                      <div className="w-24 h-4 bg-orange-500 rounded-lg"></div>
                      <div className="w-20 h-4 bg-orange-500/70 rounded-lg"></div>
                      <div className="w-16 h-4 bg-orange-500/40 rounded-lg"></div>
                    </div>
                  ) : (
                    // Diagram loops simulation
                    <div className="w-12 h-12 rounded-full border-4 border-dashed border-orange-500 animate-spin" style={{ animationDuration: '6s' }}></div>
                  )}
                </div>
                
                <p className="text-xs text-slate-400 font-semibold text-center italic max-w-xs leading-relaxed">
                  "{actionDescription}"
                </p>
              </div>
            )}
          </div>

          {/* Timeline slider */}
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-4">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Right Side: Narrative script and Controller */}
        <div className="w-full md:w-85 bg-[#0a0d16] p-6 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
              <h3 className="font-extrabold text-sm text-white">Pedagogical Video Script</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Narration Script Text */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4">
            <h4 className="font-extrabold text-base text-orange-400 leading-tight">
              {currentScene.title}
            </h4>
            <p className="text-xs text-slate-350 leading-relaxed font-semibold select-text">
              {narration}
            </p>
          </div>

          {/* Speeds and Timeline controller */}
          <div className="space-y-4 border-t border-slate-900 pt-4">
            {/* Speech rate scaling speed selector */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Speech Rate:</span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {[0.75, 1.0, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-1 rounded text-[9px] font-black cursor-pointer border-none ${
                      speechRate === rate ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Timers & Play Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentSceneIdx === 0}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
                title="Prev Scene"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleReplay}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 cursor-pointer"
                title="Replay Scene"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl cursor-pointer border-none shadow-md shadow-orange-500/10"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Play
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentSceneIdx === scenes.length - 1 || (!!currentScene.question_prompt && answerResult !== 'correct')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
                title="Next Scene"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
