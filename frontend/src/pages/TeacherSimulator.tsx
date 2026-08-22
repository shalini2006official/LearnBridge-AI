import React, { useState } from 'react';
import { api } from '../services/api';
import { Markdown } from '../components/Markdown';
import { Activity, Sparkles, RefreshCw, AlertTriangle, HelpCircle, Copy, Download } from 'lucide-react';

export const TeacherSimulator: React.FC = () => {
  const [targetTopic, setTargetTopic] = useState('Recursion');
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [worksheet, setWorksheet] = useState<string | null>(null);
  const [generatingWorksheet, setGeneratingWorksheet] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const runSimulation = () => {
    setSimulating(true);
    setResults(null);
    setWorksheet(null);

    // Simulate class diagnostics evaluation delay
    setTimeout(() => {
      let mockData: any = {};
      if (targetTopic === 'Recursion') {
        mockData = {
          successRate: 45,
          riskLevel: 'HIGH RISK',
          riskColor: 'text-rose-600 border-rose-200 bg-rose-50/50',
          prereqBottleneck: 'Stack Memory & Lifo Structures',
          bottleneckDescription: 'Students fail to trace active call states because they have an average 38% mastery score in underlying Stack logic.',
          struggleGroupSize: 4,
          predictedStruggleReason: 'Students will confuse call order and forget base case conditions when recursive depth exceeds 3.',
          remedialRecommendation: 'Instruct the AI Coach to review "LIFO Stack Call Stack trace" with students before lecturing on Recurrent concepts.'
        };
      } else if (targetTopic === 'Binary Search') {
        mockData = {
          successRate: 82,
          riskLevel: 'LOW RISK',
          riskColor: 'text-emerald-600 border-emerald-200 bg-emerald-50/50',
          prereqBottleneck: 'Array Sorting Protocols',
          bottleneckDescription: 'Strong foundational logic. Students have a 92% average mastery in arrays, meaning binary index calculation is intuitive.',
          struggleGroupSize: 1,
          predictedStruggleReason: 'Minor syntax index truncation issues (off-by-one errors) on boundary base check conditions.',
          remedialRecommendation: 'Provide a quick 5-minute quiz on index truncation equations.'
        };
      } else {
        mockData = {
          successRate: 68,
          riskLevel: 'MODERATE RISK',
          riskColor: 'text-amber-600 border-amber-200 bg-amber-50/50',
          prereqBottleneck: 'Linked List Traversal',
          bottleneckDescription: 'Moderate sequential index traversal. Some students fail to link reference pointers correctly.',
          struggleGroupSize: 2,
          predictedStruggleReason: 'Boundary checks on empty lists or list headers.',
          remedialRecommendation: 'Conduct visual pointer drawing trace sessions.'
        };
      }

      setResults(mockData);
      setSimulating(false);
    }, 2500);
  };

  const generateWorksheet = async () => {
    if (!results) return;
    setGeneratingWorksheet(true);
    try {
      const topicPrompt = `Review Worksheet for Class struggles in ${targetTopic}. Focus on correcting prerequisite bottleneck: ${results.prereqBottleneck}. Generate 3 targeted practice questions with explanations.`;
      const res = await api.generateNotes(targetTopic, topicPrompt);
      setWorksheet(res.content);
    } catch (e) {
      alert("Failed to generate worksheet.");
    } finally {
      setGeneratingWorksheet(false);
    }
  };

  const handleCopy = () => {
    if (!worksheet) return;
    navigator.clipboard.writeText(worksheet);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#17233C] animate-slide-up max-w-6xl mx-auto">
      
      {/* Premium Header Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Activity className="w-6 h-6 text-white animate-pulse" />
            AI Class Cognitive Simulator
          </h2>
          <p className="text-xs text-white/90 font-bold">Predict prerequisite bottlenecks, classroom success probability, and generate automated custom worksheets.</p>
        </div>
      </div>

      <div className="space-y-6 w-full">
        
        {/* Top Control Card */}
        <div className="w-full p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5 font-bold text-xs text-[#17233C]">
          <div>
            <h3 className="font-extrabold text-sm">Simulation Setup</h3>
            <p className="text-[10px] text-[#52627A] font-bold">Choose a target curriculum topic to scan class readiness.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="uppercase tracking-wider">Target Topic</label>
              <select
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl py-3 px-3.5 text-xs font-semibold focus:outline-none focus:border-[#F26B0F] text-[#17233C] cursor-pointer"
              >
                <option value="Recursion">Recursion</option>
                <option value="Binary Search">Binary Search</option>
                <option value="Linked Lists">Linked Lists</option>
                <option value="Trees">Trees</option>
                <option value="Stacks">Stacks</option>
              </select>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] disabled:bg-slate-200 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer text-xs"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Running Class Diagnostic...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  Run Cognitive Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-full space-y-6">
          
          {/* Diagnostic simulation running state */}
          {simulating && (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center space-y-6 min-h-[350px] relative overflow-hidden">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Sonar pulse animation */}
                <div className="absolute inset-0 rounded-full bg-[#FF8A1F]/10 border border-[#FF8A1F]/30 animate-ping"></div>
                <div className="absolute w-16 h-16 rounded-full bg-[#FF8A1F]/20 border border-[#FF8A1F]/40 animate-pulse-glow"></div>
                <Activity className="w-8 h-8 text-[#F26B0F] z-10 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-sm text-[#17233C]">Calculating Cognitive Prerequisite Gaps...</h4>
                <p className="text-[10px] text-[#52627A] font-bold max-w-sm mx-auto leading-relaxed">
                  Scanning student mastery portfolio databases and calculating failure risks for upcoming syllabus milestones.
                </p>
              </div>
            </div>
          )}

          {/* Simulation scan results */}
          {results && !simulating && (
            <div className="space-y-6 animate-slide-up">
              
              {/* Main Risk Status card */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#F26B0F] tracking-widest block">Simulation Result</span>
                    <h3 className="text-xl font-extrabold text-[#17233C] mt-1">{targetTopic} Readiness</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[#52627A] block text-[9px] uppercase tracking-wider">Success Probability</span>
                      <span className="text-2xl font-black text-[#17233C] block mt-0.5">{results.successRate}%</span>
                    </div>
                    <div className={`p-3.5 rounded-xl border flex flex-col justify-center ${results.riskColor}`}>
                      <span className="block text-[9px] uppercase tracking-wider font-bold">Risk Assessment</span>
                      <span className="text-sm font-black block mt-0.5">{results.riskLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 text-xs font-bold text-[#17233C] flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-amber-950">Prerequisite Bottleneck:</p>
                    <p className="text-amber-800 text-[11px] uppercase font-black">{results.prereqBottleneck}</p>
                    <p className="text-[10px] text-[#52627A] leading-relaxed font-bold mt-1">{results.bottleneckDescription}</p>
                  </div>
                </div>
              </div>

              {/* Detailed insights & Recommendation */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 font-bold text-xs">
                <h4 className="text-sm font-extrabold text-[#17233C]">AI Class Diagnostics & Remediations</h4>
                <div className="h-0.5 bg-slate-150"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                  <div className="space-y-2">
                    <p className="text-[#52627A] uppercase text-[9px] tracking-wider">Predicted Struggle Detail</p>
                    <p className="text-[#17233C] font-extrabold">
                      {results.struggleGroupSize} student{results.struggleGroupSize === 1 ? '' : 's'} will likely struggle due to: 
                    </p>
                    <p className="text-[10px] text-[#52627A] font-bold">{results.predictedStruggleReason}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[#52627A] uppercase text-[9px] tracking-wider">AI Recommended Preventive Action</p>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 font-extrabold text-[10px]">
                      {results.remedialRecommendation}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={generateWorksheet}
                    disabled={generatingWorksheet}
                    className="bg-[#17233C] hover:bg-slate-900 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md border-none cursor-pointer flex items-center gap-1.5"
                  >
                    {generatingWorksheet ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Compiling Remedial Worksheet...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                        Generate Remedial Class Worksheet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Remedial Worksheet Pane */}
          {worksheet && !simulating && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-slide-up select-text">
              <div className="flex items-center justify-between border-b pb-4 mb-4 flex-wrap gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-800 uppercase tracking-wider border border-emerald-500/20">
                    AI Remedial Worksheet
                  </span>
                  <h3 className="font-extrabold text-base mt-1 text-[#17233C]">Target Topic: {targetTopic}</h3>
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
                    onClick={() => window.print()}
                    className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-extrabold py-2 px-4.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                  >
                    <Download className="w-4 h-4 text-white fill-white" />
                    Print / Save PDF
                  </button>
                </div>
              </div>

              <div className="text-xs leading-relaxed font-sans space-y-4 font-bold text-[#17233C]">
                <Markdown text={worksheet} />
              </div>
            </div>
          )}

          {/* Initial Empty state placeholder */}
          {!results && !simulating && (
            <div className="p-8 rounded-2xl border border-dashed border-[#FF8A1F]/30 bg-[#FFF9F3]/10 flex flex-col items-center justify-center text-center min-h-[350px] space-y-3">
              <HelpCircle className="w-12 h-12 text-[#FF8A1F]/40 animate-pulse" />
              <h4 className="font-extrabold text-base">Simulator Ready</h4>
              <p className="text-xs text-[#52627A] max-w-sm font-semibold leading-relaxed">
                Click "Run Cognitive Scan" to analyze the current student roster mastery and simulate upcoming curriculum readiness.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
