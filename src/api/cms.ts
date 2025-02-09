import { api } from './client';
import type { CMSConfig } from '../types/cms';

export const fetchConfig = async () => {
  const response = await api.get<CMSConfig>('/api/xy/cmsConfig.json');
  return response.data;
};