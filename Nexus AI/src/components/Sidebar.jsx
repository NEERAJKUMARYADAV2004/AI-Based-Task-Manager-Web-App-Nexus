import React from 'react';
import { CustomButton } from './UI'; 

const Sidebar = ({
  activeMenu,
  setActiveMenu,
  onSignOut
}) => {
  const navItems = [
    { icon: '⌂', label: 'Dashboard', key: 'dashboard' },
    { icon: '≡', label: 'To Do', key: 'todo' },
    { icon: '🗓️', label: 'Calendar', key: 'calendar' },
    { icon: '📂', label: 'My Projects', key: 'projects' },
  ];
  
  const utilityItems = [
    { icon: '📝', label: 'My Notes', key: 'notes' },
    { icon: '📊', label: 'Stats', key: 'stats' },
    { icon: '🌙', label: 'Dark Mode', key: 'dark' },
    { icon: '🤝', label: 'Collaboration', key: 'collab' },
    { icon: '⚙️', label: 'Settings', key: 'settings' },
    { icon: '❓', label: 'Help Center', key: 'help' },
    { icon: '📞', label: 'Contact Us', key: 'contact' },
  ];

  const MenuItem = ({ icon, label, isActive, onClick }) => (
    <div
      onClick={onClick}
      className={
        `flex items-center p-3 my-1 rounded-xl cursor-pointer transition-all duration-300
        ${isActive ? 'bg-red-600 text-white font-semibold shadow-lg shadow-red-500/50' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
      }
    >
      <span className="text-xl mr-3">{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="w-64 p-4 flex flex-col h-full bg-white/5 backdrop-blur-md border-r border-white/10 shadow-2xl z-10 flex-shrink-0">
      <h1 className="text-3xl font-extrabold text-white mb-6 flex-shrink-0">Nexus AI</h1>
      <div className="mb-6 relative flex-shrink-0">
        <input
          type="text"
          placeholder="Search"
          className="w-full p-2.5 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
      </div>
      
      {/* CHANGED: Use 'no-scrollbar' instead of 'custom-scrollbar' */}
      <nav className="flex-grow overflow-y-auto no-scrollbar pr-2"> 
        <div className="mb-4">
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
        {utilityItems.map((item) => (
          <MenuItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            isActive={activeMenu === item.key}
            onClick={() => setActiveMenu(item.key)}
          />
        ))}
      </nav>
      <div className="pt-4 border-t border-white/10 flex-shrink-0">
        <CustomButton onClick={onSignOut} className="w-full bg-red-600 hover:bg-red-700 shadow-red-500/50">
          Sign Out
        </CustomButton>
      </div>
    </div>
  );
};

export default Sidebar;