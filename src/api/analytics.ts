import { api } from './client';

export interface ResponseTime {
  value: string;
  score: string;
}

export interface EndpointAnalytics {
  responseTimes: ResponseTime[];
  statusCodes: Record<string, string>;
  patterns: {
    hourly: Record<string, string>;
    daily: Record<string, string>;
    averageResponseTime: Record<string, string>;
  };
}

export interface EndpointData {
  endpoint: string;
  analytics: EndpointAnalytics;
  currentRate: {
    requestsPerMinute: number;
    timestamp: number;
  };
}

export interface AnalyticsResponse {
  timestamp: string;
  endpoints: EndpointData[];
}

export interface AggregatedEndpointData extends EndpointData {
  occurrences: number;
}

export const fetchEndpointAnalytics = async (): Promise<AnalyticsResponse> => {
  try {
    // Set proper headers for JSON response
    const response = await api.get<AnalyticsResponse>('/analytics/health', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Handle non-JSON responses
    if (typeof response.data === 'string') {
      console.error('Received string response instead of JSON');
      // Return safe default
      return {
        timestamp: new Date().toISOString(),
        endpoints: []
      };
    }
    
    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response: No data received');
    }
    
    // Ensure we have an endpoints array, even if empty
    if (!response.data.endpoints) {
      response.data.endpoints = [];
    }
    
    // Deduplicate endpoints by URL
    const uniqueEndpoints = deduplicateEndpoints(response.data.endpoints);
    
    return {
      timestamp: response.data.timestamp,
      endpoints: uniqueEndpoints
    };
  } catch (error) {
    console.error('Error fetching endpoint analytics:', error);
    // Return a safe default structure
    return {
      timestamp: new Date().toISOString(),
      endpoints: []
    };
  }
};

// Function to deduplicate endpoints by merging data from duplicates
export const deduplicateEndpoints = (endpoints: EndpointData[]): EndpointData[] => {
  const endpointMap = new Map<string, EndpointData & { occurrences: number }>();
  
  endpoints.forEach(endpoint => {
    if (!endpoint || !endpoint.endpoint) return;
    
    const url = endpoint.endpoint;
    
    if (endpointMap.has(url)) {
      // Endpoint already exists, merge data
      const existing = endpointMap.get(url)!;
      existing.occurrences += 1;
      
      // Merge status codes
      if (endpoint.analytics?.statusCodes) {
        Object.entries(endpoint.analytics.statusCodes).forEach(([code, count]) => {
          const currentCount = parseInt(existing.analytics.statusCodes[code] || '0', 10);
          const newCount = parseInt(count, 10);
          existing.analytics.statusCodes[code] = (currentCount + newCount).toString();
        });
      }
      
      // Merge response times (keep all)
      if (endpoint.analytics?.responseTimes) {
        existing.analytics.responseTimes = [
          ...existing.analytics.responseTimes,
          ...endpoint.analytics.responseTimes
        ];
      }
      
      // Use the highest current rate
      if (endpoint.currentRate && endpoint.currentRate.requestsPerMinute > existing.currentRate.requestsPerMinute) {
        existing.currentRate.requestsPerMinute = endpoint.currentRate.requestsPerMinute;
      }
      
      // Merge hourly patterns
      if (endpoint.analytics?.patterns?.hourly) {
        Object.entries(endpoint.analytics.patterns.hourly).forEach(([hour, count]) => {
          const currentCount = parseInt(existing.analytics.patterns.hourly[hour] || '0', 10);
          const newCount = parseInt(count, 10);
          existing.analytics.patterns.hourly[hour] = (currentCount + newCount).toString();
        });
      }
      
      // Merge daily patterns
      if (endpoint.analytics?.patterns?.daily) {
        Object.entries(endpoint.analytics.patterns.daily).forEach(([day, count]) => {
          const currentCount = parseInt(existing.analytics.patterns.daily[day] || '0', 10);
          const newCount = parseInt(count, 10);
          existing.analytics.patterns.daily[day] = (currentCount + newCount).toString();
        });
      }
      
      // Recalculate average response times
      // This is more complex as we need to weight by request count
      // For simplicity, we'll just use the more recent/relevant one
    } else {
      // New endpoint, add to map
      endpointMap.set(url, {
        ...endpoint,
        occurrences: 1
      });
    }
  });
  
  return Array.from(endpointMap.values());
};