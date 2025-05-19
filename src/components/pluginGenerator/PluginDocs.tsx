import React from 'react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { BookOpen, Code, Webhook, Settings, FileCode, Server } from 'lucide-react';

const PluginDocs = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  return (
    <div className={`mt-8 rounded-lg shadow-md ${themeClasses.primary} p-6`}>
      <h2 className={`text-2xl font-bold mb-6 ${themeClasses.text} flex items-center`}>
        <BookOpen className="mr-2" />
        Plugin Documentation
      </h2>

      <div className="space-y-6">
        <section>
          <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text} flex items-center`}>
            <Code className="mr-2 h-5 w-5" />
            Plugin System Overview
          </h3>
          <p className={`${themeClasses.text} mb-3`}>
            The Adaptus2-Framework plugin system allows you to extend the functionality of your application
            without modifying the core codebase. Plugins are self-contained modules that can be loaded dynamically
            and interact with the application through a well-defined API.
          </p>
        </section>

        <section>
          <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text} flex items-center`}>
            <FileCode className="mr-2 h-5 w-5" />
            Plugin Structure
          </h3>
          <div className={`${themeClasses.secondary} p-4 rounded-md mb-3`}>
            <pre className="font-mono text-sm overflow-x-auto">
{`// Basic plugin structure
module.exports = {
  // Plugin metadata
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  
  // Lifecycle hooks
  initialize: function(api, options) {
    // Called when the plugin is loaded
  },
  
  terminate: function() {
    // Called when the plugin is unloaded
  },
  
  // Plugin-specific methods
  methods: {
    // Custom methods
  }
};`}
            </pre>
          </div>
        </section>

        <section>
          <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text} flex items-center`}>
            <Webhook className="mr-2 h-5 w-5" />
            Event Hooks
          </h3>
          <p className={`${themeClasses.text} mb-3`}>
            Plugins can register event handlers to respond to application events:
          </p>
          <div className={`${themeClasses.secondary} p-4 rounded-md mb-3`}>
            <pre className="font-mono text-sm overflow-x-auto">
{`initialize: function(api, options) {
  // Listen for specific events
  api.events.on('data:save', function(data) {
    // Handle data save event
    console.log('Data saved:', data);
  });
  
  // Register middleware
  api.middleware.register('request', function(req, res, next) {
    // Process request
    next();
  });
}`}
            </pre>
          </div>
        </section>

        <section>
          <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text} flex items-center`}>
            <Settings className="mr-2 h-5 w-5" />
            Plugin Configuration
          </h3>
          <p className={`${themeClasses.text} mb-3`}>
            Plugins receive configuration options when they are loaded:
          </p>
          <div className={`${themeClasses.secondary} p-4 rounded-md mb-3`}>
            <pre className="font-mono text-sm overflow-x-auto">
{`// In your application config:
{
  plugins: {
    'my-plugin': {
      enabled: true,
      options: {
        timeout: 5000,
        retries: 3
      }
    }
  }
}

// In your plugin:
initialize: function(api, options) {
  const timeout = options.timeout || 1000; // Default value
  const retries = options.retries || 1;
  
  // Use configuration values
}`}
            </pre>
          </div>
        </section>

        <section>
          <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text} flex items-center`}>
            <Server className="mr-2 h-5 w-5" />
            Installation & Usage
          </h3>
          <div className={`space-y-2 ${themeClasses.text}`}>
            <p>To install a plugin in your Adaptus2-Framework application:</p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Save the generated plugin code to a file in your project's <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">plugins</code> directory.</li>
              <li>Register the plugin in your application configuration:</li>
            </ol>
            <div className={`${themeClasses.secondary} p-4 rounded-md my-3`}>
              <pre className="font-mono text-sm overflow-x-auto">
{`// config/plugins.js
module.exports = {
  plugins: [
    {
      name: 'my-plugin',
      path: './plugins/my-plugin.js',
      enabled: true,
      options: {
        // Plugin-specific options
      }
    }
  ]
};`}
              </pre>
            </div>
            <p>
              Restart your application, and the plugin system will automatically load and initialize your plugin.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PluginDocs;