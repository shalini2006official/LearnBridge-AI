import React, { useState, useEffect, useRef } from 'react';
import { Flame, Brain, Award, Play, RotateCcw, HelpCircle, ShieldAlert, Timer } from 'lucide-react';

interface Card {
  id: number;
  concept: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CONCEPT_PAIRS = [
  { concept: 'Recursion', emoji: '🔄' },
  { concept: 'Stack (LIFO)', emoji: '🥞' },
  { concept: 'Queue (FIFO)', emoji: '🚶' },
  { concept: 'Binary Tree', emoji: '🌿' },
  { concept: 'Graph Node', emoji: '🕸️' },
  { concept: 'Linked List', emoji: '🔗' },
  { concept: 'Contiguous Array', emoji: '📊' },
  { concept: 'String Char', emoji: '🔤' }
];

export const BrainGames: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'math' | 'memory'>('math');

  // Math Sprint States
  const [mathScore, setMathScore] = useState(0);
  const [mathHighScore, setMathHighScore] = useState(() => {
    return parseInt(localStorage.getItem('math_high_score') || '0', 10);
  });
  const [mathTimeLeft, setMathTimeLeft] = useState(30);
  const [mathGameState, setMathGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [mathQuestion, setMathQuestion] = useState({ text: '', answer: 0, choices: [] as number[] });
  const [mathFeedback, setMathFeedback] = useState<'correct' | 'wrong' | null>(null);
  const mathTimerRef = useRef<any>(null);

  // Memory Card Match States
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  const [memoryTime, setMemoryTime] = useState(0);
  const [memoryGameState, setMemoryGameState] = useState<'idle' | 'playing' | 'victory'>('idle');
  const memoryTimerRef = useRef<any>(null);

  // ==========================================
  // MATH SPRINT CHALLENGE LOGIC
  // ==========================================
  const generateMathQuestion = (score: number) => {
    const maxVal = score < 50 ? 12 : score < 120 ? 25 : 50;
    const ops = score < 30 ? ['+', '-'] : score < 70 ? ['+', '-', '*'] : ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let num1 = Math.floor(Math.random() * maxVal) + 2;
    let num2 = Math.floor(Math.random() * maxVal) + 2;
    let answer = 0;
    let text = '';

    if (op === '+') {
      answer = num1 + num2;
      text = `${num1} + ${num2}`;
    } else if (op === '-') {
      if (num1 < num2) {
        const temp = num1;
        num1 = num2;
        num2 = temp;
      }
      answer = num1 - num2;
      text = `${num1} - ${num2}`;
    } else if (op === '*') {
      num1 = Math.floor(Math.random() * 10) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = num1 * num2;
      text = `${num1} × ${num2}`;
    } else {
      num2 = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 9) + 2;
      num1 = num2 * answer;
      text = `${num1} ÷ ${num2}`;
    }

    const choices = new Set<number>([answer]);
    while (choices.size < 4) {
      const offset = Math.floor(Math.random() * 15) - 7;
      const fakeChoice = answer + offset;
      if (fakeChoice >= 0 && fakeChoice !== answer) {
        choices.add(fakeChoice);
      }
    }

    setMathQuestion({
      text,
      answer,
      choices: Array.from(choices).sort(() => Math.random() - 0.5)
    });
  };

