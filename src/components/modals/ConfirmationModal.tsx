import React, { useRef } from 'react';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonClass = '',
}) => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  
  const modalRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 modal-backdrop" 
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <FocusTrap>
          <div 
            ref={modalRef}
            className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${themeClasses.primary}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-headline"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 
                  id="modal-headline" 
                  className={`text-lg font-medium ${themeClasses.text}`}
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className={`rounded-full p-1 hover:${themeClasses.hover} focus:outline-none`}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className={`mb-6 ${themeClasses.text}`}>
                {message}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.hover} rounded-md ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring}`}
                >
                  {cancelButtonText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass || themeClasses.accent}`}
                >
                  {confirmButtonText}
                </button>
              </div>
            </div>
          </div>
        </FocusTrap>
      </div>
    </div>
  );
};