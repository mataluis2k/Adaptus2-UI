import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { Search, ArrowUpDown, Pencil, Trash, Plus, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from 'react-query';
import { api, useApiErrorHandler } from '../../api/client';
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

const TableContent = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create'
  });
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const queryClient = useQueryClient();
  const handleApiError = useApiErrorHandler();

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return <ErrorMessage message="Table configuration not found" />;
  }

  const table = config.cms.tables[tableId];
  const { displayFields, sortableFields, filterableFields } = table.listView;
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

  // Filter and sort records
  const filteredAndSortedRecords = React.useMemo(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      return [];
    }

    let result = [...apiResponse.data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(record =>
        filterableFields.some(field => {
          const value = record[field];
          return value != null && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const modifier = sortDirection === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * modifier;
        }

        return String(aValue ?? '').localeCompare(String(bValue ?? '')) * modifier;
      });
    }

    return result;
  }, [apiResponse?.data, searchTerm, filterableFields, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (!sortableFields.includes(field)) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={themeClasses.secondary}>
            <tr>
              {displayFields.map((field) => (
                <th
                  key={field}
                  className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.secondaryText} uppercase tracking-wider ${
                    sortableFields.includes(field) ? 'cursor-pointer hover:opacity-80' : ''
                  }`}
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{table.fields[field].label}</span>
                    {sortableFields.includes(field) && (
                      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? themeClasses.accent : ''}`} />
                    )}
                  </div>
                </th>
              ))}
              {(table.permissions.write || table.permissions.delete) && (
                <th className={`px-6 py-3 text-right text-xs font-medium ${themeClasses.secondaryText} uppercase tracking-wider`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`${themeClasses.primary} divide-y ${themeClasses.border}`}>
            {filteredAndSortedRecords.length === 0 ? (
              <tr>
                <td 
                  colSpan={displayFields.length + (table.permissions.write || table.permissions.delete ? 1 : 0)} 
                  className={`px-6 py-4 text-center ${themeClasses.secondaryText}`}
                >
                  No records found
                </td>
              </tr>
            ) : (
              filteredAndSortedRecords.map((record) => (
                <tr key={record.id} className={`${themeClasses.hover} transition-colors duration-150`}>
                  {displayFields.map((field) => (
                    <td key={field} className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                      {record[field] != null ? String(record[field]) : ''}
                    </td>
                  ))}
                  {(table.permissions.write || table.permissions.delete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {table.permissions.write && (
                        <button 
                          onClick={() => setModal({ isOpen: true, mode: 'edit', recordId: record.id })}
                          className={`${themeClasses.accent} hover:opacity-90 p-2 rounded-full transition-opacity mr-2`}
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
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
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

export const TableView = () => {
  return (
    <ErrorBoundary>
      <TableContent />
    </ErrorBoundary>
  );
};
