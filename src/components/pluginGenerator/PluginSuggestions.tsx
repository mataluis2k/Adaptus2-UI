import React, { useState, useEffect } from 'react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { Lightbulb, Zap } from 'lucide-react';

const PluginSuggestions = ({ promptText, onSuggestionSelect }) => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Triggers suggestions based on prompt text
  useEffect(() => {
    if (!promptText || promptText.length < 5) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate suggestion generation based on prompt text
    // In a real app, this would be an API call to a suggestion service
    const generateSuggestions = () => {
      const suggestionsMap = {
        'log': [
          { type: 'hook', name: 'request:start', description: 'Triggered when a request begins' },
          { type: 'method', name: 'api.logger.write()', description: 'Write to the application log' },
          { type: 'event', name: 'log:write', description: 'Listen for log write events' }
        ],
        'auth': [
          { type: 'hook', name: 'auth:login', description: 'Triggered on user login' },
          { type: 'hook', name: 'auth:logout', description: 'Triggered on user logout' },
          { type: 'method', name: 'api.auth.verify()', description: 'Verify user authentication' }
        ],
        'data': [
          { type: 'hook', name: 'data:before-save', description: 'Triggered before data is saved' },
          { type: 'hook', name: 'data:after-save', description: 'Triggered after data is saved' },
          { type: 'method', name: 'api.data.validate()', description: 'Validate data before save' }
        ],
        'cache': [
          { type: 'method', name: 'api.cache.set()', description: 'Store data in cache' },
          { type: 'method', name: 'api.cache.get()', description: 'Retrieve data from cache' },
          { type: 'hook', name: 'cache:invalidate', description: 'Triggered when cache is invalidated' }
        ],
        'user': [
          { type: 'hook', name: 'user:create', description: 'Triggered when a user is created' },
          { type: 'hook', name: 'user:update', description: 'Triggered when a user is updated' },
          { type: 'method', name: 'api.users.getById()', description: 'Get user by ID' }
        ]
      };
      
      // Find relevant suggestions based on prompt keywords
      const relevant = Object.keys(suggestionsMap).filter(key => 
        promptText.toLowerCase().includes(key.toLowerCase())
      );
      
      if (relevant.length > 0) {
        // Collect all suggestions from matching keywords
        const allSuggestions = relevant.flatMap(key => suggestionsMap[key]);
        
        // Remove duplicates (if any)
        const uniqueSuggestions = Array.from(
          new Map(allSuggestions.map(item => [item.name, item])).values()
        );
        
        // Limit to max 5 suggestions
        return uniqueSuggestions.slice(0, 5);
      }
      
      return [];
    };
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions());
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [promptText]);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`mt-2 rounded-md border ${themeClasses.border} ${themeClasses.secondary} overflow-hidden`}>
      <div className={`px-3 py-2 ${themeClasses.primary} border-b ${themeClasses.border} flex items-center`}>
        <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
        <span className="text-sm font-medium">Plugin API Suggestions</span>
      </div>
      
      <div className="max-h-40 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-center">
            <Zap className="w-4 h-4 animate-pulse mx-auto mb-1" />
            <span className="text-sm text-gray-500">Generating suggestions...</span>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <div className="flex items-center">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    suggestion.type === 'hook' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : suggestion.type === 'method'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  } mr-2`}>
                    {suggestion.type}
                  </span>
                  <span className="font-mono text-sm">{suggestion.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-16">
                  {suggestion.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PluginSuggestions;