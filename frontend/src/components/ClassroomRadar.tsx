import React from 'react';
import { type RadarGroup } from '../types';
import { AlertCircle, CheckCircle, Users, ArrowRight } from 'lucide-react';

interface ClassroomRadarProps {
  topicName: string;
  groups: RadarGroup[];
  onTriggerIntervention: (group: RadarGroup) => void;
}

export const ClassroomRadar: React.FC<ClassroomRadarProps> = ({
  topicName,
  groups,
  onTriggerIntervention
}) => {
  const getGroupIcon = (issueName: string) => {
    if (issueName.includes('Mastered') || issueName.includes('Track')) {
      return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-pulse-subtle" />;
  };

  const getGroupBgColor = (issueName: string) => {
    if (issueName.includes('Mastered') || issueName.includes('Track')) {
      return 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/50';
    }
    return 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          Classroom Radar: {topicName}
        </h3>
        <p className="text-xs text-[#52627A] mt-0.5 font-bold">Clustering students by specific cognitive gaps and misconceptions rather than broad scores.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => {
          const isMastered = group.sub_issue.includes('Mastered') || group.sub_issue.includes('Track');
          return (
            <div
              key={group.sub_issue}
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 transition-all hover:shadow-md ${getGroupBgColor(group.sub_issue)}`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white dark:bg-brand-900 shadow-sm border border-slate-200/40 dark:border-brand-800`}>
                    {getGroupIcon(group.sub_issue)}
                  </div>
                  <div>
                    <h4 className="font-black text-base text-black">{group.sub_issue}</h4>
                    <p className={`text-xs font-extrabold ${isMastered ? 'text-emerald-700 dark:text-emerald-450' : 'text-rose-700 dark:text-rose-450'}`}>
                      {group.student_count} student{group.student_count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-black leading-relaxed font-black">
                  {group.description}
                </p>

                {/* List students */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {group.students.map((st) => (
                    <span
                      key={st.id}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border-none text-white ${
                        isMastered
                          ? 'bg-emerald-600 dark:bg-emerald-700'
                          : 'bg-rose-600 dark:bg-rose-700'
                      }`}
                    >
                      {st.name}
                    </span>
                  ))}
                </div>
              </div>

              {!isMastered && (
                <button
                  onClick={() => onTriggerIntervention(group)}
                  className="w-full mt-4 bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:from-[#ff6b6b] hover:to-[#ffa899] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/10 cursor-pointer"
                >
                  Configure AI Intervention
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
