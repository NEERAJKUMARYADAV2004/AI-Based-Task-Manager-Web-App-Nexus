import { mockDashboardData } from '../data/mockData';
import React from 'react';
import { Card, CustomButton, IconButton } from './UI'; // Assuming UI.jsx exists
import Sidebar from './Sidebar'; // Assuming Sidebar.jsx exists
import Header from './Header'; // Assuming Header.jsx exists

// Import mock data directly for this example
// In a real app, this data might come via props or context/state management


// Reusable Bar Chart Component (similar to TaskProgressChart)
const WeeklyProgressChart = ({ data, title = "Weekly Task Progress" }) => {
  const days = data || [];
  const statusColors = {
    'In Progress': 'bg-red-400',
    'Due': 'bg-indigo-400',
    'Done': 'bg-green-400'
  };
  const statusHeights = {
    'In Progress': '80%',
    'Due': '60%',
    'Done': '40%',
  };

  return (
    <Card title={title}>
      <div className="flex justify-between items-end h-40 mb-4 mt-6 px-4"> {/* Increased height */}
        {days.map((item, index) => (
          <div key={index} className="flex flex-col items-center h-full w-[12%]"> {/* Adjusted width */}
            <div
              className={`w-3/4 rounded-t-md transition-all duration-500 flex-grow ${statusColors[item.status] || 'bg-gray-700'}`} // Use flex-grow for height
              style={{ maxHeight: statusHeights[item.status] || '20%' }} // Control max height based on status
            ></div>
            <span className="text-xs text-white/70 mt-2">{item.day}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4 text-xs mt-4">
        <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
          In Progress
        </div>
        <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
          Done
        </div>
        <div className="flex items-center text-white/80">
          <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
          Due
        </div>
      </div>
    </Card>
  );
};


const StatsPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {

  // Use the imported mock data
  const statsData = mockDashboardData;

  const totalTasks = statsData.overallTasksDone || 0;
  const dailyStats = statsData.dailyStats || [];
  const weeklyProgress = statsData.taskProgress || [];

  // Calculate totals from daily stats if needed
  const totalDaily = dailyStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />

      {/* Main content area for Stats */}
      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />

        {/* Main container for Stats content */}
        <div className="p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Task Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Overall Card */}
            <Card title="All-Time Completion" className="!bg-indigo-800/60 border-indigo-500">
                <div className="text-center py-4">
                    <div className="text-6xl font-extrabold text-indigo-300 mb-2">{totalTasks}</div>
                    <div className="text-lg text-white/80">Tasks Completed</div>
                </div>
            </Card>

            {/* Daily Stats Summary Card */}
             <Card title="Today's Snapshot" className="!bg-slate-800/80">
                <div className="space-y-4 pt-2">
                    {dailyStats.map((stat, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className={`text-lg font-medium ${stat.color}`}>{stat.label}</span>
                            <span className={`text-2xl font-bold px-3 py-1 rounded ${stat.bg} ${stat.color} border-2`}>
                                {stat.count}
                            </span>
                         </div>
                    ))}
                     <div className="text-right text-sm text-white/60 pt-2 border-t border-white/10">
                         Total for today: {totalDaily}
                     </div>
                </div>
             </Card>

             {/* Placeholder for more stats */}
             <Card title="Productivity Trends" className="!bg-slate-800/80 flex items-center justify-center">
                 <p className="text-white/50 text-center">More detailed charts (e.g., monthly trends, completion rate) could go here.</p>
             </Card>


            {/* Weekly Progress Chart Card (spanning more columns on larger screens) */}
            <div className="lg:col-span-3"> {/* Span full width on large screens */}
                <WeeklyProgressChart data={weeklyProgress} />
            </div>

          </div>
        </div>

        {/* Floating AI Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <IconButton
            icon={<span className="text-2xl">🤖</span>}
            className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50"
            onClick={() => alert("Nexus AI Clicked!")}
          />
        </div>
      </main>
    </div>
  );
};

export default StatsPage;