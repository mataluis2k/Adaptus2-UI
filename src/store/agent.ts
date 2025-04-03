// src/store/agentStore.ts
import { create } from 'zustand';
import { fetchAgentConfig, fetchAgents, fetchAgent, saveAgentConfig } from '../api/agent';
import { Agent, AgentMap } from '../types/agent';

interface AgentStore {
  agents: Agent[];
  agentConfig: AgentMap;
  originalAgentConfig: AgentMap;
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  
  // Fetch operations
  fetchAgents: () => Promise<void>;
  fetchAgent: (id: string) => Promise<Agent>;
  
  // CRUD operations (in-memory)
  setSelectedAgent: (agent: Agent | null) => void;
  createAgent: (id: string, agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, agent: Omit<Agent, 'id'>) => void;
  deleteAgent: (id: string) => void;
  
  // File operations
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  agentConfig: {},
  originalAgentConfig: {},
  selectedAgent: null,
  isLoading: false,
  error: null,
  isDirty: false,

  // Fetch the agent configuration and update both the config and agents array
  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agentConfig = await fetchAgentConfig();
      const agents = Object.entries(agentConfig).map(([id, agent]) => ({
        id,
        ...agent
      }));
      
      set({ 
        agents, 
        agentConfig,
        // Deep copy for comparing changes later
        originalAgentConfig: JSON.parse(JSON.stringify(agentConfig)),
        isLoading: false,
        isDirty: false
      });
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      set({ 
        error: error.message || 'Failed to load agents', 
        isLoading: false 
      });
    }
  },

  // Fetch a single agent
  fetchAgent: async (id: string) => {
    try {
      const agent = await fetchAgent(id);
      set(state => ({
        selectedAgent: agent
      }));
      return agent;
    } catch (error: any) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  },

  // Set selected agent
  setSelectedAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  // Create a new agent (in memory only)
  createAgent: (id, agentData) => {
    set(state => {
      // Update the configuration map
      const updatedConfig = {
        ...state.agentConfig,
        [id]: agentData
      };
      
      // Update the agents array
      const updatedAgents = [
        ...state.agents,
        { id, ...agentData }
      ];
      
      return {
        agentConfig: updatedConfig,
        agents: updatedAgents,
        isDirty: true
      };
    });
  },

  // Update an agent (in memory only)
  updateAgent: (id, agentData) => {
    set(state => {
      // Update the configuration map
      const updatedConfig = {
        ...state.agentConfig,
        [id]: agentData
      };
      
      // Update the agents array
      const updatedAgents = state.agents.map(a => 
        a.id === id ? { id, ...agentData } : a
      );
      
      return {
        agentConfig: updatedConfig,
        agents: updatedAgents,
        isDirty: true
      };
    });
  },

  // Delete an agent (in memory only)
  deleteAgent: (id) => {
    set(state => {
      // Create a new config object without the deleted agent
      const { [id]: removed, ...remainingConfig } = state.agentConfig;
      
      // Update the agents array
      const updatedAgents = state.agents.filter(a => a.id !== id);
      
      return {
        agentConfig: remainingConfig,
        agents: updatedAgents,
        isDirty: true
      };
    });
  },

  // Save all changes back to the server
  saveChanges: async () => {
    set({ isLoading: true, error: null });
    try {
      await saveAgentConfig(get().agentConfig);
      
      set(state => ({ 
        originalAgentConfig: JSON.parse(JSON.stringify(state.agentConfig)),
        isLoading: false,
        isDirty: false
      }));
    } catch (error: any) {
      console.error('Error saving agent configuration:', error);
      set({ 
        error: error.message || 'Failed to save agent configuration', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Discard all changes
  discardChanges: () => {
    set(state => {
      const originalConfig = state.originalAgentConfig;
      const originalAgents = Object.entries(originalConfig).map(([id, agent]) => ({
        id,
        ...agent
      }));
      
      return {
        agentConfig: JSON.parse(JSON.stringify(originalConfig)),
        agents: originalAgents,
        isDirty: false
      };
    });
  }
}));