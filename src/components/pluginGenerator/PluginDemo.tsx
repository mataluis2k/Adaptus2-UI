import React, { useState } from 'react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { Check, X, PlayCircle, PauseCircle } from 'lucide-react';

// This component demonstrates how a plugin would be loaded and used in the Adaptus2-Framework
const PluginDemo = ({ pluginCode }) => {
  const [isPluginActive, setIsPluginActive] = useState(false);
  const [demoLogs, setDemoLogs] = useState([]);
  const [demoError, setDemoError] = useState(null);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  // Function to "run" the plugin in a demo environment
  const togglePluginDemo = () => {
    if (isPluginActive) {
      // Stop the demo
      setIsPluginActive(false);
      addDemoLog('Plugin stopped', 'info');
      return;
    }
    
    // Start the demo
    setDemoError(null);
    setDemoLogs([]);
    
    try {
      // Simple sandbox environment to demonstrate plugin loading
      // Note: This doesn't actually execute the code - it's just a simulation
      addDemoLog('Loading plugin...', 'info');
      
      // Perform basic validation checks on the plugin code
      if (!pluginCode || pluginCode.trim() === '') {
        throw new Error('No plugin code provided');
      }
      
      if (!pluginCode.includes('module.exports') && !pluginCode.includes('exports.')) {
        throw new Error('Plugin must export functionality via module.exports');
      }
      
      // Simulate successful loading
      setTimeout(() => {
        addDemoLog('Plugin loaded successfully', 'success');
        addDemoLog('Plugin initialized', 'info');
        addDemoLog('Plugin listening for events', 'info');
        setIsPluginActive(true);
      }, 500);
      
    } catch (error) {
      setDemoError(error.message);
      addDemoLog(`Plugin load failed: ${error.message}`, 'error');
    }
  };
  
  // Add a log message to the demo console
  const addDemoLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDemoLogs(prev => [...prev, { message, type, timestamp }]);
  };

  return (
    <div className={`mt-8 rounded-lg border ${themeClasses.border} overflow-hidden`}>
      <div className={`p-4 ${themeClasses.primary} border-b ${themeClasses.border} flex justify-between items-center`}>
        <h3 className={`font-medium ${themeClasses.text}`}>Plugin Demo Environment</h3>
        <button
          onClick={togglePluginDemo}
          className={`flex items-center px-3 py-1 rounded ${
            isPluginActive 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          {isPluginActive ? (
            <>
              <PauseCircle className="w-4 h-4 mr-1" />
              Stop Plugin
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-1" />
              Run Plugin
            </>
          )}
        </button>
      </div>
      
      <div className={`p-4 ${themeClasses.secondary} min-h-48 max-h-96 overflow-auto`}>
        <div className="font-mono text-sm">
          {demoLogs.length === 0 && !demoError ? (
            <div className={`italic ${themeClasses.textMuted} text-center py-8`}>
              Click "Run Plugin" to test plugin functionality
            </div>
          ) : (
            <>
              {demoError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded mb-3">
                  {demoError}
                </div>
              )}
              
              {demoLogs.map((log, index) => (
                <div key={index} className="mb-1 flex">
                  <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                  {log.type === 'success' && <Check className="w-4 h-4 text-green-500 mr-1 mt-0.5" />}
                  {log.type === 'error' && <X className="w-4 h-4 text-red-500 mr-1 mt-0.5" />}
                  <span 
                    className={
                      log.type === 'error' 
                        ? 'text-red-500' 
                        : log.type === 'success' 
                          ? 'text-green-500' 
                          : themeClasses.text
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              
              {isPluginActive && (
                <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="mb-1 flex">
                    <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span className={themeClasses.text}>Plugin running...</span>
                  </div>
                  <div className="ml-5 pl-2 border-l-2 border-green-500">
                    <div className="text-gray-600 dark:text-gray-400">• Listening for events</div>
                    <div className="text-gray-600 dark:text-gray-400">• Monitoring application state</div>
                    <div className="text-gray-600 dark:text-gray-400">• Ready to process requests</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginDemo;