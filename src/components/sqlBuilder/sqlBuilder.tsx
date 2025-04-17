import React, { useState, useEffect } from 'react';
import { Copy, Save, FileCode } from 'lucide-react';
import axios from 'axios'; // Or use your existing API client

// This is a simplified version - in a real implementation you would import:
// import CodeMirror from '@uiw/react-codemirror';
// import { sql } from '@codemirror/lang-sql';
// import { javascript } from '@codemirror/lang-javascript';
// import { python } from '@codemirror/lang-python';
// import { json } from '@codemirror/lang-json';

// Create a simple API client if you don't have one
const api = {
  post: (url: string, data: any) => {
    return axios.post(url, data);
  }
};

const SqlBuilder = () => {
  const [prompt, setPrompt] = useState('');
  const [fileName, setFileName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [language, setLanguage] = useState('sql');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Generate line numbers for the code
  const lineNumbers = generatedCode ? generatedCode.split('\n').map((_, i) => i + 1) : [1];

  // Function to apply basic syntax highlighting (simplified version)
  const applySyntaxHighlighting = (code: string) => {
    if (!code) return "Your generated code will appear here...";
    
    // In a real implementation, this would be handled by CodeMirror
    // This is just a visual representation of syntax highlighting
    let highlighted = code;
    
    if (language === 'sql') {
      const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'CREATE', 'OR', 'REPLACE', 'VIEW', 'AS', 'AND', 'JOIN', 'ON', 'HAVING', 'UNION', 'ALL', 'INSERT', 'UPDATE', 'DELETE'];
      
      // Very simplified highlighting - just for demonstration
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        highlighted = highlighted.replace(regex, `<span class="text-blue-600 font-semibold">$&</span>`);
      });
      
      // Highlight comments
      highlighted = highlighted.replace(/--.*$/gm, '<span class="text-green-600 italic">$&</span>');
      
      // Highlight strings
      highlighted = highlighted.replace(/'[^']*'/g, '<span class="text-orange-500">$&</span>');
    } else if (language === 'javascript') {
      const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'from', 'export', 'default', 'class', 'extends'];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="text-purple-600 font-semibold">$&</span>`);
      });
      
      // Highlight comments
      highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="text-green-600 italic">$&</span>');
      
      // Highlight strings
      highlighted = highlighted.replace(/'[^']*'/g, '<span class="text-orange-500">$&</span>');
      highlighted = highlighted.replace(/"[^"]*"/g, '<span class="text-orange-500">$&</span>`');
    }
    
    return highlighted;
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the API to generate code
      const response = await api.post('/api/generate-code', {
        prompt,
        language,
        fileName: fileName || undefined
      });
      
      if (response.data && response.data.code) {
        setGeneratedCode(response.data.code);
        showNotification('Code generated successfully!', 'success');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      showNotification('Error generating code. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) {
      showNotification('No code to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(generatedCode)
      .then(() => showNotification('Code copied to clipboard!', 'success'))
      .catch(() => showNotification('Failed to copy code', 'error'));
  };

  const handleSaveCode = async () => {
    if (!generatedCode) {
      showNotification('No code to save', 'error');
      return;
    }
    
    if (!fileName.trim()) {
      showNotification('Please enter a file name', 'error');
      return;
    }
    
    try {
      // Call the API to save the code
      const response = await api.post('/api/save-code', {
        code: generatedCode,
        fileName,
        language
      });
      
      if (response.data && response.data.success) {
        showNotification(`Code saved as ${fileName}!`, 'success');
      } else {
        throw new Error('Failed to save code');
      }
    } catch (error) {
      console.error('Error saving code:', error);
      showNotification('Error saving code. Please try again.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white p-4 shadow-md flex flex-col">
        <h2 className="text-xl font-bold mb-4">SQL Builder</h2>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe what you want to create:
        </label>
        <textarea
          className="flex-grow p-3 border rounded-md resize-none mb-4"
          placeholder="Describe the SQL view, report, or visualization you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className={`w-full p-2 rounded-md text-white font-medium ${isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={handleGenerateCode}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white p-4 shadow-md flex items-center space-x-4">
          <div className="flex-1 flex items-center">
            <FileCode className="text-gray-600 mr-2" size={20} />
            <input
              type="text"
              className="flex-1 p-2 border rounded-md"
              placeholder="Enter file name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <select 
            className="p-2 border rounded-md bg-white"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="sql">SQL</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
          </select>
          <button
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
            onClick={handleCopyCode}
            title="Copy to clipboard"
          >
            <Copy size={20} className="text-gray-600" />
            <span className="ml-1">Copy</span>
          </button>
          <button
            className="p-2 bg-green-100 hover:bg-green-200 rounded-md flex items-center"
            onClick={handleSaveCode}
            title="Save file"
          >
            <Save size={20} className="text-green-600" />
            <span className="ml-1">Save</span>
          </button>
        </div>

        {/* Code Editor with Line Numbers */}
        <div className="flex-grow p-4 bg-gray-100 overflow-hidden">
          <div className="h-full bg-white shadow-md rounded-md flex flex-col">
            <div className="p-2 bg-gray-800 text-gray-200 text-sm rounded-t-md">
              Generated Code
            </div>
            
            {/* Code Editor with Line Numbers */}
            <div className="flex-grow flex overflow-hidden">
              {/* Line Numbers Column */}
              <div className="bg-gray-100 py-4 text-right pr-2 text-gray-500 font-mono text-sm border-r border-gray-200 min-w-12 overflow-y-auto select-none">
                {lineNumbers.map(num => (
                  <div key={num} className="h-6 px-2">{num}</div>
                ))}
              </div>
              
                              {/* This would be replaced with actual CodeMirror in a real implementation */}
              <div className="flex-grow relative">
                {/* Syntax highlighted view (read-only) */}
                <pre 
                  className="absolute top-0 left-0 w-full h-full py-4 px-4 font-mono text-sm overflow-auto m-0"
                  dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(generatedCode) }}
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Actual editable textarea (transparent, but captures input) */}
                <textarea
                  className="absolute top-0 left-0 w-full h-full py-4 px-4 font-mono text-sm resize-none bg-transparent outline-none caret-black"
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  spellCheck="false"
                />
              </div>
            </div>
          </div>
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

export default SqlBuilder;