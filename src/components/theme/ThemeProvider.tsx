import React from 'react';
import { useCMSStore } from '../../store/cms';
import themeConfig from '../../config/themes.json';

// Type definitions for theme configuration
export interface ThemeColors {
  primary: string;
  secondary: string;
  text: string;
  secondaryText: string;
  accent: string;
  hover: string;
  border: string;
  modalOverlay: string;
  modalBackground: string;
  shadow: string;
}

interface ThemeConfig {
  name: string;
  colors: ThemeColors;
}

interface ThemeDefinitions {
  themes: {
    [key: string]: ThemeConfig;
  };
}

// Ensure type safety for the imported JSON
const themes = themeConfig as ThemeDefinitions;

export type ThemeName = keyof typeof themeConfig.themes;

export const getThemeClasses = (themeName: ThemeName): ThemeColors => {
  const themeColors = themes.themes[themeName]?.colors;
  if (!themeColors) {
    console.warn(`Theme "${themeName}" not found, falling back to light theme`);
    return themes.themes.light.colors;
  }
  return themeColors;
};

export const getAvailableThemes = () => {
  return Object.entries(themes.themes).map(([id, theme]) => ({
    id: id as ThemeName,
    name: theme.name,
  }));
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useCMSStore((state) => state.theme);
  const setTheme = useCMSStore((state) => state.setTheme);
  const themeClasses = getThemeClasses(theme);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeName | null;
    if (storedTheme && themes.themes[storedTheme]) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  React.useEffect(() => {
    console.log("Applying theme:", theme);
    
    document.documentElement.className = "";
    document.documentElement.classList.add(theme);
    
    document.body.className = `${themeClasses.secondary} ${themeClasses.text}`;
    
    localStorage.setItem('theme', theme);
  }, [theme, themeClasses]);

  return (
    <div className={`min-h-screen ${themeClasses.secondary} ${themeClasses.text}`}>
      {children}
    </div>
  );
};
