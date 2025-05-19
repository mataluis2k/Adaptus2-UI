import { api } from '../lib/client';

interface GeneratePluginRequest {
  prompt: string;
}

interface GeneratePluginResponse {
  success: boolean;  // Added to match backend response
  code: string;
}

export const generatePlugin = async (data: GeneratePluginRequest): Promise<GeneratePluginResponse> => {
  const response = await api.post('/api/generate-plugin', data);
  return response.data;
};