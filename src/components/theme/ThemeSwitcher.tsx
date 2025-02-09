import React from 'react';
import { Palette } from 'lucide-react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses, getAvailableThemes, ThemeName } from './ThemeProvider';

export const ThemeSwitcher = () => {
  const theme = useCMSStore((state) => state.theme);
  const setTheme = useCMSStore((state) => state.setTheme);
  const themeClasses = getThemeClasses(theme);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const availableThemes = getAvailableThemes();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (themeId: ThemeName) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg ${themeClasses.hover} transition-colors duration-200 ease-in-out`}
        aria-label="Change theme"
        title="Change theme"
      >
        <Palette className={`h-5 w-5 ${themeClasses.text} transition-colors duration-200`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${themeClasses.primary} ring-1 ring-black ring-opacity-5 z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-menu"
        >
          <div className="py-1">
            {availableThemes.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  id === theme 
                    ? `${themeClasses.accent} text-white` 
                    : `${themeClasses.text} ${themeClasses.hover}`
                } transition-colors duration-200`}
                role="menuitem"
              >
                <span className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${themeClasses.accent}`} />
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
