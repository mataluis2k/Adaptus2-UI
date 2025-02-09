import { create } from 'zustand';
import { ThemeName } from '../components/theme/ThemeProvider';
import { CMSConfig, CMSStore } from '../types/cms';
import themeConfig from '../config/themes.json';

const getInitialTheme = (): ThemeName => {
  console.log('Getting initial theme');
  const savedTheme = localStorage.getItem('theme') as ThemeName;
  if (savedTheme && Object.keys(themeConfig.themes).includes(savedTheme)) {
    console.log('Using saved theme:', savedTheme);
    return savedTheme;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const defaultTheme = prefersDark ? 'dark' : 'light';
  console.log('Using default theme:', defaultTheme);
  return defaultTheme as ThemeName;
};

export const useCMSStore = create<CMSStore>((set, get) => ({
  config: null,
  theme: getInitialTheme(),
  initialized: false,
  setConfig: (config: CMSConfig) => {
    console.log('Setting CMS config:', config);
    set({ config });
  },
  setTheme: (theme: ThemeName) => {
    console.log('Setting theme:', theme);
    if (!Object.keys(themeConfig.themes).includes(theme)) {
      console.warn('Invalid theme:', theme);
      return;
    }
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  setInitialized: (initialized: boolean) => {
    console.log('Setting initialized:', initialized);
    set({ initialized });
  }
}));

// Initialize theme system
const initializeTheme = () => {
  console.log('Initializing theme system');
  const theme = useCMSStore.getState().theme;
  document.documentElement.classList.remove(...Object.keys(themeConfig.themes));
  document.documentElement.classList.add(theme);
};

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        console.log('System theme changed:', e.matches ? 'dark' : 'light');
        useCMSStore.getState().setTheme(e.matches ? 'dark' : 'light');
      }
    });
}

// Initialize theme on load
initializeTheme();
