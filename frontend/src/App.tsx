import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AccessibilityProvider } from './hooks/useAccessibility';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TutorChat } from './pages/TutorChat';
import { Quiz } from './pages/Quiz';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ClassroomRadar } from './components/ClassroomRadar';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCurriculum } from './pages/TeacherCurriculum';
import { TeacherSimulator } from './pages/TeacherSimulator';
import { AidMatcher } from './pages/AidMatcher';
import { StudyNotes } from './pages/StudyNotes';
import { BrainGames } from './pages/BrainGames';
import { ActivityStreak } from './pages/ActivityStreak';
import { api } from './services/api';




// Route Guard for logged in users
const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'student' | 'teacher' }> = ({ 
  children, 
  allowedRole 
}) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect role mismatches safely
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return <Layout>{children}</Layout>;
};

// HomeRedirect handles root route redirection based on login status and role
const HomeRedirect: React.FC = () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/student" replace />;
};

// Graph Wrapper to feed callbacks
const KnowledgeGraphWrapper: React.FC = () => {
  const [graphData, setGraphData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.getKnowledgeGraph();
        setGraphData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F26B0F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#17233C]">Curriculum Mastery Tree</h2>
        <p className="text-xs text-[#52627A] mt-0.5 font-bold">Explore the topics layout and check prerequisites connections.</p>
      </div>
      <KnowledgeGraph
        data={graphData}
        onSelectTopic={() => {}}
        onGenerateQuiz={() => navigate('/quiz')}
        onAskTutor={(_topicName) => navigate('/chat')}
      />
    </div>
  );
};

// Teacher Radar Wrapper to feed details
const TeacherRadarWrapper: React.FC = () => {
  const [radarData, setRadarData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRadar = async () => {
      try {
        const res = await api.getTeacherRadar(1, 2); // default class 1, topic 2 (Recursion)
        setRadarData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F26B0F]"></div>
      </div>
    );
  }

  return radarData ? (
    <ClassroomRadar
      topicName={radarData.topic_name}
      groups={radarData.radar_groups}
      onTriggerIntervention={(g: any) => alert(`Intervention configure triggered for ${g.sub_issue}.`)}
    />
  ) : (
    <p className="text-sm text-[#52627A] font-bold">Classroom radar unavailable.</p>
  );
};

// Teacher Interventions Wrapper
const TeacherInterventionsWrapper: React.FC = () => {
  const [interventions, setInterventions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchIntvs = async () => {
      try {
        const res = await api.getTeacherInterventions(1);
        setInterventions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchIntvs();
  }, []);

  const handleAction = async (id: number, status: 'accepted' | 'modified' | 'dismissed') => {
    try {
      await api.updateInterventionStatus(id, status);
      const res = await api.getTeacherInterventions(1);
      setInterventions(res);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F26B0F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl text-[#17233C]">
      <div>
        <h2 className="text-xl font-extrabold text-[#17233C]">Active Interventions</h2>
        <p className="text-xs text-[#52627A] mt-0.5 font-bold uppercase tracking-wider">AI Suggested Student Corrections</p>
      </div>

      <div className="space-y-4">
        {interventions.map(intv => (
          <div key={intv.id} className="p-6 rounded-2xl border border-[#FF8A1F]/15 bg-white shadow-sm space-y-4 text-sm">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF9F3] text-[#F26B0F] uppercase tracking-wide">
                {intv.topic_name}
              </span>
              <h4 className="font-bold text-base mt-1 text-[#17233C]">{intv.title}</h4>
              <p className="text-[#52627A] mt-1 leading-relaxed">{intv.issue_description}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl leading-relaxed text-xs">
              <span className="font-bold text-[#F26B0F] block mb-0.5">Suggested Remedy:</span>
              {intv.suggested_action}
            </div>

            {intv.status === 'pending' ? (
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => handleAction(intv.id, 'accepted')}
                  className="bg-[#F26B0F] hover:bg-[#D95D0B] text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer border-none"
                >
                  Accept Recommendation
                </button>
                <button
                  onClick={() => handleAction(intv.id, 'dismissed')}
                  className="text-slate-400 hover:text-slate-600 font-bold py-1.5 px-4 rounded-xl text-xs"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 uppercase">Status: {intv.status}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Student Layout Routes */}
          <Route 
            path="/student" 
            element={
              <PrivateRoute allowedRole="student">
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/streak" 
            element={
              <PrivateRoute allowedRole="student">
                <ActivityStreak />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute allowedRole="student">
                <TutorChat />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/quiz" 
            element={
              <PrivateRoute allowedRole="student">
                <Quiz />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/graph" 
            element={
              <PrivateRoute allowedRole="student">
                <KnowledgeGraphWrapper />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/aid" 
            element={
              <PrivateRoute allowedRole="student">
                <AidMatcher />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/notes" 
            element={
              <PrivateRoute allowedRole="student">
                <StudyNotes />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/games" 
            element={
              <PrivateRoute allowedRole="student">
                <BrainGames />
              </PrivateRoute>
            } 
          />

          {/* Teacher Layout Routes */}
          <Route 
            path="/teacher" 
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/radar" 
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherRadarWrapper />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/interventions" 
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherInterventionsWrapper />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/curriculum" 
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherCurriculum />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/simulator" 
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherSimulator />
              </PrivateRoute>
            } 
          />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AccessibilityProvider>
  );
};

export default App;
