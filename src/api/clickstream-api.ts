import { api } from '../api/client';
import { AxiosError } from 'axios';
import _ from 'lodash';

// Event data interfaces
export interface EventData {
  id: number;
  event_type: string;
  user_id: string;
  page_url: string;
  user_agent: string;
  ip_address: string | null;
  event_data: Record<string, any>;
  created_at: string;
}

export interface PaginationMetadata {
  totalRecords: number;
  limit: number;
  offset: number;
  totalPages: number;
}

export interface ClickstreamResponse {
  data: EventData[];
  metadata: PaginationMetadata;
  requestId: string;
}

export interface UserJourney {
  userId: string;
  journey: string[];
  events: EventData[];
  startTime: string;
  endTime: string;
  duration: number;
}

export interface UserSession {
  userId: string;
  eventCount: number;
  sessionCount: number;
  sessions: EventData[][];
}

export interface ProductInteraction {
  name: string;
  count: number;
  price?: number;
  category?: string;
}

export interface EventTypeCount {
  type: string;
  count: number;
}

export interface TimelineDataPoint {
  time: string;
  count: number;
}

export interface PageViewCount {
  url: string;
  count: number;
}

export interface JourneyPath {
  path: string;
  count: number;
}

export interface ClickstreamAnalytics {
  events: EventData[];
  userJourneys: UserJourney[];
  userSessions: UserSession[];
  eventTypes: EventTypeCount[];
  timelineData: TimelineDataPoint[];
  pageViewsByUrl: PageViewCount[];
  productInteractions: ProductInteraction[];
  topJourneyPaths: JourneyPath[];
}

// Fetch raw clickstream data
export const fetchClickstreamData = async (
  timeframe: string = 'all',
  limit: number = 500,
  offset: number = 0
): Promise<ClickstreamResponse> => {
  try {
    // Determine date filter based on timeframe
    let startDate = '';
    const now = new Date();
    
    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        // All time - no filter
        break;
    }

    const params: Record<string, any> = { limit, offset };
    if (startDate) params.startDate = startDate;
    
    // Using the existing api client
    const response = await api.get<ClickstreamResponse>('/api/events', { params });
    
    // Validate response
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response: No data received');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching clickstream data:', error);
    
    // Handle API errors
    if (error instanceof AxiosError) {
      // The existing API client already has error handling via interceptors
      // So we just need to pass it through
      throw error;
    }
    
    // Return a safe default structure for other errors
    return {
      data: [],
      metadata: {
        totalRecords: 0,
        limit,
        offset,
        totalPages: 0
      },
      requestId: ''
    };
  }
};

// Process clickstream data to extract analytics
export const processClickstreamData = (events: EventData[]): ClickstreamAnalytics => {
  // Using lodash for data manipulation
  
  // Calculate event type distribution
  const eventTypeMap = _.countBy(events, 'event_type');
  const eventTypes = Object.entries(eventTypeMap).map(([type, count]) => ({
    type,
    count: count as number
  })).sort((a, b) => b.count - a.count);
  
  // Get the count of events over time
  const eventsByTime = _.groupBy(events, (event: EventData) => {
    const date = new Date(event.created_at);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  });
  
  const timelineData = Object.entries(eventsByTime).map(([time, events]) => ({
    time,
    count: events.length
  })).sort((a, b) => {
    const [aHour, aMinute] = a.time.split(':').map(Number);
    const [bHour, bMinute] = b.time.split(':').map(Number);
    return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
  });

  // Identify unique users and their sessions
  const userMap = _.groupBy(events, 'user_id');
  const userSessions = Object.entries(userMap).map(([userId, userEvents]) => {
    // Sort events by time
    const sortedEvents = userEvents.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Split events into sessions (gap of >5 minutes = new session)
    let sessions = [];
    let currentSession = sortedEvents.length > 0 ? [sortedEvents[0]] : [];
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const prevEvent = sortedEvents[i-1];
      
      const timeDiff = (new Date(currentEvent.created_at).getTime() - 
                       new Date(prevEvent.created_at).getTime()) / 1000 / 60;
      
      if (timeDiff > 5) {
        sessions.push([...currentSession]);
        currentSession = [currentEvent];
      } else {
        currentSession.push(currentEvent);
      }
    }
    
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    return {
      userId,
      eventCount: userEvents.length,
      sessionCount: sessions.length,
      sessions
    };
  });

  // Process page views
  const pageViews = events.filter(event => 
    event.event_type === 'page_view' || event.event_type === 'pageview'
  );
  
  const pageViewsByUrlMap = _.countBy(pageViews, 'page_url');
  const pageViewsByUrl = Object.entries(pageViewsByUrlMap).map(([url, count]) => ({
    url,
    count: count as number
  })).sort((a, b) => b.count - a.count);

  // Process product interactions
  const productEvents = events.filter(event => 
    event.event_type === 'add_to_cart' || 
    (event.event_type === 'click' && event.event_data?.text === 'Add to Cart')
  );
  
  const productData = productEvents.reduce((acc: ProductInteraction[], event) => {
    if (event.event_type === 'add_to_cart' && event.event_data?.product_name) {
      const existing = acc.find(p => p.name === event.event_data.product_name);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          name: event.event_data.product_name,
          count: 1,
          price: event.event_data.product_price,
          category: event.event_data.product_category
        });
      }
    }
    return acc;
  }, []);

  // Extract user journeys as sequences of events
  const userJourneys = userSessions.flatMap(userData => 
    userData.sessions.map(session => ({
      userId: userData.userId,
      journey: session.map(event => event.event_type),
      events: session,
      startTime: session[0]?.created_at || '',
      endTime: session[session.length - 1]?.created_at || '',
      duration: session.length > 1 ? 
        (new Date(session[session.length - 1].created_at).getTime() - 
         new Date(session[0].created_at).getTime()) / 1000 : 0
    }))
  );
  
  // Calculate the most common user journey paths
  const simplifiedJourneys = userJourneys.map(journey => {
    const path = journey.journey
      .filter(event => !['visibility_hidden', 'visibility_visible'].includes(event))
      .join(' → ');
    return path;
  });
  
  // Count occurrences of each path
  const pathCounts = _.countBy(simplifiedJourneys);
  
  // Convert to array and sort by count
  const topJourneyPaths = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    events,
    userJourneys,
    userSessions,
    eventTypes,
    timelineData,
    pageViewsByUrl,
    productInteractions: productData,
    topJourneyPaths
  };
};

