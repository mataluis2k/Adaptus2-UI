import React, { useState } from 'react';
import { api } from '../../lib/client';

const PageCloner = () => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clonedContent, setClonedContent] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const handleClone = async () => {
    if (!sourceUrl) {
      showNotification('Please provide a source URL', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/ui/getPage', {
        url: sourceUrl
      });

      if (response.data.content) {
        setClonedContent(response.data.content);
        setPageId(response.data.id);
        showNotification('Page cloned successfully!', 'success');
      } else {
        throw new Error(response.data.message || 'Clone failed');
      }
    } catch (error) {
      console.error('Error cloning page:', error);
      showNotification('Error cloning page. Please try again.', 'error');
      setClonedContent('');
      setPageId('');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 p-6 pb-0">
      {/* Input Section */}
      <div className="bg-white rounded-t-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Page Cloner</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL to Clone
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://website.com/page-to-clone"
            />
          </div>
          
          <button
            className={`w-full p-3 rounded-md text-white font-medium ${
              isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleClone}
            disabled={isLoading}
          >
            {isLoading ? 'Cloning...' : 'Clone Page'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex-1 bg-white shadow-md rounded-b-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Page Preview</h3>
            {pageId && (
              <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
                Page ID: {pageId}
              </div>
            )}
          </div>
        </div>
        <div className="h-[calc(100%-3.5rem)]">
          {clonedContent ? (
            <iframe
              srcDoc={clonedContent}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts"
              title="Cloned page preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Enter a URL and click "Clone Page" to see the preview
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 p-3 rounded-md shadow-md ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default PageCloner; 