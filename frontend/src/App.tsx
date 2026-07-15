import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import axios from 'axios';

// Import Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Components
import Navbar from './components/Navbar';

// Import Pages
import AuthScreen from './pages/AuthScreen';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import ComplaintDetailView from './pages/ComplaintDetailView';

// Axios defaults
axios.defaults.baseURL = '/';

// Protected Route for Citizens
const CitizenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'CITIZEN') return <Navigate to="/officer" replace />;
  return <>{children}</>;
};

// Protected Route for Officers
const OfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'OFFICER') return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-100">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <Routes>
              {/* Public Authentications */}
              <Route path="/login" element={<AuthScreen isRegister={false} />} />
              <Route path="/register" element={<AuthScreen isRegister={true} />} />

              {/* Citizen Portals */}
              <Route
                path="/"
                element={
                  <CitizenRoute>
                    <CitizenDashboard />
                  </CitizenRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={<ComplaintDetailView />}
              />

              {/* Officer Portals */}
              <Route
                path="/officer"
                element={
                  <OfficerRoute>
                    <OfficerDashboard />
                  </OfficerRoute>
                }
              />

              {/* Route Fallback redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
