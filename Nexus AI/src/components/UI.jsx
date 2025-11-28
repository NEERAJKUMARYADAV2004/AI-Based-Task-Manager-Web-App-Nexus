import React from 'react';

export const Card = ({
  title,
  children,
  className = '',
  centerTitle = false,
  glass = true
}) => {
  return (
    <div
      className={
        `p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-indigo-500/20 h-full
        ${glass ? 'bg-white/5 backdrop-blur-sm border border-white/10' : 'bg-slate-800'} 
        ${className}`
      }
    >
      {title && (
        <h3
          className={`text-xl font-bold mb-4 text-white ${centerTitle ? 'text-center' : ''}`}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export const CustomButton = ({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false
}) => (
  <button
    onClick={onClick}
    type={type}
    disabled={disabled}
    className={
      `px-5 py-2 rounded-lg font-semibold text-white transition-all duration-300 
      bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/50 
      ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    }
  >
    {children}
  </button>
);

export const IconButton = ({
  icon,
  onClick,
  className = ''
}) => (
  <button
    onClick={onClick}
    className={
      `p-2.5 rounded-full text-indigo-400 hover:text-white transition-colors duration-200
       bg-white/5 backdrop-blur-sm hover:bg-indigo-600/50 ${className}`
    }
  >
    {icon}
  </button>
);