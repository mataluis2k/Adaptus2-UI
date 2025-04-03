import { api } from './client';
import type { Rule, Capability, ValidationResult } from '../types/rules';

// Fetch the current rules
export const fetchRules = async (): Promise<Rule> => {
  const response = await api.get<Rule>('/ui/getConfig/businessRules.dsl');
  return response.data;
};

// Fetch available capabilities (actions)
export const fetchCapabilities = async (): Promise<Capability> => {
  const response = await api.get<Capability>('/ui/capabilities');
  return response.data;
};

// Save rules
export const saveRules = async (dsl: string): Promise<Rule> => {
  const response = await api.post<Rule>('/ui/saveConfig', { fileName : 'businessRules.dsl', content : dsl });
  return response.data;
};

// Validate DSL syntax
export const validateDsl = async (dsl: string): Promise<ValidationResult> => {
  const response = await api.post<ValidationResult>('/ui/rules/validate', { dsl });
  return response.data;
};
