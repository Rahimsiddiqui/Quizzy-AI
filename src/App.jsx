import React, { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, Zoom } from "react-toastify";
import { Analytics } from "@vercel/analytics/react";

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
import Achievements from "./components/Achievements.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
// Admin components
import AdminLogin from "./components/AdminLogin.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AdminUsers from "./components/AdminUsers.jsx";
import AdminUserDetail from "./components/AdminUserDetail.jsx";
import AdminQuizzes from "./components/AdminQuizzes.jsx";
import AdminQuizDetail from "./components/AdminQuizDetail.jsx";
import AdminActivity from "./components/AdminActivity.jsx";
// Static pages
import Pricing from "./components/Pricing.jsx";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Policies from "./components/Policies.jsx";
import Terms from "./components/Terms.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import StorageService from "./services/storageService.js";
import { useTheme } from "./hooks/useTheme.js";

// Protected Route Wrapper
const ProtectedRoute = ({ children, auth }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  // If token is missing from localStorage but auth says we're authenticated,
  // the user was logged out in another window/tab, so redirect
  if (!token && auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!auth.user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public Only Route Wrapper - prevents authenticated users from accessing
const PublicOnlyRoute = ({ children, auth }) => {
  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Protected Admin Route Wrapper
const ProtectedAdminRoute = ({ children }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
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

    // Listen for account disabled event - redirect to landing with error message
    const handleAccountDisabled = (event) => {
      setAuth({ isAuthenticated: false, user: null });
      // Show error toast and redirect
      window.location.href =
        "/?message=" +
        encodeURIComponent(
          event.detail?.message || "Your account has been disabled"
        );
    };

    // Listen for account banned event - redirect to landing with error message
    const handleAccountBanned = (event) => {
      setAuth({ isAuthenticated: false, user: null });
      // Show error toast and redirect
      window.location.href =
        "/?message=" +
        encodeURIComponent(
          event.detail?.message || "Your account has been banned"
        );
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("sessionLogout", handleSessionLogout);
    window.addEventListener("accountDisabled", handleAccountDisabled);
    window.addEventListener("accountBanned", handleAccountBanned);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("sessionLogout", handleSessionLogout);
      window.removeEventListener("accountDisabled", handleAccountDisabled);
      window.removeEventListener("accountBanned", handleAccountBanned);
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
      // Failed to refresh user - ignore and keep current auth state
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
      <Analytics />
      <Router>
        <Routes>
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="quizzes/:quizId" element={<AdminQuizDetail />} />
            <Route path="activity" element={<AdminActivity />} />
          </Route>

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

          <Route element={<PublicLayout />}>
            <Route
              path="/features"
              element={
                <PublicOnlyRoute auth={auth}>
                  <FeaturesPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/testimonials"
              element={
                <PublicOnlyRoute auth={auth}>
                  <TestimonialsPage />
                </PublicOnlyRoute>
              }
            />

            {/* Static pages */}
            <Route
              path="/pricing"
              element={
                <PublicOnlyRoute auth={auth}>
                  <Pricing />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/about"
              element={
                <PublicOnlyRoute auth={auth}>
                  <About />
                </PublicOnlyRoute>
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/policies"
              element={
                <PublicOnlyRoute auth={auth}>
                  <Policies />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <PublicOnlyRoute auth={auth}>
                  <Policies />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/terms"
              element={
                <PublicOnlyRoute auth={auth}>
                  <Terms />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/"
              element={
                auth.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <PublicOnlyRoute auth={auth}>
                    <LandingPage onLogin={handleLoginSuccess} />
                  </PublicOnlyRoute>
                )
              }
            />
          </Route>

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
            path="/achievements"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <Achievements user={auth.user} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute auth={auth}>
                <Layout
                  user={auth.user}
                  onLogout={handleLogout}
                  refreshUser={refreshUser}
                >
                  <Leaderboard user={auth.user} />
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
