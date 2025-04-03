import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useRulesStore } from "../../store/rules";

const DslEditor = () => {
  const { 
    dslCode, 
    actions, 
    validationErrors, 
    astPreview, 
    isLoading, 
    isSaving, 
    error,
    fetchData, 
    setDslCode, 
    validateCode, 
    saveCode 
  } = useRulesStore();
  
  // Reference to the editor instance
  const editorRef = useRef<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {    
    fetchData();
  }, []);

  // Update editor when dslCode changes in the store
  useEffect(() => {
    if (editorRef.current && dslCode !== undefined) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== dslCode) {
        editorRef.current.setValue(dslCode);
      }
    }
  }, [dslCode]);

  const handleSave = async () => {
    const success = await saveCode();
    if (success) {
      alert("Rules saved successfully!");
    } else {
      alert(`Failed to save rules: ${error || "Unknown error"}`);
    }
  };

  const validateDsl = async (code: string) => {
    await validateCode(code);
  };

  const getMonacoOptions = () => ({
    selectOnLineNumbers: true,
    wordWrap: "on" as const,
    minimap: { enabled: false },
    fontSize: 14,
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: "full" as const,
    tabSize: 2,
    snippetSuggestions: "inline" as const,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    "other": "inline",
    folding: true,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    parameterHints: {
      enabled: true
    },
    // Add these options to ensure proper rendering
    suggest: {
      showIcons: true,
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
      showUsers: true,
      showIssues: true
    }
  });

  // Enhanced suggestions with more context and snippets
  const dslSuggestions = [
    // Keywords suggestions
    {
      label: 'IF',
      kind: 17, // Keyword
      insertText: 'IF ${1:condition} THEN\n    ${0}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Creates a conditional block that executes when the condition is true',
      detail: 'Conditional Statement'
    },
    {
      label: 'WITH',
      kind: 17, // Keyword
      insertText: 'WITH ${1:connector} ${2:name} DO\n    ${0}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Defines a connection to use for the rules',
      detail: 'Connection Definition'
    },
    {
      label: 'ELSE IF',
      kind: 17, // Keyword
      insertText: 'ELSE IF ${1:condition} THEN\n    ${0}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Alternative condition to check if the previous IF condition was false',
      detail: 'Alternative Conditional'
    },
    {
      label: 'ELSE',
      kind: 17, // Keyword
      insertText: 'ELSE\n    ${0}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Executes when all previous conditions are false',
      detail: 'Default Case'
    },
    // HTTP methods
    {
      label: 'POST',
      kind: 10, // Method
      insertText: 'POST ${1:/api/path}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Matches POST HTTP requests to the specified path',
      detail: 'HTTP Method'
    },
    {
      label: 'GET',
      kind: 10, // Method
      insertText: 'GET ${1:/api/path}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Matches GET HTTP requests to the specified path',
      detail: 'HTTP Method'
    },
    // Action commands from the API
    ...actions.map((action) => ({
      label: action,
      kind: 14, // Snippet
      insertText: `${action} ${action === 'update' ? '${1:field} = ${2:value}' : '${1:params}'}`,
      insertTextRules: 4, // InsertAsSnippet
      documentation: `Executes the ${action} action with the specified parameters`,
      detail: "Action Command",
    })),
    // Common operations
    {
      label: 'update',
      kind: 14, // Snippet
      insertText: 'update ${1:field} = ${2:value}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Updates a field with a specific value',
      detail: 'Field Update'
    },
    {
      label: 'rawQuery',
      kind: 14, // Snippet
      insertText: 'rawQuery data: {"query": "${1:SQL_QUERY}"}',
      insertTextRules: 4, // InsertAsSnippet
      documentation: 'Executes a raw SQL query',
      detail: 'Database Operation'
    }
  ];

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.register({ id: "dsl" });

    // Enhanced syntax highlighting
    monaco.languages.setMonarchTokensProvider("dsl", {
      tokenizer: {
        root: [
          // Keywords with stronger distinction
          [/\b(IF|THEN|ELSE IF|ELSE|WITH|DO|UPDATE|SEND|WHEN)\b/, "keyword.control.dsl"],
          // HTTP methods highlighted distinctly
          [/\b(GET|POST|PUT|DELETE|PATCH)\b/, "keyword.http.dsl"],
          // Logical operators
          [/\b(AND|OR|IN|IS NULL|IS NOT NULL|CONTAINS)\b/, "keyword.operator.dsl"],
          // Strings with different patterns
          [/"(?:[^"\\]|\\.)*"/, "string.dsl"],
          [/'(?:[^'\\]|\\.)*'/, "string.dsl"],
          // Template variables with special highlighting
          [/\$\{[^}]*\}/, "variable.predefined.dsl"],
          // Numbers
          [/\b\d+\b/, "number.dsl"],
          // JSON in string contexts
          [/\{(?:[^{}]|\{[^{}]*\})*\}/, "string.json.dsl"],
          // Identifiers
          [/[a-zA-Z_][\w\.]*/, "identifier.dsl"],
          // Operators
          [/=|!=|>=|<=|>|</, "operator.dsl"],
          // Comments
          [/\/\/.*$/, "comment.dsl"],
        ],
      },
    });

    // Register hover provider for context help
    monaco.languages.registerHoverProvider("dsl", {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        // Custom hover information based on the word
        const hoverInfoMap: Record<string, { content: string }> = {
          "IF": { content: "Begins a conditional statement. Use with THEN to execute code when a condition is true." },
          "THEN": { content: "Follows an IF statement and begins the code block to execute when the condition is true." },
          "ELSE": { content: "Optional part of an IF statement that executes when the IF condition is false." },
          "WITH": { content: "Defines a connection to use for database operations within the rule." },
          "DO": { content: "Begins the main code block after a WITH statement." },
          "UPDATE": { content: "Modifies a field or property with a new value." },
          "SEND": { content: "Sends data to an external system or service." },
          "POST": { content: "Matches HTTP POST requests to the specified path." },
          "GET": { content: "Matches HTTP GET requests to the specified path." },
          "AND": { content: "Logical AND operator to combine conditions." },
          "OR": { content: "Logical OR operator to combine conditions." },
          "rawQuery": { content: "Executes a raw SQL query against the connected database." },
        };
        
        const info = hoverInfoMap[word.word];
        if (info) {
          return {
            contents: [{ value: info.content }],
          };
        }
        
        return null;
      }
    });

    // Enhanced completion provider with context awareness
    monaco.languages.registerCompletionItemProvider("dsl", {
      provideCompletionItems: (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        
        // Get previous line to understand context
        const previousLineNumber = position.lineNumber > 1 ? position.lineNumber - 1 : 1;
        const previousLine = model.getLineContent(previousLineNumber).trim();
        
        // Get indentation level to understand context
        const indentMatch = textUntilPosition.match(/^(\s+)/);
        const indentLevel = indentMatch ? indentMatch[1].length : 0;
        const trimmedLine = textUntilPosition.trim();
        
        // Default action suggestions - used in multiple contexts
        const actionSuggestions = actions.map(action => ({
          label: { label: action, description: "Action" }, // This ensures label text is displayed
          kind: monaco.languages.CompletionItemKind.Function, // Use proper enum for better icon
          insertText: `${action} ${action === 'update' ? '${1:field} = ${2:value}' : '${1:params}'}`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: `Execute the ${action} action`,
          detail: "Action Command"  // Adds more context to the suggestion
        }));
        
        // Context: Empty line after THEN with indentation - suggest actions
        if (trimmedLine === "" && previousLine.includes("THEN") && indentLevel >= 4) {
          return { suggestions: actionSuggestions };
        }
        
        // Context: Line after WITH ... DO with indent
        if (trimmedLine === "" && previousLine.includes("DO") && indentLevel >= 2) {
          return {
            suggestions: [
              {
                label: { label: "IF", description: "Condition" },
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'IF ${1:HTTP_METHOD} ${2:/api/path} THEN\n${3:    }${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Start a conditional rule',
                detail: "Flow Control"
              }
            ]
          };
        }
        
        // Context: After typing IF, suggest HTTP methods
        if (textUntilPosition.trim().endsWith("IF")) {
          return {
            suggestions: [
              {
                label: { label: "POST", description: "HTTP Method" },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: ' POST ${1:/api/path} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Match POST requests to the specified path',
                detail: "HTTP Method"
              },
              {
                label: { label: "GET", description: "HTTP Method" },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: ' GET ${1:/api/path} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Match GET requests to the specified path',
                detail: "HTTP Method"
              },
              {
                label: { label: "PUT", description: "HTTP Method" },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: ' PUT ${1:/api/path} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Match PUT requests to the specified path',
                detail: "HTTP Method"
              },
              {
                label: { label: "DELETE", description: "HTTP Method" },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: ' DELETE ${1:/api/path} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Match DELETE requests to the specified path',
                detail: "HTTP Method"
              }
            ]
          };
        }
        
        // Context: After THEN on the same line
        if (textUntilPosition.trim().endsWith("THEN")) {
          return { suggestions: actionSuggestions };
        }
        
        // Context: Inside an empty indented line after a THEN block
        const codeUntilPosition = model.getValue().substring(0, model.getOffsetAt(position));
        const lastThenIndex = codeUntilPosition.lastIndexOf("THEN");
        
        if (lastThenIndex !== -1 && trimmedLine === "" && indentLevel >= 4) {
          // We're inside a THEN block on an empty line
          return { suggestions: actionSuggestions };
        }
        
        // Context: Suggestions for a new rule at root level
        if (trimmedLine === "" && indentLevel === 0) {
          return {
            suggestions: [
              {
                label: { label: "WITH", description: "Connection" },
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'WITH ${1:connector} ${2:NAME} DO\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new connection for rules',
                detail: "Connection Definition"
              },
              {
                label: { label: "IF", description: "Condition" },
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'IF ${1:condition} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Start a conditional rule',
                detail: "Flow Control"
              }
            ]
          };
        }
        
        // Context: Suggest appropriate next item based on current line content
        if (trimmedLine.startsWith("update") || trimmedLine.startsWith("rawQuery")) {
          // After an action, suggest another action or a new IF block
          return {
            suggestions: [
              ...actionSuggestions,
              {
                label: { label: "IF", description: "Condition" },
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'IF ${1:HTTP_METHOD} ${2:/api/path} THEN\n    ${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Start a new conditional rule',
                detail: "Flow Control"
              }
            ]
          };
        }

        // Create enhanced default suggestions
        const defaultSuggestions = [
          {
            label: { label: "IF", description: "Condition" },
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'IF ${1:condition} THEN\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Creates a conditional block that executes when the condition is true',
            detail: 'Conditional Statement'
          },
          {
            label: { label: "WITH", description: "Connection" },
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'WITH ${1:connector} ${2:name} DO\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Defines a connection to use for the rules',
            detail: 'Connection Definition'
          },
          {
            label: { label: "ELSE IF", description: "Condition" },
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'ELSE IF ${1:condition} THEN\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Alternative condition to check if the previous IF condition was false',
            detail: 'Alternative Conditional'
          },
          {
            label: { label: "ELSE", description: "Default Case" },
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'ELSE\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Executes when all previous conditions are false',
            detail: 'Default Case'
          },
          {
            label: { label: "POST", description: "HTTP Method" },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'POST ${1:/api/path}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Matches POST HTTP requests to the specified path',
            detail: 'HTTP Method'
          },
          {
            label: { label: "GET", description: "HTTP Method" },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'GET ${1:/api/path}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Matches GET HTTP requests to the specified path',
            detail: 'HTTP Method'
          },
          ...actionSuggestions,
          {
            label: { label: "update", description: "Field Update" },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'update ${1:field} = ${2:value}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Updates a field with a specific value',
            detail: 'Field Update'
          },
          {
            label: { label: "rawQuery", description: "SQL" },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'rawQuery data: {"query": "${1:SQL_QUERY}"}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Executes a raw SQL query',
            detail: 'Database Operation'
          }
        ];

        // Default suggestions for general context
        return { suggestions: defaultSuggestions };
      },
      triggerCharacters: [' ', '.', '$', '{', '}', '=', ':', '"', "'", ',', '(', ')','\n']
    });
  };

  if (isLoading) return <div className="p-4 text-gray-500">Loading editor...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Business Rules DSL Editor</h2>
        <button 
          className="text-blue-600 hover:text-blue-800 flex items-center"
          onClick={() => setShowHelp(!showHelp)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {showHelp ? "Hide Help" : "Show Help"}
        </button>
      </div>
      
      {showHelp && (
        <div className="bg-blue-50 p-4 rounded border border-blue-200 text-sm">
          <h3 className="font-bold mb-2">DSL Syntax Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Basic Structure</h4>
              <pre className="bg-white p-2 rounded text-xs my-1">
                WITH connector NAME DO
                  IF condition THEN
                    action
                  ELSE IF condition THEN
                    action
                  ELSE
                    action
              </pre>
            </div>
            <div>
              <h4 className="font-semibold">Available Actions</h4>
              <ul className="list-disc ml-5 space-y-1">
                {actions.map((action, i) => (
                  <li key={i}><code className="bg-white px-1 rounded">{action}</code></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Variables</h4>
              <p>Access variables using <code className="bg-white px-1 rounded">${'{variable}'}</code> syntax</p>
              <p>Example: <code className="bg-white px-1 rounded">update id = ${'{user.id}'}</code></p>
            </div>
            <div>
              <h4 className="font-semibold">Tips</h4>
              <ul className="list-disc ml-5 space-y-1">
                <li>Press <kbd className="bg-gray-200 px-1 rounded">Ctrl</kbd>+<kbd className="bg-gray-200 px-1 rounded">Space</kbd> for suggestions</li>
                <li>Hover over keywords for more information</li>
                <li>Validate before saving to check for errors</li>
              </ul>
            </div>
          </div>
          <div className="mt-2">
            <h4 className="font-semibold">Example Rule</h4>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`WITH mysql DB_CONN DO
  IF POST /api/users THEN
    update password = bcrypt("\${data.password}")
    rawQuery data: {"query": "INSERT INTO users (email) VALUES ('\${data.email}')" }
`}
            </pre>
          </div>
        </div>
      )}
      
      <div className="flex space-x-2">
        <div className="flex-grow">
          <Editor
            height="500px"
            defaultLanguage="dsl"
            value={dslCode}
            onChange={(val) => setDslCode(val || "")}
            onValidate={() => validateDsl(dslCode)}
            beforeMount={handleEditorWillMount}
            options={getMonacoOptions()}
            onMount={(editor, monaco) => {
              // Store editor reference
              editorRef.current = editor;
              
              // Set initial value explicitly
              if (dslCode) {
                editor.setValue(dslCode);
              }
               // Add these lines to ensure proper editor configuration
              editor.updateOptions({
                // This forces Monaco to recalculate UI which can fix rendering issues
                fontSize: editor.getOption(monaco.editor.EditorOption.fontSize)
              });
              
              editor.onDidBlurEditorWidget(() => validateDsl(dslCode));
              
              // Add keyboard shortcut for validation
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, 
                () => {
                  validateDsl(dslCode);
                  if (validationErrors.length === 0) {
                    handleSave();
                  }
                }
              );
            }}
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          {validationErrors.length > 0 && (
            <div className="text-red-500 bg-red-50 p-3 rounded border border-red-200">
              <h4 className="font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Validation Errors:
              </h4>
              <ul className="list-disc ml-5 mt-2">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="md:w-1/2">
          {astPreview && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <h4 className="font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Parsed AST Preview:
              </h4>
              <div className="overflow-x-auto mt-2 max-h-40">
                <pre className="whitespace-pre-wrap text-xs">
                  {astPreview}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          onClick={handleSave}
          disabled={isSaving || validationErrors.length > 0}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Rules
            </>
          )}
        </button>
        
        <button
          className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          onClick={() => validateDsl(dslCode)}
        >
          Validate Syntax
        </button>
        
        <div className="text-sm text-gray-600">
          {dslCode ? `${dslCode.length} characters` : "No content"}
        </div>
      </div>
    </div>
  );
};

export default DslEditor;
