import { api } from './client';
import type { AuthResponse } from '../types/api';
import { useAuthStore } from '../store/auth';

export const login = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/api/login', {
    username: email,
    password,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/api/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Use the logout function from the auth store which will clear localStorage
    useAuthStore.getState().logout();
  }
};
// Add these new social auth methods
export const initiateGoogleLogin = () => {
  window.location.href = '/auth/google';
};

export const initiateFacebookLogin = () => {
  window.location.href = '/auth/facebook';
};