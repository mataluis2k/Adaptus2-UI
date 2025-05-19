import React from 'react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { Server, Database, Layers, Package, HardDrive } from 'lucide-react';

const EnvironmentInfo = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  
  // Sample environment information - in a real app this would come from the API
  const environmentInfo = {
    framework: {
      name: 'Adaptus2-Framework',
      version: '2.5.3',
      nodeVersion: '18.16.0',
      plugins: 7
    },
    api: {
      endpoints: 32,
      middlewares: 12,
      routes: 48
    },
    database: {
      type: 'MongoDB',
      version: '6.0.4',
      collections: 15
    }
  };

  return (
    <div className={`rounded-lg ${themeClasses.secondary} border ${themeClasses.border} p-4 mb-6`}>
      <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text} uppercase tracking-wider`}>
        Runtime Environment
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-3 rounded-lg ${themeClasses.primary} border ${themeClasses.border}`}>
          <div className="flex items-center mb-2">
            <Server className={`w-4 h-4 mr-2 ${themeClasses.accent}`} />
            <span className={`font-medium ${themeClasses.text}`}>Framework</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Version:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.framework.version}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Node:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.framework.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Plugins:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.framework.plugins} active</span>
            </div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${themeClasses.primary} border ${themeClasses.border}`}>
          <div className="flex items-center mb-2">
            <Layers className={`w-4 h-4 mr-2 ${themeClasses.accent}`} />
            <span className={`font-medium ${themeClasses.text}`}>API</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Endpoints:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.api.endpoints}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Middlewares:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.api.middlewares}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Routes:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.api.routes}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${themeClasses.primary} border ${themeClasses.border}`}>
          <div className="flex items-center mb-2">
            <Database className={`w-4 h-4 mr-2 ${themeClasses.accent}`} />
            <span className={`font-medium ${themeClasses.text}`}>Database</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Type:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.database.type}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Version:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.database.version}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${themeClasses.textMuted}`}>Collections:</span>
              <span className={`font-mono ${themeClasses.text}`}>{environmentInfo.database.collections}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-center">
        <span className={`${themeClasses.textMuted}`}>
          Plugins are executed in a Node.js CommonJS environment with full access to the Adaptus2-Framework API
        </span>
      </div>
    </div>
  );
};

export default EnvironmentInfo;