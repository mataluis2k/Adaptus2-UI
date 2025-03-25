import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { LayoutDashboard, Settings, Server } from 'lucide-react';

export const Sidebar = () => {
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const location = useLocation();

  if (!config) return null;

  const tables = Object.entries(config.cms.tables);

  return (
    <div className={`w-64 flex-shrink-0 ${themeClasses.primary} border-r ${themeClasses.border}`}>
      <div className={`h-16 flex items-center px-6 border-b ${themeClasses.border}`}>
        <h1 className={`text-xl font-bold ${themeClasses.text}`}>
          {config.cms.name}
        </h1>
      </div>
      <nav className="p-4">
        <div className="space-y-1">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>

          <div className="py-2">
            <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Content
            </h2>
          </div>
          
          {tables.map(([id, table]) => (
            <Link
              key={id}
              to={`/tables/${id}`}
              className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                location.pathname === `/tables/${id}`
                  ? `${themeClasses.accent} text-white`
                  : `${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              {table.title}
            </Link>
          ))}
          
          <div className="py-2 mt-4">
            <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administration
            </h2>
          </div>
          
          <Link
            to="/api-configurator"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname.startsWith('/api-configurator')
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <Server className="h-5 w-5 mr-3" />
            API Configurator
          </Link>
          
          <Link
            to="/settings"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/settings'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
};