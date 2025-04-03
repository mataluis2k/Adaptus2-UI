import { api } from './client';
import { Agent, AgentMap , AgentConfig} from '../types/agent';

// Fetch the entire agent file
export const fetchAgentConfig = async (): Promise<AgentMap> => {
  const response = await api.get<AgentConfig>('/ui/getConfig/personas.json');
  console.log('Agent config response:', response.data);
  const agents = response.data.data;

  // Just return the parsed data so fetchAgents() works as-is
  return agents as AgentMap;
};
// Get all agents as an array
export const fetchAgents = async (): Promise<Agent[]> => {
  const agentMap = await fetchAgentConfig();
  
  // Convert from map to array with IDs
  return Object.entries(agentMap).map(([id, agent]) => ({
    id,
    ...agent
  }));
};

// Get a single agent by ID
export const fetchAgent = async (id: string): Promise<Agent> => {
  const agentMap = await fetchAgentConfig();
  const agentData = agentMap[id];
  
  if (!agentData) {
    throw new Error(`Agent with ID ${id} not found`);
  }
  
  return {
    id,
    ...agentData
  };
};

// Save the entire agent configuration
export const saveAgentConfig = async (agentMap: AgentMap): Promise<void> => {
  await api.put('/ui/saveConfig', { fileName: 'agents.json', content: JSON.stringify(agentMap, null, 2) });
};