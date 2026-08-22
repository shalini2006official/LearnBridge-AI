import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, User, ShieldCheck, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      } catch (e) {
        console.error('Failed to parse user on mount', e);
      }
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [registerSection, setRegisterSection] = useState<1 | 2>(1);
  
  // Sign In Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register Form States
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');
  const [registerLanguage, setRegisterLanguage] = useState('en');
  
  // Extended student register properties
  const [registerGrade, setRegisterGrade] = useState('college');
  const [registerSubject, setRegisterSubject] = useState('Computer Science');
  const [registerLevel, setRegisterLevel] = useState('beginner');

  // Error, loading, and welcome animation state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playWelcome, setPlayWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const data = await api.login({ email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'student') {
        // Trigger signature student welcome animation
        setWelcomeName(data.user.name);
        setPlayWelcome(true);
      } else {
        // Teachers go straight to workspace
        navigate('/teacher');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await api.register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole,
        language: registerLanguage,
        grade: registerGrade,
        explanation_preference: registerLevel === 'beginner' ? 'example' : registerLevel === 'intermediate' ? 'analogy' : 'technical'
      });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'student') {
        // Trigger signature student welcome animation
        setWelcomeName(data.user.name);
        setPlayWelcome(true);
      } else {
        navigate('/teacher');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Choose a different email.');
    } finally {
      setLoading(false);
    }
  };

  // Single-click Demo Access Shortcuts
  const enterDemo = async (role: 'student' | 'teacher') => {
    setLoading(true);
    setError('');
    const demoEmail = role === 'student' ? 'student@learnbridge.edu' : 'teacher@learnbridge.edu';
    const demoPass = role === 'student' ? 'student123' : 'teacher123';

    try {
      const data = await api.login({ email: demoEmail, password: demoPass });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (role === 'student') {
        setWelcomeName(data.user.name);
        setPlayWelcome(true);
      } else {
        navigate('/teacher');
      }
    } catch (err: any) {
      setError('Demo accounts not found. Make sure backend is running and database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  if (playWelcome) {
    return (
      <WelcomeAnimationOverlay 
        studentName={welcomeName} 
        onAnimationEnd={() => {
          setPlayWelcome(false);
          navigate('/student');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-[#17233C] relative overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Onboarding Showcase (Warm saffron/cream gradient) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-gradient-to-br from-[#FFFDFB] via-[#FFF9F3] to-[#FFF5EA] border-r border-[#FF8A1F]/10 relative z-10 overflow-y-auto">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#F26B0F] p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight flex gap-1">
            <span className="text-[#17233C]">LearnBridge</span>
            <span className="text-[#F26B0F]">AI</span>
          </span>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 max-w-md my-6">
          <h1 className="text-4xl md:text-[42px] font-black leading-[1.15] tracking-tight text-[#17233C]">
            Learn Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F]">Achieve More.</span>
          </h1>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            Your AI-powered learning companion for mastering concepts, practicing smarter, and achieving your goals.
          </p>
        </div>

        {/* Floating Cartoon Graphics Container */}
        <div className="relative w-full max-w-md mx-auto aspect-square my-4 rounded-3xl overflow-visible">
          
          {/* Main Pixar Student Image */}
          <img 
            src="/assets/student_study_cartoon.jpg" 
            alt="Student studying with laptop" 
            className="w-full h-full object-cover rounded-3xl shadow-lg border border-slate-100" 
          />

          {/* AI Tutor Card (Top-Left overlay) */}
          <div className="absolute top-4 -left-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] flex items-center gap-2.5 border border-slate-100 max-w-[170px] z-10 transition-all hover:scale-105">
            <img src="/assets/robot_avatar.jpg" className="w-9 h-9 rounded-xl object-cover" alt="AI Tutor Robot" />
            <div className="min-w-0">
              <h5 className="font-black text-[11px] text-[#17233C]">AI Tutor</h5>
              <p className="text-[8px] text-slate-400 font-bold leading-tight">Personalized guidance anytime, anywhere</p>
            </div>
          </div>

          {/* Current Streak Card (Top-Right overlay) */}
          <div className="absolute top-16 -right-3 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center border border-slate-100 z-10 w-20 text-center transition-all hover:scale-105">
            <span className="text-lg">🔥</span>
            <span className="text-[10px] text-slate-400 font-bold mt-0.5">Current Streak</span>
            <span className="text-xs font-black text-[#17233C] mt-0.5">7 days</span>
            <span className="text-[8px] text-emerald-600 font-bold mt-0.5">Keep it up!</span>
          </div>

          {/* Topics Mastered Card (Middle-Right overlay) */}
          <div className="absolute bottom-20 -right-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-100 z-10 w-28 transition-all hover:scale-105">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Topics Mastered</span>
            <span className="text-2xl font-black text-[#17233C] block mt-0.5">24</span>
            <span className="text-[9px] text-[#52627A] font-bold block mt-0.5">This Month</span>
            <div className="mt-2 flex items-center justify-between">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mr-2">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <span className="text-[9px] font-black text-[#17233C]">72%</span>
            </div>
          </div>
        </div>

        {/* Student Testimonial Quote Banner */}
        <div className="bg-white/90 backdrop-blur-sm p-4.5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 mt-4 max-w-md mx-auto">
          <img 
            src="/assets/ananya_avatar.jpg" 
            className="w-11 h-11 rounded-full object-cover border border-slate-100 flex-shrink-0" 
            alt="Student Reviewer" 
          />
          <div className="space-y-1 font-bold text-xs text-[#17233C]">
            <p className="italic text-slate-600 font-semibold leading-relaxed">
              "LearnBridge AI explains concepts so clearly, it feels like having a personal tutor!"
            </p>
            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="font-extrabold text-[11px] text-[#17233C]">— Ananya, Engineering Student</span>
              <span className="text-amber-400 text-xs">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login & Signup Panel */}
      <div className="lg:col-span-6 flex flex-col justify-between p-8 lg:p-10 relative z-10 bg-white overflow-y-auto min-h-screen">
        
        {/* Spacer to push form down (removed English language dropdown selector) */}
        <div className="pt-4 print:hidden"></div>

        {/* Form Container (Centered) */}
        <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
          <div className="p-8 lg:p-10 rounded-[32px] border border-slate-150/70 bg-white shadow-[0_15px_40px_rgba(242,107,15,0.04)] space-y-6">
            
            {/* Header titles */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-[#17233C] tracking-tight">
                {activeTab === 'signin' ? 'Welcome Back! 👋' : 'Create Account 🚀'}
              </h2>
              <p className="text-slate-400 text-xs font-bold">
                {activeTab === 'signin' ? 'Login to continue your learning journey' : 'Register to unlock personalized AI tutors'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-2xl text-xs font-bold">
                {error}
              </div>
            )}

            {/* Render Login form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleLogin} className="space-y-4 font-bold text-xs text-[#17233C]">
                
                <div className="space-y-1.5">
                  <label className="uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉</span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-[#17233C] focus:outline-none focus:border-[#F26B0F] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="uppercase tracking-wider">Password</label>
                    <span className="text-[#F26B0F] hover:underline cursor-pointer text-[11px] font-bold">Forgot Password?</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl py-3 pl-10 pr-10 text-xs font-semibold text-[#17233C] focus:outline-none focus:border-[#F26B0F] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-[#F26B0F] border-slate-300 rounded focus:ring-[#F26B0F] cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-slate-500 font-bold select-none cursor-pointer">Remember me</label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none mt-2"
                >
                  {loading ? 'Logging in...' : 'Login'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            ) : (
              /* Progressive Registration Form inside mockup style card */
              <form onSubmit={handleRegister} className="space-y-4 font-bold text-xs text-[#17233C]">
                {registerSection === 1 ? (
                  <div className="space-y-4 animate-slide-up">
                    <div className="space-y-1.5">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Shalini"
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-[#F26B0F]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="shalini@example.com"
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-[#F26B0F]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="uppercase tracking-wider">Account Role</label>
                      <select
                        value={registerRole}
                        onChange={(e) => setRegisterRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-250 rounded-xl py-3 px-3.5 text-xs font-bold cursor-pointer focus:outline-none focus:border-[#F26B0F] text-[#17233C]"
                      >
                        <option value="student">Student (Learn concepts, practice quizzes)</option>
                        <option value="teacher">Staff (Simulate classes, build lessons)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label>Password</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          required
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-3 pl-4 pr-10 text-xs font-semibold focus:outline-none focus:border-[#F26B0F]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 bg-transparent border-none cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        required
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-[#F26B0F]"
                      />
                    </div>

                    {registerRole === 'teacher' ? (
                      <button
                        type="submit"
                        disabled={loading || !registerName || !registerEmail || !registerPassword || registerPassword !== registerConfirmPassword}
                        className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] text-white text-xs font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border-none cursor-pointer"
                      >
                        {loading ? 'Creating Account...' : 'Register Staff Profile'}
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!registerName || !registerEmail || !registerPassword || registerPassword !== registerConfirmPassword}
                        onClick={() => setRegisterSection(2)}
                        className="w-full bg-[#F26B0F] hover:bg-[#D95D0B] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border-none cursor-pointer"
                      >
                        Next: Study Preferences
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-slide-up">
                    <div className="space-y-1.5">
                      <label>Preferred Language</label>
                      <select
                        value={registerLanguage}
                        onChange={(e) => setRegisterLanguage(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl py-3 px-3 text-xs font-bold cursor-pointer focus:outline-none focus:border-[#F26B0F]"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="kn">Kannada (கನ್ನಡ)</option>
                        <option value="ml">Malayalam (മലയാളം)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <label>Grade</label>
                        <select
                          value={registerGrade}
                          onChange={(e) => setRegisterGrade(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-3 px-2 text-[10px] font-bold cursor-pointer focus:outline-none focus:border-[#F26B0F]"
                        >
                          <option value="college">College</option>
                          <option value="highschool">Highschool</option>
                          <option value="middleschool">Middleschool</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label>Subject</label>
                        <select
                          value={registerSubject}
                          onChange={(e) => setRegisterSubject(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-3 px-2 text-[10px] font-bold cursor-pointer focus:outline-none focus:border-[#F26B0F]"
                        >
                          <option value="Computer Science">Comp Sci</option>
                          <option value="Mathematics">Math</option>
                          <option value="Science">Science</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label>Level</label>
                        <select
                          value={registerLevel}
                          onChange={(e) => setRegisterLevel(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-3 px-2 text-[10px] font-bold cursor-pointer focus:outline-none focus:border-[#F26B0F]"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterSection(1)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#17233C] text-xs font-black py-2.5 rounded-xl border-none transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-gradient-to-r from-[#FF8A1F] to-[#F26B0F] hover:opacity-90 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border-none cursor-pointer"
                      >
                        {loading ? 'Creating...' : 'Register Profile'}
                        <UserPlus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Don't have an account toggle trigger link */}
            <div className="text-center font-bold text-xs text-slate-500 pt-2">
              {activeTab === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <span 
                    onClick={() => { setActiveTab('register'); setError(''); }} 
                    className="text-[#F26B0F] hover:underline cursor-pointer font-black"
                  >
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span 
                    onClick={() => { setActiveTab('signin'); setError(''); }} 
                    className="text-[#F26B0F] hover:underline cursor-pointer font-black"
                  >
                    Login here
                  </span>
                </>
              )}
            </div>

            {/* Sandbox Quick Access Buttons */}
            <div className="relative my-4 flex items-center justify-center select-none">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative bg-white px-3.5 text-[8px] uppercase font-black text-slate-400 tracking-wider">
                Or Explore Demo Sandbox
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 font-bold text-xs pt-1">
              <button
                type="button"
                onClick={() => enterDemo('student')}
                disabled={loading}
                className="bg-slate-50 hover:bg-[#FFF9F3]/60 text-[#F26B0F] border border-[#FF8A1F]/30 text-[10px] font-black py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Student Sandbox
              </button>
              <button
                type="button"
                onClick={() => enterDemo('teacher')}
                disabled={loading}
                className="bg-slate-50 hover:bg-[#FFF9F3]/60 text-[#F26B0F] border border-[#FF8A1F]/30 text-[10px] font-black py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Teacher Sandbox
              </button>
            </div>

          </div>
        </div>

        {/* Footer grid of value propositions */}
        <div className="w-full border-t border-slate-100 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto text-center font-black text-xs text-[#17233C] py-2">
            
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF9F3] border border-[#FF8A1F]/20 flex items-center justify-center text-[#F26B0F]">
                🧠
              </div>
              <span className="text-[12px] font-black text-[#17233C] tracking-tight">AI-Powered Learning</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF9F3] border border-[#FF8A1F]/20 flex items-center justify-center text-[#F26B0F]">
                🎯
              </div>
              <span className="text-[12px] font-black text-[#17233C] tracking-tight">Personalized Practice</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF9F3] border border-[#FF8A1F]/20 flex items-center justify-center text-[#F26B0F]">
                📈
              </div>
              <span className="text-[12px] font-black text-[#17233C] tracking-tight">Track & Achieve Goals</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF9F3] border border-[#FF8A1F]/20 flex items-center justify-center text-[#F26B0F]">
                🛡️
              </div>
              <span className="text-[12px] font-black text-[#17233C] tracking-tight">Secure & Private</span>
            </div>

          </div>

          <div className="flex items-center justify-center gap-1 mt-4 text-[12px] text-[#17233C] font-black tracking-tight">
            <span>🛡️</span>
            <span>Your data is encrypted and secure with us.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

// 🎬 Student Welcome Animation full-screen overlay player
const WelcomeAnimationOverlay: React.FC<{ studentName: string; onAnimationEnd: () => void }> = ({ studentName, onAnimationEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion Accessibility settings
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [onAnimationEnd]);

  const handleVideoEnded = () => {
    setTimeout(() => {
      onAnimationEnd();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17233C] flex flex-col items-center justify-center text-white overflow-hidden select-none">
      <video
        ref={videoRef}
        src="/assets/learnbridge_student_welcome_animation.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover opacity-85"
      />
      
      {/* Skip button */}
      <button
        onClick={onAnimationEnd}
        className="absolute top-6 right-6 z-50 bg-black/40 hover:bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
      >
        Skip Onboarding Intro
      </button>

      {/* Welcome Message card */}
      <div className="relative z-10 text-center space-y-3 px-6 animate-slide-up bg-black/35 backdrop-blur-md py-6 px-10 rounded-2xl border border-white/10">
        <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-md">
          Welcome back, {studentName} 👋
        </h2>
        <p className="text-base text-brand-200 font-semibold max-w-sm mx-auto drop-shadow-sm">
          Ready to continue your customized learning journey?
        </p>
      </div>
    </div>
  );
};
