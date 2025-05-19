import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { LayoutDashboard, Settings, Server, Users, LogOut, Database, Copy, PanelRight, FileCode } from 'lucide-react';
import { logout } from '../../api/auth';

export const Sidebar = () => {
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname.startsWith(path);

  if (!config) return null;

  const tables = Object.entries(config.cms.tables);

  const navigationItems = [
    {
      name: 'SQL Builder',
      href: '/sql-builder',
      icon: Database,
      current: location.pathname === '/sql-builder',
    },
  ];

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
            API Analytics
          </Link>

          <Link
            to="/ecommerce"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/ecommerce'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            E-commerce Analytics
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
              Tools
            </h2>
          </div>
          
          <Link
            to="/sql-builder"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/sql-builder'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileCode className="h-5 w-5 mr-3" />
            SQL Builder
          </Link>

          <Link
            to="/page-cloner"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/page-cloner'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <Copy className="h-5 w-5 mr-3" />
            Page Cloner
          </Link>
          
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
          <Link to="/dsl-editor"   className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/dsl-editor'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
          <Server className="h-5 w-5 mr-3" />
          DSL Editor
          </Link>
          <Link
            to="/sdui"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/sdui'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <Server className="h-5 w-5 mr-3" />
            SDUI Builder
          </Link>
          <Link
            to="/plugin-generator"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/plugin-generator'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <PanelRight className="h-5 w-5 mr-3" />
            Plugin Generator
          </Link>
          {/* <Link
            to="/settings"
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
              location.pathname === '/settings'
                ? `${themeClasses.accent} text-white`
                : `${themeClasses.text} ${themeClasses.hover}`
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link> */}
        </div>
          <div>
            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider ${themeClasses.secondaryText}`}>
              Agent Configuration
            </h3>
            <div className="mt-2 space-y-1">
              <Link
                to="/agents"
                className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                  isActive('/agents')
                    ? `${themeClasses.accent} text-white`
                    : `${themeClasses.text} ${themeClasses.hover}`
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                Agent Profiles
              </Link>
              <Link
                to="/agent-workflows"
                className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                  isActive('/agent-workflows')
                    ? `${themeClasses.accent} text-white`
                    : `${themeClasses.text} ${themeClasses.hover}`
                }`}
              >
                <Server className="h-5 w-5 mr-3" />
                Agent Workflows
              </Link>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-4">
            <button
              onClick={() => logout()}
              className={`flex items-center px-4 py-2 w-full rounded-md transition-colors duration-200 ${themeClasses.text} ${themeClasses.hover}`}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
      </nav>
    </div>
  );
};

export default Sidebar;