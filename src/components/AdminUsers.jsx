import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Shield,
  Mail,
  Calendar,
  Activity,
  X,
  Users,
  UserX,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomTooltip from "./CustomTooltip";
import ConfirmActionModal from "./ConfirmActionModal";
import StorageService from "../services/storageService";
import {
  getUsers,
  toggleUserActive,
  toggleUserBan,
  promoteUserToAdmin,
  demoteAdminToUser,
} from "../services/adminService";

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

  // Get current user on component mount
  useEffect(() => {
    const current = StorageService.getCurrentUser();
    setCurrentUser(current);
  }, []);

  // Single effect that handles all data fetching
  useEffect(() => {
    setLoading(true);

    const doFetch = async () => {
      try {
        const fetchId = ++latestFetchId.current;
        const res = await getUsers(
          pagination.page,
          pagination.limit,
          filters.search,
          filters.role,
          filters.status
        );

        if (!mounted.current || fetchId !== latestFetchId.current) return;

        console.log(
          "Frontend received users:",
          res.users,
          "Full response:",
          res
        );
        setUsers(res.users || []);
        setPagination((p) => ({
          ...p,
          page: pagination.page,
          pages: res.pagination?.pages || 1,
          total: res.pagination?.total || 0,
        }));
      } catch (e) {
        console.error("Error fetching users:", e);
        if (mounted.current) {
          toast.error(`Failed to load users: ${e.message || e}`);
          setUsers([]);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    doFetch();
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.role,
    filters.status,
  ]);

  // Set up auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch users without changing page
      const doFetch = async () => {
        try {
          const fetchId = ++latestFetchId.current;
          const res = await getUsers(
            pagination.page,
            pagination.limit,
            filters.search,
            filters.role,
            filters.status
          );

          if (!mounted.current || fetchId !== latestFetchId.current) return;

          setUsers(res.users || []);
          setPagination((p) => ({
            ...p,
            pages: res.pagination?.pages || 1,
            total: res.pagination?.total || 0,
          }));
        } catch (e) {
          console.error("Auto-refresh failed:", e);
        }
      };

      doFetch();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
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
    return () => (mounted.current = false);
  }, []);

  // Callback to refetch users
  const refetchUsers = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

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
      setShowPromoteModal(false);
      setSelectedUserForModal(null);
    } catch (error) {
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
      setShowDemoteModal(false);
      setSelectedUserForModal(null);
    } catch (error) {
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
      setShowDisableModal(false);
      setSelectedUserForModal(null);
    } catch (error) {
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
      setShowBanModal(false);
      setSelectedUserForModal(null);
    } catch (error) {
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
        <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
          Active
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
        Disabled
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-textMain tracking-tight mb-4">
            Users Management
          </h2>
          <p className="text-sm text-textMuted mb-3">
            Manage permissions and monitor user activity across the platform.
          </p>
        </div>
        <div className="bg-surface border border-border px-4 py-2 rounded-xl text-sm font-semibold text-textMain shadow-sm">
          {pagination.total} Total Users
        </div>
      </header>

      {/* Desktop Filter Bar - Hidden on mobile */}
      <div className="hidden md:flex flex-wrap items-center gap-4 bg-surface p-4 border border-border rounded-2xl shadow-sm transition-colors">
        <div className="relative flex-1 min-w-70">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted"
            size={16}
          />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none point transition-colors"
            value={filters.role}
            onChange={(e) => {
              setFilters({ ...filters, role: e.target.value });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Users</option>
            <option value="user">Regular Users</option>
            <option value="admin">Admins</option>
          </select>
          <select
            className="px-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none point transition-colors"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">Any Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Mobile Filter Bar - Shown only on small screens */}
      <div className="md:hidden space-y-3 bg-surface p-4 border border-border rounded-2xl shadow-sm transition-colors">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted"
            size={16}
          />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full px-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm font-medium text-textMain hover:bg-surfaceHighlight/80 transition-colors flex items-center justify-between"
        >
          <span>Filters</span>
          <Filter
            size={16}
            className={`transition-transform ${
              mobileFiltersOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {mobileFiltersOpen && (
          <div className="space-y-3 pt-3 border-t border-border animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Filter by
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-surfaceHighlight rounded-lg transition-colors"
              >
                <X size={16} className="text-textMuted" />
              </button>
            </div>
            <select
              className="w-full px-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none point transition-colors"
              value={filters.role}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value });
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="">All Users</option>
              <option value="user">Regular Users</option>
              <option value="admin">Admins</option>
            </select>
            <select
              className="w-full px-4 py-2.5 bg-surfaceHighlight border border-border rounded-xl text-sm text-textMain focus:outline-none point transition-colors"
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="">Any Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">
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
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-textMuted animate-pulse"
                  >
                    Loading users...
                  </td>
                </tr>
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
                            className="p-2 hover:bg-surfaceHighlight rounded-lg text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="px-6 py-4 bg-surfaceHighlight/30 border-t border-border flex items-center justify-between">
          <span className="text-xs font-medium text-textMuted uppercase tracking-widest">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-textMain hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(p.pages, p.page + 1),
                }))
              }
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
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
