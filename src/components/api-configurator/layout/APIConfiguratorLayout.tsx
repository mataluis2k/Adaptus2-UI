import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useCMSStore } from '../../../store/cms';
import { getThemeClasses } from '../../theme/ThemeProvider';
import { Database, Server, ArrowLeft } from 'lucide-react';

export const APIConfiguratorLayout = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  return (
    <div className="h-full flex flex-col">
      <header className={`${themeClasses.primary} shadow-md`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Link to="/tables" className="flex items-center text-gray-500 hover:text-gray-700 mr-4">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Back</span>
            </Link>
            <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
              API Configuration Editor
            </h1>
          </div>
          <div className="flex items-center">
            <Server className={`h-6 w-6 mr-2 ${themeClasses.accent}`} />
            <Database className={`h-6 w-6 ${themeClasses.accent}`} />
          </div>
        </div>
      </header>
      <main className={`flex-1 overflow-auto ${themeClasses.secondary} p-6`}>
        <Outlet />
      </main>
    </div>
  );
};