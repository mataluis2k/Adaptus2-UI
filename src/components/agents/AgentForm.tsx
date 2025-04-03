// src/components/agents/AgentForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useCMSStore } from '../../store/cms';
import { useAgentStore } from '../../store/agent';


// Zod schema for form validation
const agentSchema = z.object({
  id: z.string().min(3, 'ID must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'ID can only contain letters, numbers, and underscores'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  behaviorInstructions: z.string().min(5, 'Behavior instructions must be at least 5 characters long'),
  functionalDirectives: z.string().min(5, 'Functional directives must be at least 5 characters long'),
  knowledgeConstraints: z.string().min(5, 'Knowledge constraints must be at least 5 characters long'),
  ethicalGuidelines: z.string().min(5, 'Ethical guidelines must be at least 5 characters long'),
});

type AgentFormData = z.infer<typeof agentSchema>;

export const AgentForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new';
  const navigate = useNavigate();
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Agent store actions and state
  const {
    fetchAgent,
    createAgent,
    updateAgent,
    saveChanges,
    agents,
    fetchAgents,
    isDirty
  } = useAgentStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      id: '',
      description: '',
      behaviorInstructions: '',
      functionalDirectives: '',
      knowledgeConstraints: '',
      ethicalGuidelines: '',
    },
  });

  // Load agents if not already loaded
  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, [agents.length, fetchAgents]);

  // Fetch agent data if in edit mode
  useEffect(() => {
    const loadAgent = async () => {
      if (isEditMode && id) {
        try {
          const agentData = await fetchAgent(id);
          reset(agentData);
        } catch (error: any) {
          console.error(`Failed to load agent ${id}:`, error);
          navigate('/agents', { replace: true });
        }
      }
    };

    loadAgent();
  }, [isEditMode, id, fetchAgent, reset, navigate]);

  const onSubmit = async (data: AgentFormData) => {
    setSaveError(null);
    try {
      if (isEditMode) {
        // Extract id and update agent
        const { id: agentId, ...agentData } = data;
        updateAgent(agentId, agentData);
      } else {
        // Check if ID already exists
        const existingAgent = agents.find(a => a.id === data.id);
        if (existingAgent) {
          setSaveError(`An agent with ID '${data.id}' already exists`);
          return;
        }
        
        // Extract id and create agent
        const { id: agentId, ...agentData } = data;
        createAgent(agentId, agentData);
      }
      
      // Automatically save changes (like API Config)
      await saveChanges();
      navigate('/agents');
    } catch (error: any) {
      console.error('Error saving agent:', error);
      setSaveError(error.message || 'Failed to save agent');
    }
  };

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
            {isEditMode ? 'Edit Agent Profile' : 'Create Agent Profile'}
          </h1>
        </div>
        
        {isDirty && (
          <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium flex items-center gap-2">
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            ID <span className="text-red-500">*</span>
          </label>
          <input
            {...register('id')}
            disabled={isEditMode}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.id ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input} ${isEditMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
          />
          {errors.id && (
            <p className="mt-1 text-sm text-red-500">{errors.id.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description')}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.description ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input}`}
            rows={2}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            Behavior Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('behaviorInstructions')}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.behaviorInstructions ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input}`}
            rows={4}
          />
          {errors.behaviorInstructions && (
            <p className="mt-1 text-sm text-red-500">{errors.behaviorInstructions.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            Functional Directives <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('functionalDirectives')}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.functionalDirectives ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input}`}
            rows={4}
          />
          {errors.functionalDirectives && (
            <p className="mt-1 text-sm text-red-500">{errors.functionalDirectives.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            Knowledge Constraints <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('knowledgeConstraints')}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.knowledgeConstraints ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input}`}
            rows={4}
          />
          {errors.knowledgeConstraints && (
            <p className="mt-1 text-sm text-red-500">{errors.knowledgeConstraints.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
            Ethical Guidelines <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('ethicalGuidelines')}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.ethicalGuidelines ? 'border-red-500' : themeClasses.border
            } ${themeClasses.input}`}
            rows={4}
          />
          {errors.ethicalGuidelines && (
            <p className="mt-1 text-sm text-red-500">{errors.ethicalGuidelines.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/agents')}
            className={`px-4 py-2 border ${themeClasses.border} rounded-md shadow-sm ${themeClasses.text} ${themeClasses.hover}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center px-4 py-2 rounded-md ${themeClasses.accent} text-white hover:opacity-90 transition-opacity ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Save className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};