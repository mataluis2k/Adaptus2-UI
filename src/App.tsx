import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ContentView } from './components/dashboard/ContentView';
import { ListView } from './components/dashboard/ListView';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { useCMSStore } from './store/cms';
import { useAuthStore } from './store/auth';
import { LoginForm } from './components/auth/LoginForm';
import { APIConfiguratorRoutes } from './components/api-configurator/APIConfiguratorRoutes';

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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tables" replace />} />
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
    </Routes>
  );
};

export const App = () => {
  console.log('App rendering');
  const setToken = useAuthStore((state) => state.setToken);
  
  // Initialize auth from localStorage if token exists
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
          <AppRoutes />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};