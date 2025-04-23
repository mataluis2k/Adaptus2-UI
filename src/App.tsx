import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ContentView } from './components/dashboard/ContentView';
import { ListView } from './components/dashboard/ListView';
import EndpointAnalyticsDashboard from './components/dashboard/EndpointAnalyticsDashboard';
import EcommerceAnalyticsDashboard from './components/dashboard/EcommerceAnalyticsDashboard';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { useCMSStore } from './store/cms';
import { useAuthStore } from './store/auth';
import { LoginForm } from './components/auth/LoginForm';
import { APIConfiguratorRoutes } from './components/api-configurator/APIConfiguratorRoutes';
import DslEditor from './components/rules/DslEditor';
import { AgentsList } from './components/agents/AgentsList';
import { AgentForm } from './components/agents/AgentForm';
import { AgentDetails } from './components/agents/AgentDetails';
import AgentWorkflowManager from './components/agents/AgentWorkflowManager';
import LoginSuccess from './components/auth/login-success';
import SDUIAdmin from './components/sdui/SDUIAdmin';
import { Toaster } from 'react-hot-toast';
import SqlBuilder from './components/sqlBuilder/sqlBuilder';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const initialized = useCMSStore((state) => state.initialized);
  const setInitialized = useCMSStore((state) => state.setInitialized);
  const token = useAuthStore((state) => state.token);

  React.useEffect(() => {
    console.log('Initializing app...');
    setInitialized(true);
    return () => setInitialized(false);
  }, [setInitialized]);

  if (!initialized) {
    console.log('App not initialized yet');
    return null;
  }

  console.log('App initialized, rendering routes');
  return (
    <Routes>
      <Route path="/login" element={!token ? <LoginForm /> : <Navigate to="/" replace />} />
      <Route path="/login-success" element={<LoginSuccess />} /> 
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* <Route index element={<Navigate to="/tables" replace />} /> */}
        <Route index element={<EndpointAnalyticsDashboard />} />
        <Route path="ecommerce" element={<EcommerceAnalyticsDashboard />} />
        <Route path="tables">
          <Route index element={<ListView />} />
          <Route path=":tableId" element={<ContentView />} />
        </Route>
      </Route>
      
      {/* API Configurator Routes */}
      <Route
        path="/api-configurator/*"
        element={
          <ProtectedRoute>
            <APIConfiguratorRoutes />
          </ProtectedRoute>
        }
      />
      
      {/* DSL Editor Route */}
      <Route
        path="/dsl-editor"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DslEditor />} />
      </Route>
       {/* Agent management routes */}
       <Route
         path="/agents"
         element={
           <ProtectedRoute>
             <DashboardLayout />
           </ProtectedRoute>
         }
       >
          <Route index element={<AgentsList />} />
          <Route path="new" element={<AgentForm />} />
          <Route path="edit/:id" element={<AgentForm />} />
          <Route path="view/:id" element={<AgentDetails />} />
        </Route>
        <Route
          path="/sdui"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SDUIAdmin />} />
        </Route>
      <Route
        path="/sql-builder"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SqlBuilder />} />
      </Route>
      
      {/* Agent Workflow Manager Route */}
      <Route
        path="/agent-workflows"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentWorkflowManager />} />
      </Route>
    </Routes>
  );
};

// First, let's create a store or ref to hold the chat widget instance globally
const chatWidgetRef = { current: null };

// Modify the ChatWidgetLoader component
const ChatWidgetLoader = () => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  useEffect(() => {
    if (!token || location.pathname === '/login' || location.pathname === '/login-success') {
      // Clean up chat widget if it exists when token is removed or on login pages
      if (chatWidgetRef.current?.cleanup) {
        chatWidgetRef.current.cleanup();
        chatWidgetRef.current = null;
        
        // Remove the scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (
            script.src.includes('socket.io') ||
            script.src.includes('marked') ||
            script.src.includes('chat-rag2.js')
          ) {
            document.head.removeChild(script);
          }
        });
      }
      return;
    }

    const loadScriptsSequentially = async () => {
      try {
        const socketScript = document.createElement('script');
        socketScript.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
        await new Promise((resolve, reject) => {
          socketScript.onload = resolve;
          socketScript.onerror = reject;
          document.head.appendChild(socketScript);
        });

        const markedScript = document.createElement('script');
        markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        await new Promise((resolve, reject) => {
          markedScript.onload = resolve;
          markedScript.onerror = reject;
          document.head.appendChild(markedScript);
        });

        const chatScript = document.createElement('script');
        chatScript.src = '/js/chat-rag2.js';
        await new Promise((resolve, reject) => {
          chatScript.onload = () => {
            chatWidgetRef.current = new (window as any).ChatWidget({
              websocketUrl: 'ws://localhost:3007',
              position: 'bottom-right',
              service: 'chatbot',
              theme: {
                primary: '#007bff',
                secondary: '#e9ecef',
                text: '#212529'
              },
              authToken: token
            });
            resolve(null);
          };
          chatScript.onerror = reject;
          document.head.appendChild(chatScript);
        });
      } catch (error) {
        console.error('Error loading chat widget scripts:', error);
      }
    };

    loadScriptsSequentially();

    return () => {
      if (chatWidgetRef.current?.cleanup) {
        chatWidgetRef.current.cleanup();
        chatWidgetRef.current = null;
      }
    };
  }, [token, location.pathname]);

  return null;
};

// Modify your logout function in auth.ts or wherever it's defined
export const logout = () => {
  // Clean up chat widget before logging out
  if (chatWidgetRef.current?.cleanup) {
    chatWidgetRef.current.cleanup();
    chatWidgetRef.current = null;
    
    // Remove the scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (
        script.src.includes('socket.io') ||
        script.src.includes('marked') ||
        script.src.includes('chat-rag2.js')
      ) {
        document.head.removeChild(script);
      }
    });
  }

  // Your existing logout logic
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const App = () => {
  console.log('App rendering');
  const setToken = useAuthStore((state) => state.setToken);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('Found token in localStorage, initializing auth state');
      setToken(storedToken);
    }
  }, [setToken]);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />
          <AppRoutes />
          <ChatWidgetLoader />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
