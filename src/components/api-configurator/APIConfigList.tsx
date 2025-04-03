import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAPIConfigStore, APIConfig } from '../../store/api-config';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses, ThemeName } from '../theme/ThemeProvider';
import { 
  Plus, Search, Trash2, Edit, Database, Activity, 
  Upload, Code, Eye, Filter, RefreshCw, Save, XCircle 
} from 'lucide-react';
import { ConfirmationModal } from '../modals/ConfirmationModal';

export const APIConfigList: React.FC = () => {
  const { 
    configurations = [], // Provide default empty array
    fetchConfigurations = async () => {}, // Default no-op function
    removeConfiguration = () => {}, // Default no-op function
    saveAllConfigurations = async () => false, // Default returns false
    discardChanges = () => {}, // Default no-op function
    isLoading = false, // Default to not loading
    error = null, // Default to no error
    isDirty = false // Default to no unsaved changes
  } = useAPIConfigStore() || {}; // Handle potential undefined return
  
  const theme = useCMSStore((state) => state?.theme) || 'light' as ThemeName;
  const themeClasses = getThemeClasses(theme);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [endpointToDelete, setEndpointToDelete] = useState<APIConfig | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof fetchConfigurations === 'function'  && !isDirty) {
      fetchConfigurations();
    }
  }, [fetchConfigurations, isDirty]);

  const handleDelete = (endpoint: APIConfig) => {
    setEndpointToDelete(endpoint);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (endpointToDelete && typeof removeConfiguration === 'function') {
      removeConfiguration(endpointToDelete.route);
      setShowDeleteModal(false);
      setEndpointToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEndpointToDelete(null);
  };

  const handleSaveChanges = async () => {
    if (typeof saveAllConfigurations === 'function') {
      const success = await saveAllConfigurations();
      if (success) {
        // Maybe show a success toast/notification
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardModal(true);
  };

  const confirmDiscardChanges = () => {
    if (typeof discardChanges === 'function') {
      discardChanges();
      setShowDiscardModal(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'dynamic':
        return <Activity className="h-5 w-5" />;
      case 'fileUpload':
        return <Upload className="h-5 w-5" />;
      case 'def':
        return <Code className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

  const filteredConfigurations = configurations.filter((config: APIConfig) => {
    // Not all config have routes, so we need to check for it
    if (!config.route) return false;
    const matchesSearch = config.route.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? config.routeType === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
          API Endpoints
          {isDirty && <span className="ml-2 text-sm font-normal text-amber-600">(Unsaved Changes)</span>}
        </h2>
        
        <div className="flex space-x-2">
          {isDirty && (
            <>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Discard
              </button>
              
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-600 rounded-md text-white flex items-center hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save All Changes
              </button>
            </>
          )}

          <Link 
            to="/api-configurator/new" 
            className={`px-4 py-2 ${themeClasses.accent} text-white rounded-md flex items-center`}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Endpoint
          </Link>
        </div>
      </div>

      {isDirty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
          You have unsaved changes. Click "Save All Changes" to persist them or "Discard" to revert to the last saved state.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className={`relative flex-grow ${themeClasses.primary} rounded-md shadow`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search endpoints..."
            className={`block w-full pl-10 pr-3 py-2 rounded-md ${themeClasses.primary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <div className={`relative ${themeClasses.primary} rounded-md shadow mr-2`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className={`block pl-10 pr-8 py-2 rounded-md ${themeClasses.primary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="dynamic">Dynamic</option>
              <option value="database">Database</option>
              <option value="fileUpload">File Upload</option>
              <option value="def">Definition</option>
            </select>
          </div>
          
          <button 
            onClick={() => fetchConfigurations()} 
            className={`p-2 ${themeClasses.primary} rounded-md shadow ${themeClasses.text} hover:${themeClasses.hover}`}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredConfigurations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || filterType ? 'No endpoints match your search criteria.' : 'No endpoints found. Create your first one!'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y divide-gray-200 ${themeClasses.primary} rounded-md shadow`}>
            <thead className={`${themeClasses.accent} text-white`}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Route
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Methods
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Database
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${themeClasses.primary}`}>
              {filteredConfigurations.map((config: APIConfig, index: number) => (
                <tr key={config.route} className={index % 2 === 0 ? themeClasses.primary : themeClasses.secondary}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                    {config.route}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                    <div className="flex items-center">
                      {getTypeIcon(config.routeType)}
                      <span className="ml-2 capitalize">{config.routeType}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                    <div className="flex flex-wrap gap-1">
                      {config.allowMethods?.map((method: string) => (
                        <span key={method} className={`px-2 py-1 text-xs rounded-full ${
                          method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          method === 'POST' ? 'bg-green-100 text-green-800' :
                          method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {method}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                    {config.dbType && config.dbConnection ? (
                      <div>
                        <span className="font-medium">{config.dbType}</span>
                        <span className="text-gray-500 ml-2">({config.dbConnection})</span>
                        {config.dbTable && <span className="block text-xs text-gray-500">Table: {config.dbTable}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/api-configurator/edit/${encodeURIComponent(config.route)}`}
                        className={`p-2 rounded-full hover:bg-gray-200 ${themeClasses.text}`}
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(config)}
                        className="p-2 rounded-full hover:bg-gray-200 text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Endpoint"
        message={`Are you sure you want to delete the endpoint ${endpointToDelete?.route}? This change won't be permanent until you save all changes.`}
        confirmButtonText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
      
      <ConfirmationModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={confirmDiscardChanges}
        title="Discard Changes"
        message="Are you sure you want to discard all unsaved changes? This action cannot be undone."
        confirmButtonText="Discard Changes"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};
