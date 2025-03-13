import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { TableView } from './TableView';
import { GridView } from './GridView';
import { ListView } from './ListView';
import { MLAnalysisView } from './MLAnalysisView';
import VideoGallery from '../VideoGallery/VideoGallery';
import { ErrorBoundary } from '../ErrorBoundary';
import { ViewType } from '../../types/cms';
import { getThemeClasses } from '../theme/ThemeProvider';

// Tab switcher component for switching between CRUD and ML Analysis views
const TabSwitcher = ({ 
  tableId, 
  activeTab, 
  onTabChange 
}: { 
  tableId: string; 
  activeTab: 'crud' | 'ml'; 
  onTabChange: (tab: 'crud' | 'ml') => void;
}) => {
  const config = useCMSStore((state) => state.config);
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);

  if (!config || !tableId || !config.cms.tables[tableId]) {
    return null;
  }

  const table = config.cms.tables[tableId];
  const hasMlModels = Boolean(table.mlmodel && table.mlmodel.length > 0);

  // Only show the tab switcher if the table has ML models
  if (!hasMlModels) {
    return null;
  }

  return (
    <div className={`mb-4 border-b ${themeClasses.border}`}>
      <div className="flex">
        <button
          onClick={() => onTabChange('crud')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'crud'
              ? `${themeClasses.accent} text-white border-b-2 border-${themeClasses.accent.replace('bg-', '')}`
              : `${themeClasses.text} hover:${themeClasses.hover}`
          }`}
        >
          Data View
        </button>
        <button
          onClick={() => onTabChange('ml')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'ml'
              ? `${themeClasses.accent} text-white border-b-2 border-${themeClasses.accent.replace('bg-', '')}`
              : `${themeClasses.text} hover:${themeClasses.hover}`
          }`}
        >
          ML Analysis
        </button>
      </div>
    </div>
  );
};

const ViewContent = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);
  const [activeTab, setActiveTab] = useState<'crud' | 'ml'>('crud');
  const location = useLocation();

  if (!config || !tableId || !config.cms.tables[tableId]) {
    console.error('Table configuration not found:', { tableId, config });
    return <div>Table not found</div>;
  }

  const table = config.cms.tables[tableId];
  const hasMlModels = Boolean(table.mlmodel && table.mlmodel.length > 0);
  
  // Reset to CRUD view when changing tables
  useEffect(() => {
    setActiveTab('crud');
  }, [tableId]);

  // Check for ML tab in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'ml' && hasMlModels) {
      setActiveTab('ml');
    }
  }, [location.search, hasMlModels]);

  // If ML tab is active, show ML Analysis view
  if (activeTab === 'ml' && hasMlModels) {
    console.log('Rendering MLAnalysisView');
    return (
      <>
        <TabSwitcher tableId={tableId} activeTab={activeTab} onTabChange={setActiveTab} />
        <MLAnalysisView />
      </>
    );
  }

  // Otherwise, show the regular view based on list_type
  const viewType: ViewType = table.listView.list_type || 'table';
  console.log('ContentView rendering:', { tableId, viewType, table });

  // Select view based on list_type while maintaining all options
  let contentView;
  switch (viewType) {
    case 'grid':
      console.log('Rendering GridView');
      contentView = <GridView />;
      break;
    case 'list':
      console.log('Rendering ListView');
      contentView = <ListView />;
      break;
    case 'table':
      console.log('Rendering TableView');
      contentView = <TableView />;
      break;
    case 'video-gallery':
      console.log('Rendering VideoGallery');
      contentView = <VideoGallery />;
      break;
    default:
      console.warn(`Unknown view type: ${viewType}, falling back to TableView`);
      contentView = <TableView />;
  }

  return (
    <>
      {hasMlModels && (
        <TabSwitcher tableId={tableId} activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      {contentView}
    </>
  );
};

export const ContentView = () => {
  return (
    <ErrorBoundary>
      <ViewContent />
    </ErrorBoundary>
  );
};
