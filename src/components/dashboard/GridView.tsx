import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { Search, Pencil, Trash, Plus, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from 'react-query';
import { api, useApiErrorHandler, ApiError } from '../../api/client';
import { ApiResponse, BaseRecord } from '../../types/api';
import { getThemeClasses } from '../theme/ThemeProvider';
import { FormModal } from '../forms/FormModal';
import { ErrorBoundary } from '../ErrorBoundary';

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  recordId?: string;
}

const ErrorMessage = ({ message }: { message: string }) => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  return (
    <div className={`flex items-center justify-center p-6 ${themeClasses.modalBackground} rounded-lg shadow-md`}>
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className={`${themeClasses.text} text-lg`}>{message}</span>
      </div>
    </div>
  );
};

const LoadingMessage = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  return (
    <div className={`flex items-center justify-center p-6 ${themeClasses.modalBackground} rounded-lg shadow-md`}>
      <div className={`${themeClasses.text} text-lg`}>Loading...</div>
    </div>
  );
};

const GridContent = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create'
  });
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const handleApiError = useApiErrorHandler();

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return <ErrorMessage message="Table configuration not found" />;
  }

  const table = config.cms.tables[tableId];
  const { displayFields, filterableFields } = table.listView;
  const themeClasses = getThemeClasses(theme);

  const { data: apiResponse, isLoading, error } = useQuery<ApiResponse<BaseRecord>, Error>(
    ['tableData', tableId],
    async () => {
      try {
        const response = await api.get<ApiResponse<BaseRecord>>(table.route);
        if (!response.data) {
          throw new Error('No data received from API');
        }
        return response.data;
      } catch (err) {
        const apiError = handleApiError(err);
        throw new Error(apiError.message);
      }
    },
    {
      enabled: Boolean(tableId),
      keepPreviousData: true,
      retry: (failureCount, error: Error) => {
        // Don't retry on 401, 403, or 404
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );

  // Filter records
  const filteredRecords = React.useMemo(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      return [];
    }

    if (!searchTerm) {
      return apiResponse.data;
    }

    return apiResponse.data.filter(record =>
      filterableFields.some(field => {
        const value = record[field];
        return value != null && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [apiResponse?.data, searchTerm, filterableFields]);

  const handleDelete = async (id: string) => {
    if (!table.permissions.delete) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`${table.route}/${id}`);
      await queryClient.invalidateQueries(['tableData', tableId]);
    } catch (err) {
      const apiError = handleApiError(err);
      alert(apiError.message);
    }
  };

  if (isLoading) {
    return <LoadingMessage />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div className={`${themeClasses.primary} rounded-lg shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${themeClasses.border}`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-semibold ${themeClasses.text}`}>
            {table.title}
          </h1>
          {table.permissions.write && (
            <button 
              onClick={() => setModal({ isOpen: true, mode: 'create' })}
              className={`inline-flex items-center px-4 py-2 ${themeClasses.accent} text-white rounded-md hover:opacity-90 transition-opacity`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New
            </button>
          )}
        </div>

        {/* Search */}
        {filterableFields.length > 0 && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${filterableFields.map(field => table.fields[field].label).join(', ')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-md border ${themeClasses.border} ${themeClasses.modalBackground} ${themeClasses.text} focus:ring-2 focus:ring-opacity-50 focus:ring-${themeClasses.accent.replace('bg-', '')}`}
              />
              <Search className={`absolute left-3 top-2.5 h-5 w-5 ${themeClasses.secondaryText}`} />
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="p-6">
        {filteredRecords.length === 0 ? (
          <div className={`text-center ${themeClasses.secondaryText} p-6`}>
            No records found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`${themeClasses.modalBackground} rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] duration-200`}
              >
                <div className="p-4">
                  {displayFields.map((field) => (
                    <div key={field} className="mb-2">
                      <div className={`text-sm font-medium ${themeClasses.secondaryText}`}>
                        {table.fields[field].label}
                      </div>
                      <div className={`${themeClasses.text} break-words`}>
                        {record[field] != null ? String(record[field]) : ''}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {(table.permissions.write || table.permissions.delete) && (
                  <div className={`px-4 py-3 ${themeClasses.secondary} border-t ${themeClasses.border} flex justify-end space-x-2`}>
                    {table.permissions.write && (
                      <button 
                        onClick={() => setModal({ isOpen: true, mode: 'edit', recordId: record.id })}
                        className={`${themeClasses.accent} hover:opacity-90 p-2 rounded-full transition-opacity`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </button>
                    )}
                    {table.permissions.delete && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:opacity-90 p-2 rounded-full transition-opacity"
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <FormModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, mode: 'create' })}
        tableId={tableId}
        recordId={modal.recordId}
        mode={modal.mode}
      />
    </div>
  );
};

export const GridView = () => {
  return (
    <ErrorBoundary>
      <GridContent />
    </ErrorBoundary>
  );
};
