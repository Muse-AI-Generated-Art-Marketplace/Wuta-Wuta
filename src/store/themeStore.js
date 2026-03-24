import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'muse-theme-storage',
    }
  )
);

// Apply theme class to document element outside of React lifecycle for initial paint
const unsubscribe = useThemeStore.subscribe((state) => {
  const root = window.document.documentElement;
  if (state.theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
});

// Initialize on load
if (typeof window !== 'undefined') {
  const root = window.document.documentElement;
  const initialTheme = useThemeStore.getState().theme;
  if (initialTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
