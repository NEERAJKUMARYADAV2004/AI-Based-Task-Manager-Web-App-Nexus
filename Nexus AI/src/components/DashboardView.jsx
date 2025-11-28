import React, { useState, useEffect } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';

// --- WIDGETS ---

const OverallInformation = ({ data }) => {
  const totalTasks = data.overallTasksDone || 0;
  const dailyStats = data.dailyStats || [];

  return (
    <Card title="Overall Information" className="col-span-1 flex flex-col h-full">
      <div className="flex-grow flex flex-col justify-center">
        <div className="text-4xl font-extrabold text-red-400 mb-2">{totalTasks}</div>
        <div className="text-sm text-white/70 mb-2">Task Done for all time</div>
      </div>
      <div className="flex justify-between mt-auto pt-2 space-x-2">
        {dailyStats.map((stat, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center 
              ${stat.bg} ${stat.color} text-sm font-bold mb-1`}
            >
              {stat.count}
            </div>
            <span className="text-[10px] md:text-xs text-white/80">{stat.label}</span>
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
  const formatMonth = (date) => date.toLocaleString('en-US', { month: 'long' });
  const formatYear = (date) => date.getFullYear();

  return (
    <Card title="Calendar" className="col-span-1 flex flex-col items-center h-full">
      <div className="flex justify-around w-full text-center mb-2 text-white/80 flex-grow items-center">
        <div className="flex flex-col items-center">
          <span className="text-xs md:text-sm">Yesterday</span>
          <span className="text-2xl md:text-3xl font-bold text-white/50">{formatDay(yesterday)}</span>
        </div>
        <div className="flex flex-col items-center text-red-400">
          <span className="text-xs md:text-sm font-bold">Today</span>
          <span className="text-4xl md:text-5xl font-bold">{formatDay(today)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs md:text-sm">Tomorrow</span>
          <span className="text-2xl md:text-3xl font-bold text-white/50">{formatDay(tomorrow)}</span>
        </div>
      </div>
      <div className="text-sm text-white/60 mb-4">{formatMonth(today)} {formatYear(today)}</div>
      <div className="w-full rounded-lg text-center p-3 bg-white/10 mt-auto">
        <div className="text-xl font-semibold text-red-400 truncate">
          {data.calendar.message}
        </div>
        <div className="text-xs text-white/70 mt-1">
          {today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
    </Card>
  );
};

const TaskProgressChart = ({ data }) => {
  const days = data.taskProgress || [];
  const statusColors = {
    'In Progress': 'bg-red-400',
    'Due': 'bg-indigo-400',
    'Done': 'bg-green-400'
  };

  return (
    <Card title="Task Progress" className="col-span-1 lg:col-span-2 h-full flex flex-col">
      <div className="flex justify-between items-end h-32 md:h-40 mb-4 flex-grow px-2">
        {days.map((item, index) => (
          <div key={index} className="flex flex-col items-center h-full w-1/7 justify-end group relative">
             {/* Tooltip for exact status */}
             <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                {item.status}
             </div>
            <div
              className={`w-3 md:w-4 rounded-full transition-all duration-500 
              ${statusColors[item.status] || 'bg-gray-700'}`}
              style={{
                height: `${item.status === 'In Progress' ? '80%' : item.status === 'Due' ? '60%' : '40%'}`,
              }}
            ></div>
            <span className="text-xs text-white/70 mt-2">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center space-x-4 text-xs mt-auto pt-2 border-t border-white/10">
        <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
          In Progress
        </div>
        <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
          Due
        </div>
         <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
          Done
        </div>
      </div>
    </Card>
  );
};

// --- UPDATED: ProjectsCard to handle redirection on + click ---
const ProjectsCard = ({ data, setActiveMenu }) => (
  <Card title="Ongoing Projects" className="lg:col-span-2 h-full flex flex-col">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
      {data.ongoingProjects.map((project) => (
        <div
          key={project.id}
          className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg text-center h-full min-h-[120px]"
        >
          <div className="text-2xl text-red-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-white text-sm font-semibold mt-1 line-clamp-1" title={project.title}>{project.title}</div>
          </div>
          <p className="text-xs text-white/70">
            {new Date(project.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      ))}
      <button 
        onClick={() => setActiveMenu('projects')} // Redirects to My Projects page
        className="flex items-center justify-center bg-white/10 rounded-lg text-white/50 text-4xl hover:bg-white/20 transition-colors duration-200 h-full min-h-[120px]"
      >
        +
      </button>
    </div>
  </Card>
);

const NoteCard = ({ data }) => (
  <Card title="Today's Note" className="col-span-1 flex flex-col h-full">
    <div className="flex-grow flex flex-col items-center justify-center overflow-hidden">
      <p className="text-white/90 text-base italic text-center overflow-y-auto max-h-[120px] custom-scrollbar p-2 w-full">
        "{data.todayNote || "No note set for today."}"
      </p>
    </div>
  </Card>
);

const TaskCard = ({ data }) => {
    return (
      <Card title="Today's Task" className="col-span-1 flex flex-col h-full">
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="flex items-center justify-between text-white/90 w-full px-2 mb-2">
            <button className="p-2 rounded-full text-red-400 hover:text-white transition-colors duration-200 bg-white/10 hover:bg-red-600/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-grow text-center px-2">
                <span className="text-lg md:text-xl font-semibold block line-clamp-2">
                    {data.todayTask?.title || "No tasks for today"}
                </span>
            </div>
    
            <button className="p-2 rounded-full text-red-400 hover:text-white transition-colors duration-200 bg-white/10 hover:bg-red-600/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-white/70 text-center">
             {data.todayTask?.date || new Date().toLocaleDateString('en-GB')}
          </div>
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
  userName
}) => (
  <div className="flex h-full w-full overflow-hidden">
    <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
    <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
      <Header userName={userName} setActiveMenu={setActiveMenu} />
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 pb-24">
    
        {/* Row 1 */}
        <OverallInformation data={dashboardData} />
        <CalendarWidget data={dashboardData} />
        <TaskProgressChart data={dashboardData} />
        
        {/* Row 2 */}
        <ProjectsCard data={dashboardData} setActiveMenu={setActiveMenu} /> {/* Passed setActiveMenu */}
        
        {/* Row 2 (cont'd) */}
        <NoteCard data={dashboardData} />
        <TaskCard data={dashboardData} />

        {/* Row 3 - Additional Placeholders */}
        <Card title="Project Progress" className="lg:col-span-2 h-full flex flex-col min-h-[200px]">
            <div className="h-full bg-white/5 rounded-lg flex flex-col items-center justify-center text-white/50 text-sm p-4">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 mb-2"></div>
              <span>Project Status Overview</span>
            </div>
        </Card>

        {/* UPDATED: Centered Content in Quick Actions */}
        <Card title="Quick Actions" className="lg:col-span-2 h-full min-h-[200px]">
           <div className="flex items-center justify-center h-full w-full"> {/* Centering Container */}
               <div className="grid grid-cols-2 gap-6 w-full max-w-md"> {/* Constrained width for centering look */}
                   <button 
                     onClick={() => setActiveMenu('notes')}
                     className="flex flex-col items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors p-6 border border-white/10"
                    >
                      <span className="text-4xl mb-2">📝</span>
                      <span className="text-base font-semibold text-white">New Note</span>
                   </button>
                   <button 
                     onClick={() => setActiveMenu('todo')}
                     className="flex flex-col items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors p-6 border border-white/10"
                    >
                       <span className="text-4xl mb-2">✅</span>
                       <span className="text-base font-semibold text-white">New Task</span>
                   </button>
               </div>
           </div>
        </Card>

        <footer className="text-right text-sm text-white/50 pt-4 mt-8 lg:col-span-4">
            {/* Footer content if any */}
        </footer>
      </div>
    </main>
    
    {/* Global Chatbot is handled in App.jsx, no need to add here */}
  </div>
);

export default DashboardView;