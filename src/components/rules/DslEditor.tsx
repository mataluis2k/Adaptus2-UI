import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, tooltips, hoverTooltip, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { autocompletion, completionKeymap, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { syntaxHighlighting, HighlightStyle, indentUnit, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useRulesStore } from "../../store/rules";
import { defaultKeymap } from "@codemirror/commands";

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
  
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {    
    fetchData();
  }, []);

  // Define a custom DSL language for syntax highlighting
  const defineDSLLanguage = () => {
    return StreamLanguage.define({
      name: "dsl",
      startState: () => ({}),
      token: (stream, state) => {
        // Skip whitespace
        if (stream.eatSpace()) return null;
        
        // Check for keywords
        if (stream.match(/IF|THEN|ELSE IF|ELSE|WITH|DO/i)) {
          return "keyword";
        }
        
        // Check for HTTP methods
        if (stream.match(/GET|POST|PUT|DELETE|PATCH/i)) {
          return "atom"; // Use atom tag for HTTP methods
        }
        
        // Check for operators
        if (stream.match(/AND|OR|IN|IS NULL|IS NOT NULL|CONTAINS/i)) {
          return "operator";
        }
        
        // Check for variables (${...})
        if (stream.match(/\$\{[^}]*\}/)) {
          return "variableName";
        }
        
        // Check for action commands
        if (stream.match(/update|rawQuery|send/i)) {
          return "function";
        }
        
        // Check for strings
        if (stream.match(/"([^"\\]|\\.)*"/)) {
          return "string";
        }
        if (stream.match(/'([^'\\]|\\.)*'/)) {
          return "string";
        }
        
        // Check for numbers
        if (stream.match(/\d+/)) {
          return "number";
        }
        
        // Check for paths (/api/...)
        if (stream.match(/\/[a-zA-Z0-9/._-]+/)) {
          return "string";
        }
        
        // Consume and return nothing for other characters
        stream.next();
        return null;
      }
    });
  }

  // Custom DSL completion function
  function dslCompletions(context) {
    const word = context.matchBefore(/\w*/);
    if (word.from === word.to && !context.explicit) return null;

    // Get the line text and position for context-aware suggestions
    const line = context.state.doc.lineAt(context.pos);
    const lineText = line.text.substring(0, context.pos - line.from);
    const lineIndent = /^(\s*)/.exec(line.text)[1].length;
    
    // Get previous line text for context
    const prevLineNo = line.number > 1 ? line.number - 1 : 1;
    const prevLine = context.state.doc.line(prevLineNo);
    const prevLineText = prevLine.text;
    
    let options = [];
    
    // Context: After THEN
    if (prevLineText.includes("THEN") && lineIndent >= 4) {
      options = actions.map(action => ({
        label: action,
        type: "function",
        detail: "Action Command",
        info: `Execute the ${action} action`,
        apply: action === 'update' 
          ? `${action} ${action === 'update' ? 'field = value' : 'params'}`
          : action
      }));
    }
    // Context: After WITH... DO
    else if (prevLineText.includes("DO") && lineIndent >= 2) {
      options.push({
        label: "IF",
        type: "keyword",
        detail: "Conditional",
        info: "Start a conditional rule",
        apply: "IF HTTP_METHOD /api/path THEN\n    "
      });
    }
    // Context: After IF keyword
    else if (lineText.trim().endsWith("IF")) {
      options = [
        { label: "POST", type: "atom", detail: "HTTP Method", info: "Match POST requests", apply: " POST /api/path THEN\n    " },
        { label: "GET", type: "atom", detail: "HTTP Method", info: "Match GET requests", apply: " GET /api/path THEN\n    " },
        { label: "PUT", type: "atom", detail: "HTTP Method", info: "Match PUT requests", apply: " PUT /api/path THEN\n    " },
        { label: "DELETE", type: "atom", detail: "HTTP Method", info: "Match DELETE requests", apply: " DELETE /api/path THEN\n    " }
      ];
    }
    // Default suggestions
    else {
      options = [
        { label: "IF", type: "keyword", detail: "Conditional", info: "Creates a conditional block", apply: "IF condition THEN\n    " },
        { label: "WITH", type: "keyword", detail: "Connection", info: "Defines a connection for rules", apply: "WITH connector NAME DO\n    " },
        { label: "ELSE IF", type: "keyword", detail: "Conditional", info: "Alternative condition", apply: "ELSE IF condition THEN\n    " },
        { label: "ELSE", type: "keyword", detail: "Default Case", info: "Executes when conditions are false", apply: "ELSE\n    " },
        { label: "POST", type: "atom", detail: "HTTP Method", info: "Match POST requests", apply: "POST /api/path" },
        { label: "GET", type: "atom", detail: "HTTP Method", info: "Match GET requests", apply: "GET /api/path" },
        { label: "update", type: "function", detail: "Field Update", info: "Updates a field value", apply: "update field = value" },
        { label: "rawQuery", type: "function", detail: "Database", info: "Executes a SQL query", apply: "rawQuery data: {\"query\": \"SQL_QUERY\"}" },
        ...actions.map(action => ({
          label: action,
          type: "function",
          detail: "Action Command",
          info: `Execute the ${action} action`,
          apply: action
        })),
      ];
    }
    
    return {
      from: word.from,
      options: options,
      span: /^\w*$/
    };
  }
  
  // Hover documentation provider
  const dslHoverTooltip = hoverTooltip((view, pos) => {
    const { from, to, text } = view.state.doc.lineAt(pos);
    const wordStart = text.lastIndexOf(" ", pos - from) + 1;
    
    // Fixed: use let instead of const for wordEnd since we need to reassign it
    let wordEnd = text.indexOf(" ", pos - from);
    if (wordEnd === -1) wordEnd = text.length;
    
    const word = text.slice(wordStart, wordEnd);
    
    // Documentation for keywords
    const docs = {
      "IF": "Begins a conditional statement. Use with THEN to execute code when a condition is true.",
      "THEN": "Follows an IF statement and begins the code block to execute when the condition is true.",
      "ELSE": "Optional part of an IF statement that executes when the IF condition is false.",
      "WITH": "Defines a connection to use for database operations within the rule.",
      "DO": "Begins the main code block after a WITH statement.",
      "UPDATE": "Modifies a field or property with a new value.",
      "SEND": "Sends data to an external system or service.",
      "POST": "Matches HTTP POST requests to the specified path.",
      "GET": "Matches HTTP GET requests to the specified path.",
      "AND": "Logical AND operator to combine conditions.",
      "OR": "Logical OR operator to combine conditions.",
      "rawQuery": "Executes a raw SQL query against the connected database."
    };
    
    if (docs[word]) {
      return {
        pos: from + wordStart,
        end: from + wordEnd,
        above: true,
        create() {
          const dom = document.createElement("div");
          dom.className = "cm-tooltip-doc";
          dom.textContent = docs[word];
          return { dom };
        }
      };
    }
    return null;
  });

  // Handle validation and save
  const handleSave = async () => {
    const success = await saveCode();
    if (success) {
      alert("Rules saved successfully!");
    } else {
      alert(`Failed to save rules: ${error || "Unknown error"}`);
    }
  };

  const handleValidate = async () => {
    if (viewRef.current) {
      const content = viewRef.current.state.doc.toString();
      await validateCode(content);
    }
  };

  // Set up editor when component mounts and when dslCode changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Define DSL language
    const dslLanguage = defineDSLLanguage();
    
    // Define syntax highlighting 
    const dslHighlighting = HighlightStyle.define([
      { tag: tags.keyword, color: "#5c6bc0", fontWeight: "bold" },
      { tag: tags.atom, color: "#8e44ad", fontWeight: "500" }, // HTTP Methods
      { tag: tags.variableName, color: "#26a69a" },
      { tag: tags.string, color: "#ef5350" },
      { tag: tags.comment, color: "#546e7a", fontStyle: "italic" },
      { tag: tags.function, color: "#ec407a" },
      { tag: tags.number, color: "#ff9800" },
      { tag: tags.operator, color: "#78909c" },
    ]);
    
    // Custom extensions for DSL editor
    const extensions = [
      dslLanguage,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          setDslCode(update.state.doc.toString());
        }
      }),
      keymap.of(defaultKeymap),
      // Add line numbers
      lineNumbers(),
      highlightActiveLineGutter(),
      keymap.of(completionKeymap),
      autocompletion({
        override: [dslCompletions],
        closeOnBlur: false,
        activateOnTyping: true,
        maxRenderedOptions: 10
      }),
      dslHoverTooltip,
      indentUnit.of("    "),
      syntaxHighlighting(dslHighlighting),
      EditorState.tabSize.of(4),
      // Key command for save and validate
      keymap.of([{
        key: "Ctrl-s",
        run: () => {
          handleValidate();
          if (validationErrors.length === 0) {
            handleSave();
          }
          return true;
        }
      }]),
      // Add theme with better styling
      EditorView.theme({
        "&": {
          fontSize: "14px",
          height: "100%",
          maxHeight: "100%"
        },
        ".cm-content": {
          fontFamily: "monospace",
          padding: "10px 0",
          caretColor: "#0077ff"
        },
        ".cm-line": {
          padding: "0 10px"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "rgba(151, 181, 215, 0.93)"
        },
        ".cm-gutters": {
          backgroundColor: "#f5f5f5",
          color: "#6e7781",
          border: "none",
          borderRight: "1px solid #ddd"
        },
        ".cm-scroller": {
          overflow: "auto"
        },
        ".cm-cursor": {
          borderLeftWidth: "2px",
          borderLeftColor: "#0077ff",
          borderLeftStyle: "solid"
        }
      })
    ];

    const state = EditorState.create({
      doc: dslCode || '',
      extensions
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });
    
    viewRef.current = view;
    
    return () => {
      view.destroy();
    };
  }, [editorRef.current, actions]);
  
  // Update editor content when dslCode changes externally
  useEffect(() => {
    if (viewRef.current && dslCode !== undefined) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== dslCode) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: dslCode
          }
        });
      }
    }
  }, [dslCode]);

  if (isLoading) return <div className="p-4 text-gray-500">Loading editor...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header with help toggle */}
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
      
      {/* Help panel */}
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
      
      {/* Editor container */}
      <div className="flex space-x-2">
        <div className="flex-grow border rounded overflow-hidden" style={{ height: '500px' }}>
          {/* CodeMirror editor container */}
          <div ref={editorRef} className="h-full" />
        </div>
      </div>
      
      {/* Validation results */}
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
      
      {/* Footer controls */}
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
          onClick={handleValidate}
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