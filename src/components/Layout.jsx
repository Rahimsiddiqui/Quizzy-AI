import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart,
  LogOut,
  Crown,
  Loader2,
  Settings,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import SettingsModal from "./SettingsModal.jsx";
import ConfirmLogoutModal from "./ConfirmLogoutModal.jsx";
import SidebarContext from "../context/SidebarContext.js";

const getProgressWidth = (remaining, max) => {
  if (max === Infinity) return "0%";
  if (remaining === null || remaining === undefined) return "0%";
  const used = max - remaining;
  return `${Math.min(100, Math.max(0, (used / max) * 100))}%`;
};

const Layout = ({ children, user, onLogout, refreshUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [quizzesLeft, setQuizzesLeft] = useState(
    user?.role === "admin" ? Infinity : user?.limits?.generationsRemaining || 0
  );
  const [pdfLeft, setPdfLeft] = useState(
    user?.role === "admin" ? Infinity : user?.limits?.pdfUploadsRemaining || 0
  );

  // Sync state whenever user prop changes
  useEffect(() => {
    setQuizzesLeft(
      user?.role === "admin"
        ? Infinity
        : user?.limits?.generationsRemaining ?? 0
    );
  }, [user]);

  useEffect(() => {
    setPdfLeft(
      user?.role === "admin" ? Infinity : user?.limits?.pdfUploadsRemaining ?? 0
    );
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
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: PlusCircle, label: "New Quiz", path: "/generate" },
      { icon: BarChart, label: "Overview", path: "/overview" },
      { icon: Zap, label: "Achievements", path: "/achievements" },
      { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    ],
    []
  );

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
    }, 1000);
  };

  const userTier = user?.tier || "Free";
  const isPro = user?.tier === "Pro";

  // Define tier limits
  const tierLimits = {
    Free: { generationsRemaining: 7, pdfUploadsRemaining: 3 },
    Basic: { generationsRemaining: 35, pdfUploadsRemaining: 20 },
    Pro: { generationsRemaining: Infinity, pdfUploadsRemaining: Infinity },
  };

  const MAX_QUIZZES = tierLimits[userTier]?.generationsRemaining ?? 7;
  const MAX_PDF_UPLOADS = tierLimits[userTier]?.pdfUploadsRemaining ?? 3;

  return (
    <div className="min-h-screen bg-background text-textMain flex font-sans no-print selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed h-full transition-all duration-300 bg-surface border-r border-border shadow-sm overflow-y-auto overflow-x-none max-w-64 ${
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
                  to="/dashboard"
                  className={`flex items-center gap-2.5 text-primary dark:text-blue-400 font-bold tracking-tight transition-opacity hover:opacity-90 min-w-fit ${
                    sidebarCollapsed ? "justify-center" : "text-[1.4rem]"
                  }`}
                  aria-label="Go to Qubli AI Dashboard"
                  title="Qubli AI"
                >
                  <img
                    src="/icons/favicon-main.png"
                    className="w-11 h-11 mx-auto"
                    alt="Brand Icon"
                    loading="lazy"
                  />
                  {!sidebarCollapsed && (
                    <span
                      className={`transition-opacity duration-300 ease-in-out ${
                        sidebarCollapsed ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      Qubli AI
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed((s) => !s)}
                className={`p-2 text-textMuted hover:bg-surfaceHighlight cursor-ew-resize rounded-md ${
                  !sidebarCollapsed ? "ml-8" : ""
                }`}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 fill-black dark:fill-white"
                  viewBox="0 0 20 20"
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

        <nav className="flex flex-col px-3 space-y-2 my-4 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex flex-${
                  sidebarCollapsed ? "col" : "row"
                } items-center gap-3 px-3 py-3 hover:pl-4 rounded-xl transition-all group ${
                  isActive
                    ? "bg-indigo-100/70 dark:bg-blue-800/20 text-primary dark:text-blue-400 shadow-sm dark:shadow-slate-700 pl-4"
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.15 : 2}
                  className={
                    isActive
                      ? "text-primary dark:text-blue-400"
                      : "group-hover:text-textMain"
                  }
                />
                {!sidebarCollapsed && (
                  <span
                    className={`text-[15px] font-medium transition-all ${
                      isActive ? "opacity-100" : "opacity-80"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-secondary rounded-r-full" />
                )}
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
                  : "bg-surfaceHighlight p-4 rounded-xl border border-border/50 shadow-md-custom"
              }`}
            >
              {!sidebarCollapsed ? (
                <>
                  <div
                    className={`flex items-center justify-between mb-4 transition-opacity duration-300 ease-in-out ${
                      sidebarCollapsed
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div
                        className={`overflow-hidden min-w-0 transition-opacity duration-300 ease-in-out whitespace-nowrap ${
                          sidebarCollapsed
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                        }`}
                      >
                        <p className="text-sm font-bold truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-textMuted truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-3 shadow-sm transition-opacity duration-300 ease-in-out whitespace-nowrap ${
                        sidebarCollapsed
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100"
                      } ${
                        user.tier === "Pro"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300"
                          : user.tier === "Basic"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300"
                      }
`}
                    >
                      {user.tier}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 mb-1 transition-opacity duration-300 ease-in-out ${
                      sidebarCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-textMuted whitespace-nowrap pointer-events-none">
                          Quiz Generations Left
                        </span>
                        <span
                          className={`font-bold ${
                            isPro || quizzesLeft > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isPro ? "∞" : quizzesLeft}
                        </span>
                      </div>
                      {user.tier !== "Pro" && (
                        <div className="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
                            style={{
                              width: getProgressWidth(quizzesLeft, MAX_QUIZZES),
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-textMuted whitespace-nowrap pointer-events-none">
                          PDF Uploads Left
                        </span>
                        <span className="font-bold text-textMain">
                          {isPro ? "∞" : pdfLeft}
                        </span>
                      </div>
                      {user.tier !== "Pro" && (
                        <div className="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
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
                    className={`w-full flex items-center justify-center gap-2 text-white hover:text-white/90 text-xs font-extrabold py-2.5 rounded-xl transition-all duration-300 ease-in-out active:scale-[0.98] mt-5 ${
                      sidebarCollapsed
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                    } ${
                      user.tier === "Free"
                        ? "bg-blue-600 dark:bg-blue-700 shadow-lg shadow-blue-500/40 dark:shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-700/80"
                        : user.tier === "Basic"
                        ? "bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 shadow-lg shadow-amber-500/50 dark:shadow-amber-600/30"
                        : "bg-blue-600 dark:bg-blue-700 shadow-lg shadow-blue-500/40 dark:shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-700/80"
                    }`}
                  >
                    {user.tier !== "Pro" ? (
                      <>
                        <Crown className="w-3.75 h-3.75 fill-white -mt-0.5" />
                        <span
                          className={`whitespace-nowrap opacity-${
                            !sidebarCollapsed ? "100" : "0"
                          } transition-all duration-300 ease-in-out`}
                        >
                          Upgrade Plan
                        </span>
                      </>
                    ) : (
                      <span
                        className={`whitespace-nowrap opacity-${
                          !sidebarCollapsed ? "100" : "0"
                        } transition-all duration-300 ease-in-out`}
                      >
                        Downgrade Plan
                      </span>
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
                    className="p-2 rounded-md bg-transparent text-amber-500 hover:bg-surfaceHighlight"
                  >
                    <Crown className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1.5 text-[15px] font-medium text-textMuted hover:bg-indigo-100/60 hover:text-indigo-600 dark:hover:bg-blue-800/30 dark:hover:text-blue-400 rounded-xl transition-all point ${
              !sidebarCollapsed ? "justify-start" : "justify-center"
            }`}
          >
            <Settings size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-medium text-textMuted hover:bg-rose-100/70 hover:text-rose-600 dark:hover:bg-red-800/30 dark:hover:text-red-400 rounded-xl transition-all point ${
              !sidebarCollapsed ? "justify-start" : "justify-center"
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed flex bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 overflow-x-auto overflow-y-hidden pb-safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex relative z-100 w-full justify-around gap-1 p-1 sm:p-2 px-2 sm:px-3 shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all active:scale-95 shrink-0 whitespace-nowrap ${
                  isActive
                    ? "text-primary dark:text-blue-500 bg-primary/10"
                    : "text-textMuted hover:text-textMain"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${
                    isActive ? "fill-primary/20 dark:text-blue-500/80" : ""
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
          <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b border-border/50">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 text-primary font-bold text-[1.4rem] hover:opacity-80 transition-opacity cursor-pointer bg-none border-none p-0"
              aria-label="Go to Qubli AI Dashboard"
            >
              <img
                src="/icons/favicon-main.png"
                className="w-11 h-11"
                alt="Brand Icon"
                loading="lazy"
              />
              <span>Qubli AI</span>
            </button>

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

          <SidebarContext.Provider
            value={{ sidebarCollapsed, setSidebarCollapsed }}
          >
            {children}
          </SidebarContext.Provider>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            user={user}
            refreshUser={refreshUser}
          />
        )}
        <ConfirmLogoutModal
          open={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          isProcessing={isLoggingOut}
          title="Logout"
          description="Are you sure you want to logout from this device?"
          confirmLabel="Logout"
          cancelLabel="Cancel"
        />
      </AnimatePresence>
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
