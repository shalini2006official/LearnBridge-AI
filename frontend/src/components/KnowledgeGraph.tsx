import React, { useState } from 'react';
import { type Topic } from '../types';
import { MessageSquare, Award, ArrowRight, GitBranch, Sparkles } from 'lucide-react';

interface KnowledgeGraphProps {
  data: Array<{
    subject_id: number;
    subject_name: string;
    topics: Topic[];
  }>;
  onSelectTopic: (topic: Topic) => void;
  onGenerateQuiz: (topicId: number) => void;
  onAskTutor: (topicName: string, topicId: number) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  data,
  onSelectTopic,
  onGenerateQuiz,
  onAskTutor
}) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Position nodes radially around a central "Data Structures" hub (cx=300, cy=165)
  const getNodeCoordinates = (name: string): { x: number; y: number } => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes("array")) return { x: 440, y: 165 };
    if (cleanName.includes("string")) return { x: 410, y: 245 };
    if (cleanName.includes("linked list")) return { x: 345, y: 290 };
    if (cleanName.includes("stack")) return { x: 255, y: 290 };
    if (cleanName.includes("queue")) return { x: 190, y: 245 };
    if (cleanName.includes("tree")) return { x: 160, y: 165 };
    if (cleanName.includes("graph")) return { x: 190, y: 85 };
    if (cleanName.includes("algorithm")) return { x: 255, y: 40 };
    if (cleanName.includes("recursion")) return { x: 345, y: 40 };
    if (cleanName.includes("binary search")) return { x: 410, y: 85 };
    // Fallback/Default
    return { x: 300, y: 165 };
  };

  const getStatusBorderColor = (color?: string) => {
    switch (color) {
      case 'green': return 'stroke-emerald-450 fill-emerald-950/40 text-emerald-400';
      case 'yellow': return 'stroke-amber-450 fill-amber-950/40 text-amber-400';
      case 'red': return 'stroke-rose-450 fill-rose-950/40 text-rose-400';
      default: return 'stroke-slate-650 fill-slate-950/45 text-slate-400';
    }
  };

  const getStatusBadgeColor = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-600';
      case 'yellow': return 'bg-amber-500/20 border border-amber-500/35 text-amber-600';
      case 'red': return 'bg-rose-500/20 border border-rose-500/35 text-rose-600';
      default: return 'bg-slate-100 border border-slate-200 text-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up text-[#17233C]">
      {/* Galaxy graph visualization */}
      <div className="lg:col-span-2 rounded-3xl p-6 relative overflow-hidden bg-slate-950 text-white shadow-xl flex flex-col justify-between min-h-[460px] border border-slate-900">
        
        {/* Graph Header */}
        <div className="flex justify-between items-start z-10">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-1.5 text-orange-400">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              Learning Constellation
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
              Radial master map centered on Data Structures. Galaxy links track prerequisite mappings.
            </p>
          </div>
          <div className="flex gap-2 text-[8px] font-black uppercase tracking-wider bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400">🟢 Mastered</span>
            <span className="flex items-center gap-1 text-amber-400">🟡 Learning</span>
            <span className="flex items-center gap-1 text-rose-400">🔴 Review</span>
            <span className="flex items-center gap-1 text-slate-400">⚪ Locked</span>
          </div>
        </div>

        {/* SVG Constellation */}
        <div className="flex-1 flex items-center justify-center py-6 relative">
          <svg className="w-full max-w-[650px] aspect-[16/9] drop-shadow-sm select-none" viewBox="0 0 650 330">
            
            {/* Defs for gradients & glowing node overlays */}
            <defs>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F26B0F" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F26B0F" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF8A1F" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F26B0F" stopOpacity="0.1" />
              </linearGradient>
              <marker id="constellationArrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-orange-500/40" />
              </marker>
            </defs>

            {/* Galaxy Star Dust Particles */}
            <circle cx="120" cy="60" r="1" fill="#fff" opacity="0.4" />
            <circle cx="210" cy="110" r="1.5" fill="#fff" opacity="0.35" className="animate-pulse" />
            <circle cx="480" cy="70" r="1" fill="#fff" opacity="0.6" />
            <circle cx="510" cy="270" r="2" fill="#fff" opacity="0.3" className="animate-pulse" />
            <circle cx="130" cy="250" r="1" fill="#fff" opacity="0.5" />
            <circle cx="580" cy="180" r="1.5" fill="#fff" opacity="0.45" />
            <circle cx="340" cy="130" r="1" fill="#fff" opacity="0.3" />
            <circle cx="280" cy="220" r="1" fill="#fff" opacity="0.4" />

            {/* Faint Radial Gravity Rings */}
            <circle cx="300" cy="165" r="140" fill="none" stroke="rgba(242, 107, 15, 0.05)" strokeWidth="1" strokeDasharray="3 4" />
            <circle cx="300" cy="165" r="80" fill="none" stroke="rgba(242, 107, 15, 0.03)" strokeWidth="1" />

            {/* Central Node Glow Overlay */}
            <circle cx="300" cy="165" r="50" fill="url(#hubGlow)" />

            {/* Draw Dependency lines (sequential prerequisites) */}
            {data.map((subj) =>
              subj.topics.flatMap((topic) => {
                const targetCoord = getNodeCoordinates(topic.name);
                return topic.prerequisites.map((prereqId) => {
                  const prereq = subj.topics.find(t => t.id === prereqId);
                  if (!prereq) return null;
                  const sourceCoord = getNodeCoordinates(prereq.name);
                  return (
                    <line
                      key={`${prereqId}-${topic.id}`}
                      x1={sourceCoord.x}
                      y1={sourceCoord.y}
                      x2={targetCoord.x}
                      y2={targetCoord.y}
                      stroke="url(#linkGradient)"
                      strokeWidth="2"
                      markerEnd="url(#constellationArrow)"
                      strokeDasharray="4 2"
                    />
                  );
                });
              })
            )}

            {/* Central Star: Data Structures Core */}
            <g className="cursor-pointer group">
              <circle cx="300" cy="165" r="28" className="stroke-orange-500 fill-slate-900 stroke-2 group-hover:scale-105 transition-all" />
              <circle cx="300" cy="165" r="22" fill="none" stroke="rgba(242, 107, 15, 0.3)" strokeWidth="1" className="animate-spin" style={{ transformOrigin: '300px 165px', animationDuration: '8s' }} />
              <text x="300" y="162" textAnchor="middle" className="text-[8px] font-black fill-orange-400 uppercase tracking-widest">Core</text>
              <text x="300" y="172" textAnchor="middle" className="text-[7px] font-black fill-white uppercase tracking-wider">Structures</text>
            </g>

            {/* Draw Constellation Planet Nodes */}
            {data.map((subj) =>
              subj.topics.map((topic) => {
                const coord = getNodeCoordinates(topic.name);
                const isSelected = selectedTopic?.id === topic.id;
                return (
                  <g 
                    key={topic.id} 
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedTopic(topic);
                      onSelectTopic(topic);
                    }}
                  >
                    {/* Node Glimmer Aura */}
                    {isSelected && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="32"
                        className="stroke-orange-500/30 fill-none stroke-[3] animate-pulse"
                      />
                    )}

                    {/* Planet Circle */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="20"
                      className={`stroke-2 transition-all duration-350 ${getStatusBorderColor(topic.status_color)} ${
                        isSelected 
                          ? 'stroke-orange-400 stroke-3 scale-110' 
                          : 'group-hover:stroke-orange-500/80 group-hover:scale-105'
                      }`}
                      style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
                    />
                    
                    {/* Mastery score text inside */}
                    <text
                      x={coord.x}
                      y={coord.y + 3}
                      textAnchor="middle"
                      className="text-[8px] font-black fill-white"
                    >
                      {topic.mastery_score ? `${Math.round(topic.mastery_score)}%` : '0%'}
                    </text>
                    
                    {/* Constellation Star Label */}
                    <text
                      x={coord.x}
                      y={coord.y + 34}
                      textAnchor="middle"
                      className={`text-[8.5px] font-bold tracking-wider ${
                        isSelected 
                          ? 'fill-orange-400 font-extrabold shadow-sm' 
                          : 'fill-slate-400 group-hover:fill-white'
                      } transition-colors`}
                    >
                      {topic.name}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      {/* Interactive Detail Side Panel */}
      <div className="glass-card rounded-3xl p-6 border border-[#E2E8F0] bg-white shadow-sm flex flex-col justify-between min-h-[460px] hover:shadow-md transition-shadow">
        {selectedTopic ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getStatusBadgeColor(selectedTopic.status_color)}`}>
                  {selectedTopic.status_color ? `${selectedTopic.status_color} mastery` : 'Not Started'}
                </span>
                {selectedTopic.mastery_score !== undefined && (
                  <span className="text-xs font-black text-[#F26B0F]">
                    Score: {Math.round(selectedTopic.mastery_score)}%
                  </span>
                )}
              </div>
              
              <div>
                <h4 className="font-extrabold text-lg leading-tight text-[#17233C]">{selectedTopic.name}</h4>
                <p className="text-[9px] text-[#52627A] mt-0.5 uppercase tracking-widest font-extrabold">Learning Cluster Star</p>
              </div>

              {/* Dynamic Prereqs details */}
              <div className="space-y-3 bg-[#FFF9F3]/65 p-4.5 rounded-2xl border border-[#FF8A1F]/15 shadow-sm text-xs">
                <div className="flex justify-between border-b pb-1.5 border-[#FF8A1F]/10">
                  <span className="text-[#64748B] font-bold">Star Dependency:</span>
                  <span className="font-extrabold text-[#17233C]">
                    {selectedTopic.name.toLowerCase().includes("search") ? "Array Fundamentals" : 
                     selectedTopic.name.toLowerCase().includes("array") ? "Basic Logic" :
                     selectedTopic.name.toLowerCase().includes("stack") ? "Linked Lists" : "Array Fundamentals"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-[#FF8A1F]/10">
                  <span className="text-[#64748B] font-bold">Strong Area:</span>
                  <span className="font-extrabold text-emerald-600">Calibration Passed</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-[#FF8A1F]/10">
                  <span className="text-[#64748B] font-bold">Focus Challenge:</span>
                  <span className="font-extrabold text-rose-600">Indices & Stack Boundaries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-bold">Prerequisites Satisfied:</span>
                  <span className="font-extrabold text-emerald-600">Yes</span>
                </div>
              </div>

              <p className="text-xs text-[#52627A] leading-relaxed font-semibold">
                {selectedTopic.description || 'No detailed description available. Click Ask AI Tutor to launch personal pedagogy.'}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAskTutor(selectedTopic.name, selectedTopic.id)}
                  className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask AI Tutor
                </button>
                
                <button
                  onClick={() => onGenerateQuiz(selectedTopic.id)}
                  className="bg-white border border-[#CBD5E1] hover:bg-[#FFF9F3]/30 text-[#17233C] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-[#F26B0F]" />
                  Practice Quiz
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { window.location.href = "/notes"; }}
                  className="bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📝 Notes Hub
                </button>
                <button
                  onClick={() => { window.location.href = "/chat"; }}
                  className="bg-[#FFF9F3] border border-[#FF8A1F]/30 hover:bg-[#FFEBD6] text-[#C8540A] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  🎬 Watch Video
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9F3] border border-[#FF8A1F]/15 text-[#F26B0F] flex items-center justify-center animate-float">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base">Select a Constellation Star</h4>
              <p className="text-xs text-[#52627A] max-w-[220px] mx-auto mt-1 leading-relaxed font-semibold">
                Click any planet star on the constellation map to check prerequisites, track scores, or start tutoring.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FF8A1F] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
