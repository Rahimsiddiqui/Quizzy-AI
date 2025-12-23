import React, { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, Zoom } from "react-toastify";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import QuizGenerator from "./components/QuizGenerator.jsx";
import QuizTaker from "./components/QuizTaker.jsx";
import Overview from "./components/Overview.jsx";
import Subscription from "./components/Subscription.jsx";
import AuthForm from "./components/AuthForm.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";
import OAuthCallback from "./components/OAuthCallback.jsx";
import LandingPage from "./components/LandingPage.jsx";
import FeaturesPage from "./components/FeaturesPage.jsx";
import TestimonialsPage from "./components/TestimonialsPage.jsx";
import StorageService from "./services/storageService.js";
import { useTheme } from "./hooks/useTheme.js";

// Protected Route Wrapper
const ProtectedRoute = ({ children, auth }) => {
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!auth.user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [auth, setAuth] = useState({ isAuthenticated: false, user: null });
  const [loading, setLoading] = useState(true);
  useTheme(); // Initialize theme on app load

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth({ isAuthenticated: true, user });
    }
    setLoading(false);
  }, []);

  // Listen for user updates dispatched from other parts of the app
  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event.detail || StorageService.getCurrentUser();
      if (updatedUser) setAuth({ isAuthenticated: true, user: updatedUser });
    };

    // Listen for session logout event (no page reload)
    const handleSessionLogout = () => {
      setAuth({ isAuthenticated: false, user: null });
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("sessionLogout", handleSessionLogout);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("sessionLogout", handleSessionLogout);
    };
  }, []);

  const handleLoginSuccess = () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth({ isAuthenticated: true, user });
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setAuth({ isAuthenticated: false, user: null });
    // Full page reload to clear all state and redirect to landing page
    window.location.href = "/";
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await StorageService.refreshUser();
      setAuth({ ...auth, user: updatedUser });
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <CircularProgress sx={{ color: "#2563eb" }} size={50} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={2}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
        transition={Zoom}
        toastStyle={{
          width: "auto",
          color: "#000",
          padding: "0 40px 0 30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          fontWeight: "500",
        }}
      />
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<OAuthCallback />} />

          <Route
            path="/auth"
            element={
              auth.isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthForm onLogin={handleLoginSuccess} />
              )
            }
          />

          <Route path="/auth/verify-email" element={<VerifyEmail />} />

          <Route path="/features" element={<FeaturesPage />} />

          <Route path="/testimonials" element={<TestimonialsPage />} />

          <Route
            path="/"
            element={
              auth.isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage onLogin={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <Dashboard user={auth.user} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/generate"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <QuizGenerator
                    user={auth.user}
                    onGenerateSuccess={refreshUser}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <QuizTaker
                    user={auth.user}
                    onComplete={refreshUser}
                    onLimitUpdate={refreshUser}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/overview"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <Overview user={auth.user} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subscription"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <Subscription user={auth.user} onUpgrade={refreshUser} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/flashcards"
            element={<Navigate to="/overview" replace />}
          />
        </Routes>
      </Router>
    </>
  );
};

export default App;
