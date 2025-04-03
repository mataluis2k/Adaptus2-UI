// src/components/agents/AgentDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useCMSStore } from '../../store/cms';
import { useAgentStore } from '../../store/agent';

export const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    fetchAgent, 
    selectedAgent, 
    deleteAgent,
    saveChanges,
    isDirty
  } = useAgentStore();

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        await fetchAgent(id);
        setLoading(false);
      } catch (err: any) {
        console.error(`Error fetching agent ${id}:`, err);
        setError(err.message || 'Failed to load agent details');
        setLoading(false);
      }
    };

    loadAgent();
  }, [id, fetchAgent]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      deleteAgent(id);
      await saveChanges();
      navigate('/agents');
    } catch (err: any) {
      console.error(`Error deleting agent ${id}:`, err);
      setError(err.message || 'Failed to delete agent');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !selectedAgent) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Failed to load agent details.'}</span>
        <div className="mt-3">
          <button
            onClick={() => navigate('/agents')}
            className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/agents')}
            className={`mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          >
            <ArrowLeft className={`h-5 w-5 ${themeClasses.text}`} />
          </button>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            {selectedAgent.id}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete
          </button>
          <button
            onClick={() => navigate(`/agents/edit/${selectedAgent.id}`)}
            className={`flex items-center px-4 py-2 rounded-md ${themeClasses.accent} text-white hover:opacity-90 transition-opacity`}
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/20 dark:border-yellow-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                You have unsaved changes in other agents. Navigate to the Agents list to save or discard these changes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg shadow overflow-hidden ${themeClasses.primary}`}>
        <div className="p-6 space-y-4">
          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Description</h3>
            <p className={`mt-2 ${themeClasses.text}`}>{selectedAgent.description}</p>
          </div>

          <div className={`h-px ${themeClasses.divider}`}></div>

          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Behavior Instructions</h3>
            <p className={`mt-2 whitespace-pre-line ${themeClasses.text}`}>{selectedAgent.behaviorInstructions}</p>
          </div>

          <div className={`h-px ${themeClasses.divider}`}></div>

          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Functional Directives</h3>
            <p className={`mt-2 whitespace-pre-line ${themeClasses.text}`}>{selectedAgent.functionalDirectives}</p>
          </div>

          <div className={`h-px ${themeClasses.divider}`}></div>

          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Knowledge Constraints</h3>
            <p className={`mt-2 whitespace-pre-line ${themeClasses.text}`}>{selectedAgent.knowledgeConstraints}</p>
          </div>

          <div className={`h-px ${themeClasses.divider}`}></div>

          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Ethical Guidelines</h3>
            <p className={`mt-2 whitespace-pre-line ${themeClasses.text}`}>{selectedAgent.ethicalGuidelines}</p>
          </div>
        </div>
      </div>
    </div>
  );
};