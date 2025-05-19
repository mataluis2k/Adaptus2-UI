import React, { useState, useEffect } from 'react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { Send, Loader, PanelRight, Copy, Check, Info } from 'lucide-react';
import { generatePlugin } from '../../api/plugins';
import PluginDemo from './PluginDemo';
import PluginDocs from './PluginDocs';
import EnvironmentInfo from './EnvironmentInfo';
import PluginSuggestions from './PluginSuggestions';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// VSCode-like theme colors
const vscodeTheme = {
  ...atomDark,
  'code[class*="language-"]': {
    ...atomDark['code[class*="language-"]'],
    color: '#D4D4D4', // VSCode default text color
    background: 'transparent',
  },
  'pre[class*="language-"]': {
    ...atomDark['pre[class*="language-"]'],
    background: 'transparent',
  },
  '.token.comment': {
    color: '#6A9955', // VSCode green for comments
  },
  '.token.string': {
    color: '#CE9178', // VSCode brown for strings
  },
  '.token.keyword': {
    color: '#569CD6', // VSCode blue for keywords
  },
  '.token.function': {
    color: '#DCDCAA', // VSCode yellow for functions
  },
  '.token.number': {
    color: '#B5CEA8', // VSCode light green for numbers
  },
  '.token.operator': {
    color: '#D4D4D4', // VSCode default text color
  },
  '.token.punctuation': {
    color: '#D4D4D4', // VSCode default text color
  },
  '.token.property': {
    color: '#9CDCFE', // VSCode light blue for properties
  },
  '.token.class-name': {
    color: '#4EC9B0', // VSCode teal for class names
  },
  '.token.parameter': {
    color: '#9CDCFE', // VSCode light blue for parameters
  },
  '.token.boolean': {
    color: '#569CD6', // VSCode blue for booleans
  },
  '.token.null': {
    color: '#569CD6', // VSCode blue for null
  },
  '.token.undefined': {
    color: '#569CD6', // VSCode blue for undefined
  },
  '.token.regex': {
    color: '#D16969', // VSCode red for regex
  },
  '.token.important': {
    color: '#569CD6', // VSCode blue for important
  },
  '.token.selector': {
    color: '#D7BA7D', // VSCode gold for selectors
  },
  '.token.tag': {
    color: '#569CD6', // VSCode blue for tags
  },
  '.token.attr-name': {
    color: '#9CDCFE', // VSCode light blue for attribute names
  },
  '.token.attr-value': {
    color: '#CE9178', // VSCode brown for attribute values
  },
};

