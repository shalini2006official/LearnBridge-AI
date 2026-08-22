import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAccessibility } from '../hooks/useAccessibility';
import { 
  BookOpen, MessageSquare, Award, GitBranch, LayoutDashboard, Users, 
  HelpCircle, LogOut, Sun, Moon, Sparkles, Sliders, Type, Flame, 
  Volume2, VolumeX, Eye, Info, Activity, Calendar, Clock, X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, setFontSize, toggleHighContrast, toggleLiteMode, toggleTTS } = useAccessibility();
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.body.classList.contains('dark'));
  const [currentTime, setCurrentTime] = useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isTeacher = user?.role === 'teacher';

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = isTeacher ? [
    { label: 'Class Overview', path: '/teacher', icon: Users },
    { label: 'Topic Radar', path: '/teacher/radar', icon: Sliders },
    { label: 'Interventions', path: '/teacher/interventions', icon: HelpCircle },
    { label: 'AI Lesson Builder', path: '/teacher/curriculum', icon: Sparkles },
    { label: 'AI Class Simulator', path: '/teacher/simulator', icon: Activity },
  ] : [
    { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { label: 'Activity Streak', path: '/streak', icon: Calendar },
    { label: 'Tutor Chat', path: '/chat', icon: MessageSquare },
    { label: 'Practice Quiz', path: '/quiz', icon: Award },
    { label: 'Knowledge Graph', path: '/graph', icon: GitBranch },
    { label: 'Study Notes', path: '/notes', icon: BookOpen },
    { label: 'Aid & Scholarships', path: '/aid', icon: Sparkles },
    { label: 'Brain Games', path: '/games', icon: Flame },
  ];

  return (
    <div className={`min-h-screen flex ${settings.liteMode ? '' : 'transition-colors duration-200'} bg-[#FFF9F3]/40 text-[#17233C]`}>
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#FF8A1F]/15 bg-white flex flex-col flex-shrink-0 z-20">
        
        {/* Sidebar Logo */}
        <div className="p-6 flex items-center gap-2.5 border-b border-slate-100">
          <div className="bg-[#FF8A1F] p-2.5 rounded-xl text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg flex gap-1">
            <span className="text-[#F26B0F]">LearnBridge</span>
            <span className="text-[#17233C]">AI</span>
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                  isActive
                    ? 'bg-[#FFF7EF] border-l-4 border-[#F26B0F] text-[#F26B0F]'
                    : 'text-[#52627A] hover:text-[#F26B0F] hover:bg-[#FFF5EA]'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#F26B0F]' : 'text-[#64748B] group-hover:text-[#F26B0F]'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF8A1F] to-[#F26B0F] text-white font-black flex items-center justify-center text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold truncate text-[#17233C]">{user.name}</p>
                <p className="text-xs text-[#52627A] truncate capitalize font-bold">{user.role === 'teacher' ? 'staff' : user.role}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FFF9F3]/10">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200/60 bg-white flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <span className="md:hidden font-extrabold text-[#F26B0F]">
              LearnBridge AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Top Bar Gamification Indicator */}
            {!isTeacher && (
              <div className="flex items-center gap-3 text-xs bg-[#FFF9F3] px-3.5 py-1.5 rounded-full border border-[#FF8A1F]/15">
                <div className="flex items-center gap-1 text-[#17233C]">
                  <Flame className="w-3.5 h-3.5 text-[#F26B0F] fill-[#F26B0F] flex-shrink-0" />
                  <span className="font-bold"><span className="text-[#F26B0F] font-extrabold">3</span> Days Streak</span>
                </div>
                <div className="h-3 w-[1px] bg-[#FF8A1F]/30"></div>
                <div className="flex items-center gap-1 text-[#17233C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8A1F] flex-shrink-0" />
                  <span className="font-bold">Level <span className="text-[#F26B0F] font-extrabold">2</span></span>
                </div>
              </div>
            )}

            {/* Live Clock & Date Timer */}
            <div className="flex items-center gap-2.5 text-xs bg-[#FFF9F3] border border-[#FF8A1F]/20 px-3.5 py-1.5 rounded-full shadow-sm text-[#17233C] font-bold">
              <div className="flex items-center gap-1.5 text-[#F26B0F]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <span className="h-3 w-[1px] bg-[#FF8A1F]/30"></span>
              <div className="flex items-center gap-1.5 text-[#17233C] tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#52627A]" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              </div>
            </div>

            {/* Quick Actions (Moon/Settings clearly visible) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-[#17233C] hover:bg-[#FFF9F3]/60 transition-colors cursor-pointer"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-[#F26B0F]" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Accessibility Controls Button */}
            <button
              onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
              className="p-2 rounded-lg text-[#17233C] hover:bg-[#FFF9F3]/60 transition-colors relative cursor-pointer"
              title="Accessibility & Layout Controls"
            >
              <Sliders className="w-4.5 h-4.5" />
              {showAccessibilityMenu && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-[#F26B0F] rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Floating Accessibility Sidepanel */}
      {showAccessibilityMenu && (
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex justify-end">
          <div className="w-85 h-full bg-white border-l border-[#FF8A1F]/15 p-6 flex flex-col justify-between shadow-2xl animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-[#17233C]">
                  <Sliders className="w-4.5 h-4.5 text-[#FF8A1F]" />
                  Accessibility Controls
                </h3>
                <button 
                  onClick={() => setShowAccessibilityMenu(false)}
                  className="text-[#52627A] hover:text-[#17233C] text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Adjust Font Sizes */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Text Size Scaling
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#FFF9F3] p-1 rounded-xl border border-[#FF8A1F]/10">
                  {(['small', 'medium', 'large', 'xlarge'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`text-xs py-1.5 capitalize rounded-lg font-bold transition-colors cursor-pointer ${
                        settings.fontSize === sz
                          ? 'bg-[#FF8A1F] text-white shadow-sm'
                          : 'text-[#64748B] hover:bg-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Contrast */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm font-bold flex items-center gap-2 text-[#17233C]">
                  <Eye className="w-4.5 h-4.5 text-[#FF8A1F]" />
                  High Contrast Mode
                </span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={toggleHighContrast}
                  className="w-4 h-4 text-[#FF8A1F] border-gray-300 rounded focus:ring-[#FF8A1F]"
                />
              </div>

              {/* Toggle Lite Mode */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold flex items-center gap-2 text-[#17233C]">
                    <Info className="w-4.5 h-4.5 text-[#FF8A1F]" />
                    Lite Bandwidth Mode
                  </span>
                  <span className="text-[10px] text-[#64748B] font-semibold ml-6">Reduces animations, graphics</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.liteMode}
                  onChange={toggleLiteMode}
                  className="w-4 h-4 text-[#FF8A1F] border-gray-300 rounded focus:ring-[#FF8A1F]"
                />
              </div>

              {/* Toggle TTS */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm font-bold flex items-center gap-2 text-[#17233C]">
                  {settings.ttsEnabled ? (
                    <Volume2 className="w-4.5 h-4.5 text-[#FF8A1F]" />
                  ) : (
                    <VolumeX className="w-4.5 h-4.5 text-[#64748B]" />
                  )}
                  TTS Voice Narration
                </span>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={toggleTTS}
                  className="w-4 h-4 text-[#FF8A1F] border-gray-300 rounded focus:ring-[#FF8A1F]"
                />
              </div>
            </div>

            <p className="text-[10px] text-center text-[#64748B] mt-6 border-t border-slate-100 pt-4 font-bold uppercase tracking-widest">
              LearnBridge Accessibility Engine
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/60 flex items-center justify-around px-4 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? 'text-[#F26B0F] scale-105 font-extrabold' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
