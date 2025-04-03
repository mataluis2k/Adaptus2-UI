import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAPIConfigStore, APIConfig } from '../../store/api-config';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses, ThemeName } from '../theme/ThemeProvider';
import { 
  Save, ArrowLeft, Database, Activity, Upload, Code,
  Plus, Trash2, AlertCircle, ChevronDown, ChevronUp,
  Lock, Key, Settings, FileText, Brain
} from 'lucide-react';

interface APIConfigFormProps {
  isNew: boolean;
}

// Define the owner type
interface OwnerConfig {
  column?: string;
  tokenField?: string;
}

type ArrayField = keyof Pick<APIConfig, 'keys' | 'allowRead' | 'allowWrite' | 'acl'>;

const convertToStringArray = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
};

export const APIConfigForm: React.FC<APIConfigFormProps> = ({ isNew }) => {
  const { 
    configurations, 
    fetchConfigurations,
    addConfiguration,
    updateConfiguration,
    getConfigSchema,
    getEmptyTemplate,
    validateConfiguration,
    isLoading
  } = useAPIConfigStore();

  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  
  const navigate = useNavigate();
  const { route: routeParam } = useParams();

  const [formData, setFormData] = useState<Partial<APIConfig>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [routeType, setRouteType] = useState<string>('dynamic');
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    database: true,
    methods: true,
    authorization: true,
    advanced: false,
    ml: true,
  });
  
  // Fetch configuration data if editing
  useEffect(() => {
    // Clear form on mount
    if (isNew) {
      setFormData(getEmptyTemplate('dynamic'));
      setRouteType('dynamic');
      setInitialFetchDone(true);
    } else if (!initialFetchDone) {
      fetchConfigurations().then(() => {
        const configToEdit = configurations.find(
          (config) => config.route === decodeURIComponent(routeParam || '')
        );
        
        if (configToEdit) {
          setFormData(configToEdit);
          setRouteType(configToEdit.routeType);
        } else {
          navigate('/api-configurator');
        }
        setInitialFetchDone(true);
      });
    }
  }, [isNew, routeParam, fetchConfigurations, initialFetchDone, navigate, getEmptyTemplate]);

  const handleRouteTypeChange = (type: string) => {
    setRouteType(type);
    setFormData(prev => ({
      ...getEmptyTemplate(type),
      ...prev,
      routeType: type
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMethodToggle = (method: string) => {
    setFormData(prev => {
      const methods = [...(prev.allowMethods || [])];
      const index = methods.indexOf(method);
      
      if (index === -1) {
        methods.push(method);
      } else {
        methods.splice(index, 1);
      }
      
      return {
        ...prev,
        allowMethods: methods
      };
    });
  };

  const handleArrayInputChange = (field: ArrayField, value: string) => {
    // Store the raw input value to preserve commas during typing
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileTypesChange = (value: string) => {
    const fileTypes = convertToStringArray(value);
    setFormData(prev => ({
      ...prev,
      fileUpload: {
        ...prev.fileUpload,
        allowedFileTypes: fileTypes,
        storagePath: prev.fileUpload?.storagePath || './uploads',
        fieldName: prev.fileUpload?.fieldName || 'file'
      }
    }));
  };

  const prepareFormDataForSubmission = (data: Partial<APIConfig>): Partial<APIConfig> => {
    const processedData = { ...data };
    
    // Convert comma-separated string fields to arrays
    const arrayFields: ArrayField[] = ['keys', 'allowRead', 'allowWrite', 'acl'];
    
    arrayFields.forEach(field => {
      const value = processedData[field];
      processedData[field] = convertToStringArray(value) as any;
    });

    // Handle fileUpload.allowedFileTypes
    if (processedData.fileUpload) {
      const fileTypes = processedData.fileUpload.allowedFileTypes;
      processedData.fileUpload = {
        ...processedData.fileUpload,
        allowedFileTypes: convertToStringArray(fileTypes),
        storagePath: processedData.fileUpload.storagePath || './uploads',
        fieldName: processedData.fileUpload.fieldName || 'file'
      };
    }

    return processedData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process the form data before validation
    const processedFormData = prepareFormDataForSubmission(formData);
    
    // Validate before submission
    const { valid, errors } = validateConfiguration(processedFormData);
    
    if (!valid) {
      setValidationErrors(errors);
      return;
    }
    
    // Only update in-memory state
    if (isNew) {
      addConfiguration(processedFormData);
    } else {
      updateConfiguration(processedFormData);
    }
    
    setTimeout(() => {
      navigate('/api-configurator');
    }, 100);
  };

  const renderMLSection = () => {
    const mlOptions = ['sentiment', 'recommendation', 'anomaly', 'rag'];
    
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('ml')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            ML Models
          </h3>
          {expandedSections.ml ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.ml && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mlOptions.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    const currentModels = formData.mlmodel || [];
                    const newModels = currentModels.includes(model)
                      ? currentModels.filter(m => m !== model)
                      : [...currentModels, model];
                    handleInputChange('mlmodel', newModels);
                  }}
                  className={`p-3 rounded-md flex items-center justify-center ${
                    formData.mlmodel?.includes(model)
                      ? `${themeClasses.accent} text-white`
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  {model.charAt(0).toUpperCase() + model.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBasicSection = () => {
    const schema = getConfigSchema(routeType);
    
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('basic')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            Basic Information
          </h3>
          {expandedSections.basic ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.basic && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                Endpoint Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('dynamic')}
                  className={`flex items-center justify-center p-3 rounded-md ${
                    routeType === 'dynamic' 
                      ? `${themeClasses.accent} text-white` 
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Dynamic
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('database')}
                  className={`flex items-center justify-center p-3 rounded-md ${
                    routeType === 'database' 
                      ? `${themeClasses.accent} text-white` 
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Database
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('fileUpload')}
                  className={`flex items-center justify-center p-3 rounded-md ${
                    routeType === 'fileUpload' 
                      ? `${themeClasses.accent} text-white` 
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('def')}
                  className={`flex items-center justify-center p-3 rounded-md ${
                    routeType === 'def' 
                      ? `${themeClasses.accent} text-white` 
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <Code className="h-5 w-5 mr-2" />
                  Definition
                </button>
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('static')}
                  className={`flex items-center justify-center p-3 rounded-md ${
                    routeType === 'static' 
                      ? `${themeClasses.accent} text-white` 
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Static
                </button>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                API Route Path 
                {schema.required.includes('route') && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text"
                placeholder="/api/your-endpoint"
                className={`w-full p-2 rounded-md ${themeClasses.primary} border ${
                  validationErrors.route ? 'border-red-500' : themeClasses.border
                }`}
                value={formData.route || ''}
                onChange={(e) => handleInputChange('route', e.target.value)}
              />
              {validationErrors.route && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.route}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Path must start with a forward slash (e.g., /api/users)
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDatabaseSection = () => {
    const schema = getConfigSchema(routeType);
    const isDatabaseRequired = schema.required.includes('dbType') || 
                              schema.required.includes('dbConnection') ||
                              schema.required.includes('dbTable');
    
    if (!isDatabaseRequired && !schema.optional.includes('dbType')) {
      return null;
    }
    
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('database')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            Database Configuration
          </h3>
          {expandedSections.database ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.database && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Database Type
                  {schema.required.includes('dbType') && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${
                    validationErrors.dbType ? 'border-red-500' : themeClasses.border
                  }`}
                  value={formData.dbType || ''}
                  onChange={(e) => handleInputChange('dbType', e.target.value)}
                >
                  <option value="">Select Database Type</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
                {validationErrors.dbType && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.dbType}</p>
                )}
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Database Connection
                  {schema.required.includes('dbConnection') && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="text"
                  placeholder="MYSQL_1"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${
                    validationErrors.dbConnection ? 'border-red-500' : themeClasses.border
                  }`}
                  value={formData.dbConnection || ''}
                  onChange={(e) => handleInputChange('dbConnection', e.target.value)}
                />
                {validationErrors.dbConnection && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.dbConnection}</p>
                )}
              </div>
            </div>
            
            {(routeType === 'database' || routeType === 'fileUpload') && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Database Table
                  {schema.required.includes('dbTable') && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="text"
                  placeholder="users"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${
                    validationErrors.dbTable ? 'border-red-500' : themeClasses.border
                  }`}
                  value={formData.dbTable || ''}
                  onChange={(e) => handleInputChange('dbTable', e.target.value)}
                />
                {validationErrors.dbTable && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.dbTable}</p>
                )}
              </div>
            )}
            
            {routeType === 'dynamic' && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  SQL Query
                </label>
                <textarea
                  rows={4}
                  placeholder="SELECT * FROM users WHERE id = {id}"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                  value={formData.sqlQuery || ''}
                  onChange={(e) => handleInputChange('sqlQuery', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use {'{param}'} syntax for dynamic parameters
                </p>
              </div>
            )}
            
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                Table Keys (comma-separated)
              </label>
              <input 
                type="text"
                placeholder="id, uuid"
                className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                value={typeof formData.keys === 'string' ? formData.keys : (formData.keys || []).join(',')}
                onChange={(e) => handleArrayInputChange('keys', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Allowed Read Fields (comma-separated)
                </label>
                <input 
                  type="text"
                  placeholder="id, name, email"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                  value={typeof formData.allowRead === 'string' ? formData.allowRead : (formData.allowRead || []).join(',')}
                  onChange={(e) => handleArrayInputChange('allowRead', e.target.value)}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Allowed Write Fields (comma-separated)
                </label>
                <input 
                  type="text"
                  placeholder="name, email"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                  value={typeof formData.allowWrite === 'string' ? formData.allowWrite : (formData.allowWrite || []).join(',')}
                  onChange={(e) => handleArrayInputChange('allowWrite', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="uuidMapping"
                className="mr-2"
                checked={Boolean(formData.uuidMapping)}
                onChange={(e) => handleInputChange('uuidMapping', e.target.checked)}
              />
              <label 
                htmlFor="uuidMapping" 
                className={`text-sm ${themeClasses.text}`}
              >
                Enable UUID Mapping
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMethodsSection = () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const schema = getConfigSchema(routeType);
    
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('methods')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            HTTP Methods
            {schema.required.includes('allowMethods') && <span className="text-red-500">*</span>}
          </h3>
          {expandedSections.methods ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.methods && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {methods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleMethodToggle(method)}
                  className={`p-3 rounded-md flex items-center justify-center ${
                    formData.allowMethods?.includes(method)
                      ? `${themeClasses.accent} text-white`
                      : `${themeClasses.primary} ${themeClasses.text} border ${themeClasses.border}`
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {validationErrors.allowMethods && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.allowMethods}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAuthorizationSection = () => {
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('authorization')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            Authorization
          </h3>
          {expandedSections.authorization ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.authorization && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                Authentication Type
              </label>
              <select
                className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                value={formData.auth || ''}
                onChange={(e) => handleInputChange('auth', e.target.value)}
              >
                <option value="">No Authentication</option>
                <option value="token">Token Based</option>
                <option value="jwt">JWT</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                Access Control (comma-separated)
              </label>
              <input 
                type="text"
                placeholder="admin, user, publicAccess"
                className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                value={typeof formData.acl === 'string' ? formData.acl : (formData.acl || []).join(',')}
                onChange={(e) => handleArrayInputChange('acl', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdvancedSection = () => {
    return (
      <div className="mb-6">
        <div 
          className={`flex justify-between items-center mb-4 cursor-pointer ${themeClasses.hover} p-2 rounded`}
          onClick={() => toggleSection('advanced')}
        >
          <h3 className={`text-lg font-medium ${themeClasses.text}`}>
            Advanced Settings
          </h3>
          {expandedSections.advanced ? 
            <ChevronUp className={`h-5 w-5 ${themeClasses.text}`} /> : 
            <ChevronDown className={`h-5 w-5 ${themeClasses.text}`} />
          }
        </div>
        
        {expandedSections.advanced && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                Cache Duration (seconds)
              </label>
              <input 
                type="number"
                placeholder="0"
                className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                value={formData.cache || 0}
                onChange={(e) => handleInputChange('cache', parseInt(e.target.value))}
              />
            </div>
            
            {routeType === 'fileUpload' && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Allowed File Types (comma-separated)
                </label>
                <input 
                  type="text"
                  placeholder="image/jpeg, image/png, application/pdf"
                  className={`w-full p-2 rounded-md ${themeClasses.primary} border ${themeClasses.border}`}
                  value={typeof formData.fileUpload?.allowedFileTypes === 'string' ? formData.fileUpload.allowedFileTypes : (formData.fileUpload?.allowedFileTypes || []).join(',')}
                  onChange={(e) => handleFileTypesChange(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/api-configurator')}
            className={`mr-4 p-2 rounded-full hover:bg-gray-200 ${themeClasses.text}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            {isNew ? 'Create New Endpoint' : 'Edit Endpoint'}
          </h2>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 ${themeClasses.accent} text-white rounded-md flex items-center`}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {renderBasicSection()}
      {renderDatabaseSection()}
      {renderMethodsSection()}
      {renderMLSection()}
      {renderAuthorizationSection()}
      {renderAdvancedSection()}
    </form>
  );
};
