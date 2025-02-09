export interface BaseRecord {
  id: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