// Dev/test helper function - for development without a backend
// In production, this would be removed
export const fetchMockClickstreamData = async (timeframe: string = 'all'): Promise<ClickstreamResponse> => {
  try {
    // Load sample data for development - use fetch directly for local files
    const response = await fetch('/data/clickstream-sample.json');
    const jsonData = await response.json();
    
    let filteredData = jsonData.data;
    
    // Apply timeframe filter if needed
    if (timeframe !== 'all') {
      const now = new Date();
      let cutoff;
      
      switch (timeframe) {
        case 'hour':
          cutoff = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = null;
      }
      
      if (cutoff) {
        filteredData = jsonData.data.filter((event: EventData) => 
          new Date(event.created_at) >= cutoff
        );
      }
    }
    
    return {
      data: filteredData,
      metadata: {
        ...jsonData.metadata,
        totalRecords: filteredData.length
      },
      requestId: jsonData.requestId || ''
    };
  } catch (error) {
    console.error('Error fetching mock clickstream data:', error);
    return {
      data: [],
      metadata: {
        totalRecords: 0,
        limit: 0,
        offset: 0,
        totalPages: 0
      },
      requestId: ''
    };
  }
};

// Agent Workflow related interfaces and functions
export interface WorkflowEvent {
  id?: string;
  timestamp: string;
  userId: string;
  workflowId: string;
  agentId?: string;
  mcpId?: string;
  eventType: 'start' | 'complete' | 'error' | 'step';
  status?: 'pending' | 'success' | 'failure';
  duration?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowAnalytics {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  avgCompletionTime: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
  workflowPerformance: Array<{
    workflowId: string;
    name: string;
    avgCompletionTime: number;
    successRate: number;
  }>;
}

// Track a workflow event
export const trackWorkflowEvent = async (eventData: WorkflowEvent): Promise<WorkflowEvent> => {
  try {
    const response = await api.post<WorkflowEvent>('/api/workflow/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error tracking workflow event:', error);
    // For now, return the original data to prevent UI breakage
    return eventData;
  }
};

// Get workflow analytics
export const getWorkflowAnalytics = async (
  startDate?: string,
  endDate?: string,
  filters?: Record<string, any>
): Promise<WorkflowAnalytics> => {
  try {
    const response = await api.get<WorkflowAnalytics>('/api/workflow/analytics', {
      params: {
        startDate,
        endDate,
        ...filters,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting workflow analytics:', error);
    // Return mock data for development
    return {
      totalWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0,
      avgCompletionTime: 0,
      topFailureReasons: [],
      workflowPerformance: []
    };
  }
};

// Get workflow events for a specific workflow
export const getWorkflowEvents = async (workflowId: string): Promise<WorkflowEvent[]> => {
  try {
    const response = await api.get<WorkflowEvent[]>(`/api/workflow/${workflowId}/events`);
    return response.data;
  } catch (error) {
    console.error('Error getting workflow events:', error);
    return [];
  }
};