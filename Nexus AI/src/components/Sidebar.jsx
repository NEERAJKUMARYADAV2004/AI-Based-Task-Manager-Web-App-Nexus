import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  FolderKanban, 
  StickyNote, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  PhoneCall, 
  Search,
  LogOut
} from 'lucide-react';

const Sidebar = ({
  activeMenu,
  setActiveMenu,
  onSignOut
}) => {

  // Navigation Items using Lucide Icons
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { icon: CheckSquare, label: 'To Do', key: 'todo' },
    { icon: CalendarDays, label: 'Calendar', key: 'calendar' },
    { icon: FolderKanban, label: 'My Projects', key: 'projects' },
  ];
  
  const utilityItems = [
    { icon: StickyNote, label: 'My Notes', key: 'notes' },
    { icon: BarChart3, label: 'Stats', key: 'stats' },
    { icon: Users, label: 'Collaboration', key: 'collab' },
    { icon: Settings, label: 'Settings', key: 'settings' },
    { icon: HelpCircle, label: 'Help Center', key: 'help' },
    { icon: PhoneCall, label: 'Contact Us', key: 'contact' },
  ];

  // Elegant Menu Item Component
  const MenuItem = ({ icon: Icon, label, isActive, onClick }) => (
    <div
      onClick={onClick}
      className={`group flex items-center px-4 py-3 my-1 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden
        ${isActive 
          ? 'bg-gradient-to-r from-red-600/10 to-transparent text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-red-500 rounded-r-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
      )}
      
      <Icon 
        strokeWidth={isActive ? 2.5 : 2} 
        size={20} 
        className={`mr-4 transition-colors duration-300 ${isActive ? 'text-red-400' : 'text-white/50 group-hover:text-white/90'}`} 
      />
      <span className="text-sm tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className="w-72 p-5 flex flex-col h-full backdrop-blur-xl border-r shadow-2xl z-10 flex-shrink-0 transition-colors duration-300 bg-[#0a0f1c]/90 border-white/5">
      
      {/* Luxury Logo Area */}
      <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 border border-transparent">
          <span className="text-white font-black text-lg tracking-tighter">N</span>
        </div>
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text tracking-wider bg-gradient-to-r from-white to-white/70">
          Nexus AI
        </h1>
      </div>

      {/* Sleek Search Bar */}
      <div className="mb-6 relative flex-shrink-0 px-2">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search size={16} className="text-white/40" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all duration-300 shadow-inner bg-white/5 border-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-red-500/50 focus:bg-white/10"
        />
      </div>
      
      {/* Navigation Sections */}
      <nav className="flex-grow overflow-y-auto no-scrollbar px-2 pb-4"> 
        <div className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-4 text-white/30">
            Menu
          </h3>
          {navItems.map((item) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={activeMenu === item.key}
              onClick={() => setActiveMenu(item.key)}
            />
          ))}
        </div>
        
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-4 text-white/30">
            Workspace & Utilities
          </h3>
          {utilityItems.map((item) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              isActive={activeMenu === item.key}
              onClick={() => setActiveMenu(item.key)}
            />
          ))}
        </div>
      </nav>

      {/* Elegant Sign Out Button */}
      <div className="pt-5 pb-2 px-2 border-t flex-shrink-0 mt-2 border-white/5">
        <button 
          onClick={onSignOut} 
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm border bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
        >
          <LogOut size={18} strokeWidth={2.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;