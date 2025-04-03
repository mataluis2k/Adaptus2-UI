// src/types/agent.ts
export interface AgentConfig {
  data: string;
  lock: boolean;
  requestId: string;
}

export interface Agent {
  id: string;
  description: string;
  behaviorInstructions: string;
  functionalDirectives: string;
  knowledgeConstraints: string;
  ethicalGuidelines: string;
}

export type AgentMap = Record<string, Omit<Agent, 'id'>>;
  
