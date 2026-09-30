import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-7 w-14 items-center rounded-full
        transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
        ${isDark ? 'bg-black/50 border border-border' : 'bg-warm border border-border'}
      `}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Sun icon for light mode (left side) */}
      <span className={`absolute left-1.5 flex items-center justify-center transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <Sun className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.5} />
      </span>

      {/* Moon icon for dark mode (right side) */}
      <span className={`absolute right-1.5 flex items-center justify-center transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <Moon className="h-3.5 w-3.5 text-orange-400" strokeWidth={2.5} />
      </span>

      {/* Thumb */}
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out
          ${isDark ? 'translate-x-8' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
