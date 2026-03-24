import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{ scale: theme === 'dark' ? 0 : 1, opacity: theme === 'dark' ? 0 : 1, rotate: theme === 'dark' ? 90 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute"
        >
          <Sun className="w-5 h-5" />
        </motion.div>

        <motion.div
          initial={false}
          animate={{ scale: theme === 'light' ? 0 : 1, opacity: theme === 'light' ? 0 : 1, rotate: theme === 'light' ? -90 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute"
        >
          <Moon className="w-5 h-5" />
        </motion.div>
      </div>
    </button>
  );
};

export default ThemeToggle;
