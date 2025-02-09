import React from 'react';
import { X } from 'lucide-react';
import { DynamicForm } from './DynamicForm';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useQueryClient } from 'react-query';
import { api } from '../../api/client';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  recordId?: string;
  mode: 'create' | 'edit';
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  tableId,
  recordId,
  mode
}) => {
  const theme = useCMSStore((state) => state.theme);
  const config = useCMSStore((state) => state.config);
  const themeClasses = getThemeClasses(theme);
  const queryClient = useQueryClient();

  const [initialData, setInitialData] = React.useState<Record<string, any> | undefined>();

  // Fetch record data for edit mode
  React.useEffect(() => {
    const fetchRecord = async () => {
      if (mode === 'edit' && recordId && config?.cms.tables[tableId]) {
        try {
          const response = await api.get(`${config.cms.tables[tableId].route}/${recordId}`);
          const recordData = response.data?.data || response.data;
          setInitialData(recordData);
        } catch (error) {
          console.error('Failed to fetch record:', error);
        }
      } else {
        setInitialData(undefined);
      }
    };

    if (isOpen) {
      fetchRecord();
    }
  }, [isOpen, mode, recordId, tableId, config]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setInitialData(undefined);
    }
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const table = config.cms.tables[tableId];
  if (!table) return null;

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      if (mode === 'create') {
        await api.post(table.route, data);
      } else {
        await api.put(`${table.route}/${recordId}`, data);
      }
      await queryClient.invalidateQueries(['tableData', tableId]);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 transition-opacity ${themeClasses.modalOverlay}`}
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div 
          className={`
            relative w-full max-w-2xl transform overflow-hidden rounded-lg 
            ${themeClasses.modalBackground} 
            ${themeClasses.text} 
            p-6 text-left align-middle shadow-xl transition-all
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 
              id="modal-headline" 
              className={`text-xl font-semibold ${themeClasses.text}`}
            >
              {mode === 'create' ? 'Create New' : 'Edit'} {table.title}
            </h2>
            <button
              onClick={onClose}
              className={`rounded-full p-1 ${themeClasses.hover} transition-colors duration-200`}
              aria-label="Close"
            >
              <X className={`h-6 w-6 ${themeClasses.secondaryText}`} />
            </button>
          </div>

          {/* Content */}
          <div className={`${themeClasses.modalBackground} ${themeClasses.shadow} rounded-lg`}>
            <DynamicForm
              key={`${tableId}-${recordId}-${mode}`}
              tableId={tableId}
              initialData={initialData}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
