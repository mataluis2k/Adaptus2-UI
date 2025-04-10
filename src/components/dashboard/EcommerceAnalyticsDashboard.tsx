import React, { useState, useEffect } from 'react';
import { 
    fetchClickstreamData, 
    processClickstreamData,
    EventData,
    UserJourney,
    UserSession,
    EventTypeCount,
    TimelineDataPoint,
    PageViewCount,
    ProductInteraction,
    JourneyPath,
    ClickstreamAnalytics
  } from '../../api/clickstream-api';
import { useApiErrorHandler } from '../../api/client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Calendar, Clock, User, MousePointer, Eye, Activity, ArrowDown, ArrowUp } from 'lucide-react';
import _ from 'lodash';

// Simple stat card component
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className="mt-4">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
};

// Change indicator component for showing trends
const ChangeIndicator = ({ value, inverted = false }) => {
  const numValue = parseFloat(value);
  const isPositive = inverted ? numValue < 0 : numValue > 0;
  const isNegative = inverted ? numValue > 0 : numValue < 0;
  const isZero = numValue === 0;
  
  if (isZero) {
    return <span className="ml-2 text-sm text-gray-500">0%</span>;
  }
  
  return (
    <div className={`ml-2 flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? 
        <ArrowUp className="h-3 w-3 mr-1" /> : 
        <ArrowDown className="h-3 w-3 mr-1" />
      }
      <span className="text-sm">{Math.abs(numValue)}%</span>
    </div>
  );
};

const EcommerceAnalyticsDashboard = () => {
  // State management
  const [clickstreamData, setClickstreamData] = useState([]);
  const [userJourneys, setUserJourneys] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [pageViewsByUrl, setPageViewsByUrl] = useState([]);
  const [productInteractions, setProductInteractions] = useState([]);
  const [topJourneyPaths, setTopJourneyPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  // Colors for charts
  const colors = {
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#f97316',
    warning: '#eab308',
    danger: '#ef4444',
    success: '#22c55e',
    info: '#3b82f6',
    light: '#f3f4f6',
    dark: '#1f2937'
  };

  const colorPalette = [
    '#4f46e5', '#10b981', '#f97316', '#eab308', 
    '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'
  ];

  // Get the error handler hook at component level
  const handleApiError = useApiErrorHandler();

  // Load and process clickstream data with controlled refresh rate
  useEffect(() => {
    let isMounted = true;
    const refreshInterval = 30000; // 30 seconds refresh rate
    let timeoutId: number | null = null;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      // Only set loading to true on initial load
      if (!timelineData.length) {
        setLoading(true);
      }
      setError(null);
      
      try {
        // Fetch data from API based on selected timeframe
        const response = await fetchClickstreamData(selectedTimeframe);
        
        if (!isMounted) return;
        
        // Process the data using our API utility
        const analytics = processClickstreamData(response.data);
        
        // Update all state variables with processed data
        setClickstreamData(analytics.events);
        setUserJourneys(analytics.userJourneys);
        setEventTypes(analytics.eventTypes);
        setTimelineData(analytics.timelineData);
        setUserSessions(analytics.userSessions);
        setPageViewsByUrl(analytics.pageViewsByUrl);
        setProductInteractions(analytics.productInteractions);
        setTopJourneyPaths(analytics.topJourneyPaths);
      } catch (err) {
        if (!isMounted) return;
        
        // Use the error handler from the API client
        const errorResult = handleApiError(err);
        console.error("Error fetching clickstream data:", errorResult);
        setError(errorResult.message || "Failed to load clickstream data. Please try again later.");
      } finally {
        if (isMounted) {
          setLoading(false);
          
          // Schedule next refresh
          timeoutId = window.setTimeout(fetchData, refreshInterval);
        }
      }
    };

    // Initial fetch
    fetchData();
    
    // Cleanup function to prevent memory leaks and unnecessary fetches
    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [selectedTimeframe]);

  // No need for this effect - the main useEffect already handles timeframe changes
  // and the processLocalClickstreamData function is updating state which causes an infinite loop

  // Process clickstream data for different visualizations locally
  // This function should only be used for local transformations without state updates
  // Removed unused implementation that was causing infinite loops

  // Filter data based on selected timeframe
  const filterDataByTimeframe = (data, timeframe) => {
    if (timeframe === 'all') return data;
    
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
        return data;
    }
    
    return data.filter(event => new Date(event.created_at) >= cutoff);
  };

  // Event handler for selecting a user
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  // Filter data for the selected user
  const getUserData = () => {
    if (!selectedUserId) return null;
    
    const userData = userSessions.find(user => user.userId === selectedUserId);
    if (!userData) return null;
    
    const userEvents = clickstreamData.filter(event => event.user_id === selectedUserId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const sessionEvents = userData.sessions.map((session, idx) => ({
      sessionId: idx + 1,
      events: session,
      startTime: session.length > 0 ? new Date(session[0].created_at).toLocaleTimeString() : 'N/A',
      endTime: session.length > 0 ? new Date(session[session.length - 1].created_at).toLocaleTimeString() : 'N/A',
      duration: session.length > 1 ? 
        ((new Date(session[session.length - 1].created_at).getTime() - 
          new Date(session[0].created_at).getTime()) / 1000).toFixed(0) + 's' : 'N/A',
      eventCount: session.length
    }));
    
    return {
      userId: selectedUserId,
      eventCount: userData.eventCount,
      sessionCount: userData.sessionCount,
      events: userEvents,
      sessions: sessionEvents
    };
  };


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading clickstream data...</p>
        </div>
      </div>
    );
  }

  const selectedUserData = getUserData();


  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clickstream Analytics Dashboard</h1>
              <p className="text-gray-500">Analyze user journeys and interaction patterns</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setSelectedTimeframe('hour')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${selectedTimeframe === 'hour' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last Hour
              </button>
              <button 
                onClick={() => setSelectedTimeframe('day')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${selectedTimeframe === 'day' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last Day
              </button>
              <button 
                onClick={() => setSelectedTimeframe('week')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${selectedTimeframe === 'week' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last Week
              </button>
              <button 
                onClick={() => setSelectedTimeframe('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${selectedTimeframe === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Events" 
            value={clickstreamData.length} 
            icon={<Activity className="w-6 h-6 text-indigo-500" />}
          />
          <StatCard 
            title="Unique Users" 
            value={userSessions.length} 
            icon={<User className="w-6 h-6 text-emerald-500" />}
          />
          <StatCard 
            title="Page Views" 
            value={pageViewsByUrl.reduce((sum, item) => sum + item.count, 0)} 
            icon={<Eye className="w-6 h-6 text-amber-500" />}
          />
          <StatCard 
            title="Avg. Events Per User" 
            value={(clickstreamData.length / (userSessions.length || 1)).toFixed(1)} 
            icon={<MousePointer className="w-6 h-6 text-blue-500" />}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Types Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-md font-medium text-gray-700 mb-4">Event Types Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(180, 180, 180, 0.2)' }} />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill={colors.primary} 
                    name="Event Count" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-md font-medium text-gray-700 mb-4">Event Timeline</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(180, 180, 180, 0.2)' }} />
                  <Legend />
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Event Count" 
                    stroke={colors.primary} 
                    fillOpacity={1} 
                    fill="url(#colorEvents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Analysis */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-4">Top User Journey Paths</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journey Path
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topJourneyPaths.map((journey, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {journey.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journey.count} {journey.count === 1 ? 'time' : 'times'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User List and Detail View */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-1">
            <h3 className="text-md font-medium text-gray-700 mb-4">User Sessions</h3>
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userSessions.map((user, i) => (
                    <tr 
                      key={i} 
                      className={`${selectedUserId === user.userId ? 'bg-indigo-50' : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')} cursor-pointer hover:bg-gray-100`}
                      onClick={() => handleUserSelect(user.userId)}
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.userId.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {user.sessionCount}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {user.eventCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Detail View */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
            <h3 className="text-md font-medium text-gray-700 mb-4">
              {selectedUserId ? `User Detail: ${selectedUserId.slice(0, 8)}...` : 'Select a user to view details'}
            </h3>
            
            {selectedUserData ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Events</h4>
                    <p className="text-xl font-semibold">{selectedUserData.eventCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Sessions</h4>
                    <p className="text-xl font-semibold">{selectedUserData.sessionCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Last Seen</h4>
                    <p className="text-xl font-semibold">
                      {selectedUserData.events.length > 0 ? 
                        new Date(selectedUserData.events[selectedUserData.events.length - 1].created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-2">Session Timeline</h4>
                <div className="overflow-y-auto max-h-64 mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Time
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Events
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedUserData.sessions.map((session, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            Session {session.sessionId}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {session.startTime}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {session.endTime}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {session.duration}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {session.eventCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-2">Event Stream</h4>
                <div className="overflow-y-auto max-h-96">
                  <div className="relative">
                    {/* Time-oriented vertical timeline */}
                    <div className="border-l-2 border-indigo-200 absolute h-full left-4"></div>
                    
                    {selectedUserData.events.map((event, i) => (
                      <div key={i} className="mb-4 ml-12 relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-10 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-white text-xs">{i+1}</span>
                        </div>
                        
                        {/* Event time */}
                        <div className="absolute -left-36 top-0 w-24 text-right">
                          <span className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {/* Event card */}
                        <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm text-indigo-600">
                              {event.event_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {event.page_url && (
                            <div className="text-xs text-gray-600 mb-1">
                              URL: {event.page_url}
                            </div>
                          )}
                          
                          {event.event_data && Object.keys(event.event_data).length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-500 mb-1">Event Data:</div>
                              <div className="bg-white p-2 rounded text-xs overflow-x-auto">
                                <pre className="text-gray-700">
                                  {JSON.stringify(event.event_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Select a user from the list to view their journey details</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Interactions */}
          {productInteractions.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-md font-medium text-gray-700 mb-4">Product Interactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Add to Cart Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productInteractions.map((product, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${product.price?.toFixed(2) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EcommerceAnalyticsDashboard;

