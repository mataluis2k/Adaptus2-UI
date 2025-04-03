import React, { useEffect, useRef } from "react";
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
  });

  const dslSuggestions = actions.map((action) => ({
    label: action,
    kind: 14,
    insertText: action,
    detail: "Action Command",
  }));

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.register({ id: "dsl" });

    monaco.languages.setMonarchTokensProvider("dsl", {
      tokenizer: {
        root: [
          [/\b(IF|THEN|ELSE IF|ELSE|WITH|DO|UPDATE|SEND|WHEN)\b/, "keyword"],
          [/\b(AND|OR|IN|IS NULL|IS NOT NULL|CONTAINS)\b/, "operator"],
          [/".*?"/, "string"],
          [/[a-zA-Z_][\w\.]*/, "identifier"],
          [/=|!=|>=|<=|>|</, "operator"],
        ],
      },
    });

    monaco.languages.registerCompletionItemProvider("dsl", {
      provideCompletionItems: () => {
        return { suggestions: dslSuggestions };
      },
    });
  };

  if (isLoading) return <div className="p-4 text-gray-500">Loading editor...</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Business Rules DSL Editor</h2>
      <Editor
        height="500px"
        defaultLanguage="dsl"
        value={dslCode} // This should show initial value
        onChange={(val) => setDslCode(val || "")}
        onValidate={() => validateDsl(dslCode)}
        beforeMount={handleEditorWillMount}
        options={getMonacoOptions()}
        onMount={(editor) => {
          // Store editor reference
          editorRef.current = editor;
          
          // Set initial value explicitly
          if (dslCode) {
            editor.setValue(dslCode);
          }
          
          editor.onDidBlurEditorWidget(() => validateDsl(dslCode));
        }}
      />
      {validationErrors.length > 0 && (
        <div className="text-red-500 bg-red-100 p-2 rounded">
          <h4 className="font-semibold">Validation Errors:</h4>
          <ul className="list-disc ml-5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      {astPreview && (
        <div className="bg-gray-100 p-4 rounded">
          <h4 className="font-semibold">Parsed AST Preview:</h4>
          <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
            {astPreview}
          </pre>
        </div>
      )}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Rules"}
      </button>
      <div className="text-sm text-gray-600">
        {dslCode ? `DSL content loaded (${dslCode.length} characters)` : "No DSL content loaded"}
      </div>
    </div>
  );
};

export default DslEditor;