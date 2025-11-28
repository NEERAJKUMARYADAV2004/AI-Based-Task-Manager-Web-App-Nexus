export const mockDashboardData = {
 overallTasksDone: 67,
 dailyStats: [
    { label: "Done", count: 33, color: "text-red-400", bg: "border-red-400" },
    { label: "Ongoing", count: 7, color: "text-amber-400", bg: "border-amber-400" },
    { label: "Due", count: 5, color: "text-black", bg: "border-black bg-white" }
  ],
 calendar: { date: new Date(), message: "Happy Birthday Master" },
 taskProgress: [
    { day: 'Mon', status: 'In Progress' },
    { day: 'Tue', status: 'Due' },
    { day: 'Wed', status: 'In Progress' },
    { day: 'Thu', status: 'In Progress' },
    { day: 'Fri', status: 'Due' },
    { day: 'Sat', status: 'Done' },
    { day: 'Sun', status: 'Done' }
  ],
 ongoingProjects: [
    { id: 1, title: "Task Management App", date: new Date("2025-11-15") },
    { id: 2, title: "Task Management App", date: new Date("2025-11-15") }
  ],
 todayNote: "There's No limit which cannot be achievable...",
 todayTask: { title: "Trip 2 Ladakh", date: "28/10/2025" }
};