// src/components/dashboard/AgentDashboardCard.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useCMSStore } from '../../store/cms';
import { useAgentStore } from '../../store/agent';

export const AgentDashboardCard = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  
  const { agents, fetchAgents, isLoading, error, isDirty } = useAgentStore();

  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, [agents.length, fetchAgents]);

  return (
    <div className={`rounded-lg shadow-md ${themeClasses.primary} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${themeClasses.accent} bg-opacity-20`}>
              <Users className={`h-6 w-6 ${themeClasses.accent} text-opacity-100`} />
            </div>
            <h3 className={`ml-3 text-lg font-medium ${themeClasses.text}`}>Agent Profiles</h3>
          </div>
          <Link
            to="/agents"
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="mt-4">
          {isLoading && agents.length === 0 ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : error && agents.length === 0 ? (
            <div className="py-4 text-center text-red-500">Failed to load agents</div>
          ) : (
            <>
              {isDirty && (
                <div className="mb-3 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Unsaved changes</span>
                </div>
              )}
            
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {agents.slice(0, 3).map((agent) => (
                  <li key={agent.id} className="py-3">
                    <Link to={`/agents/view/${agent.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-5 px-5 py-2 rounded-md transition-colors">
                      <div className="flex justify-between">
                        <span className={`font-medium ${themeClasses.text}`}>{agent.id}</span>
                      </div>
                      <p className={`mt-1 text-sm truncate ${themeClasses.textMuted}`}>
                        {agent.description}
                      </p>
                    </Link>
                  </li>
                ))}
                {agents.length === 0 && (
                  <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No agents available
                  </li>
                )}
                {agents.length > 3 && (
                  <li className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    + {agents.length - 3} more agent(s)
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};