import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { Search, ChevronRight, Plus, Pencil, Trash } from 'lucide-react';
import { useQuery } from 'react-query';
import { api } from '../../api/client';

export const ListView = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const [searchTerm, setSearchTerm] = useState('');

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return <div>Table not found</div>;
  }

  const table = config.cms.tables[tableId];
  const { displayFields, filterableFields } = table.listView;

  // Fetch the full dataset (without applying search as a query param)
  const { data: records = [], isLoading } = useQuery(
    ['tableData', tableId],
    async () => {
      const response = await api.get(`${table.route}`);
      return response.data;
    }
  );

  // Client-side filtering based on searchTerm and displayFields
  const filteredRecords = searchTerm
    ? records.filter((record: any) =>
        displayFields.some((field) =>
          String(record[field])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    : records;

  const handleDelete = async (id: string) => {
    if (!table.permissions.delete) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`${table.route}/${id}`);
      // Invalidate and refetch if needed
      // queryClient.invalidateQueries(['tableData', tableId]);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{table.title}</h1>
          {table.permissions.write && (
            <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <Plus className="h-5 w-5 mr-2" />
              Create New
            </button>
          )}
        </div>
        {filterableFields.length > 0 && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No records found</div>
        ) : (
          filteredRecords.map((record: any) => (
            <div key={record.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    {displayFields.map((field) => (
                      <div key={field} className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-32">
                          {table.fields[field].label}:
                        </span>
                        <span className="ml-2 text-sm text-gray-900">{record[field]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {table.permissions.write && (
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Pencil className="h-5 w-5" />
                    </button>
                  )}
                  {table.permissions.delete && (
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
