import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Shield,
  Activity,
  X,
  Users,
  UserX,
  Ban,
  ChevronDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomTooltip from "../user/CustomTooltip";
import ConfirmActionModal from "../user/ConfirmActionModal";
import StorageService from "../../services/storageService";
import {
  getUsers,
  toggleUserActive,
  toggleUserBan,
  promoteUserToAdmin,
  demoteAdminToUser,
} from "../../services/adminService";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);
  const mounted = useRef(true);
  const hasInitialized = useRef(false);
  const latestFetchId = useRef(0);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Get current user on component mount
  useEffect(() => {
    const current = StorageService.getCurrentUser();
    setCurrentUser(current);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const fetchId = ++latestFetchId.current;
    try {
      const res = await getUsers(
        pagination.page,
        pagination.limit,
        debouncedSearch,
        filters.role,
        filters.status
      );

      if (!mounted.current || fetchId !== latestFetchId.current) return;

      setUsers(res.users || []);
      setPagination((p) => ({
        ...p,
        page: pagination.page,
        pages: res.pagination?.pages || 1,
        total: res.pagination?.total || 0,
      }));
    } catch (e) {
      if (!mounted.current || fetchId !== latestFetchId.current) return;
      console.error("Error fetching users:", e);
      toast.error(`Failed to load users: ${e.message || e}`);
      setUsers([]);
    } finally {
      if (mounted.current && fetchId === latestFetchId.current) {
        setLoading(false);
      }
    }
  };

  // Single effect that handles all data fetching and auto-refresh
  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    filters.role,
    filters.status,
  ]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (hasInitialized.current) {
      setPagination((p) => ({ ...p, page: 1 }));
    } else {
      hasInitialized.current = true;
    }
  }, [filters.search, filters.role, filters.status]);

  useEffect(() => {
    mounted.current = true;

    const handleClickOutside = (event) => {
      if (!event.target.closest(".role-dropdown")) setIsRoleDropdownOpen(false);
      if (!event.target.closest(".status-dropdown"))
        setIsStatusDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      mounted.current = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleReset = () => {
    setFilters({ search: "", role: "", status: "" });
    setDebouncedSearch(""); // Immediately clear debounced search to prevent double-fetch
    setPagination((p) => ({ ...p, page: 1, limit: 10 }));
    toast.info("Filters reset to default");
  };

  const confirmPromoteUser = async () => {
    if (!selectedUserForModal) return;
    setProcessingUser(selectedUserForModal._id);

    // Optimistic update
    const previousUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === selectedUserForModal._id ? { ...u, role: "admin" } : u
      )
    );

    try {
      await promoteUserToAdmin(selectedUserForModal._id);
      toast.success("User promoted to admin successfully");
      fetchUsers();
      setShowPromoteModal(false);
      setSelectedUserForModal(null);
    } catch {
      // Rollback on error
      setUsers(previousUsers);
      toast.error("Failed to promote user to admin");
    } finally {
      setProcessingUser(null);
    }
  };

  const confirmDemoteUser = async () => {
    if (!selectedUserForModal) return;
    setProcessingUser(selectedUserForModal._id);

    // Optimistic update
    const previousUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === selectedUserForModal._id ? { ...u, role: "user" } : u
      )
    );

    try {
      await demoteAdminToUser(selectedUserForModal._id);
      toast.success("Admin demoted to user successfully");
      fetchUsers();
      setShowDemoteModal(false);
      setSelectedUserForModal(null);
    } catch {
      // Rollback on error
      setUsers(previousUsers);
      toast.error("Failed to demote admin");
    } finally {
      setProcessingUser(null);
    }
  };

  const confirmDisableUser = async () => {
    if (!selectedUserForModal) return;
    setProcessingUser(selectedUserForModal._id);

    // Optimistic update
    const previousUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === selectedUserForModal._id ? { ...u, active: !u.active } : u
      )
    );

    try {
      await toggleUserActive(selectedUserForModal._id, {
        reason: "Disabled by admin",
      });
      toast.success(
        selectedUserForModal.active
          ? "Account disabled successfully"
          : "Account enabled successfully"
      );
      fetchUsers();
      setShowDisableModal(false);
      setSelectedUserForModal(null);
    } catch {
      // Rollback on error
      setUsers(previousUsers);
      toast.error("Failed to update account status");
    } finally {
      setProcessingUser(null);
    }
  };

  const confirmBanUser = async () => {
    if (!selectedUserForModal) return;
    setProcessingUser(selectedUserForModal._id);

    // Optimistic update
    const previousUsers = users;
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u._id === selectedUserForModal._id ? { ...u, banned: !u.banned } : u
      )
    );

    try {
      await toggleUserBan(selectedUserForModal._id, {
        reason: "Banned by admin",
      });
      toast.success(
        selectedUserForModal.banned
          ? "User unbanned successfully"
          : "User banned successfully"
      );
      fetchUsers();
      setShowBanModal(false);
      setSelectedUserForModal(null);
    } catch {
      // Rollback on error
      setUsers(previousUsers);
      toast.error("Failed to update ban status");
    } finally {
      setProcessingUser(null);
    }
  };

  const StatusBadge = ({ user }) => {
    if (user.banned)
      return (
        <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-[10px] font-bold uppercase tracking-wider">
          Banned
        </span>
      );
    if (user.active)
      return (
        <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
          Active
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full bg-amber-200/70 dark:bg-amber-800/40 text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider">
        Disabled
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-textMain dark:text-textMain/95 tracking-tight mb-4">
            Users Management
          </h2>
          <p className="text-sm text-textMuted mb-3">
            Manage permissions and monitor user activity across the platform.
          </p>
        </div>
        <div className="bg-surface border border-border shadow-md-custom px-4 py-2 rounded-xl text-sm font-semibold text-textMain dark:text-textMain/90">
          {pagination.total} Total User
          {pagination.total <= 1 ? "" : "s"}
        </div>
      </header>

      {/* Desktop Filter Bar - Hidden on mobile */}
      <div className="hidden md:flex flex-wrap items-center gap-4 bg-surface py-4 px-5 border border-border rounded-2xl shadow-md-custom transition-colors">
        <div className="relative flex-1 min-w-70 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary dark:group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            className="w-full pl-10 pr-4 py-2.5 shadow-sm-custom bg-surfaceHighlight/30 border border-border rounded-xl text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => {
              setLoading(true);
              setFilters({ ...filters, search: e.target.value });
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Role Dropdown */}
          <div className="relative role-dropdown">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMain dark:text-textMain/90 hover:bg-surfaceHighlight/50 transition-all point w-44 shadow-sm-custom"
            >
              <div className="flex items-center gap-2">
                {filters.role === "admin" ? (
                  <Shield size={16} className="text-blue-500" />
                ) : (
                  <Users
                    size={16}
                    className={
                      filters.role === "user"
                        ? "text-primary"
                        : "text-textMuted"
                    }
                  />
                )}
                <span>
                  {filters.role === ""
                    ? "All Roles"
                    : filters.role === "admin"
                    ? "Admins"
                    : "Users"}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-textMuted transition-transform duration-300 ${
                  isRoleDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-sm z-50 overflow-hidden animate-slide-in-top">
                {[
                  { id: "", label: "All Roles", icon: Users },
                  { id: "user", label: "Regular Users", icon: Users },
                  { id: "admin", label: "Admins", icon: Shield },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, role: option.id });
                      setPagination((p) => ({ ...p, page: 1 }));
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 point ${
                      filters.role === option.id
                        ? "text-primary dark:text-blue-500 font-bold bg-primary/5 dark:bg-blue-500/5"
                        : "text-textMain font-medium"
                    }`}
                  >
                    <option.icon
                      size={16}
                      className={
                        filters.role === option.id
                          ? "text-primary dark:text-blue-400"
                          : "text-textMuted"
                      }
                    />
                    {option.label}
                    {filters.role === option.id && (
                      <CheckCircle size={14} className="ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative status-dropdown">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-semibold text-textMain dark:text-textMain/90 hover:bg-surfaceHighlight/50 transition-all w-44 shadow-sm-custom point"
            >
              <div className="flex items-center gap-2">
                {filters.status === "banned" ? (
                  <Ban size={16} className="text-red-500" />
                ) : (
                  <Activity
                    size={16}
                    className={
                      filters.status === "active"
                        ? "text-emerald-500"
                        : "text-textMuted"
                    }
                  />
                )}
                <span>
                  {filters.status === ""
                    ? "Any Status"
                    : filters.status === "active"
                    ? "Active"
                    : "Banned"}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-textMuted transition-transform duration-300 ${
                  isStatusDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-in-top">
                {[
                  { id: "", label: "Any Status", icon: Activity },
                  { id: "active", label: "Active", icon: Activity },
                  { id: "banned", label: "Banned", icon: Ban },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, status: option.id });
                      setPagination((p) => ({ ...p, page: 1 }));
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surfaceHighlight/50 point ${
                      filters.status === option.id
                        ? "text-primary dark:text-blue-500 font-bold bg-primary/5 dark:bg-blue-500/5"
                        : "text-textMain font-medium"
                    }`}
                  >
                    <option.icon
                      size={16}
                      className={
                        filters.status === option.id
                          ? "text-primary dark:text-blue-400"
                          : "text-textMuted"
                      }
                    />
                    {option.label}
                    {filters.status === option.id && (
                      <CheckCircle size={14} className="ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-surfaceHighlight/30 border border-border rounded-xl text-sm font-bold text-textMuted hover:text-primary dark:hover:text-blue-500 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm-custom group point"
            title="Reset all filters"
          >
            <RotateCcw
              size={16}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Bar - Shown only on small screens */}
      <div className="md:hidden space-y-4 xs:space-y-4.5 bg-surface p-4 border border-border rounded-2xl shadow-md-custom transition-colors">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted"
              size={16}
            />
            <input
              className="w-full pl-10 pr-4 py-2.5 shadow-md-custom bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => {
                setLoading(true);
                setFilters({ ...filters, search: e.target.value });
              }}
            />
          </div>
          <button
            onClick={handleReset}
            className="p-2.5 bg-surfaceHighlight border border-border rounded-xl text-textMuted hover:text-primary transition-all point shadow-md-custom"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full px-4 py-2.5 bg-surfaceHighlight shadow-md-custom border border-border rounded-xl text-sm font-medium text-textMain hover:bg-surfaceHighlight/80 transition-colors flex items-center justify-between"
        >
          <span>Filters</span>
          <div className="flex items-center gap-2">
            {(filters.role !== "" || filters.status !== "") && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
            <Filter
              size={16}
              className={`transition-transform ${
                mobileFiltersOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        {mobileFiltersOpen && (
          <div className="space-y-4 pt-4 border-t border-border animate-slide-in-top">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Filter by
                </h3>
                {(filters.role !== "" || filters.status !== "") && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-surfaceHighlight rounded-lg transition-colors"
              >
                <X size={16} className="text-textMuted" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-textMuted uppercase ml-1">
                  Role
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "", label: "All", icon: Users },
                    { id: "user", label: "Users", icon: Users },
                    { id: "admin", label: "Admins", icon: Shield },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setLoading(true);
                        setFilters({ ...filters, role: opt.id });
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        filters.role === opt.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-surfaceHighlight/30 text-textMain border border-border"
                      }`}
                    >
                      <opt.icon size={14} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-textMuted uppercase ml-1">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "", label: "Any", icon: Activity },
                    { id: "active", label: "Active", icon: Activity },
                    { id: "banned", label: "Banned", icon: Ban },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setLoading(true);
                        setFilters({ ...filters, status: opt.id });
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        filters.status === opt.id
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-surfaceHighlight/30 text-textMain border border-border"
                      }`}
                    >
                      <opt.icon size={14} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-surface shadow-lg-custom border border-border rounded-2xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center">
                  Joined
                </th>
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                // Skeleton Rows
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surfaceHighlight"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-surfaceHighlight rounded w-32"></div>
                          <div className="h-3 bg-surfaceHighlight rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-surfaceHighlight"></div>
                        <div className="h-4 bg-surfaceHighlight rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-6 bg-surfaceHighlight rounded-full w-20"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="h-4 bg-surfaceHighlight rounded w-20"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surfaceHighlight"></div>
                        <div className="w-8 h-8 rounded-lg bg-surfaceHighlight"></div>
                        <div className="w-8 h-8 rounded-lg bg-surfaceHighlight"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-textMuted"
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => navigate(`/admin/users/${u._id}`)}
                    className="hover:bg-surfaceHighlight/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary dark:text-blue-400 font-bold text-sm border border-primary/10 overflow-hidden">
                          {u.picture ? (
                            <img
                              src={u.picture}
                              alt={u.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-textMain truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-textMuted truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2 text-sm text-textMain">
                        {u.role === "admin" ? (
                          <>
                            <Shield size={14} className="text-blue-500" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users size={14} className="text-blue-500" />
                            <span className="capitalize">User</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge user={u} />
                    </td>
                    <td className="px-6 py-4 text-sm text-textMuted text-center">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CustomTooltip
                          content={
                            u.role === "admin"
                              ? currentUser?._id === u._id
                                ? "You cannot demote yourself"
                                : "Demote from admin"
                              : "Promote to admin"
                          }
                          position="top"
                        >
                          <button
                            onClick={() => {
                              setSelectedUserForModal(u);
                              if (u.role === "admin") {
                                // Prevent self-demotion
                                if (currentUser?._id === u._id) {
                                  toast.error(
                                    "You cannot demote yourself. Contact another admin for help."
                                  );
                                  return;
                                }
                                setShowDemoteModal(true);
                              } else {
                                setShowPromoteModal(true);
                              }
                            }}
                            disabled={
                              u.role === "admin" && currentUser?._id === u._id
                            }
                            className="p-2 hover:bg-surfaceHighlight rounded-lg text-primary dark:text-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Shield size={16} />
                          </button>
                        </CustomTooltip>

                        <CustomTooltip
                          content={
                            u.active
                              ? "Disable this account"
                              : "Enable this account"
                          }
                          position="top"
                        >
                          <button
                            onClick={() => {
                              setSelectedUserForModal(u);
                              setShowDisableModal(true);
                            }}
                            className="p-2 hover:bg-surfaceHighlight rounded-lg text-amber-600 transition-colors cursor-pointer"
                          >
                            <UserX size={16} />
                          </button>
                        </CustomTooltip>

                        <CustomTooltip
                          content={
                            u.banned ? "Unban this user" : "Ban this user"
                          }
                          position="top"
                        >
                          <button
                            onClick={() => {
                              setSelectedUserForModal(u);
                              setShowBanModal(true);
                            }}
                            className="p-2 hover:bg-surfaceHighlight rounded-lg text-red-600 transition-colors cursor-pointer"
                          >
                            <Ban size={16} />
                          </button>
                        </CustomTooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-textMuted uppercase tracking-widest">
            Showing <span className="text-textMain">{pagination.page}</span> of{" "}
            <span className="text-textMain">{pagination.pages}</span> Page
            {pagination.pages === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-textMain hover:bg-surfaceHighlight shadow-sm transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            <div className="flex items-center gap-1 mx-2">
              {pagination.pages <= 5 ? (
                [...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: i + 1 }))
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all point shadow-sm ${
                      pagination.page === i + 1
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-textMuted hover:text-textMain bg-surface border border-border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                <>
                  {pagination.page > 2 && (
                    <>
                      <button
                        onClick={() =>
                          setPagination((p) => ({ ...p, page: 1 }))
                        }
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
                      >
                        1
                      </button>
                      {pagination.page > 3 && (
                        <span className="px-1 text-textMuted">...</span>
                      )}
                    </>
                  )}
                  {[
                    Math.max(1, pagination.page - 1),
                    pagination.page,
                    Math.min(pagination.pages, pagination.page + 1),
                  ]
                    .filter((p, i, arr) => arr.indexOf(p) === i)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: p }))
                        }
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          pagination.page === p
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-textMuted hover:text-textMain bg-surface border border-border"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  {pagination.page < pagination.pages - 1 && (
                    <>
                      {pagination.page < pagination.pages - 2 && (
                        <span className="px-1 text-textMuted">...</span>
                      )}
                      <button
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: pagination.pages,
                          }))
                        }
                        className="w-8 h-8 rounded-lg text-xs font-bold text-textMuted hover:text-textMain bg-surface border border-border transition-all shadow-sm"
                      >
                        {pagination.pages}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(pagination.pages, p.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Promote Admin Modal */}
      <ConfirmActionModal
        isOpen={showPromoteModal}
        title="Promote to Admin"
        message={`Promote "${selectedUserForModal?.name}" to admin? They will have access to the admin dashboard and user management features.`}
        confirmText="Promote"
        cancelText="Cancel"
        isDangerous={false}
        isLoading={processingUser === selectedUserForModal?._id}
        onConfirm={confirmPromoteUser}
        onCancel={() => {
          setShowPromoteModal(false);
          setSelectedUserForModal(null);
        }}
      />

      {/* Demote Admin Modal */}
      <ConfirmActionModal
        isOpen={showDemoteModal}
        title="Demote from Admin"
        message={`Demote "${selectedUserForModal?.name}" from admin? They will lose access to the admin dashboard and all admin privileges.`}
        confirmText="Demote"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={processingUser === selectedUserForModal?._id}
        onConfirm={confirmDemoteUser}
        onCancel={() => {
          setShowDemoteModal(false);
          setSelectedUserForModal(null);
        }}
      />

      {/* Disable Account Modal */}
      <ConfirmActionModal
        isOpen={showDisableModal}
        title={
          selectedUserForModal?.active ? "Disable Account" : "Enable Account"
        }
        message={
          selectedUserForModal?.active
            ? `Disable "${selectedUserForModal?.name}"'s account? They will be logged out on their next request.`
            : `Enable "${selectedUserForModal?.name}"'s account? They will be able to access the platform again.`
        }
        confirmText={selectedUserForModal?.active ? "Disable" : "Enable"}
        cancelText="Cancel"
        isDangerous={selectedUserForModal?.active}
        isLoading={processingUser === selectedUserForModal?._id}
        onConfirm={confirmDisableUser}
        onCancel={() => {
          setShowDisableModal(false);
          setSelectedUserForModal(null);
        }}
      />

      {/* Ban Account Modal */}
      <ConfirmActionModal
        isOpen={showBanModal}
        title={selectedUserForModal?.banned ? "Unban User" : "Ban User"}
        message={
          selectedUserForModal?.banned
            ? `Unban "${selectedUserForModal?.name}"? They will be able to access the platform again.`
            : `Ban "${selectedUserForModal?.name}"? They will be permanently banned and logged out immediately. All sessions will be terminated.`
        }
        confirmText={selectedUserForModal?.banned ? "Unban" : "Ban"}
        cancelText="Cancel"
        isDangerous={!selectedUserForModal?.banned}
        isLoading={processingUser === selectedUserForModal?._id}
        onConfirm={confirmBanUser}
        onCancel={() => {
          setShowBanModal(false);
          setSelectedUserForModal(null);
        }}
      />
    </div>
  );
}
