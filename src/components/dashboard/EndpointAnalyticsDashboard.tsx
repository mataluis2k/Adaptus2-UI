import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { fetchEndpointAnalytics } from '../../api/analytics';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  TimeScale,
  ArcElement
} from 'chart.js';
import { 
  AlertCircle, 
  Clock, 
  Activity, 
  Loader, 
  RefreshCw,
  BarChart,
  PieChart,
  Server,
  CheckCircle,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { useCMSStore } from '../../store/cms';
import { getThemeClasses } from '../theme/ThemeProvider';
import { useAuthStore } from '../../store/auth';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement
);

const EndpointAnalyticsDashboard: React.FC = () => {
  const theme = useCMSStore((state) => state.theme);
  const themeClasses = getThemeClasses(theme);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute by default
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  // Period selection for analytics view
  const [selectedPeriod, setSelectedPeriod] = useState<'hourly' | 'daily'>('hourly');

  // Get auth token for API requests
  const token = useAuthStore((state) => state.token);

  // Fetch analytics data with react-query
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery(
    'endpointAnalytics',
    fetchEndpointAnalytics,
    {
      refetchInterval: refreshInterval,
      refetchOnWindowFocus: true,
      staleTime: 30000, // Consider data stale after 30 seconds
      enabled: !!token, // Only run query when authenticated
      retry: 2,
      onError: (err) => {
        console.error('Failed to fetch analytics data:', err);
      }
    }
  );

  // Format the last updated time
  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Toggle endpoint expansion
  const toggleEndpointExpansion = (endpoint: string) => {
    if (expandedEndpoint === endpoint) {
      setExpandedEndpoint(null);
    } else {
      setExpandedEndpoint(endpoint);
    }
  };

  // Calculate total request count across all endpoints
  const calculateTotalRequests = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return 0;

    return data.endpoints.reduce((total, endpoint) => {
      if (!endpoint?.analytics?.statusCodes) return total;
      
      return total + Object.values(endpoint.analytics.statusCodes).reduce((sum, count) => {
        return sum + (parseInt(count, 10) || 0);
      }, 0);
    }, 0);
  };

  // Group endpoints by type (REST, GraphQL, etc.)
  const groupEndpointsByType = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return {};
    
    const groups: Record<string, number> = {};
    
    data.endpoints.forEach(endpoint => {
      if (!endpoint?.endpoint) return;
      
      // Extract API type from endpoint path
      let type = 'Unknown';
      
      if (endpoint.endpoint.includes('/api/')) {
        type = 'REST API';
      } else if (endpoint.endpoint.includes('/graphql')) {
        type = 'GraphQL';
      } else if (endpoint.endpoint.includes('.json')) {
        type = 'Static JSON';
      } else if (endpoint.endpoint.includes('/static/')) {
        type = 'Static Assets';
      } else {
        type = 'Other';
      }
      
      groups[type] = (groups[type] || 0) + 1;
    });
    
    return groups;
  };

  // Get status code distribution across all endpoints
  const getStatusCodeDistribution = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return {};
    
    const distribution: Record<string, number> = {};
    
    data.endpoints.forEach(endpoint => {
      if (!endpoint?.analytics?.statusCodes) return;
      
      Object.entries(endpoint.analytics.statusCodes).forEach(([code, count]) => {
        distribution[code] = (distribution[code] || 0) + (parseInt(count, 10) || 0);
      });
    });
    
    return distribution;
  };

  // Calculate average response time across all endpoints
  const calculateAverageResponseTime = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return '0.00';
    
    let totalTime = 0;
    let totalSamples = 0;
    
    data.endpoints.forEach(endpoint => {
      if (!endpoint?.analytics?.patterns?.averageResponseTime) return;
      
      Object.values(endpoint.analytics.patterns.averageResponseTime).forEach(time => {
        const parsedTime = parseFloat(time);
        if (!isNaN(parsedTime)) {
          totalTime += parsedTime;
          totalSamples++;
        }
      });
    });
    
    return totalSamples > 0 ? (totalTime / totalSamples).toFixed(2) : '0.00';
  };

  // Calculate error rate
  const calculateErrorRate = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return { count: 0, rate: '0' };
    
    let totalRequests = 0;
    let errorCount = 0;
    
    data.endpoints.forEach(endpoint => {
      if (!endpoint?.analytics?.statusCodes) return;
      
      Object.entries(endpoint.analytics.statusCodes).forEach(([code, count]) => {
        const parsedCount = parseInt(count, 10) || 0;
        totalRequests += parsedCount;
        
        if (code.startsWith('4') || code.startsWith('5')) {
          errorCount += parsedCount;
        }
      });
    });
    
    const rate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : '0';
    
    return {
      count: errorCount,
      rate
    };
  };

  // Get endpoint with highest response time
  const getEndpointWithHighestResponseTime = () => {
    if (!data?.endpoints || data.endpoints.length === 0) return null;
    
    let highestAvgTime = 0;
    let slowestEndpoint = null;
    
    data.endpoints.forEach(endpoint => {
      if (!endpoint?.analytics?.patterns?.averageResponseTime) return;
      
      const times = Object.values(endpoint.analytics.patterns.averageResponseTime);
      if (times.length === 0) return;
      
      const avgTime = times.reduce((sum, time) => sum + parseFloat(time || '0'), 0) / times.length;
      
      if (avgTime > highestAvgTime) {
        highestAvgTime = avgTime;
        slowestEndpoint = endpoint;
      }
    });
    
    return {
      endpoint: slowestEndpoint?.endpoint || 'Unknown',
      responseTime: highestAvgTime.toFixed(2)
    };
  };

  // Prepare data for overview charts
  const prepareOverviewChartData = () => {
    // For endpoint types chart
    const typeGroups = groupEndpointsByType();
    const typeLabels = Object.keys(typeGroups);
    const typeData = Object.values(typeGroups);
    
    // For status code distribution
    const statusCodes = getStatusCodeDistribution();
    const statusLabels = Object.keys(statusCodes);
    const statusData = Object.values(statusCodes);
    
    // Colors for status codes
    const statusColors = statusLabels.map(code => {
      if (code.startsWith('2')) return 'rgba(34, 197, 94, 0.8)'; // Green for 2xx
      if (code.startsWith('3')) return 'rgba(59, 130, 246, 0.8)'; // Blue for 3xx
      if (code.startsWith('4')) return 'rgba(234, 179, 8, 0.8)';  // Yellow for 4xx
      if (code.startsWith('5')) return 'rgba(239, 68, 68, 0.8)';  // Red for 5xx
      return 'rgba(156, 163, 175, 0.8)'; // Gray for others
    });
    
    // Colors for endpoint types
    const typeColors = [
      'rgba(79, 70, 229, 0.8)', // Indigo
      'rgba(236, 72, 153, 0.8)', // Pink
      'rgba(245, 158, 11, 0.8)', // Amber
      'rgba(16, 185, 129, 0.8)', // Emerald
      'rgba(99, 102, 241, 0.8)', // Indigo
    ];
    
    return {
      types: {
        labels: typeLabels,
        datasets: [{
          data: typeData,
          backgroundColor: typeColors,
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
        }]
      },
      statusCodes: {
        labels: statusLabels,
        datasets: [{
          data: statusData,
          backgroundColor: statusColors,
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
        }]
      }
    };
  };

  // Computed values
  const totalRequests = calculateTotalRequests();
  const totalEndpoints = data?.endpoints?.length || 0;
  const avgResponseTime = calculateAverageResponseTime();
  const errorStats = calculateErrorRate();
  const slowestEndpoint = getEndpointWithHighestResponseTime();
  const chartData = prepareOverviewChartData();

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Update refresh interval
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value, 10));
  };

  // Toggle between hourly and daily view
  const handlePeriodChange = (period: 'hourly' | 'daily') => {
    setSelectedPeriod(period);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${themeClasses.secondary}`}>
        <div className="text-center">
          <Loader className={`w-10 h-10 animate-spin mx-auto mb-4 ${themeClasses.text}`} />
          <p className={`${themeClasses.text}`}>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 rounded-lg ${themeClasses.error} text-white`}>
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Error Loading Analytics</h2>
        </div>
        <p>{(error as Error)?.message || 'Failed to load endpoint analytics'}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-white text-red-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text}`}>API Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${themeClasses.mutedText}`}>
            Last updated: {formatLastUpdated(dataUpdatedAt)}
          </div>
          <select 
            value={refreshInterval} 
            onChange={handleIntervalChange}
            className={`px-3 py-1 border rounded-md text-sm ${themeClasses.input}`}
          >
            <option value={30000}>Refresh: 30s</option>
            <option value={60000}>Refresh: 1m</option>
            <option value={300000}>Refresh: 5m</option>
            <option value={0}>Manual Refresh</option>
          </select>
          <button 
            onClick={handleRefresh} 
            className={`p-2 rounded-md ${themeClasses.accent} text-white hover:opacity-90 transition-opacity`}
            aria-label="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Endpoints */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${themeClasses.mutedText}`}>Total Endpoints</h3>
            <Server className={`w-5 h-5 ${themeClasses.accent}`} />
          </div>
          <p className={`text-2xl font-semibold mt-2 ${themeClasses.text}`}>{totalEndpoints}</p>
          <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>Unique API endpoints monitored</p>
        </div>
        
        {/* Total Requests */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${themeClasses.mutedText}`}>Total Requests</h3>
            <Activity className={`w-5 h-5 ${themeClasses.accent}`} />
          </div>
          <p className={`text-2xl font-semibold mt-2 ${themeClasses.text}`}>{totalRequests.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>API calls processed</p>
        </div>
        
        {/* Avg Response Time */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${themeClasses.mutedText}`}>Avg Response Time</h3>
            <Clock className={`w-5 h-5 ${themeClasses.accent}`} />
          </div>
          <p className={`text-2xl font-semibold mt-2 ${themeClasses.text}`}>{avgResponseTime} ms</p>
          <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>
            Slowest: {slowestEndpoint?.endpoint || 'N/A'} ({slowestEndpoint?.responseTime || 0} ms)
          </p>
        </div>
        
        {/* Error Rate */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${themeClasses.mutedText}`}>Error Rate</h3>
            <AlertCircle className={`w-5 h-5 ${errorStats.count > 0 ? 'text-red-500' : themeClasses.accent}`} />
          </div>
          <div className="flex items-end space-x-1 mt-2">
            <p className={`text-2xl font-semibold ${errorStats.count > 0 ? 'text-red-500' : themeClasses.text}`}>
              {errorStats.rate}%
            </p>
            <p className={`text-sm ${themeClasses.mutedText}`}>
              ({errorStats.count} errors)
            </p>
          </div>
          <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>
            {errorStats.count > 0 ? 'Errors detected in API responses' : 'All systems operational'}
          </p>
        </div>
      </div>

      {/* Overview Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint Types Distribution */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <h3 className={`text-md font-semibold mb-4 ${themeClasses.text}`}>Endpoint Types</h3>
          <div className="h-64">
            {chartData.types.labels.length > 0 ? (
              <Doughnut
                data={chartData.types}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: theme === 'dark' ? '#e5e7eb' : '#374151',
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw as number;
                          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                  cutout: '60%'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`text-sm ${themeClasses.mutedText}`}>No endpoint data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Code Distribution */}
        <div className={`p-4 rounded-lg ${themeClasses.primary} shadow-md`}>
          <h3 className={`text-md font-semibold mb-4 ${themeClasses.text}`}>Status Code Distribution</h3>
          <div className="h-64">
            {chartData.statusCodes.labels.length > 0 ? (
              <Pie
                data={chartData.statusCodes}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: theme === 'dark' ? '#e5e7eb' : '#374151',
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw as number;
                          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `Status ${label}: ${value} requests (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`text-sm ${themeClasses.mutedText}`}>No status code data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className={`border-b ${themeClasses.border}`}>
        <div className="flex space-x-4">
          <button
            onClick={() => handlePeriodChange('hourly')}
            className={`py-2 px-4 border-b-2 transition-colors ${
              selectedPeriod === 'hourly'
                ? `border-indigo-500 ${themeClasses.text}`
                : `border-transparent ${themeClasses.mutedText} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            Hourly Metrics
          </button>
          <button
            onClick={() => handlePeriodChange('daily')}
            className={`py-2 px-4 border-b-2 transition-colors ${
              selectedPeriod === 'daily'
                ? `border-indigo-500 ${themeClasses.text}`
                : `border-transparent ${themeClasses.mutedText} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            Daily Metrics
          </button>
        </div>
      </div>

      {/* Endpoint Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Endpoint Performance</h2>
          <div className="flex items-center">
            <Globe className={`w-4 h-4 mr-2 ${themeClasses.mutedText}`} />
            <span className={`text-sm ${themeClasses.mutedText}`}>{totalEndpoints} unique endpoints</span>
          </div>
        </div>
        
        {Array.isArray(data?.endpoints) && data.endpoints.map((endpoint, index) => {
          if (!endpoint || !endpoint.analytics) {
            return null; // Skip invalid endpoints
          }
          
          try {
            // Get if this endpoint is expanded
            const isExpanded = expandedEndpoint === endpoint.endpoint;
            
            // Safely extract data with fallbacks
            const patterns = endpoint.analytics?.patterns || {};
            const periodData = selectedPeriod === 'hourly' ? patterns.hourly : patterns.daily;
            const statusCodes = endpoint.analytics?.statusCodes || {};
            
            // Extract pattern data for the chart based on selected period
            const patternLabels = Object.keys(periodData || {}).sort((a, b) => parseInt(a) - parseInt(b));
            const patternData = patternLabels.map(key => {
              const value = parseInt(periodData?.[key] || '0', 10);
              return isNaN(value) ? 0 : value;
            });
            
            // Extract average response times
            const avgResponseTimes = Object.entries(patterns.averageResponseTime || {})
              .map(([key, time]) => {
                const keyValue = parseInt(key, 10);
                const timeValue = parseFloat(time);
                return {
                  key: isNaN(keyValue) ? 0 : keyValue,
                  value: isNaN(timeValue) ? 0 : timeValue
                };
              })
              .filter(item => !isNaN(item.key) && !isNaN(item.value))
              .sort((a, b) => a.key - b.key);
            
            const responseTimeLabels = avgResponseTimes.map(item => `${selectedPeriod === 'hourly' ? 'Hour' : 'Day'} ${item.key}`);
            const responseTimeData = avgResponseTimes.map(item => item.value);
            
            // Status code breakdown
            const statusCodeLabels = Object.keys(statusCodes);
            const statusCodeData = statusCodeLabels.map(code => {
              const value = parseInt(statusCodes[code], 10);
              return isNaN(value) ? 0 : value;
            });
            
            // Determine if there are any error status codes
            const hasErrors = statusCodeLabels.some(code => code.startsWith('4') || code.startsWith('5'));
            
            // Calculate total requests for this endpoint
            const endpointTotalRequests = statusCodeData.reduce((sum, count) => sum + count, 0);
            
            // Calculate average response time for this endpoint
            const endpointAvgResponseTime = responseTimeData.length > 0
              ? (responseTimeData.reduce((sum, time) => sum + time, 0) / responseTimeData.length).toFixed(2)
              : '0.00';

            return (
              <div 
                key={`${endpoint?.endpoint || `unknown-${index}`}-${index}`} 
                className={`rounded-lg ${themeClasses.primary} shadow-md overflow-hidden`}
              >
                {/* Endpoint Header - Always visible */}
                <div 
                  className={`p-4 flex justify-between items-center cursor-pointer hover:bg-opacity-50 ${themeClasses.hover}`}
                  onClick={() => toggleEndpointExpansion(endpoint.endpoint)}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${hasErrors ? 'bg-yellow-500' : 'bg-green-500'} mr-2`}></div>
                      <h3 className={`text-md font-medium ${themeClasses.text}`}>
                        {endpoint.endpoint || 'Unknown Endpoint'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap mt-2 gap-2">
                      <div className={`text-xs px-2 py-1 rounded-full bg-opacity-10 ${themeClasses.mutedBg}`}>
                        <span className={`${themeClasses.mutedText}`}>{endpointTotalRequests} requests</span>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full bg-opacity-10 ${themeClasses.mutedBg}`}>
                        <span className={`${themeClasses.mutedText}`}>{endpointAvgResponseTime} ms avg</span>
                      </div>
                      {statusCodeLabels.map(code => (
                        <div 
                          key={`${endpoint.endpoint}-${code}`}
                          className={`text-xs px-2 py-1 rounded-full ${
                            code.startsWith('2') ? 'bg-green-100 text-green-800' :
                            code.startsWith('3') ? 'bg-blue-100 text-blue-800' :
                            code.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                            code.startsWith('5') ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {code}: {statusCodes[code]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm mr-2 ${themeClasses.mutedText}`}>
                      {isExpanded ? 'Hide details' : 'Show details'}
                    </span>
                    {isExpanded ? 
                      <ChevronUp className={`w-5 h-5 ${themeClasses.mutedText}`} /> : 
                      <ChevronDown className={`w-5 h-5 ${themeClasses.mutedText}`} />
                    }
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className={`border-t ${themeClasses.border} p-4`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Traffic Pattern Chart */}
                      <div className={`p-3 rounded border ${themeClasses.border}`}>
                        <h4 className={`text-sm font-medium mb-2 ${themeClasses.mutedText}`}>
                          {selectedPeriod === 'hourly' ? 'Hourly' : 'Daily'} Traffic
                        </h4>
                        <div className="h-48">
                          {patternData.length > 0 ? (
                            <Bar 
                              data={{
                                labels: patternLabels.map(h => `${selectedPeriod === 'hourly' ? 'Hour' : 'Day'} ${h}`),
                                datasets: [
                                  {
                                    label: 'Requests',
                                    data: patternData,
                                    backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(79, 70, 229, 0.7)',
                                    borderColor: theme === 'dark' ? 'rgb(99, 102, 241)' : 'rgb(79, 70, 229)',
                                    borderWidth: 1,
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {                                   
                                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    },
                                    grid: {
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                    }
                                  },
                                  x: {
                                    ticks: {
                                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    },
                                    grid: {
                                      display: false
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    display: false
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className={`text-sm ${themeClasses.mutedText}`}>No traffic data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Response Time Trend */}
                      <div className={`p-3 rounded border ${themeClasses.border}`}>
                        <h4 className={`text-sm font-medium mb-2 ${themeClasses.mutedText}`}>Response Time</h4>
                        <div className="h-48">
                          {responseTimeData.length > 0 ? (
                            <Line 
                              data={{
                                labels: responseTimeLabels,
                                datasets: [
                                  {
                                    label: 'Avg Response Time (ms)',
                                    data: responseTimeData,
                                    borderColor: theme === 'dark' ? 'rgb(236, 72, 153)' : 'rgb(219, 39, 119)',
                                    backgroundColor: theme === 'dark' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(219, 39, 119, 0.1)',
                                    fill: true,
                                    tension: 0.3,
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    },
                                    grid: {
                                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                    }
                                  },
                                  x: {
                                    ticks: {
                                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    },
                                    grid: {
                                      display: false
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    labels: {
                                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                                    }
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className={`text-sm ${themeClasses.mutedText}`}>No response time data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Details */}
                    <div className={`mt-4 p-3 rounded border ${themeClasses.border}`}>
                      <h4 className={`text-sm font-medium mb-2 ${themeClasses.mutedText}`}>Response Times</h4>
                      <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${themeClasses.border}`}>
                          <thead>
                            <tr>
                              <th className={`px-3 py-2 text-left text-xs font-medium ${themeClasses.mutedText} uppercase tracking-wider`}>Value (ms)</th>
                              <th className={`px-3 py-2 text-left text-xs font-medium ${themeClasses.mutedText} uppercase tracking-wider`}>Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${themeClasses.border}`}>
                            {endpoint.analytics.responseTimes && endpoint.analytics.responseTimes.length > 0 ? (
                              endpoint.analytics.responseTimes.map((time, idx) => (
                                <tr key={`${time.score}-${idx}`}>
                                  <td className={`px-3 py-2 text-sm ${themeClasses.text}`}>{time.value}</td>
                                  <td className={`px-3 py-2 text-sm ${themeClasses.mutedText}`}>
                                    {new Date(parseInt(time.score, 10) * 1000).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td 
                                  colSpan={2} 
                                  className={`px-3 py-2 text-sm ${themeClasses.mutedText} text-center`}
                                >
                                  No response time data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          } catch (error) {
            console.error('Error rendering endpoint card:', error);
            return (
              <div 
                key={`error-endpoint-${index}`} 
                className={`p-4 rounded-lg ${themeClasses.primary} shadow-md border border-red-300`}
              >
                <p className="text-red-500">Error displaying endpoint data. See console for details.</p>
              </div>
            );
          }
        })}
        
        {(!data?.endpoints || data.endpoints.length === 0) && (
          <div className={`p-6 rounded-lg ${themeClasses.primary} shadow-md text-center`}>
            <p className={`${themeClasses.mutedText}`}>No endpoint data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointAnalyticsDashboard;