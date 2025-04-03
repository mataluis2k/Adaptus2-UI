// src/components/agents/AgentsList.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ArrowUpDown, Save, RefreshCcw, Eye } from 'lucide-react';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useCMSStore } from '../../store/cms';
import { useAgentStore } from '../../store/agent';
import { Agent } from '../../types/agent';

export const AgentsList = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const navigate = useNavigate();
  
  const {
    agents,
    fetchAgents,
    deleteAgent,
    saveChanges,
    discardChanges,
    isLoading,
    error,
    isDirty
  } = useAgentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Agent>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(id);
    }
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveChanges();
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(agent => 
    agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const handleSort = (field: keyof Agent) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && agents.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Failed to load agents.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Agent Profiles</h1>
        <div className="flex space-x-2">
          {isDirty && (
            <>
              <button
                onClick={discardChanges}
                className={`flex items-center px-4 py-2 rounded-md border ${themeClasses.border} ${themeClasses.text} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                disabled={isSaving}
              >
                <RefreshCcw className="h-5 w-5 mr-2" />
                Discard
              </button>
              <button
                onClick={handleSaveChanges}
                className={`flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSaving}
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/agents/new')}
            className={`flex items-center px-4 py-2 rounded-md ${themeClasses.accent} text-white hover:opacity-90 transition-opacity`}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Agent
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {saveError}</span>
        </div>
      )}

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
                You have unsaved changes. Click "Save Changes" to persist your changes or "Discard" to revert.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className={`pl-10 py-2 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md ${themeClasses.input}`}
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className={`min-w-full divide-y ${themeClasses.divider}`}>
          <thead className={`${themeClasses.primary}`}>
            <tr>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${themeClasses.text}`}
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center">
                  ID
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${themeClasses.text}`}
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${themeClasses.text}`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${themeClasses.secondary} divide-y ${themeClasses.divider}`}>
            {sortedAgents.length > 0 ? (
              sortedAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                    {agent.id}
                  </td>
                  <td className={`px-6 py-4 text-sm ${themeClasses.text}`}>
                    {agent.description.length > 100 
                      ? `${agent.description.substring(0, 100)}...` 
                      : agent.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/agents/view/${agent.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/agents/edit/${agent.id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-center ${themeClasses.text}`}
                >
                  {searchQuery ? 'No matching agents found.' : 'No agents found. Create your first agent.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};