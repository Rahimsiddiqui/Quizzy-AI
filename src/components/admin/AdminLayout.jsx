import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpenCheck,
  FileText,
  BookOpen,
  LogOut,
  Search,
  Activity,
} from "lucide-react";
import {
  getAdminInfo,
  getUsers,
  getQuizzes,
} from "../../services/adminService";
import StorageService from "../../services/storageService";
import ConfirmLogoutModal from "../user/ConfirmLogoutModal.jsx";

const menuItems = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/quizzes", label: "Quizzes", icon: BookOpenCheck },
  { to: "/admin/blogs", label: "Blogs", icon: FileText },
  { to: "/admin/activity", label: "Activity", icon: Activity },
];

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    users: [],
    quizzes: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    let mounted = true;
    getAdminInfo()
      .then((res) => {
        if (mounted) {
          // Verify that user is actually an admin
          if (res.admin?.role !== "admin" && res.admin?.role !== "moderator") {
            // Kick them out - they're not authorized to be here
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            StorageService.logoutAdmin();
            navigate("/", { replace: true });
            return;
          }
          setAdmin(res.admin);
          setIsAuthChecking(false);
        }
      })
      .catch(() => {
        if (mounted) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login", { replace: true });
        }
      });

    return () => (mounted = false);
  }, [navigate]);

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      StorageService.logoutAdmin();
      // Full page reload to clear all state and redirect to admin login
      window.location.href = "/admin/login";
    }, 1000);
  };

  const pageTitle =
    location.pathname.replace("/admin/", "").split("/")[0] || "dashboard";
  const displayTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  // Debounced search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], quizzes: [] });
      setShowResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const [usersRes, quizzesRes] = await Promise.all([
          getUsers(1, 4, searchQuery),
          getQuizzes(1, 4, null, null, searchQuery),
        ]);
        setSearchResults({
          users: usersRes.users || [],
          quizzes: quizzesRes.quizzes || [],
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <div className="w-12 h-12 border-4 border-border rounded-full border-t-primary"></div>
          </div>
          <p className="text-textMuted font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-slate-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col z-20 fixed h-full transition-all duration-300 bg-surface border-r border-border shadow-sm overflow-y-auto overflow-x-none max-w-64 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo / Toggle */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div
              className={`flex items-center justify-between space-x-${
                !sidebarCollapsed && "2"
              }`}
            >
              {!sidebarCollapsed && (
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center gap-2.5 text-primary dark:text-blue-400 font-bold tracking-tight transition-opacity text-[1.4rem] duration-300 hover:opacity-90 overflow-x-none min-w-fit ${
                    sidebarCollapsed
                      ? "justify-center opacity-0"
                      : "opacity-100"
                  }`}
                  aria-label="Go to Qubli AI Dashboard"
                  title="Qubli AI"
                >
                  <img
                    src="/icons/favicon-main.png"
                    className="w-11 h-11"
                    alt="Brand Icon"
                    loading="lazy"
                    decoding="async"
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

        {/* Navigation */}
        <nav className="flex flex-col px-3 space-y-2 my-4 py-3">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-${
                  sidebarCollapsed ? "col" : "row"
                } items-center gap-3 px-3 py-3 hover:pl-4 rounded-xl transition-all group ${
                  isActive
                    ? "bg-indigo-100/70 dark:bg-blue-800/20 text-primary dark:text-blue-400 dark:shadow-slate-700 shadow-sm pl-4"
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                }`}
              >
                <Icon
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

        {/* Footer: Logout */}
        <div className="p-4 pt-6 border-t border-border">
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-medium text-textMuted hover:bg-rose-100/70 hover:text-rose-600 dark:hover:bg-red-800/30 dark:hover:text-red-400 rounded-xl transition-all point ${
              !sidebarCollapsed ? "justify-start" : "justify-center"
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        <ConfirmLogoutModal
          open={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          isProcessing={isLoggingOut}
          title="Log Out"
          description="Are you sure you want to log out?"
          confirmLabel="Log Out"
          cancelLabel="Cancel"
        />
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Top Bar */}
        <header className="h-20 bg-surface backdrop-blur-md border-b border-border flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-xl font-bold text-textMuted tracking-tight">
              {displayTitle}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden group md:block search-container">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  isSearching
                    ? "text-primary animate-pulse"
                    : "text-textMuted group-focus-within:text-primary dark:group-focus-within:text-blue-400"
                }`}
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                placeholder="Search users or quizzes..."
                className="pl-10 pr-4 py-2 bg-surfaceHighlight/30 border border-border rounded-xl text-textMain text-sm focus:outline-none focus:ring-2 focus:ring-primary/80 w-64 lg:w-80 transition-all shadow-sm-custom"
              />

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-surface border border-border rounded-2xl shadow-md-custom overflow-hidden z-50 animate-fade-in">
                  {isSearching && searchQuery.trim() && (
                    <div className="p-4 text-center text-textMuted text-sm">
                      Searching...
                    </div>
                  )}

                  {!isSearching &&
                    searchResults.users.length === 0 &&
                    searchResults.quizzes.length === 0 && (
                      <div className="p-4 text-center text-textMuted text-sm">
                        No results found for "{searchQuery}"
                      </div>
                    )}

                  {!isSearching && (
                    <div className="max-h-[70vh] overflow-y-auto">
                      {/* Users Category */}
                      {searchResults.users.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-surfaceHighlight/50 border-b border-border text-[10px] font-bold text-textMuted uppercase tracking-wider">
                            Users
                          </div>
                          {searchResults.users.map((u) => (
                            <button
                              key={u._id}
                              onClick={() => {
                                navigate(`/admin/users/${u._id}`);
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 dark:hover:bg-blue-900/20 text-left transition-colors group point"
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-800/40 shrink-0">
                                {u.picture ? (
                                  <img
                                    src={u.picture}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary dark:text-blue-400">
                                    {u.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-textMain truncate">
                                  {u.name}
                                </p>
                                <p className="text-xs text-textMuted truncate">
                                  {u.email}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quizzes Category */}
                      {searchResults.quizzes.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-surfaceHighlight/50 border-b border-border text-[10px] font-bold text-textMuted uppercase tracking-wider border-t">
                            Quizzes
                          </div>
                          {searchResults.quizzes.map((q) => (
                            <button
                              key={q._id}
                              onClick={() => {
                                navigate(`/admin/quizzes/${q._id}`);
                                setShowResults(false);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 dark:hover:bg-blue-900/20 text-left transition-colors group point"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <BookOpen size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-textMain truncate">
                                  {q.title}
                                </p>
                                <p className="text-xs text-textMuted truncate">
                                  {q.topic} • {q.difficulty}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-surfaceHighlight" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-textMain leading-none">
                  {admin?.name}
                </p>
                <p className="text-[11px] text-textMuted mt-1 uppercase tracking-wider">
                  Online
                </p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-800/40 shrink-0">
                {admin?.picture ? (
                  <img
                    src={admin.picture}
                    alt={admin.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-primary dark:text-blue-400">
                    {admin?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-background pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-10 shadow-lg overflow-x-auto">
          <div className="flex items-center justify-around gap-3 h-16 px-2">
            {menuItems.map(({ to, label, icon: IconComponent }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full transition-colors rounded-lg ${
                  location.pathname === to
                    ? "text-primary bg-primary/10"
                    : "text-textMuted hover:text-textMain"
                }`}
              >
                <IconComponent size={18} />
                <span className="text-[9px] font-semibold uppercase tracking-wider truncate">
                  {label}
                </span>
              </Link>
            ))}
            <button
              onClick={handleLogoutClick}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full transition-colors text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg"
            >
              <LogOut size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                Logout
              </span>
            </button>
          </div>
        </nav>

        {/* Logout Modal */}
        <ConfirmLogoutModal
          open={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          isProcessing={isLoggingOut}
          title="Logout from Admin Panel"
          description="Are you sure you want to logout from the admin panel? You'll need to login again to access admin features."
          confirmLabel="Logout"
          cancelLabel="Cancel"
        />
      </main>
    </div>
  );
}
