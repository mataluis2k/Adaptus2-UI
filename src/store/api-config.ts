import { create } from 'zustand';
import axios from 'axios';
import { useCMSStore } from './cms';
import { api } from '../api/client';
import type { CMSConfig } from '../types/cms';

// Define the API configuration interface
export interface APIConfig {
  route: string;
  routeType: string;
  allowMethods?: string[];
  dbType?: string;
  dbConnection?: string;
  dbTable?: string;
  cache?: number;
  sqlQuery?: string;
  keys?: string[];
  uuidMapping?: Record<string, string>;
  allowRead?: string[];
  allowWrite?: string[];
  auth?: string;
  acl?: string[];
  validation?: Record<string, any>;
  errorCodes?: Record<string, any>;
  response?: Record<string, any>;
  owner?: string;
  fileUpload?: {
    allowedFileTypes: string[];
    storagePath: string;
    fieldName: string;
  };
  columnDefinitions?: Record<string, any>;
  mlmodel?: string[];
}

export interface APIConfigStore {
  configurations: APIConfig[];
  originalConfigurations: APIConfig[];
  isLoading: boolean;
  error: string | null;
  selectedConfig: APIConfig | null;
  isDirty: boolean;
  fetchConfigurations: () => Promise<void>;
  setSelectedConfig: (config: APIConfig | null) => void;
  addConfiguration: (newConfig: Partial<APIConfig>) => void;
  updateConfiguration: (updatedConfig: Partial<APIConfig>) => void;
  removeConfiguration: (route: string) => void;
  saveAllConfigurations: () => Promise<boolean>;
  discardChanges: () => void;
  getConfigSchema: (routeType: string) => { required: string[], optional: string[] };
  getEmptyTemplate: (routeType: string) => Partial<APIConfig>;
  validateConfiguration: (config: Partial<APIConfig>) => { valid: boolean, errors: Record<string, string> };
}

