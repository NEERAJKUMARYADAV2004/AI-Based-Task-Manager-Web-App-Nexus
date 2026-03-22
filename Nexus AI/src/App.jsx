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
import ProfilePage from './components/ProfilePage';
import Chatbot from './components/Chatbot';
import { io } from 'socket.io-client';
import { API_URL, getAuthHeaders } from './utils/api';
import { mockDashboardData } from './data/mockData';

// --- MAIN APPLICATION COMPONENT ---
const App = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  
  // Global Profile States
  const [userName, setUserName] = useState('Chief');
  const [userAvatar, setUserAvatar] = useState('');

  // Global Notifications State
  const [notifications, setNotifications] = useState([]);

  // --- AUTH AND DATA LOADING LOGIC (FIXED FOR RELOAD PERSISTENCE) ---
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('nexus-token');
      const storedUserStr = localStorage.getItem('nexus-user');

      // 1. If we have a token, fetch the absolute latest user profile from the database
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/user`, { 
            headers: { 'x-auth-token': token, 'Content-Type': 'application/json' } 
          });
          
          if (res.ok) {
            const dbUser = await res.json();
            setUser(dbUser);
            setUserName(dbUser.name || (dbUser.email ? dbUser.email.split('@')[0] : 'Chief'));
            setUserAvatar(dbUser.avatar || '');
            
            // Keep local storage in sync with fresh database data
            localStorage.setItem('nexus-user', JSON.stringify(dbUser));
            setIsAuthReady(true);
            return; // Successfully fetched, exit early
          }
        } catch (e) {
          console.error("Database fetch failed on reload, falling back to local cache", e);
        }
      }

      // 2. Fallback to local storage if API is unreachable or no token exists
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);
        setUserName(parsedUser.name || (parsedUser.email ? parsedUser.email.split('@')[0] : 'Chief'));
        setUserAvatar(parsedUser.avatar || '');
      }
      setIsAuthReady(true);
    };

    initApp();
  }, []);

  // --- GLOBAL SOCKET NOTIFICATIONS LISTENER ---
  useEffect(() => {
    if (user) {
      setDashboardData(mockDashboardData);
      
      const globalSocket = io('http://localhost:5000');
      
      const setupGlobalNotifications = async () => {
          try {
              const res = await fetch(`${API_URL}/teams`, { headers: getAuthHeaders() });
              if (res.ok) {
                  const teams = await res.json();
                  teams.forEach(team => globalSocket.emit('join_team', team._id || team.id));
              }
          } catch (err) {
              console.error("Global notification setup failed", err);
          }
      };

      setupGlobalNotifications();

      globalSocket.on('receive_update', (data) => {
          const currentUserId = user._id || user.id || user.uid; 
          if (data.senderId && data.senderId !== currentUserId) {
              const newNotif = {
                  id: `notif-${Date.now()}-${Math.random()}`,
                  title: data.senderName || 'A team member',
                  desc: data.actionMessage || 'made an update.',
                  type: data.type,
                  time: data.serverTimestamp || new Date().toISOString()
              };
              setNotifications(prev => [newNotif, ...prev]);
          }
      });

      return () => globalSocket.close();
    }
  }, [user]);

  const handleAuth = async (email, password, mode) => {
    setLoading(true);
    setError(null);
    try {
      const url = mode === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const body = mode === 'register' ? { email, password, name: email.split('@')[0] } : { email, password };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Auth failed');

      // Save real token and user to localStorage
      localStorage.setItem('nexus-token', data.token);
      localStorage.setItem('nexus-user', JSON.stringify(data.user));
      
      setUser(data.user);
      setUserName(data.user.name || email.split('@')[0]);
      setUserAvatar(data.user.avatar || '');
    } catch (e) {
      // Offline Mock Fallback
      console.warn("Backend auth failed, falling back to local mock auth", e);
      if (mode === 'register' && password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const extractedName = email.split('@')[0];
      const mockUser = { uid: `mock-user-${Date.now()}`, email: email, name: extractedName };
      setUser(mockUser);
      setUserName(extractedName);
      setUserAvatar('');
      localStorage.setItem('nexus-user', JSON.stringify(mockUser));
      localStorage.setItem('nexus-token', 'mock-token');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setUser(null);
    setNotifications([]);
    setUserAvatar('');
    localStorage.removeItem('nexus-user');
    localStorage.removeItem('nexus-token');
    setAuthMode('login');
    setActiveMenu('dashboard');
  };

  const handleDismissNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const handleClearAllNotifications = () => setNotifications([]);

  if (!isAuthReady) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Initializing Dashboard...</div>;
  }

  const isAuthenticated = user !== null;
  const backgroundClasses = "h-screen w-screen font-sans overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-900 to-slate-800 text-white";

  if (!isAuthenticated) {
    return ( <div className={`${backgroundClasses} flex items-center justify-center p-4`}> <AuthPage mode={authMode} setMode={setAuthMode} handleAuth={handleAuth} loading={loading} error={error} /> </div> );
  }

  // Pass userAvatar down so the Header and Profile Page can access it globally
  const pageProps = {
    activeMenu,
    setActiveMenu,
    onSignOut: handleSignOut,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    notifications,
    onDismissNotification: handleDismissNotification,
    onClearAll: handleClearAllNotifications
  };

  return (
    <div className={backgroundClasses}>
      <style>{`
        /* =========================================
           1. LUXURY TYPOGRAPHY & SCROLLBARS
           ========================================= */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.2); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(239, 68, 68, 0.8); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {activeMenu === 'dashboard' && <DashboardView dashboardData={dashboardData} {...pageProps} />}
      {activeMenu === 'todo' && <TodoPage {...pageProps} />}
      {activeMenu === 'calendar' && <CalendarPage {...pageProps} />}
      {activeMenu === 'projects' && <MyProjectsPage {...pageProps} />}
      {activeMenu === 'notes' && <MyNotesPage {...pageProps} />}
      {activeMenu === 'stats' && <StatsPage {...pageProps} />}
      {activeMenu === 'contact' && <ContactUsPage {...pageProps} />}
      {activeMenu === 'help' && <HelpCenterPage {...pageProps} />}
      {activeMenu === 'collab' && <CollaborationPage {...pageProps} />}
      {activeMenu === 'profile' && <ProfilePage {...pageProps} />}
      
      <Chatbot />
    </div>
  );
};

export default App;