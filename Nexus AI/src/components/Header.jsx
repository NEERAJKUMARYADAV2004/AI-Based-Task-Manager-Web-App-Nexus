import React, { useState, useEffect, useRef } from 'react';
import { CustomButton } from './UI';
import { Bell, Plus, X, MessageSquare, Edit2, Trash2, Info } from 'lucide-react';
import ProfilePage from './ProfilePage';

const Header = ({ userName = 'Chief', setActiveMenu, notifications = [], onDismissNotification, onClearAll }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const wrapperRef = useRef(null);
  

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const unreadCount = notifications.length;

  // Handle clicking outside to close the notification shade
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically assign an icon based on the real-time socket action type
  const getNotifIcon = (type, desc) => {
    if (desc?.toLowerCase().includes('comment')) return <MessageSquare size={16} className="text-amber-400" />;
    switch(type) {
      case 'NEW_TASK': return <Plus size={16} className="text-emerald-400" />;
      case 'UPDATE_TASK': return <Edit2 size={16} className="text-indigo-400" />;
      case 'DELETE_TASK': return <Trash2 size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center p-5 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-white/5 transition-colors duration-300">
      <h2 className="text-2xl font-extrabold text-white tracking-tight">
        Welcome Back, {userName}!
      </h2>
      
      <div className="flex items-center space-x-6">
        <div className="text-white/60 text-sm font-medium hidden sm:block tracking-wide">
          {currentDate}
        </div>
        
        {/* ADD TASK BUTTON */}
        <CustomButton 
          className="text-sm px-5 py-2.5 flex items-center gap-2 !bg-indigo-600 hover:!bg-indigo-700 text-[#ffffff] shadow-lg shadow-indigo-500/20 transition-all font-semibold rounded-xl"
          onClick={() => setActiveMenu && setActiveMenu('todo')}
        >
          <Plus size={18} strokeWidth={2.5} color="#ffffff" />
          ADD TASK
        </CustomButton>
        
        {/* NOTIFICATIONS ICON & SHADE */}
        <div className="relative" ref={wrapperRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2.5 rounded-full text-white opacity-70 cursor-pointer hover:opacity-100 hover:bg-white/10 transition-all duration-300 group relative"
            title="Notifications"
          >
            {isNotifOpen ? (
              <X size={22} strokeWidth={2.5} className="text-white hover:text-red-400 transition-colors" />
            ) : (
              <>
                <Bell size={22} strokeWidth={2} className={`transition-transform ${unreadCount > 0 ? 'animate-bounce text-emerald-400' : 'group-hover:scale-110'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0a0f1c] px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* LUXURIOUS NOTIFICATION SHADE */}
          {isNotifOpen && (
            <div className="absolute top-[calc(100%+14px)] right-0 w-[320px] sm:w-[380px] bg-[#0f172a]/95 backdrop-blur-3xl border border-slate-700/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-50">
              
              {/* Shade Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700/80 bg-[#1e293b]/50">
                <h3 className="text-white text-[15px] font-bold tracking-wide">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => { onClearAll && onClearAll(); setIsNotifOpen(false); }} 
                    className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Shade Scrollable List */}
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {unreadCount === 0 ? (
                  <div className="px-5 py-12 flex flex-col items-center justify-center text-slate-500">
                    <Bell size={32} strokeWidth={1.5} className="mb-3 opacity-30" />
                    <span className="font-medium text-[13px]">You're all caught up!</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-4 p-4 border-b border-slate-700/40 hover:bg-[#1e293b]/80 transition-colors relative group">
                      
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-600/50">
                        {getNotifIcon(notif.type, notif.desc)}
                      </div>
                      
                      <div className="flex-1 pr-5">
                        <h4 className="text-[13px] font-bold text-white mb-0.5">{notif.title}</h4>
                        <p className="text-[12px] text-slate-400 leading-snug">{notif.desc}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block font-medium uppercase tracking-wider">
                          {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button 
                        onClick={() => onDismissNotification && onDismissNotification(notif.id)} 
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Dismiss"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* USER AVATAR */}
        <div 
          onClick={() => setActiveMenu && setActiveMenu('profile')}
          className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-lg font-bold text-slate-900 shadow-lg cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-red-400 hover:ring-offset-transparent transition-all"
          title="Go to Profile"
        >
          {/* {m.avatar && m.avatar.length > 5 ? <img src={m.avatar} alt="Profile" className="w-full h-full object-cover" /> : (m.name?.[0] || '👤')} */}
          {userName && userName.length > 0 ? userName[0].toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

export default Header;