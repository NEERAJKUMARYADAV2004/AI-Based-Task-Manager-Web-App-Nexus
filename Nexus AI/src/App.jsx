import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import DashboardView from './components/DashboardView';
import TodoPage from './components/TodoPage';
import CalendarPage from './components/CalendarPage';
import MyProjectsPage from './components/MyProjectsPage';
import MyNotesPage from './components/MyNotesPage';
import StatsPage from './components/StatsPage';
import ContactUsPage from './components/ContactUsPage';
import HelpCenterPage from './components/HelpCenterPage';
import CollaborationPage from './components/CollaborationPage';
import Chatbot from './components/Chatbot';
import { API_URL, getAuthHeaders } from './utils/api';

// Default empty structure for dashboard data to prevent crashes before load
const defaultDashboardData = {
  overallTasksDone: 0,
  dailyStats: [
    { label: "Done", count: 0, color: "text-red-400", bg: "border-red-400" },
    { label: "Ongoing", count: 0, color: "text-amber-400", bg: "border-amber-400" },
    { label: "Due", count: 0, color: "text-black", bg: "border-black bg-white" }
  ],
  calendar: { date: new Date(), message: "Welcome Back" },
  taskProgress: [],
  ongoingProjects: [],
  todayNote: "Loading...",
  todayTask: { title: "No immediate task", date: "" },
};

const App = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [userName, setUserName] = useState('Chief');

  // --- 1. Check Login Status on Load ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('nexus-token');
      if (token) {
        try {
          // Validate token with backend
          const res = await fetch(`${API_URL}/auth/user`, {
            headers: { 'x-auth-token': token }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setUserName(userData.name);
          } else {
            localStorage.removeItem('nexus-token');
          }
        } catch (err) {
          console.error("Auth check failed", err);
        }
      }
      setIsAuthReady(true);
    };
    checkAuth();
  }, []);

  // --- 2. Fetch Dashboard Data (Tasks/Projects) ---
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch Tasks and Projects in parallel
      const [tasksRes, projectsRes, notesRes] = await Promise.all([
        fetch(`${API_URL}/tasks`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/projects`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/notes`, { headers: getAuthHeaders() })
      ]);

      if (tasksRes.ok && projectsRes.ok) {
        const tasks = await tasksRes.json();
        const projects = await projectsRes.json();
        const notes = await notesRes.json();

        // --- Calculate Stats ---
        const done = tasks.filter(t => t.completed).length;
        const ongoing = tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length;
        const due = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
        
        // Task Progress (Mocking weekly data logic for visual simplicity)
        const progressData = [
            { day: 'Mon', status: 'In Progress' }, { day: 'Tue', status: 'Due' },
            { day: 'Wed', status: 'In Progress' }, { day: 'Thu', status: 'In Progress' },
            { day: 'Fri', status: 'Due' }, { day: 'Sat', status: 'Done' }, { day: 'Sun', status: 'Done' },
        ];

        // Ongoing Projects (Limit 2)
        const activeProjects = projects.filter(p => p.status === 'In Progress').slice(0, 2);
        
        // Today's Task (First upcoming)
        const nextTask = tasks.find(t => !t.completed) || { taskName: "All caught up!", dueDate: new Date() };
        const latestNote = notes.length > 0 ? notes[0].content.substring(0, 50) + "..." : "Add a note to get started.";

        setDashboardData({
          overallTasksDone: done,
          dailyStats: [
            { label: "Done", count: done, color: "text-red-400", bg: "border-red-400" },
            { label: "Ongoing", count: ongoing, color: "text-amber-400", bg: "border-amber-400" },
            { label: "Due", count: due, color: "text-black", bg: "border-black bg-white" }
          ],
          calendar: { date: new Date(), message: `Happy ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}` },
          taskProgress: progressData,
          ongoingProjects: activeProjects.map(p => ({ id: p._id, title: p.name, date: new Date(p.startDate) })),
          todayNote: latestNote,
          todayTask: { title: nextTask.taskName, date: new Date(nextTask.dueDate).toLocaleDateString('en-GB') }
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  // Refresh dashboard when menu changes to 'dashboard' or user logs in
  useEffect(() => {
    if (activeMenu === 'dashboard' && user) {
      fetchDashboardData();
    }
  }, [activeMenu, user]);


  // --- 3. Handle Login/Register ---
  const handleAuth = async (email, password, mode) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'register' 
        ? { email, password, name: email.split('@')[0] } // Extract name from email for simplicity
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Authentication failed');

      localStorage.setItem('nexus-token', data.token);
      setUser(data.user);
      setUserName(data.user.name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('nexus-token');
    setAuthMode('login');
    setActiveMenu('dashboard');
  };

  if (!isAuthReady) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading Nexus AI...</div>;
  }

  const isAuthenticated = user !== null;
  const backgroundClasses = "h-screen w-screen font-sans overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-900 to-slate-800 text-white";

  if (!isAuthenticated) {
    return ( <div className={`${backgroundClasses} flex items-center justify-center p-4`}> <AuthPage mode={authMode} setMode={setAuthMode} handleAuth={handleAuth} loading={loading} error={error} /> </div> );
  }

  return (
    <div className={backgroundClasses}>
      <style>{`
        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #ef4444; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {activeMenu === 'dashboard' && ( <DashboardView dashboardData={dashboardData} activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'todo' && ( <TodoPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'calendar' && ( <CalendarPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'projects' && ( <MyProjectsPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'notes' && ( <MyNotesPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'stats' && ( <StatsPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'contact' && ( <ContactUsPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'help' && ( <HelpCenterPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      {activeMenu === 'collab' && ( <CollaborationPage activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={handleSignOut} userName={userName} /> )}
      
      <Chatbot />
    </div>
  );
};

export default App;