import React from 'react';
import { CustomButton, IconButton } from './UI';

const Header = ({ userName = 'Chief', setActiveMenu }) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-20 flex justify-between items-center p-4 bg-slate-900/60 backdrop-blur-md border-b border-white/10">
      <h2 className="text-3xl font-extrabold text-white">
        Welcome Back {userName}!
      </h2>
      <div className="text-white/70 text-lg mr-8 hidden sm:block">{currentDate}</div>
      <div className="flex items-center space-x-4">
        <CustomButton 
          className="text-sm px-4 py-2"
          onClick={() => setActiveMenu && setActiveMenu('todo')} // Redirects to To-Do Page
        >
          ADD TASK
        </CustomButton>
        <IconButton
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>}
        />
        <div className="h-10 w-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl font-bold text-slate-900 border-2 border-white">
          {userName[0]}
        </div>
      </div>
    </header>
  );
};

export default Header;