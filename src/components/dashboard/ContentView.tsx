import React from 'react';
import { useParams } from 'react-router-dom';
import { useCMSStore } from '../../store/cms';
import { TableView } from './TableView';
import { GridView } from './GridView';
import { ListView } from './ListView';
import { ErrorBoundary } from '../ErrorBoundary';
import { ViewType } from '../../types/cms';

const ViewContent = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const config = useCMSStore((state) => state.config);

  if (!config || !tableId || !config.cms.tables[tableId]) {
    console.error('Table configuration not found:', { tableId, config });
    return <div>Table not found</div>;
  }

  const table = config.cms.tables[tableId];
  const viewType: ViewType = table.listView.list_type || 'table';

  console.log('ContentView rendering:', { tableId, viewType, table });

  // Select view based on list_type while maintaining all options
  switch (viewType) {
    case 'grid':
      console.log('Rendering GridView');
      return <GridView />;
    case 'list':
      console.log('Rendering ListView');
      return <ListView />;
    case 'table':
      console.log('Rendering TableView');
      return <TableView />;
    default:
      console.warn(`Unknown view type: ${viewType}, falling back to TableView`);
      return <TableView />;
  }
};

export const ContentView = () => {
  return (
    <ErrorBoundary>
      <ViewContent />
    </ErrorBoundary>
  );
};
