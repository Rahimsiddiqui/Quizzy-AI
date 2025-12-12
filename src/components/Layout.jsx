import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart,
  LogOut,
  Crown,
  BrainCircuit,
  Loader2,
  Settings,
} from "lucide-react";
import PropTypes from "prop-types";
import SettingsModal from "./SettingsModal.jsx";

const getProgressWidth = (remaining, max) => {
  if (max === Infinity) return "0%";
  if (remaining === null || remaining === undefined) return "0%";
  const used = max - remaining;
  return `${Math.min(100, Math.max(0, (used / max) * 100))}%`;
};

const Layout = ({ children, user, onLogout, refreshUser }) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quizzesLeft, setQuizzesLeft] = useState(
    user?.limits?.generationsRemaining || 0
  );
  const [pdfLeft, setPdfLeft] = useState(
    user?.limits?.pdfUploadsRemaining || 0
  );

  // Sync state whenever user prop changes
  useEffect(() => {
    setQuizzesLeft(user?.limits?.generationsRemaining ?? 0);
  }, [user]);

  useEffect(() => {
    setPdfLeft(user?.limits?.pdfUploadsRemaining ?? 0);
  }, [user]);

  // Listen for custom events from Storage Service
  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event.detail;
      if (updatedUser?.limits?.generationsRemaining !== undefined) {
        setQuizzesLeft(updatedUser.limits.generationsRemaining);
      }
      if (updatedUser?.limits?.pdfUploadsRemaining !== undefined) {
        setPdfLeft(updatedUser.limits.pdfUploadsRemaining);
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: PlusCircle, label: "New Quiz", path: "/generate" },
      { icon: BarChart, label: "Overview", path: "/overview" },
    ],
    []
  );

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
      setIsLoggingOut(false);
    }, 1000);
  };

  const userTier = user?.tier || "Free";
  const isPro = user?.tier === "Pro";

  // Define tier limits
  const tierLimits = {
    Free: { generationsRemaining: 7, pdfUploadsRemaining: 3 },
    Basic: { generationsRemaining: 30, pdfUploadsRemaining: 10 },
    Pro: { generationsRemaining: Infinity, pdfUploadsRemaining: Infinity },
  };

  const MAX_QUIZZES = tierLimits[userTier]?.generationsRemaining ?? 7;
  const MAX_PDF_UPLOADS = tierLimits[userTier]?.pdfUploadsRemaining ?? 3;

  return (
    <div className="min-h-screen bg-background text-textMain flex font-sans no-print selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed h-full z-10 transition-all duration-300 bg-surface border-r border-border shadow-sm overflow-auto ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div
              className={`flex items-center justify-between space-x-${
                !sidebarCollapsed && "2"
              }`}
            >
              {!sidebarCollapsed && (
                <Link
                  to="/"
                  className={`flex items-center gap-2 text-primary font-bold tracking-tight transition-opacity hover:opacity-80 ${
                    sidebarCollapsed ? "justify-center" : "text-xl"
                  }`}
                  aria-label="Go to Quizzy AI Dashboard"
                  title="Quizzy AI"
                >
                  <BrainCircuit className="w-7 h-7" />
                  {!sidebarCollapsed && <span>Quizzy AI</span>}
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed((s) => !s)}
                className={`p-2 text-textMuted hover:bg-surfaceHighlight cursor-ew-resize rounded-md`}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="black"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 15a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 pb-5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center py-3 px-4 hover:pl-5 ${
                  sidebarCollapsed ? "justify-center" : "gap-3"
                } rounded-xl transition-all duration-200 mt-2 group ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-inner pl-5"
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {user && (
            <div
              className={`p-3 mb-4 ${
                sidebarCollapsed
                  ? "flex items-center justify-center"
                  : "bg-surfaceHighlight p-4 rounded-xl border border-border/50 shadow-lg shadow-black/5"
              }`}
            >
              {!sidebarCollapsed ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 mb-1 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-sm font-bold truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-textMuted truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-3 shadow-sm ${
                        user.tier === "Pro"
                          ? "bg-amber-100 text-amber-700"
                          : user.tier === "Basic"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {user.tier}
                    </span>
                  </div>
                  <div className="space-y-3 mb-1">
                    <div className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-textMuted">
                          Quiz Generations Left
                        </span>
                        <span
                          className={`font-bold ${
                            isPro || quizzesLeft > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {isPro ? "∞" : quizzesLeft}
                        </span>
                      </div>
                      {user.tier !== "Pro" && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                            style={{
                              width: getProgressWidth(quizzesLeft, MAX_QUIZZES),
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-textMuted">PDF Uploads Left</span>
                        <span className="font-bold text-textMain">
                          {isPro ? "∞" : pdfLeft}
                        </span>
                      </div>
                      {user.tier !== "Pro" && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                            style={{
                              width: getProgressWidth(pdfLeft, MAX_PDF_UPLOADS),
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/subscription"
                    className="w-full flex items-center justify-center gap-2 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all active:scale-[0.98] mt-5"
                    style={{
                      background:
                        user.tier === "Free"
                          ? "#2563eb"
                          : user.tier === "Basic"
                          ? "linear-gradient(to right, #f59e0b, #fb923c)"
                          : "#2563eb",
                      boxShadow:
                        user.tier === "Free"
                          ? "0 4px 12px rgba(37, 99, 235, 0.4)"
                          : user.tier === "Basic"
                          ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                          : "0 4px 12px rgba(37, 99, 235, 0.4)",
                    }}
                  >
                    {user.tier !== "Pro" ? (
                      <>
                        <Crown className="w-[15px] h-[15px] fill-white -mt-0.5" />
                        Upgrade Plan
                      </>
                    ) : (
                      "Downgrade Plan"
                    )}
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <Link
                    to="/subscription"
                    title="Upgrade Plan"
                    className="p-2 rounded-md bg-transparent text-orange-500 hover:bg-surfaceHighlight"
                  >
                    <Crown className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "px-[13px]" : "px-4"
            } py-2 text-textMuted hover:text-primary transition-colors w-full rounded-xl hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-5 cursor-pointer`}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "px-[13px]" : "px-4"
            } py-2 text-textMuted hover:text-red-600 transition-colors w-full rounded-xl hover:bg-red-50 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mt-3 cursor-pointer`}
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}

            {!sidebarCollapsed && (isLoggingOut ? "Logging out..." : "Logout")}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed flex bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-40 overflow-x-auto overflow-y-hidden pb-safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex w-full justify-around gap-1 p-1 sm:p-2 px-2 sm:px-3 flex-shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all active:scale-95 flex-shrink-0 whitespace-nowrap ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-textMuted hover:text-textMain"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${
                    isActive ? "fill-primary/20" : ""
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[8px] sm:text-[9px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <Link
            to="/subscription"
            className="flex flex-col items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-textMuted shrink-0 active:scale-95 hover:text-orange-500 transition-colors whitespace-nowrap"
            aria-label="Upgrade Plan"
          >
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-orange-500" />
            <span className="text-[8px] sm:text-[9px] font-semibold leading-tight">
              Upgrade
            </span>
          </Link>

          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-textMuted shrink-0 active:scale-95 hover:text-primary transition-colors whitespace-nowrap"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[8px] sm:text-[9px] font-semibold leading-tight">
              Settings
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        className={`flex-1 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        } p-4 md:p-8 overflow-y-auto min-h-screen bg-background pb-24 md:pb-8 transition-all`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur z-30 py-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <BrainCircuit className="w-7 h-7" />
              <span>Quizzy AI</span>
            </div>

            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="p-2 text-textMuted hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label={isLoggingOut ? "Logging out..." : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>

          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          user={user}
          refreshUser={refreshUser}
        />
      )}
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    tier: PropTypes.string,
    limits: PropTypes.shape({
      generationsRemaining: PropTypes.number,
      pdfUploadsRemaining: PropTypes.number,
    }),
  }),
  onLogout: PropTypes.func.isRequired,
  refreshUser: PropTypes.func.isRequired,
};

export default Layout;