export const useAPIConfigStore = create<APIConfigStore>((set, get) => ({
  configurations: [],
  originalConfigurations: [], // Store original data to detect changes
  isLoading: false,
  error: null,
  selectedConfig: null,
  isDirty: false, // Track if there are unsaved changes
  
  // Fetch all API configurations
  fetchConfigurations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<APIConfig[]>('/api/xy/apiConfig.json');
      const configurations = Array.isArray(response.data) ? response.data : [];
      
      set({ 
        configurations, 
        originalConfigurations: JSON.parse(JSON.stringify(configurations)), // Deep copy
        isLoading: false,
        isDirty: false
      });
    } catch (error: any) {
      console.error('Error fetching API configurations:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to load API configurations', 
        isLoading: false 
      });
    }
  },
  
  // Set selected configuration for editing
  setSelectedConfig: (config) => {
    set({ selectedConfig: config });
  },
  
  // Add new configuration (in memory only)
  addConfiguration: (newConfig) => {
    if (!newConfig.route) {
      console.error('Cannot add configuration without a route');
      return;
    }
    
    set(state => ({ 
      configurations: [...state.configurations, newConfig as APIConfig],
      isDirty: true
    }));
  },
  
  // Update existing configuration (in memory only)
  updateConfiguration: (updatedConfig) => {
    if (!updatedConfig.route) {
      console.error('Cannot update configuration without a route');
      return;
    }
    
    set(state => ({
      configurations: state.configurations.map(config => 
        config.route === updatedConfig.route ? {...config, ...updatedConfig} : config
      ),
      isDirty: true
    }));
  },
  
  // Remove configuration (in memory only)
  removeConfiguration: (route) => {
    set(state => ({
      configurations: state.configurations.filter(config => config.route !== route),
      isDirty: true
    }));
  },
  
  // Save all changes back to the server
  saveAllConfigurations: async () => {
    set({ isLoading: true, error: null });
    try {
      // Send the entire array to be saved
      await axios.put('/api/xy/cmsConfig.json', get().configurations);
      
      // Update original after save to reset dirty state
      set(state => ({ 
        originalConfigurations: JSON.parse(JSON.stringify(state.configurations)),
        isLoading: false,
        isDirty: false
      }));
      
      return true;
    } catch (error: any) {
      console.error('Error saving API configurations:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to save API configurations', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Discard all changes
  discardChanges: () => {
    set(state => ({
      configurations: JSON.parse(JSON.stringify(state.originalConfigurations)),
      isDirty: false
    }));
  },

  // Get configuration schema based on routeType
  getConfigSchema: (routeType: string) => {
    const schemas: Record<string, { required: string[], optional: string[] }> = {
      dynamic: {
        required: ['routeType', 'route', 'allowMethods'],
        optional: ['dbType', 'dbConnection', 'cache', 'sqlQuery', 'keys', 'uuidMapping', 
                  'allowRead', 'allowWrite', 'auth', 'acl', 'validation', 'errorCodes', 
                  'response', 'dbTable', 'owner']
      },
      database: {
        required: ['routeType', 'dbType', 'dbConnection', 'dbTable', 'route', 'allowMethods'],
        optional: ['keys', 'uuidMapping', 'cache', 'allowRead', 'allowWrite', 
                  'columnDefinitions', 'owner', 'validation', 'errorCodes', 'auth', 'acl']
      },
      fileUpload: {
        required: ['routeType', 'dbType', 'dbConnection', 'dbTable', 'route', 'allowMethods', 'fileUpload'],
        optional: ['allowRead', 'allowWrite', 'keys', 'auth', 'acl', 'columnDefinitions']
      },
      def: {
        required: ['routeType', 'dbType', 'dbConnection', 'route', 'allowMethods'],
        optional: ['dbTable', 'allowRead', 'allowWrite', 'keys', 'columnDefinitions', 
                  'cache', 'validation', 'errorCodes']
      }
    };

    return schemas[routeType] || { required: [], optional: [] };
  },

  // Get empty template based on routeType
  getEmptyTemplate: (routeType: string) => {
    const templates: Record<string, Partial<APIConfig>> = {
      dynamic: {
        routeType: 'dynamic',
        route: '',
        allowMethods: ['GET'],
        dbType: 'mysql',
        dbConnection: 'MYSQL_1',
        cache: 0,
        auth: 'token',
        acl: ['publicAccess']
      },
      database: {
        routeType: 'database',
        dbType: 'mysql',
        dbConnection: 'MYSQL_1',
        dbTable: '',
        route: '',
        allowMethods: ['GET'],
        keys: [],
        allowRead: [],
        allowWrite: [],
        auth: 'token',
        acl: ['publicAccess']
      },
      fileUpload: {
        routeType: 'fileUpload',
        dbType: 'mysql',
        dbConnection: 'MYSQL_1',
        dbTable: 'uploads',
        route: '',
        allowMethods: ['POST'],
        keys: ['id'],
        allowRead: ['id', 'filename', 'filepath', 'filetype', 'uploaded_by', 'uploaded_at'],
        allowWrite: ['filename', 'filepath', 'filetype', 'uploaded_by'],
        auth: 'token',
        acl: ['publicAccess'],
        fileUpload: {
          allowedFileTypes: ['image/png', 'image/jpeg'],
          storagePath: './uploads',
          fieldName: 'file'
        }
      },
      def: {
        routeType: 'def',
        dbType: 'mysql',
        dbConnection: 'MYSQL_1',
        route: '',
        allowMethods: ['GET'],
        cache: 0
      },
      static: {
        routeType: 'static',
        route: '',
        allowMethods: ['GET'],
        cache: 0,
        auth: 'token',
        acl: ['publicAccess']
      }
    };

    return templates[routeType] || {};
  },

  // Validate configuration based on routeType
  validateConfiguration: (config: Partial<APIConfig>) => {
    if (!config.routeType) {
      return { valid: false, errors: { routeType: 'Route type is required' } };
    }

    const schema = get().getConfigSchema(config.routeType);
    const errors: Record<string, string> = {};

    // Check required fields
    schema.required.forEach(field => {
      if (field === 'fileUpload' && config.routeType === 'fileUpload') {
        const fileUpload = config.fileUpload as { allowedFileTypes?: string[], storagePath?: string, fieldName?: string } | undefined;
        if (!fileUpload || !fileUpload.allowedFileTypes || 
            !fileUpload.storagePath || !fileUpload.fieldName) {
          errors.fileUpload = 'File upload configuration is required';
        }
      } else if (!config[field as keyof APIConfig]) {
        errors[field] = `${field} is required`;
      }
    });

    // Validate route format
    if (config.route && !config.route.startsWith('/')) {
      errors.route = 'Route must start with /';
    }

    // Check for duplicate routes
    if (config.route) {
      const isDuplicate = get().configurations.some(c => 
        c.route === config.route && c !== config
      );
      
      if (isDuplicate) {
        errors.route = 'This route already exists';
      }
    }

    // Validate allowMethods
    if (config.allowMethods && config.allowMethods.length === 0) {
      errors.allowMethods = 'At least one HTTP method must be selected';
    }

    return { 
      valid: Object.keys(errors).length === 0,
      errors 
    };
  }
}));
