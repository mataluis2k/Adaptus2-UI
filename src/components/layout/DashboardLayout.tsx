import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useQuery } from 'react-query';
import { fetchConfig } from '../../api/cms';
import { useCMSStore } from '../../store/cms';
import { Loader } from 'lucide-react';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { getThemeClasses } from '../theme/ThemeProvider';

export const DashboardLayout = () => {
  const setConfig = useCMSStore((state) => state.setConfig);
  const theme = useCMSStore((state) => state.theme);
  const config = useCMSStore((state) => state.config);
  const themeClasses = getThemeClasses(theme);
  
  const { isLoading } = useQuery('cmsConfig', fetchConfig, {
    onSuccess: (data) => setConfig(data),
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.secondary}`}>
        <Loader className={`w-8 h-8 animate-spin ${themeClasses.accent}`} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${themeClasses.secondary}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className={`${themeClasses.primary} shadow-lg z-30`}>
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className={`text-xl font-semibold ${themeClasses.text}`}>
              {config?.cms.name || 'Dashboard'}
            </h1>
            <ThemeSwitcher />
          </div>
        </header>
        <main className={`flex-1 overflow-auto ${themeClasses.secondary}`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
