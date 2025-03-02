import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import FocusTrap from 'focus-trap-react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import 'react-quill/dist/quill.snow.css';
import './EnhancedWYSIWYGModal.css';

type EnhancedWYSIWYGModalProps = {
  initialContent?: string;
  onSave: (content: string) => void;
  onClose: () => void;
  isOpen: boolean;
};

const EnhancedWYSIWYGModal: React.FC<EnhancedWYSIWYGModalProps> = ({
  initialContent = '',
  onSave,
  onClose,
  isOpen
}) => {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setError(null);
    }
  }, [isOpen, initialContent]);

  const editorRef = useRef<ReactQuill>(null);
  
  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      onSave(content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  }, [content, onSave, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  useEffect(() => {
    if (isOpen && editorRef.current) {
      // Focus the editor when modal opens
      const editor = editorRef.current.getEditor();
      editor.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        
        {/* Modal */}
        <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Modal Header */}
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} p-4 flex justify-between items-center`}>
            <h2 id="modal-title" className={`font-bold text-lg ${themeClasses.text}`}>WYSIWYG Editor</h2>
            <div className="space-x-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`px-4 py-2 ${themeClasses.accent} text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50`}
                aria-label={isLoading ? 'Saving...' : 'Save'}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Fullscreen Editor */}
          <div className={`flex-1 p-4 overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <ReactQuill
              ref={editorRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Start typing your content here..."
              className={theme === 'dark' ? 'quill-dark' : ''}
              aria-label="Rich text editor"
            />
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default EnhancedWYSIWYGModal;
