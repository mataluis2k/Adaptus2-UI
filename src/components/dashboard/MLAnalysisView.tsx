import React from 'react';
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { ErrorBoundary } from '../ErrorBoundary';
import MLResultsGraph from '../ml/MLResultsGraph';

// Component to display error state
const ErrorMessage = ({ message }: { message: string }) => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  return (
    <div className={`flex items-center justify-center p-6 ${themeClasses.modalBackground} rounded-lg shadow-md`}>
      <div className="flex items-center space-x-3">
        <span className={`${themeClasses.text} text-lg text-red-500`}>{message}</span>
      </div>
    </div>
  );
};

// Main component content
const MLAnalysisContent = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return <ErrorMessage message="Table configuration not found" />;
  }

  const table = config.cms.tables[tableId];
  
  // Check if the table has ML models defined
  if (!table.mlmodel || table.mlmodel.length === 0) {
    return <ErrorMessage message="No ML models defined for this table" />;
  }

  return (
    <div className={`${themeClasses.primary} rounded-lg shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${themeClasses.border}`}>
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-semibold ${themeClasses.text}`}>
            ML Analysis: {table.title}
          </h1>
        </div>
      </div>

      {/* ML Visualizations - Render all models */}
      <div className="p-6 space-y-8">
        {table.mlmodel.map((modelType) => {
          // Log the table information for debugging
          console.log('MLAnalysisView - Table info:', {
            tableId,
            dbTable: table.dbTable,
            tableName: table.dbTable || tableId,
            modelType
          });
          
          return (
            <div key={modelType} className="mb-8">
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>
                {modelType.charAt(0).toUpperCase() + modelType.slice(1)} Analysis
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <MLResultsGraph 
                  tableName={table.dbTable || tableId} 
                  modelType={modelType} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Wrapped with error boundary
export const MLAnalysisView = () => {
  return (
    <ErrorBoundary>
      <MLAnalysisContent />
    </ErrorBoundary>
  );
};