  const startMathGame = () => {
    setMathScore(0);
    setMathTimeLeft(30);
    setMathGameState('playing');
    setMathFeedback(null);
    generateMathQuestion(0);

    if (mathTimerRef.current) clearInterval(mathTimerRef.current);
    mathTimerRef.current = setInterval(() => {
      setMathTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(mathTimerRef.current!);
          setMathGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMathAnswer = (choice: number) => {
    if (mathGameState !== 'playing') return;

    if (choice === mathQuestion.answer) {
      setMathFeedback('correct');
      const nextScore = mathScore + 10;
      setMathScore(nextScore);
      setMathTimeLeft((t) => Math.min(t + 3, 45));

      if (nextScore > mathHighScore) {
        setMathHighScore(nextScore);
        localStorage.setItem('math_high_score', nextScore.toString());
      }

      setTimeout(() => {
        setMathFeedback(null);
        generateMathQuestion(nextScore);
      }, 350);
    } else {
      setMathFeedback('wrong');
      setMathTimeLeft((t) => Math.max(t - 5, 0));
      setTimeout(() => {
        setMathFeedback(null);
      }, 350);
    }
  };

  useEffect(() => {
    return () => {
      if (mathTimerRef.current) clearInterval(mathTimerRef.current);
      if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
    };
  }, []);

  // ==========================================
  // MEMORY MATCH GAME LOGIC
  // ==========================================
  const startMemoryGame = () => {
    const deck: Card[] = [];
    let idCounter = 0;
    
    [...CONCEPT_PAIRS, ...CONCEPT_PAIRS]
      .sort(() => Math.random() - 0.5)
      .forEach((item) => {
        deck.push({
          id: idCounter++,
          concept: item.concept,
          emoji: item.emoji,
          isFlipped: false,
          isMatched: false
        });
      });

    setCards(deck);
    setFlippedIndices([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setMemoryTime(0);
    setMemoryGameState('playing');

    if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
    memoryTimerRef.current = setInterval(() => {
      setMemoryTime((t) => t + 1);
    }, 1000);
  };

  const handleCardClick = (clickedIdx: number) => {
    if (memoryGameState !== 'playing') return;
    const clickedCard = cards[clickedIdx];
    if (clickedCard.isFlipped || clickedCard.isMatched || flippedIndices.length >= 2) return;

    const updatedCards = [...cards];
    updatedCards[clickedIdx].isFlipped = true;
    setCards(updatedCards);

    const nextFlipped = [...flippedIndices, clickedIdx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].concept === cards[secondIdx].concept) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          
          const newMatchCount = memoryMatches + 1;
          setMemoryMatches(newMatchCount);

          if (newMatchCount === CONCEPT_PAIRS.length) {
            clearInterval(memoryTimerRef.current!);
            setMemoryGameState('victory');
          }
        }, 300);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const formatMemoryTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Dashboard Banner */}
        <div className="relative p-6 rounded-2xl border bg-white border-[#FF8A1F]/15 flex items-center justify-between gap-4 overflow-hidden shadow-sm">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#FF8A1F]" />
              <h1 className="text-xl font-black text-[#17233C]">Refreshment Brain Games</h1>
            </div>
            <p className="text-xs text-[#52627A] font-semibold max-w-xl">
              Take a short cognitive break! Charge your focus streak and refresh your analytical processing speed.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-slate-100/40 select-none pointer-events-none">
            <Brain className="w-48 h-48" />
          </div>
        </div>

        {/* Tab selection links */}
        <div className="flex gap-2.5 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'math'
                ? 'bg-[#FF8A1F] text-white shadow-sm'
                : 'bg-white border border-[#FF8A1F]/15 text-[#52627A] hover:bg-[#FFF9F3]/60'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            Math Sprint
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'memory'
                ? 'bg-[#FF8A1F] text-white shadow-sm'
                : 'bg-white border border-[#FF8A1F]/15 text-[#52627A] hover:bg-[#FFF9F3]/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            AlgoPairs Card Match
          </button>
        </div>

        {/* GAME SCREEN BODY */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 min-h-[400px] flex flex-col justify-between shadow-sm relative overflow-hidden">

          {/* TAB 1: MATH SPRINT CHALLENGE */}
          {activeTab === 'math' && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Math Game Header Status bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-xs">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider block">Score</span>
                    <span className="text-base font-black text-[#F26B0F]">{mathScore}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200"></div>
                  <div className="text-xs">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider block">High Score</span>
                    <span className="text-base font-black text-[#17233C]">{mathHighScore}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FFF9F3] border border-[#FF8A1F]/15 px-3 py-1.5 rounded-full text-xs text-[#FF8A1F] font-extrabold animate-pulse">
                  <Timer className="w-4 h-4 text-[#F26B0F]" />
                  <span>Time Left: {mathTimeLeft}s</span>
                </div>
              </div>

              {/* GAME IDLE SCREEN */}
              {mathGameState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-8">
                  <div className="w-16 h-16 bg-[#FFF9F3] border border-[#FF8A1F]/20 text-[#FF8A1F] rounded-2xl flex items-center justify-center shadow-sm">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#17233C]">Math Sprint</h3>
                    <p className="text-xs text-[#52627A] font-semibold max-w-sm">
                      Solve as many mental math equations as possible before the timer runs out! Each correct answer adds +3s. Incorrect subtracts -5s.
                    </p>
                  </div>
                  <button
                    onClick={startMathGame}
                    className="bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] hover:scale-105 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 animate-bounce"
                  >
                    <Play className="w-4 h-4 text-white" />
                    Start Sprint Game
                  </button>
                </div>
              )}

              {/* GAME ACTIVE SCREEN */}
              {mathGameState === 'playing' && (
                <div className="flex-1 flex flex-col justify-around py-4">
                  {/* Equation bubble */}
                  <div className={`text-center py-6 px-4 rounded-2xl border transition-all ${
                    mathFeedback === 'correct' 
                      ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800 animate-pulse' 
                      : mathFeedback === 'wrong' 
                        ? 'bg-rose-50 border-rose-500/30 text-rose-800' 
                        : 'bg-slate-50 border-slate-200/50 text-[#17233C]'
                  }`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] block mb-1">Compute Fast</span>
                    <span className="text-3xl font-black font-mono tracking-wider">{mathQuestion.text}</span>
                  </div>

                  {/* Multiple choices option grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {mathQuestion.choices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => handleMathAnswer(choice)}
                        className="p-4 rounded-xl border border-slate-200 hover:border-[#FF8A1F] hover:bg-[#FFF9F3]/40 text-[#17233C] text-lg font-black font-mono cursor-pointer transition-all shadow-sm flex items-center justify-center"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GAME OVER SCREEN */}
              {mathGameState === 'gameover' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-8">
                  <div className="w-16 h-16 bg-rose-50 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-rose-600">Times Up!</h3>
                    <p className="text-xs text-[#52627A] font-semibold">
                      You finished with a sprint score of <span className="text-base font-black text-[#F26B0F]">{mathScore}</span> points.
                    </p>
                  </div>
                  <button
                    onClick={startMathGame}
                    className="bg-[#17233C] hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALGO-PAIRS CARD MATCH */}
          {activeTab === 'memory' && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Memory Game status stats */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-xs">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider block">Moves</span>
                    <span className="text-base font-black text-[#17233C]">{memoryMoves}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200"></div>
                  <div className="text-xs">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider block">Pairs Matched</span>
                    <span className="text-base font-black text-[#F26B0F]">{memoryMatches} / {CONCEPT_PAIRS.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FFF9F3] border border-[#FF8A1F]/15 px-3 py-1.5 rounded-full text-xs text-[#FF8A1F] font-extrabold">
                  <Timer className="w-4 h-4 text-[#F26B0F]" />
                  <span>Time: {formatMemoryTime(memoryTime)}</span>
                </div>
              </div>

              {/* GAME IDLE SCREEN */}
              {memoryGameState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-8">
                  <div className="w-16 h-16 bg-[#FFF9F3] border border-[#FF8A1F]/20 text-[#FF8A1F] rounded-2xl flex items-center justify-center shadow-sm">
                    <Flame className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#17233C]">AlgoPairs Matching Grid</h3>
                    <p className="text-xs text-[#52627A] font-semibold max-w-sm">
                      Reveal cards to find matching pairs of computer science concepts (Recursion, Stacks, Queues, Binary Trees). Memorize positions to speed up operations!
                    </p>
                  </div>
                  <button
                    onClick={startMemoryGame}
                    className="bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] hover:scale-105 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4 text-white" />
                    Start Card Match
                  </button>
                </div>
              )}

              {/* GAME PLAYING ACTIVE BOARD GRID */}
              {memoryGameState === 'playing' && (
                <div className="grid grid-cols-4 gap-3 py-2 max-w-md mx-auto w-full">
                  {cards.map((card, idx) => {
                    const isFlippedOrMatched = card.isFlipped || card.isMatched;
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleCardClick(idx)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-350 cursor-pointer shadow-sm relative ${
                          card.isMatched
                            ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800 scale-[0.98]'
                            : card.isFlipped
                              ? 'bg-white border-[#FF8A1F] text-[#FF8A1F]'
                              : 'bg-gradient-to-tr from-[#FFF7EF] to-[#FF8A1F]/10 border-[#FF8A1F]/25 text-[#17233C] hover:scale-103'
                        }`}
                      >
                        {isFlippedOrMatched ? (
                          <div className="flex flex-col items-center gap-1 p-1">
                            <span className="text-2xl">{card.emoji}</span>
                            <span className="text-[7.5px] font-black tracking-tighter uppercase truncate text-center max-w-[65px] text-slate-800">
                              {card.concept.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <HelpCircle className="w-6 h-6 text-[#FF8A1F]/60" />
                        )}
                        {card.isMatched && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* GAME VICTORY SCREEN */}
              {memoryGameState === 'victory' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-8">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <Award className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-600">Victory! Matched All Pairs</h3>
                    <p className="text-xs text-[#52627A] font-semibold max-w-sm">
                      Completed in <span className="font-extrabold text-[#F26B0F]">{memoryMoves}</span> moves within <span className="font-extrabold text-[#17233C]">{formatMemoryTime(memoryTime)}</span>. Excellent cognitive speed!
                    </p>
                  </div>
                  <button
                    onClick={startMemoryGame}
                    className="bg-[#17233C] hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    Reset Match Game
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
  );
};
