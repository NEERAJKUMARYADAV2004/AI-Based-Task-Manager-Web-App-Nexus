import React, { useState } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { CheckCircle, Clock, Calendar, CheckSquare, ChevronRight, ChevronLeft, Plus, Edit3, Target, Info, AlertCircle } from 'lucide-react';

// --- WIDGETS ---
const OverallInformation = ({ data }) => {
  const totalTasks = data.overallTasksDone || 0;
  const dailyStats = data.dailyStats || [];

  const getIcon = (label) => {
     if (label === 'Done') return <CheckCircle className="w-4 h-4 mb-2 opacity-80" />;
     if (label === 'Ongoing') return <Clock className="w-4 h-4 mb-2 opacity-80" />;
     return <AlertCircle className="w-4 h-4 mb-2 opacity-80" />;
  };

  return (
    <Card title="Insights" className="col-span-1 flex flex-col h-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl">
      <div className="flex-grow flex flex-col justify-center py-4">
        <div className="text-5xl font-extrabold serif-font text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-teal-500 mb-2">{totalTasks}</div>
        <div className="text-xs text-white/60 uppercase tracking-widest font-semibold drop-shadow-md">Lifetime Tasks</div>
      </div>
      <div className="flex justify-between mt-auto pt-4 space-x-2 border-t border-white/10">
        {dailyStats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            {getIcon(stat.label)}
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center bg-white/5 backdrop-blur-md shadow-inner ${stat.color} ${stat.bg} text-sm font-bold mb-2`}>
              {stat.count}
            </div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-white/50">{stat.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const CalendarWidget = ({ data }) => {
  const baseDate = data.calendar.date ? new Date(data.calendar.date) : new Date();
  const today = new Date(baseDate);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDay = (date) => date.getDate();
  const formatMonth = (date) => date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const formatYear = (date) => date.getFullYear();

  const facts = [
    "Honey never spoils.", "Octopuses have 3 hearts.", "Bananas grow upside down.", "A day on Venus is longer than a year.", "Water makes up 60% of adults."
  ];
  const randomFact = React.useMemo(() => facts[Math.floor(Math.random() * facts.length)], []);

  return (
    <Card title="Schedule" className="col-span-1 flex flex-col items-center h-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl">
      <div className="flex justify-around w-full text-center mb-4 text-white/80 flex-grow items-center">
        <div className="flex flex-col items-center opacity-40">
          <span className="text-[10px] uppercase font-semibold tracking-widest mb-1">Yest</span>
          <span className="text-2xl font-light serif-font">{formatDay(yesterday)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 mb-1">Today</span>
          <span className="text-4xl md:text-5xl font-bold serif-font text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formatDay(today)}</span>
        </div>
        <div className="flex flex-col items-center opacity-40">
          <span className="text-[10px] uppercase font-semibold tracking-widest mb-1">Tmrw</span>
          <span className="text-2xl font-light serif-font">{formatDay(tomorrow)}</span>
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-6">{formatMonth(today)} {formatYear(today)}</div>
      
      <div className="w-full rounded-xl p-4 bg-gradient-to-br from-white/10 to-transparent border border-white/10 mt-auto min-h-[80px] flex flex-col justify-center">
        {data.upcomingEvent ? (
          <>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3"/> Next Up
            </div>
            <div style={{ containerType: 'inline-size' }}>
               <h4 className="font-semibold serif-font text-indigo-300 break-words leading-snug" style={{ fontSize: 'clamp(1rem, 8cqw, 1.25rem)' }}>
                 {data.upcomingEvent.title}
               </h4>
            </div>
            <div className="text-[11px] text-white/50 mt-2 font-medium">
              Deadline: {new Date(data.upcomingEvent.date).toLocaleDateString('en-GB')}
            </div>
          </>
        ) : (
          <>
             <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
              <Info className="w-3 h-3"/> Random Fact
            </div>
            <div className="text-sm italic text-white/70 serif-font leading-relaxed">{randomFact}</div>
          </>
        )}
      </div>
    </Card>
  );
};

const TaskProgressChart = ({ data }) => {
  const days = data.taskProgress || [];
  const statusColors = {
    'In Progress': 'bg-gradient-to-t from-amber-600 to-amber-400',
    'Due': 'bg-gradient-to-t from-rose-600 to-rose-400',
    'Done': 'bg-gradient-to-t from-emerald-600 to-emerald-400'
  };

  return (
    <Card title="Activity Flow" className="col-span-1 lg:col-span-2 h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl">
      <div className="flex justify-between items-end h-32 md:h-40 mb-4 flex-grow px-2">
        {days.map((item, index) => (
          <div key={index} className="flex flex-col items-center h-full w-1/7 justify-end group cursor-pointer relative">
            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md z-10 whitespace-nowrap shadow-lg">
                {item.status}
            </div>
            <div
              className={`w-3 md:w-4 rounded-full transition-all duration-700 shadow-lg ${statusColors[item.status] || 'bg-white/10'}`}
              style={{ height: `${item.status === 'In Progress' ? '75%' : item.status === 'Due' ? '50%' : '35%'}` }}
            ></div>
            <span className="text-[10px] font-medium text-white/60 mt-3 uppercase">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center space-x-6 text-[10px] font-bold uppercase tracking-wider mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center text-white/60 group">
          <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span> Ongoing
        </div>
        <div className="flex items-center text-white/60 group">
          <span className="w-2 h-2 rounded-full bg-rose-400 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span> Due
        </div>
         <div className="flex items-center text-white/60 group">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span> Done
        </div>
      </div>
    </Card>
  );
};

const ProjectsCard = ({ data, setActiveMenu }) => (
  <Card title="Focused Projects" className="lg:col-span-2 h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow items-center">
      {data.ongoingProjects.map((project) => (
        <div key={project.id} className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-xl text-center h-full min-h-[140px] shadow-lg group hover:from-white/15 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors"></div>
          <Target className="w-7 h-7 text-indigo-300 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          <div className="text-white text-base serif-font font-semibold mb-2 line-clamp-2 leading-tight drop-shadow-sm">{project.title}</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 flex items-center justify-center gap-1.5 mt-auto">
             <Calendar className="w-3 h-3" /> {new Date(project.date).toLocaleDateString('en-GB')}
          </div>
        </div>
      ))}
      
      {/* Fill empty slots logic to ensure exactly 3 slots total */}
      {data.ongoingProjects.length < 2 && Array.from({ length: 2 - data.ongoingProjects.length }).map((_, i) => (
         <div key={`empty-${i}`} className="flex flex-col items-center justify-center space-y-2 p-5 border border-dashed border-white/10 rounded-xl text-center h-full min-h-[140px] opacity-40">
             <Info className="w-6 h-6 text-white/50" />
             <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Capacity</span>
         </div>
      ))}
      
      <button 
        onClick={() => setActiveMenu('projects')}
        className="flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-white/10 rounded-xl text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 h-full min-h-[140px] group"
      >
        <span className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors mb-3">
           <Plus className="w-6 h-6" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">New Project</span>
      </button>
    </div>
  </Card>
);

const NoteCard = ({ data }) => (
  <Card title="Quick Note" className="col-span-1 flex flex-col h-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-2xl"></div>
    <div className="flex-grow flex flex-col items-center justify-center overflow-hidden z-10 px-2 mt-2">
      <p className="text-white/80 text-sm md:text-base serif-font italic text-center overflow-y-auto max-h-[120px] custom-scrollbar focus:outline-none leading-relaxed drop-shadow-md">
        {data.todayNote ? `"${data.todayNote}"` : "The faintest ink is more powerful than the strongest memory."}
      </p>
    </div>
  </Card>
);

const TaskCard = ({ data }) => {
  const tasks = data.todayTasks || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const greetings = [
    "Good morning, Chief! Your schedule is clear today.",
    "No tasks today! Time to relax or innovate.",
    "You're completely caught up! Enjoy the peace.",
    "A clean slate! What will you create today?"
  ];
  const randomGreeting = React.useMemo(() => greetings[Math.floor(Math.random() * greetings.length)], []);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % tasks.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + tasks.length) % tasks.length);

  if (tasks.length === 0) {
    return (
      <Card title="Daily Focus" className="col-span-1 flex flex-col h-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl">
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center h-full">
            <CheckSquare className="w-10 h-10 text-emerald-400 mb-4 opacity-70" strokeWidth={1.5} />
            <p className="text-base serif-font text-white/80 leading-relaxed">{randomGreeting}</p>
        </div>
      </Card>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <Card title="Daily Focus" className="col-span-1 flex flex-col h-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl relative overflow-hidden">
      <div className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest text-white/30 bg-white/5 px-2 py-1 rounded-md">
         {currentIndex + 1} / {tasks.length}
      </div>
      <div className="flex-grow flex flex-row items-center justify-between w-full px-1 mt-6 border-t border-white/5 pt-4">
        <button onClick={handlePrev} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-grow text-center px-4">
            <h3 className="text-xl font-semibold serif-font block text-white drop-shadow-md leading-snug break-words">
                {currentTask.title}
            </h3>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mt-3 flex items-center justify-center gap-1.5">
               <Clock className="w-3 h-3" /> Due {currentTask.date}
            </div>
        </div>
        <button onClick={handleNext} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

// --- MAIN DASHBOARD VIEW ---
const DashboardView = ({
  dashboardData,
  activeMenu,
  setActiveMenu,
  onSignOut,
  userName,
  userAvatar,     
  notifications,
  onDismissNotification,
  onClearAll, isMobileMenuOpen, setIsMobileMenuOpen, onNotifAction
}) => (
  <div className="flex h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white">
    <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
    <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
      
      {/* GLOBAL HEADER WITH NOTIFICATIONS AND AVATAR */}
      <Header 
        userName={userName} 
        userAvatar={userAvatar}   
        setActiveMenu={setActiveMenu} 
        notifications={notifications}
        onDismissNotification={onDismissNotification}
        onClearAll={onClearAll}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onNotifAction={onNotifAction}
      />
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 pb-32 max-w-7xl mx-auto">
        
        {/* Row 1 */}
        <OverallInformation data={dashboardData} />
        <CalendarWidget data={dashboardData} />
        <TaskProgressChart data={dashboardData} />
        
        {/* Row 2 */}
        <ProjectsCard data={dashboardData} setActiveMenu={setActiveMenu} />
        <NoteCard data={dashboardData} />
        <TaskCard data={dashboardData} />

        {/* Quick Actions */}
        <Card title="Quick Launch" className="lg:col-span-4 h-full min-h-[160px] backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl mt-4">
           <div className="flex items-center justify-center h-full w-full py-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4">
                   <button 
                     onClick={() => setActiveMenu('notes')}
                     className="flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent rounded-xl hover:from-white/10 hover:to-white/5 transition-all duration-300 p-6 border border-white/5 hover:border-white/20 shadow-lg group"
                    >
                      <Edit3 className="w-8 h-8 mb-3 text-indigo-300 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                      <span className="text-xs uppercase tracking-widest font-bold text-white/70 group-hover:text-white">Jot Note</span>
                   </button>
                   <button 
                     onClick={() => setActiveMenu('todo')}
                     className="flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent rounded-xl hover:from-white/10 hover:to-white/5 transition-all duration-300 p-6 border border-white/5 hover:border-white/20 shadow-lg group"
                    >
                       <CheckSquare className="w-8 h-8 mb-3 text-emerald-300 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                       <span className="text-xs uppercase tracking-widest font-bold text-white/70 group-hover:text-white">New Task</span>
                   </button>
                   <button 
                     onClick={() => setActiveMenu('calendar')}
                     className="flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent rounded-xl hover:from-white/10 hover:to-white/5 transition-all duration-300 p-6 border border-white/5 hover:border-white/20 shadow-lg group"
                    >
                       <Calendar className="w-8 h-8 mb-3 text-amber-300 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                       <span className="text-xs uppercase tracking-widest font-bold text-white/70 group-hover:text-white">Schedule</span>
                   </button>
                   <button 
                     onClick={() => setActiveMenu('projects')}
                     className="flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent rounded-xl hover:from-white/10 hover:to-white/5 transition-all duration-300 p-6 border border-white/5 hover:border-white/20 shadow-lg group"
                    >
                       <Target className="w-8 h-8 mb-3 text-rose-300 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                       <span className="text-xs uppercase tracking-widest font-bold text-white/70 group-hover:text-white">Launch</span>
                   </button>
               </div>
           </div>
        </Card>
      </div>
    </main>
  </div>
);

export default DashboardView;