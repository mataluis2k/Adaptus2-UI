import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

// Create axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.ADAPTUS2_URL || 'http://localhost:5173',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Error handler hook
export const useApiErrorHandler = () => {
  const navigate = useNavigate();

  return (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message;

      console.error('API Error:', { status, message, error });

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          console.log('Unauthorized, redirecting to login');
          navigate('/login');
          return {
            message: 'Your session has expired. Please log in again.',
            code: 'UNAUTHORIZED',
            status: 401
          };

        case 403:
          // Forbidden
          return {
            message: 'You do not have permission to perform this action.',
            code: 'FORBIDDEN',
            status: 403
          };

        case 404:
          // Not Found
          return {
            message: 'The requested resource was not found.',
            code: 'NOT_FOUND',
            status: 404
          };

        case 500:
          // Server Error
          return {
            message: 'An unexpected error occurred. Please try again later.',
            code: 'SERVER_ERROR',
            status: 500
          };

        default:
          // Generic Error
          return {
            message: message || 'An unexpected error occurred.',
            code: 'UNKNOWN_ERROR',
            status: status || 500
          };
      }
    }

    // Non-Axios errors
    console.error('Non-Axios Error:', error);
    return {
      message: 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      status: 500
    };
  };
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response Error:', error);

    // Handle token expiration
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
