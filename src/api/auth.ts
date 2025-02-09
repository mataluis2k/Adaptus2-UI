import { api } from './client';
import type { AuthResponse } from '../types/cms';

export const login = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/api/login', {
    username: email,
    password,
  });
  return response.data;
};