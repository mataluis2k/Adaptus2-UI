import React, { useState, useEffect } from 'react';
import { Copy, Save, FileCode } from 'lucide-react';
import { api } from '../../lib/client'; // Import the api client

// This is a simplified version - in a real implementation you would import:
// import CodeMirror from '@uiw/react-codemirror';
// import { sql } from '@codemirror/lang-sql';
// import { javascript } from '@codemirror/lang-javascript';
// import { python } from '@codemirror/lang-python';
// import { json } from '@codemirror/lang-json';

const SqlBuilder = () => {
  const [prompt, setPrompt] = useState('');
  const [fileName, setFileName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [language, setLanguage] = useState('sql');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [isTestingQuery, setIsTestingQuery] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'results'>('code');
  const [isResearching, setIsResearching] = useState(false);

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

  const cleanupCodeResponse = (code: string): string => {
    // Remove markdown code block syntax if present
    code = code.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
    
    // Remove extra blank lines
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Trim whitespace
    code = code.trim();
    
    return code;
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.post('/api/generate-code', {
        userQuery: prompt,
        language,
        fileName: fileName || undefined
      });

      if (response.data && response.data.code) {
        // Clean up the code before setting it
        const cleanedCode = cleanupCodeResponse(response.data.code);
        setGeneratedCode(cleanedCode);
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

  const handleSaveCode = async () => {
    if (!generatedCode) {
      showNotification('No code to save', 'error');
      return;
    }
    
    if (!fileName.trim()) {
      showNotification('Please enter a Report name', 'error');
      return;
    }
    
    try {
      const response = await api.post('/api/save-code', {
        sqlQuery: generatedCode,
        reportName:fileName,
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

  const handleCopyCode = () => {
    if (!generatedCode) {
      showNotification('No code to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(generatedCode)
      .then(() => showNotification('Code copied to clipboard!', 'success'))
      .catch(() => showNotification('Failed to copy code', 'error'));
  };

  const handleTestQuery = async () => {
    if (!generatedCode) {
      showNotification('No query to test', 'error');
      return;
    }

    setIsTestingQuery(true);
    try {
      const response = await api.post('/api/run-query', {
        sql: generatedCode
      });

      if (response.data && response.data.data) {
        setQueryResults(response.data.data);
        setActiveTab('results');
        showNotification('Query executed successfully!', 'success');
      } else {
        throw new Error('No results returned from query');
      }
    } catch (error) {
      console.error('Error testing query:', error);
      setQueryResults(null);
      showNotification('Error executing query. Please check your syntax.', 'error');
    } finally {
      setIsTestingQuery(false);
    }
  };

  // Utility to check if a string is valid JSON and is an array of objects
  const isJsonArrayOfObjects = (str: string) => {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object';
    } catch {
      return false;
    }
  };

  // Research handler
  const handleResearch = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt', 'error');
      return;
    }
    setIsResearching(true);
    setQueryResults(null);
    try {
      const response = await api.post('/api/userIntent', {
        userQuery: prompt,
        language,
        fileName: fileName || undefined
      });

      // Try to handle JSON or text
      if (response.data) {
        let result = response.data.result ?? response.data; // support both {result: ...} and direct
        if (typeof result === 'string' && isJsonArrayOfObjects(result)) {
          setQueryResults(JSON.parse(result));
          setActiveTab('results');
          setGeneratedCode('');
        } else if (typeof result === 'object' && Array.isArray(result)) {
          setQueryResults(result);
          setActiveTab('results');
          setGeneratedCode('');
        } else if (typeof result === 'string') {
          setGeneratedCode(result);
          setActiveTab('code');
          setQueryResults(null);
        } else {
          setGeneratedCode(JSON.stringify(result, null, 2));
          setActiveTab('code');
          setQueryResults(null);
        }
        showNotification('Research completed!', 'success');
      } else {
        throw new Error('No result returned');
      }
    } catch (error) {
      console.error('Error during research:', error);
      showNotification('Error during research. Please try again.', 'error');
    } finally {
      setIsResearching(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 pb-6">
      {/* Sidebar */}
      <div className="w-1/4 bg-white p-4 shadow-md flex flex-col">
        <h2 className="text-xl font-bold mb-4">SQL Builder</h2>
        <div className="flex flex-col h-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe what you want to create:
          </label>
          <textarea
            className="flex-1 p-3 border rounded-md mb-4 resize-none"
            placeholder="Describe the SQL view, report, or visualization you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <button
              className={`w-full p-2 rounded-md text-white font-medium ${
                isResearching ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
              }`}
              onClick={handleResearch}
              disabled={isResearching || isLoading}
            >
              {isResearching ? 'Researching...' : 'Research'}
            </button>
            <button
              className={`w-full p-2 rounded-md text-white font-medium ${
                isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={handleGenerateCode}
              disabled={isLoading || isResearching}
            >
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </div>
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
        <div className="flex-1 p-4 pb-0 bg-gray-100 overflow-hidden">
          <div className="h-full bg-white shadow-md rounded-md flex flex-col mb-6">
            <div className="bg-gray-800 text-gray-200 text-sm rounded-t-md">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-700">
                <button
                  className={`px-4 py-2 ${
                    activeTab === 'code'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('code')}
                >
                  Generated Code
                </button>
                {queryResults && (
                  <button
                    className={`px-4 py-2 ${
                      activeTab === 'results'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab('results')}
                  >
                    Data
                  </button>
                )}
                <div className="flex-1 flex justify-end pr-2">
                  <button
                    className={`px-4 py-1 my-1 rounded ${
                      isTestingQuery
                        ? 'bg-blue-500 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white text-sm`}
                    onClick={handleTestQuery}
                    disabled={isTestingQuery || !generatedCode}
                  >
                    {isTestingQuery ? 'Running...' : 'Test Query'}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {activeTab === 'code' ? (
                <>
                  {/* Line Numbers Column */}
                  <div className="bg-gray-100 py-4 text-right pr-2 text-gray-500 font-mono text-sm border-r border-gray-200 min-w-12">
                    {lineNumbers.map(num => (
                      <div key={num} className="h-6 px-2">{num}</div>
                    ))}
                  </div>
                  
                  {/* Code Content */}
                  <div className="flex-1 relative">
                    <pre 
                      className="absolute inset-0 py-4 px-4 font-mono text-sm overflow-auto m-0"
                      dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(generatedCode) }}
                      style={{ pointerEvents: 'none' }}
                    />
                    <textarea
                      className="absolute inset-0 py-4 px-4 font-mono text-sm resize-none bg-transparent outline-none caret-black"
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value)}
                      spellCheck="false"
                    />
                  </div>
                </>
              ) : (
                /* Results Table */
                <div className="flex-1 overflow-auto p-4">
                  {queryResults && queryResults.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(queryResults[0]).map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queryResults.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value: any, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {value?.toString() ?? 'null'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-gray-500 mt-4">
                      No results found
                    </div>
                  )}
                </div>
              )}
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