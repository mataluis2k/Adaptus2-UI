import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import _ from 'lodash';
import { Calendar, Clock, CreditCard, ShoppingCart, DollarSign, Users, TrendingUp, 
  ArrowDown, ArrowUp, Activity, Eye, MousePointer, CheckSquare } from 'lucide-react';

// Main dashboard component
const EcommerceAnalyticsDashboard_v1 = () => {
  // State for all the dashboard data
  const [overviewData, setOverviewData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [userBehaviorData, setUserBehaviorData] = useState([]);
  const [productPerformanceData, setProductPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedTab, setSelectedTab] = useState(0);

  // Colors for the charts
  const colors = {
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#f97316',
    warning: '#eab308',
    danger: '#ef4444',
    success: '#22c55e',
    info: '#3b82f6',
    light: '#f3f4f6',
    dark: '#1f2937',
    primaryLight: '#818cf8',
    secondaryLight: '#34d399',
    gradient: ['#4f46e5', '#818cf8', '#c7d2fe']
  };

  // Chart color palettes
  const colorPalette = [
    colors.primary, colors.secondary, colors.accent, 
    colors.info, colors.warning, colors.success
  ];

  const pieColors = [
    colors.primary, colors.secondary, colors.accent, 
    colors.warning, colors.info, colors.success, 
    colors.primaryLight, colors.secondaryLight
  ];

  // Fetch data based on date range
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch from your backend
        // For this demo, we'll use mock data
        setOverviewData(generateOverviewData());
        setRevenueData(generateRevenueData());
        setConversionData(generateConversionData());
        setTrafficData(generateTrafficData());
        setUserBehaviorData(generateUserBehaviorData());
        setProductPerformanceData(generateProductPerformanceData());
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Mock data generators
  const generateOverviewData = () => {
    const revenue = Math.floor(Math.random() * 500000) + 200000;
    const lastPeriodRevenue = revenue * (Math.random() * 0.4 + 0.8);
    const revenueChange = ((revenue - lastPeriodRevenue) / lastPeriodRevenue) * 100;
    
    return {
      totalRevenue: revenue,
      revenueChange: revenueChange.toFixed(1),
      averageOrderValue: Math.floor(Math.random() * 100) + 50,
      aovChange: (Math.random() * 20 - 10).toFixed(1),
      conversionRate: (Math.random() * 5 + 1).toFixed(2),
      conversionChange: (Math.random() * 20 - 5).toFixed(1),
      totalOrders: Math.floor(Math.random() * 5000) + 1000,
      ordersChange: (Math.random() * 30 - 10).toFixed(1),
      totalVisitors: Math.floor(Math.random() * 50000) + 20000,
      visitorsChange: (Math.random() * 30 - 5).toFixed(1),
      cartAbandonment: (Math.random() * 30 + 60).toFixed(1),
      abandonmentChange: (Math.random() * 10 - 5).toFixed(1),
    };
  };

  const generateRevenueData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const revenue = Math.floor(Math.random() * 20000) + 5000;
      const orders = Math.floor(Math.random() * 200) + 50;
      return {
        date: dateStr,
        revenue,
        orders,
        aov: Math.floor(revenue / orders)
      };
    });
  };

  const generateConversionData = () => {
    return [
      { name: 'Homepage', visitors: 12000, conversions: 3600, rate: 30 },
      { name: 'Category Pages', visitors: 8500, conversions: 2100, rate: 24.7 },
      { name: 'Product Pages', visitors: 6400, conversions: 1920, rate: 30 },
      { name: 'Cart', visitors: 2800, conversions: 1680, rate: 60 },
      { name: 'Checkout', visitors: 2100, conversions: 1470, rate: 70 },
      { name: 'Thank You', visitors: 1470, conversions: 1470, rate: 100 }
    ];
  };

  const generateTrafficData = () => {
    return [
      { source: 'Direct', visitors: Math.floor(Math.random() * 8000) + 2000 },
      { source: 'Organic Search', visitors: Math.floor(Math.random() * 12000) + 5000 },
      { source: 'Paid Search', visitors: Math.floor(Math.random() * 7000) + 3000 },
      { source: 'Social', visitors: Math.floor(Math.random() * 5000) + 2000 },
      { source: 'Email', visitors: Math.floor(Math.random() * 4000) + 1000 },
      { source: 'Referral', visitors: Math.floor(Math.random() * 3000) + 1000 }
    ];
  };

  const generateUserBehaviorData = () => {
    return {
      clicksByPage: [
        { page: 'Homepage', clicks: Math.floor(Math.random() * 8000) + 5000 },
        { page: 'Products', clicks: Math.floor(Math.random() * 12000) + 8000 },
        { page: 'Category', clicks: Math.floor(Math.random() * 6000) + 4000 },
        { page: 'Cart', clicks: Math.floor(Math.random() * 3000) + 2000 },
        { page: 'Checkout', clicks: Math.floor(Math.random() * 2000) + 1000 }
      ],
      timeOnPage: [
        { page: 'Homepage', time: Math.floor(Math.random() * 120) + 30 },
        { page: 'Products', time: Math.floor(Math.random() * 180) + 60 },
        { page: 'Category', time: Math.floor(Math.random() * 150) + 45 },
        { page: 'Cart', time: Math.floor(Math.random() * 90) + 30 },
        { page: 'Checkout', time: Math.floor(Math.random() * 240) + 120 }
      ],
      deviceUsage: [
        { name: 'Desktop', value: Math.floor(Math.random() * 50) + 30 },
        { name: 'Mobile', value: Math.floor(Math.random() * 40) + 20 },
        { name: 'Tablet', value: Math.floor(Math.random() * 20) + 5 }
      ]
    };
  };

  const generateProductPerformanceData = () => {
    return [
      { 
        id: 'P1', 
        name: 'Wireless Headphones',
        views: Math.floor(Math.random() * 2000) + 1000,
        addToCart: Math.floor(Math.random() * 500) + 200,
        purchases: Math.floor(Math.random() * 200) + 50,
        revenue: Math.floor(Math.random() * 10000) + 2500,
        conversionRate: Math.floor(Math.random() * 15) + 5
      },
      { 
        id: 'P2', 
        name: 'Smartphone Case',
        views: Math.floor(Math.random() * 3000) + 1500,
        addToCart: Math.floor(Math.random() * 900) + 400,
        purchases: Math.floor(Math.random() * 400) + 200,
        revenue: Math.floor(Math.random() * 8000) + 4000,
        conversionRate: Math.floor(Math.random() * 20) + 10
      },
      { 
        id: 'P3', 
        name: 'Bluetooth Speaker',
        views: Math.floor(Math.random() * 1800) + 800,
        addToCart: Math.floor(Math.random() * 400) + 150,
        purchases: Math.floor(Math.random() * 150) + 50,
        revenue: Math.floor(Math.random() * 7500) + 3000,
        conversionRate: Math.floor(Math.random() * 15) + 5
      },
      { 
        id: 'P4', 
        name: 'Laptop Sleeve',
        views: Math.floor(Math.random() * 1500) + 600,
        addToCart: Math.floor(Math.random() * 300) + 100,
        purchases: Math.floor(Math.random() * 100) + 25,
        revenue: Math.floor(Math.random() * 4000) + 1000,
        conversionRate: Math.floor(Math.random() * 10) + 3
      },
      { 
        id: 'P5', 
        name: 'Smartwatch',
        views: Math.floor(Math.random() * 2200) + 1200,
        addToCart: Math.floor(Math.random() * 600) + 300,
        purchases: Math.floor(Math.random() * 250) + 100,
        revenue: Math.floor(Math.random() * 15000) + 8000,
        conversionRate: Math.floor(Math.random() * 18) + 8
      }
    ];
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">E-commerce Analytics Dashboard</h1>
              <p className="text-gray-500">Track your store's performance and customer behavior</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setDateRange('7d')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${dateRange === '7d' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setDateRange('30d')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${dateRange === '30d' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => setDateRange('90d')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${dateRange === '90d' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Revenue" 
            value={`$${(overviewData.totalRevenue / 1000).toFixed(1)}k`} 
            change={overviewData.revenueChange} 
            icon={<DollarSign className="w-6 h-6 text-indigo-500" />}
          />
          <KpiCard 
            title="Orders" 
            value={overviewData.totalOrders.toLocaleString()} 
            change={overviewData.ordersChange} 
            icon={<ShoppingCart className="w-6 h-6 text-emerald-500" />}
          />
          <KpiCard 
            title="Conversion Rate" 
            value={`${overviewData.conversionRate}%`} 
            change={overviewData.conversionChange} 
            icon={<TrendingUp className="w-6 h-6 text-amber-500" />}
          />
          <KpiCard 
            title="AOV" 
            value={`$${overviewData.averageOrderValue}`} 
            change={overviewData.aovChange} 
            icon={<CreditCard className="w-6 h-6 text-blue-500" />}
          />
        </div>
      </div>

      {/* Main content area with tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button 
                onClick={() => setSelectedTab(0)} 
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  selectedTab === 0 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenue & Orders
              </button>
              <button 
                onClick={() => setSelectedTab(1)} 
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  selectedTab === 1 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Conversion Funnel
              </button>
              <button 
                onClick={() => setSelectedTab(2)} 
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  selectedTab === 2 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Traffic Sources
              </button>
              <button 
                onClick={() => setSelectedTab(3)} 
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  selectedTab === 3 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Behavior
              </button>
              <button 
                onClick={() => setSelectedTab(4)} 
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  selectedTab === 4 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Product Performance
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Revenue & Orders Tab */}
            {selectedTab === 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue & Orders Trend</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Daily Revenue</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis 
                            tickFormatter={(value) => `$${value/1000}k`} 
                            tick={{ fontSize: 12 }} 
                          />
                          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                          <Legend />
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={colors.primary} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            activeDot={{ r: 6 }} 
                            name="Revenue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Daily Orders & AOV</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value, name) => [name === 'orders' ? value : `$${value}`, name === 'orders' ? 'Orders' : 'Avg. Order Value']} />
                          <Legend />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="orders" 
                            stroke={colors.secondary} 
                            activeDot={{ r: 6 }} 
                            name="Orders"
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="aov" 
                            stroke={colors.accent} 
                            activeDot={{ r: 6 }} 
                            name="Avg. Order Value"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Funnel Tab */}
            {selectedTab === 1 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Conversion Funnel</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Funnel Visualization</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={conversionData}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                          <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Visitors']} />
                          <Legend />
                          <Bar dataKey="visitors" fill={colors.primary} name="Visitors" />
                          <Bar dataKey="conversions" fill={colors.secondary} name="Conversions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Conversion Rates by Page</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={conversionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                          <Legend />
                          <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.4} />
                            </linearGradient>
                          </defs>
                          <Bar 
                            dataKey="rate" 
                            fill="url(#colorRate)" 
                            radius={[4, 4, 0, 0]} 
                            name="Conversion Rate (%)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Abandonment Statistics</h3>
                  <div className="flex flex-wrap">
                    <div className="w-full lg:w-1/3 p-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Cart Abandonment Rate</h4>
                        <div className="flex items-center mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{overviewData.cartAbandonment}%</span>
                          <ChangeIndicator value={-overviewData.abandonmentChange} inverted={true} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Percentage of users who add items to cart but don't purchase</p>
                      </div>
                    </div>
                    <div className="w-full lg:w-1/3 p-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Checkout Abandonment</h4>
                        <div className="flex items-center mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{(overviewData.cartAbandonment * 0.7).toFixed(1)}%</span>
                          <ChangeIndicator value={-overviewData.abandonmentChange * 0.8} inverted={true} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Percentage of users who begin checkout but don't complete</p>
                      </div>
                    </div>
                    <div className="w-full lg:w-1/3 p-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Average Visits Before Purchase</h4>
                        <div className="flex items-center mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{(Math.random() * 2 + 1.5).toFixed(1)}</span>
                          <ChangeIndicator value={(Math.random() * 20 - 10).toFixed(1)} inverted={false} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Average number of sessions before converting</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Traffic Sources Tab */}
            {selectedTab === 2 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Traffic Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Traffic by Source</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trafficData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="visitors"
                          >
                            {trafficData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value.toLocaleString(), 'Visitors']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Traffic Source Comparison</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trafficData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [value.toLocaleString(), 'Visitors']} />
                          <Legend />
                          <Bar 
                            dataKey="visitors" 
                            name="Visitors" 
                            fill={colors.info}
                            radius={[4, 4, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Source Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visitors
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversion Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orders
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trafficData.map((source, i) => {
                          const convRate = (Math.random() * 8 + 1).toFixed(2);
                          const avgOrder = Math.floor(Math.random() * 40) + 60;
                          const orders = Math.floor(source.visitors * (parseFloat(convRate) / 100));
                          const revenue = orders * avgOrder;
                          
                          return (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {source.source}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {source.visitors.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {convRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${revenue.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {orders.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* User Behavior Tab */}
            {selectedTab === 3 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">User Behavior Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Click Activity by Page</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userBehaviorData.clicksByPage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [value.toLocaleString(), 'Clicks']} />
                          <Legend />
                          <Bar 
                            dataKey="clicks" 
                            name="Clicks" 
                            fill={colors.primary}
                            radius={[4, 4, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Time on Page (seconds)</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userBehaviorData.timeOnPage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`${value} seconds`, 'Avg. Time']} />
                          <Legend />
                          <Bar 
                            dataKey="time" 
                            name="Time (seconds)" 
                            fill={colors.secondary}
                            radius={[4, 4, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Device Usage</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userBehaviorData.deviceUsage}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {userBehaviorData.deviceUsage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">User Engagement Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Pages Per Session</h4>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{(Math.random() * 3 + 2).toFixed(1)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Average number of pages viewed per session</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Avg. Session Duration</h4>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{Math.floor(Math.random() * 3) + 2}m {Math.floor(Math.random() * 50) + 10}s</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Average time spent during a session</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">Bounce Rate</h4>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{(Math.random() * 20 + 30).toFixed(1)}%</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Percentage of single-page sessions</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500">New vs Returning</h4>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-indigo-600">{(Math.random() * 30 + 60).toFixed(1)}% new</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Percentage of new vs returning visitors</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Performance Tab */}
            {selectedTab === 4 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Product Performance</h2>
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Top Performing Products</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Page Views
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Add to Cart
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purchases
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conv. Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productPerformanceData.map((product, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.views.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.addToCart.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.purchases.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${product.revenue.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.conversionRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Product Views vs Purchases</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={productPerformanceData.map(product => ({
                            name: product.name,
                            views: product.views,
                            purchases: product.purchases
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [value.toLocaleString()]} />
                          <Legend />
                          <Bar dataKey="views" name="Views" fill={colors.primary} />
                          <Bar dataKey="purchases" name="Purchases" fill={colors.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Product Revenue Comparison</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productPerformanceData.map(product => ({
                              name: product.name,
                              value: product.revenue
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {productPerformanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Revenue']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KpiCard = ({ title, value, change, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className="flex items-end mt-4">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <ChangeIndicator value={change} />
      </div>
    </div>
  );
};

// Change Indicator component
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

export default EcommerceAnalyticsDashboard_v1;