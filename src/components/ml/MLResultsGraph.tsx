import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { api, useApiErrorHandler } from '../../api/client';
import ClusteringGraph from './recommendation';
import AnomalyRecord from './AnomalyRecord';
import AnomalyGraph from './AnomalyGraph';
import { mockRecommendationData, mockAnomalyData, mockSentimentData } from './mockData';

interface MLResultsGraphProps {
  tableName: string;
  modelType: string;
}

// Component to display loading state
const LoadingMessage = () => {
  return (
    <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <div className="text-gray-800 dark:text-gray-200 text-lg">Loading ML data...</div>
    </div>
  );
};

// Component to display error state
const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center space-x-3">
        <span className="text-red-500 text-lg">{message}</span>
      </div>
    </div>
  );
};

// Fallback component to display raw data
const RawDataDisplay = ({ data, title }: { data: any; title: string }) => {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="mb-4">The data structure doesn't match the expected format for visualization.</p>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
};

const MLResultsGraph: React.FC<MLResultsGraphProps> = ({ tableName, modelType }) => {
  const handleApiError = useApiErrorHandler();

  console.log(`MLResultsGraph: Fetching data for table=${tableName}, model=${modelType}`);

  // Fetch ML data for the selected model
  const { data: mlData, isLoading, error } = useQuery(
    ['mlData', tableName, modelType],
    async () => {
      // Construct the URL path according to the API endpoint format
      const url = `/ml/${tableName}/${modelType}`;
      console.log(`Making API request to: ${url}`);
      
      try {
        // Use the API client which is already configured with the correct base URL
        const response = await api.get(url);
        console.log(`API response received:`, response.data);
        return response.data;
      } catch (err) {
        console.error(`API request failed:`, err);
        // Log more details about the error
        if (axios.isAxiosError(err)) {
          console.error('Axios error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            config: err.config
          });
        }
        const apiError = handleApiError(err);
        throw new Error(apiError.message);
      }
    },
    {
      enabled: Boolean(tableName && modelType),
      keepPreviousData: true,
      retry: (failureCount, error: Error) => {
        // Don't retry on 401, 403, or 404
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );

  console.log(`MLResultsGraph state: isLoading=${isLoading}, error=${error ? 'yes' : 'no'}, data=${mlData ? 'yes' : 'no'}`);
  
  // Log the actual data structure
  if (mlData) {
    console.log('ML Data structure:', JSON.stringify(mlData, null, 2));
    console.log('ML Data has clusters?', mlData.clusters ? 'yes' : 'no');
    if (mlData.clusters) {
      console.log('Number of clusters:', mlData.clusters.length);
    }
  }

  if (isLoading) {
    return <LoadingMessage />;
  }

  // Use mock data if there's an error or the API returns unexpected data
  let dataToUse = mlData;
  
  if (error) {
    console.log(`Using mock data for ${modelType} due to API error`);
    switch (modelType) {
      case 'recommendation':
        dataToUse = mockRecommendationData;
        break;
      case 'anomaly':
        dataToUse = mockAnomalyData;
        break;
      case 'sentiment':
        dataToUse = mockSentimentData;
        break;
      default:
        return <ErrorMessage message={(error as Error).message} />;
    }
  } else if (!mlData) {
    return <ErrorMessage message="No ML data available" />;
  }

  // Check if the data has the expected structure for the visualization
  if (modelType === 'recommendation' && (!dataToUse.clusters || !Array.isArray(dataToUse.clusters))) {
    console.log('Using mock recommendation data due to unexpected data structure');
    dataToUse = mockRecommendationData;
  }

  if (modelType === 'anomaly' && (!dataToUse.stats || !dataToUse.anomalies)) {
    console.log('Using mock anomaly data due to unexpected data structure');
    dataToUse = mockAnomalyData;
  }

  // Render the appropriate ML visualization component based on the model type
  switch (modelType) {
    case 'recommendation':
      return <ClusteringGraph payload={dataToUse} />;
    case 'anomaly':
      return (
        <div className="space-y-8">
          <AnomalyRecord data={dataToUse} />
          <AnomalyGraph data={dataToUse} />
        </div>
      );
    case 'sentiment':
      // Placeholder for sentiment analysis component
      return (
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
          <p>Sentiment analysis visualization not implemented yet.</p>
          <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
            {JSON.stringify(dataToUse, null, 2)}
          </pre>
        </div>
      );
    default:
      return (
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-bold mb-4">Unknown Model Type: {modelType}</h2>
          <p>No specific visualization available for this model type.</p>
          <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
            {JSON.stringify(dataToUse, null, 2)}
          </pre>
        </div>
      );
  }
};

export default MLResultsGraph;
