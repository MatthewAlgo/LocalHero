import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import LocationManager from './components/LocationManager/LocationManager';
import LocationDetail from './components/LocationManager/LocationDetail';
import ContentGenerator from './components/ContentGenerator/ContentGenerator';
import ReviewResponder from './components/ReviewResponder/ReviewResponder';
import Layout from './components/Layout/Layout';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="locations" element={<LocationManager />} />
        <Route path="locations/:id" element={<LocationDetail />} />
        <Route path="locations/:id/content" element={<ContentGenerator />} />
        <Route path="locations/:id/reviews" element={<ReviewResponder />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