// Clean the code - strip markdown and other formatting
const cleanCode = (text: string): string => {
  return text
    // Remove markdown code block markers
    .replace(/^```javascript\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    // Remove any remaining markdown syntax
    .replace(/^###\s*/gm, '')
    .replace(/^####\s*/gm, '')
    .replace(/^\*\*\*\s*/gm, '')
    .replace(/^\*\*\s*/gm, '')
    .replace(/^\*\s*/gm, '')
    .replace(/^-\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    // Clean up any extra whitespace
    .trim();
};

const CodeBlock = ({ code, lineNumbers = true }: { code: string, lineNumbers?: boolean }) => {
  const themeClasses = getThemeClasses(useCMSStore((state) => state.theme));
  const cleanedCode = cleanCode(code);

  return (
    <div className={`font-mono rounded-md ${themeClasses.primary} overflow-hidden`}>
      <SyntaxHighlighter
        language="javascript"
        style={vscodeTheme}
        showLineNumbers={lineNumbers}
        wrapLines={true}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: 'transparent',
          fontSize: '1rem',
          lineHeight: '1.5',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }
        }}
      >
        {cleanedCode}
      </SyntaxHighlighter>
    </div>
  );
};

const PluginGenerator = () => {
  const [promptText, setPromptText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('// Generated CommonJS plugin code will appear here');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  const examplePrompts = [
    "Create a logging plugin that captures all API requests with timestamps and response times",
    "Build a data validation plugin that checks incoming form submissions against a JSON schema before processing",
    "Make a caching plugin for database queries to improve performance by storing results in memory",
    "Create a plugin for detecting and preventing SQL injection attacks by analyzing query parameters",
    "Create an analytics plugin that tracks user interactions and sends them to Google Analytics",
    "Build a rate limiting plugin to prevent API abuse by limiting requests per IP address",
    "Create a plugin that automatically compresses response data for better performance",
    "Build an audit trail plugin that logs all data changes with user information"
  ];

  const handleGeneratePlugin = async () => {
    if (!promptText.trim()) {
      setError('Please enter a plugin description');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await generatePlugin({ prompt: promptText });
      console.log('Plugin response:', response);
      
      if (response && response.success && response.code) {
        setGeneratedCode(response.code);
      } else if (response && response.code) {
        setGeneratedCode(response.code);
      } else {
        console.warn('Unexpected response format:', response);
        setError('Received unexpected response format from server');
        setGeneratedCode('// No code was generated. Please try a different prompt.');
      }
    } catch (err) {
      console.error('Error generating plugin:', err);
      setError('Failed to generate plugin. Please try again later.');
      setGeneratedCode('// Error generating code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleGeneratePlugin();
    }
  };
  
  const handleSuggestionSelect = (suggestion: { type: string; name: string; description: string }) => {
    if (suggestion.type === 'hook') {
      setPromptText(currentText => 
        `${currentText}\nInclude support for the "${suggestion.name}" hook: ${suggestion.description}`
      );
    } else if (suggestion.type === 'method') {
      setPromptText(currentText => 
        `${currentText}\nUse the ${suggestion.name} API method: ${suggestion.description}`
      );
    } else {
      setPromptText(currentText => 
        `${currentText}\nHandle the "${suggestion.name}" event: ${suggestion.description}`
      );
    }
  };

  return (
    <div>
      <div className={`rounded-lg shadow-md ${themeClasses.primary} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${themeClasses.text} flex items-center`}>
            <PanelRight className="inline-block mr-2" />
            Plugin Generator
          </h2>
          <button
            onClick={() => setShowDocs(!showDocs)}
            className={`px-3 py-1 text-sm rounded ${themeClasses.border} ${themeClasses.secondary} hover:opacity-80 transition-opacity flex items-center`}
          >
            <Info className="w-4 h-4 mr-1" />
            {showDocs ? 'Hide Docs' : 'Show Docs'}
          </button>
        </div>
        
        <EnvironmentInfo />
      
        <div className="mb-6">
          <label htmlFor="plugin-code" className={`block text-sm font-medium mb-2 ${themeClasses.text} flex items-center justify-between`}>
            <span>Generated Plugin Code:</span>
            <div className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              <Info className="w-3 h-3 mr-1" />
              CommonJS Format
            </div>
          </label>
          <div className="relative">
            <div className="border rounded-md mb-4" style={{ maxHeight: '500px', overflow: 'auto' }}>
              <CodeBlock code={generatedCode} />
            </div>
            <button
              onClick={copyToClipboard}
              className={`absolute top-2 right-2 p-2 rounded-md ${themeClasses.secondary} hover:opacity-80 transition-opacity`}
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="plugin-prompt" className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
            Describe your plugin:
          </label>
          <div className="relative">
            <textarea
              id="plugin-prompt"
              rows={4}
              className={`w-full p-3 rounded-md border ${themeClasses.border} ${themeClasses.secondary} resize-none`}
              placeholder="Describe what you want your plugin to do. Be specific about functionality, inputs, and outputs..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <div>Press Ctrl+Enter to generate</div>
              <button 
                onClick={() => setShowExamples(!showExamples)} 
                className="text-blue-500 hover:underline"
              >
                {showExamples ? 'Hide examples' : 'Show examples'}
              </button>
            </div>
            
            {showExamples && (
              <div className={`mt-2 p-3 rounded-md ${themeClasses.secondary} border ${themeClasses.border}`}>
                <div className="text-sm font-medium mb-2">Example prompts:</div>
                <ul className="space-y-2 text-sm">
                  {examplePrompts.map((example, index) => (
                    <li key={index} className="hover:bg-opacity-50 p-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setPromptText(example)}>
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleGeneratePlugin}
            disabled={isLoading || !promptText.trim()}
            className={`flex items-center px-4 py-2 rounded-md ${
              isLoading || !promptText.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : `${themeClasses.accent} hover:opacity-90`
            } text-white transition-colors`}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Plugin
              </>
            )}
          </button>
        </div>
        
        {/* Only show the demo when we have generated code */}
        {generatedCode && generatedCode !== '// Generated CommonJS plugin code will appear here' && (
          <PluginDemo pluginCode={generatedCode} />
        )}
      </div>
      
      {showDocs && <PluginDocs />}
    </div>
  );
};

export default PluginGenerator;