import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { type Class, type ClassStudent, type ClassroomRadarResponse, type Intervention } from '../types';
import { ClassroomRadar } from '../components/ClassroomRadar';
import { 
  AlertTriangle, ShieldCheck, CheckCircle, Activity, Sparkles, Trash2
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [pulse, setPulse] = useState<{ on_track_count: number; needs_attention_count: number; high_risk_count: number } | null>(null);
  
  // Radar state
  const [radar, setRadar] = useState<ClassroomRadarResponse | null>(null);
  
  // Interventions state
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const clsList = await api.getTeacherClasses();
        setClasses(clsList);
        if (clsList.length > 0) {
          const firstClassId = clsList[0].id;
          setSelectedClassId(firstClassId);
          await loadClassMetrics(firstClassId);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError('Failed to load staff class overview.');
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, []);

  const loadClassMetrics = async (classId: number) => {
    setLoading(true);
    try {
      const detail = await api.getTeacherClassDetail(classId);
      setStudents(detail.students);

      const pulseData = await api.getTeacherClassPulse(classId);
      setPulse(pulseData);

      const radarData = await api.getTeacherRadar(classId, 2);
      setRadar(radarData);

      const intvs = await api.getTeacherInterventions(classId);
      setInterventions(intvs);

    } catch (e) {
      console.error(e);
      setError('Error loading class analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId: number) => {
    setSelectedClassId(classId);
    loadClassMetrics(classId);
  };

  const handleInterventionAction = async (id: number, status: 'accepted' | 'modified' | 'dismissed') => {
    try {
      await api.updateInterventionStatus(id, status);
      if (selectedClassId) {
        const intvs = await api.getTeacherInterventions(selectedClassId);
        setInterventions(intvs);
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    if (!selectedClassId) return;
    if (!confirm(`Are you sure you want to remove student "${studentName}" from this class?`)) return;
    try {
      await api.removeStudentFromClass(selectedClassId, studentId);
      await loadClassMetrics(selectedClassId);
    } catch (e) {
      alert("Failed to remove student from class.");
    }
  };

  const triggerCustomIntervention = (group: any) => {
    alert(`Custom intervention initialized for: "${group.sub_issue}" group. AI material references generated for ${group.student_count} students.`);
  };

  if (loading && classes.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ff7e5f]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Top Header Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Activity className="w-6 h-6 text-white animate-pulse" />
            Classroom Portal & Insights
          </h2>
          <p className="text-xs text-white/90 font-bold">Drill down into individual student struggles, gaps, and classroom risk profiles.</p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <label className="text-xs font-black text-white uppercase tracking-wider">Classroom: </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => handleClassChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white/20 border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:border-white text-white cursor-pointer"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id} className="text-[#17233C]">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold animate-shake">
          {error}
        </div>
      )}

      {/* Classroom Pulse Cards */}
      {pulse && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200/50 dark:border-brand-900 glass-card flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black text-[#52627A] uppercase tracking-wider">On Track Students</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {pulse.on_track_count}
              </h3>
              <p className="text-[10px] text-[#52627A] font-bold">Mastery avg. at or above 70%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/50 dark:border-brand-900 glass-card flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black text-[#52627A] uppercase tracking-wider">Needs Attention</p>
              <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500">
                {pulse.needs_attention_count}
              </h3>
              <p className="text-[10px] text-[#52627A] font-bold">Mastery average between 40% - 70%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/50 dark:border-brand-900 glass-card flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black text-[#52627A] uppercase tracking-wider">High Risk Students</p>
              <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {pulse.high_risk_count}
              </h3>
              <p className="text-[10px] text-[#52627A] font-bold">Mastery average below 40%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5.5 h-5.5 animate-pulse-subtle" />
            </div>
          </div>
        </div>
      )}

      {/* Classroom Radar section */}
      {radar && (
        <ClassroomRadar
          topicName={radar.topic_name}
          groups={radar.radar_groups}
          onTriggerIntervention={triggerCustomIntervention}
        />
      )}

      {/* Roster & Interventions Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class Roster list */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/50 dark:border-brand-900 glass-card space-y-4">
          <div>
            <h3 className="font-bold text-base">Class Roster</h3>
            <p className="text-[11px] text-[#52627A] font-bold">Comprehensive overview of students enrolled in introduction to CS.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-brand-800 text-[#17233C] font-black uppercase tracking-wider">
                  <th className="py-3 px-2">Student Name</th>
                  <th className="py-3 px-2">Email Address</th>
                  <th className="py-3 px-2 text-center">Completed Topics</th>
                  <th className="py-3 px-2 text-right">Mastery Score</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-brand-850 text-[#17233C] font-bold">
                {students.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/50 dark:hover:bg-brand-950/20">
                    <td className="py-3 px-2 font-extrabold">{st.name}</td>
                    <td className="py-3 px-2 text-[#52627A] font-mono">{st.email}</td>
                    <td className="py-3 px-2 text-center">
                      {st.completed_topics && st.completed_topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                          {st.completed_topics.map((t, tidx) => (
                            <span 
                              key={tidx} 
                              className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#64748B] font-bold">None yet</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-brand-600 dark:text-brand-400 font-mono text-sm">
                      {Math.round(st.overall_mastery)}%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        st.status_color === 'green' ? 'bg-emerald-500' : st.status_color === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleDeleteStudent(st.student_id, st.name)}
                        className="p-1 rounded bg-white text-red-650 hover:bg-red-50 border border-red-200 cursor-pointer inline-flex items-center justify-center"
                        title="Remove Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Interventions Recommendations */}
        <div className="p-6 rounded-2xl border border-slate-200/50 dark:border-brand-900 glass-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              AI Interventions suggested
            </h3>
            <p className="text-[11px] text-[#52627A] font-bold">Class-level actions recommended by AI to resolve identified misconceptions.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 py-3 max-h-[300px]">
            {interventions.length > 0 ? (
              interventions.map((intv) => (
                <div 
                  key={intv.id} 
                  className={`p-4 rounded-xl border space-y-3 bg-white/50 dark:bg-brand-950/20 text-xs ${
                    intv.status === 'accepted' 
                      ? 'border-emerald-300 dark:border-emerald-900/50 shadow-emerald-500/5' 
                      : intv.status === 'dismissed'
                        ? 'opacity-40 border-slate-200/40'
                        : 'border-brand-350 dark:border-brand-800'
                  }`}
                >
                  <div className="space-y-1 font-black">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 uppercase tracking-wide">
                      {intv.topic_name}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">{intv.title}</h4>
                    <p className="text-[#52627A] dark:text-slate-400 leading-relaxed mt-0.5 font-bold">{intv.issue_description}</p>
                  </div>

                  <div className="p-2.5 bg-slate-100 dark:bg-brand-950 rounded-lg text-[11px] text-[#17233C] leading-relaxed font-black">
                    <span className="font-black text-brand-600 dark:text-brand-450 block mb-0.5">Recommended Action:</span>
                    {intv.suggested_action}
                  </div>

                  {intv.status === 'pending' && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                      <button
                        onClick={() => handleInterventionAction(intv.id, 'accepted')}
                        className="bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:from-[#ff6b6b] hover:to-[#ffa899] text-white font-bold py-1.5 rounded-lg text-[10px] shadow-sm cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInterventionAction(intv.id, 'modified')}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-brand-900 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleInterventionAction(intv.id, 'dismissed')}
                        className="text-slate-450 hover:text-slate-600 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {intv.status !== 'pending' && (
                    <p className="text-[10px] font-extrabold text-[#52627A] capitalize">
                      Intervention State: {intv.status}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-bold text-xs">No pending actions</p>
                <p className="text-[10px] text-[#52627A] font-bold max-w-[150px] mx-auto mt-0.5">Students are currently hitting performance targets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
