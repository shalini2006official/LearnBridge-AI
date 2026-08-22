import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { type ScholarshipMatch } from '../types';
import { 
  Award, Clock, CheckCircle, ExternalLink, Sliders, DollarSign, MapPin, 
  Tag, Compass, Sparkles
} from 'lucide-react';

export const AidMatcher: React.FC = () => {
  const [matches, setMatches] = useState<ScholarshipMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Profile settings state
  const [income, setIncome] = useState<number | ''>('');
  const [category, setCategory] = useState('merit');
  const [region, setRegion] = useState('');
  const [field, setField] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAidMatches();
      setMatches(res);
      
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const profile = user?.student_profile;
      if (profile) {
        if (profile.income_bracket) setIncome(profile.income_bracket);
        if (profile.category) setCategory(profile.category);
        if (profile.region) setRegion(profile.region);
        if (profile.field_of_interest) setField(profile.field_of_interest);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve scholarship matches.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');

    try {
      await api.updateAidProfile({
        income_bracket: income === '' ? null : Number(income),
        category: category || null,
        region: region || null,
        field_of_interest: field || null
      });

      // Update local storage user profile parameters
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userObj = JSON.parse(userJson);
        if (!userObj.student_profile) userObj.student_profile = {};
        userObj.student_profile.income_bracket = income;
        userObj.student_profile.category = category;
        userObj.student_profile.region = region;
        userObj.student_profile.field_of_interest = field;
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      setShowProfileEdit(false);
      await fetchMatches();
    } catch (err: any) {
      setError('Failed to update private profile filters.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleStatusUpdate = async (matchId: number, status: 'suggested' | 'applied' | 'dismissed') => {
    try {
      await api.updateAidMatchStatus(matchId, status);
      await fetchMatches();
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ff7e5f]"></div>
      </div>
    );
  }

  // Count active matched scholarships (suggested / applied)
  const activeMatches = matches.filter(m => m.status !== 'dismissed');

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-up">
      
      {/* Top Banner layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 glass-card rounded-3xl border border-slate-200/50 dark:border-brand-900">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-500" />
            Scholarship Matcher
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">Rule-based filters and local AI checklists summary mapping eligibility criteria.</p>
        </div>
        
        <button
          onClick={() => setShowProfileEdit(!showProfileEdit)}
          className="bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:from-[#ff6b6b] hover:to-[#ffa899] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/10 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          {showProfileEdit ? 'Cancel Filter Profile' : 'Edit Profile Filters'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold animate-shake">
          {error}
        </div>
      )}

      {/* Profile filter editor panel */}
      {showProfileEdit && (
        <div className="p-6 rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/20 glass-card animate-fade-in">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-brand-850 pb-2">
            <Sliders className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-sm">Update Matching Profile</h3>
            <span className="text-[10px] text-slate-450 ml-auto">Matching parameters are evaluated offline</span>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Income */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#17233C] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-brand-500" /> Max Income limit ($ / Year)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-extrabold focus:outline-none focus:border-[#FF7A00] text-[#17233C] dark:text-slate-100 placeholder-[#64748B]"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#17233C] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-500" /> Aid Category Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-extrabold focus:outline-none focus:border-[#FF7A00] text-[#17233C] dark:text-slate-100"
                >
                  <option value="merit">Academic Merit</option>
                  <option value="need">Financial Need Based</option>
                  <option value="disability">Disability support</option>
                  <option value="community">Community / Minority support</option>
                </select>
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#17233C] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" /> Home Region State/Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka or National"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-extrabold focus:outline-none focus:border-[#FF7A00] text-[#17233C] dark:text-slate-100 placeholder-[#64748B]"
                />
              </div>

              {/* Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#17233C] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-500" /> Primary Field of Interest
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS or Math"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-slate-800 rounded-xl py-2.5 px-4 text-xs font-extrabold focus:outline-none focus:border-[#FF7A00] text-[#17233C] dark:text-slate-100 placeholder-[#64748B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-brand-850 pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-[#FF7A00] hover:bg-[#E06B00] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md cursor-pointer border-none"
              >
                {savingProfile ? 'Matching Criteria...' : 'Save Filters & Update Matches'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Empty state: no profile details registered */}
      {matches.length === 0 && !showProfileEdit && (
        <div className="p-8 text-center glass-card rounded-3xl border border-slate-200/50 dark:border-brand-900 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/40 text-brand-500 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <div>
            <h4 className="font-extrabold text-base">No Financial Aid Profile Registered Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed font-semibold">
              We need self-reported information (like region and income level) to filter eligibility criteria. Fill out details to identify available matches.
            </p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:from-[#ff6b6b] hover:to-[#ffa899] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md shadow-brand-500/10 cursor-pointer"
          >
            Fill Out Matching Profile
          </button>
        </div>
      )}

      {/* 4. Matches List display */}
      {activeMatches.length > 0 && !showProfileEdit && (
        <div className="space-y-6">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff5e40]" />
            You qualify for {activeMatches.length} aid opportunity{activeMatches.length === 1 ? '' : 'ies'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMatches.map((m) => {
              const sch = m.scholarship;
              const daysLeft = Math.round((new Date(sch.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isApplied = m.status === 'applied';

              return (
                <div 
                  key={m.id}
                  className={`p-6 rounded-3xl border glass-card flex flex-col justify-between space-y-6 transition-all hover:shadow-md ${
                    isApplied 
                      ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/10 shadow-emerald-500/5' 
                      : 'border-slate-200/50 dark:border-brand-900'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Title, Provider, Deadline */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-sm leading-snug">{sch.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{sch.provider}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-brand-950 px-2.5 py-1 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/20">
                        <Clock className="w-3 h-3 text-[#ff7e5f] animate-pulse-subtle" />
                        {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                      </div>
                    </div>

                    {/* Criteria Match Details Checklist */}
                    <div className="p-3.5 bg-slate-50 dark:bg-brand-950/60 rounded-2xl text-xs space-y-2 border border-slate-200/35 dark:border-brand-850 font-semibold">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        <span className="text-brand-500 dark:text-brand-400 block font-bold">Why you qualify:</span>
                        {m.matched_criteria}
                      </div>
                    </div>

                    {/* Meta Indicators: Region, field, award amount */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-1 text-[#ff5e40] font-black">
                        <DollarSign className="w-3.5 h-3.5" />
                        ${sch.award_amount.toLocaleString()}
                      </div>
                      {sch.field_criteria && (
                        <div className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          {sch.field_criteria}
                        </div>
                      )}
                      {sch.region_criteria && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {sch.region_criteria}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-brand-850">
                    {sch.official_link && (
                      <a
                        href={sch.official_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-500 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Official Page
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    <div className="flex items-center gap-2 ml-auto">
                      {!isApplied ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(m.id, 'dismissed')}
                            className="text-slate-450 hover:text-rose-500 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                          >
                            Hide
                          </button>
                          
                          <button
                            onClick={() => handleStatusUpdate(m.id, 'applied')}
                            className="bg-gradient-to-r from-[#ff7e5f] to-[#feb47b] hover:from-[#ff6b6b] hover:to-[#ffa899] text-white text-[10px] font-bold py-2 px-3.5 rounded-xl shadow-md shadow-brand-500/10 cursor-pointer"
                          >
                            Mark as Applied
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Applied
                          <button
                            onClick={() => handleStatusUpdate(m.id, 'suggested')}
                            className="text-[10px] text-slate-400 hover:text-slate-650 ml-1 hover:underline font-normal cursor-pointer"
                          >
                            (Undo)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
