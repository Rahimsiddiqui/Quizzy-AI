import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Activity,
  Shield,
  Users,
  UserX,
  Ban,
  CheckCircle2,
  XCircle,
  Percent,
  Clock,
  LogOut,
  Zap,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomTooltip from "./CustomTooltip";
import ConfirmActionModal from "./ConfirmActionModal";
import StorageService from "../services/storageService";
import {
  getUserDetail,
  toggleUserActive,
  toggleUserBan,
  promoteUserToAdmin,
  demoteAdminToUser,
} from "../services/adminService";

function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [demoting, setDemoting] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [banning, setBanning] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserDetail(userId);
        setUser(data.user);
        setStats(data.stats);
        // Get current user to check for self-demotion
        const current = StorageService.getCurrentUser();
        setCurrentUser(current);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handlePromoteToAdmin = async () => {
    if (user.role === "admin") {
      toast.warning("User is already an admin");
      return;
    }

    setShowPromoteModal(true);
  };

  const confirmPromoteToAdmin = async () => {
    setPromoting(true);
    try {
      await promoteUserToAdmin(userId);
      setUser((prev) => ({ ...prev, role: "admin" }));
      toast.success("User promoted to admin successfully");
      setShowPromoteModal(false);
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("Failed to promote user to admin");
    } finally {
      setPromoting(false);
    }
  };

  const handleDemoteAdmin = async () => {
    // Prevent self-demotion
    if (currentUser && currentUser._id === userId) {
      toast.error(
        "You cannot demote yourself. Contact another admin for help."
      );
      return;
    }
    setShowDemoteModal(true);
  };

  const confirmDemoteAdmin = async () => {
    setDemoting(true);
    try {
      await demoteAdminToUser(userId);
      setUser((prev) => ({ ...prev, role: "user" }));
      toast.success("Admin demoted to user successfully");
      setShowDemoteModal(false);
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to demote admin");
    } finally {
      setDemoting(false);
    }
  };

  const handleDisableAccount = async () => {
    setShowDisableModal(true);
  };

  const confirmDisableAccount = async () => {
    setDisabling(true);
    try {
      await toggleUserActive(userId, { reason: "Disabled by admin" });
      setUser((prev) => ({ ...prev, active: !prev.active }));
      toast.success(
        user.active
          ? "Account disabled. User will be logged out on next request."
          : "Account enabled successfully"
      );
      setShowDisableModal(false);
    } catch (error) {
      console.error("Error toggling account status:", error);
      toast.error("Failed to update account status");
    } finally {
      setDisabling(false);
    }
  };

  const handleBanAccount = async () => {
    setShowBanModal(true);
  };

  const confirmBanAccount = async () => {
    setBanning(true);
    try {
      await toggleUserBan(userId, { reason: "Banned by admin" });
      setUser((prev) => ({ ...prev, banned: !prev.banned }));
      toast.success(
        user.banned
          ? "User unbanned successfully"
          : "User banned. They will be logged out on next request."
      );
      setShowBanModal(false);
    } catch (error) {
      console.error("Error toggling ban status:", error);
      toast.error("Failed to update ban status");
    } finally {
      setBanning(false);
    }
  };

  const StatusBadge = ({ user }) => {
    if (user.banned)
      return (
        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-bold uppercase tracking-wider">
          Banned
        </span>
      );
    if (user.active)
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm font-bold uppercase tracking-wider">
          Active
        </span>
      );
    return (
      <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-sm font-bold uppercase tracking-wider">
        Disabled
      </span>
    );
  };

  const StatCard = ({ icon: Icon, label, value, tooltip }) => (
    <CustomTooltip content={tooltip} position="top">
      <div className="p-4 bg-surfaceHighlight/30 rounded-2xl border border-border/50 cursor-help">
        <div className="flex items-start gap-3 mb-2">
          <Icon size={16} className="text-primary mt-0.5" />
          <p className="text-xs uppercase font-bold text-textMuted tracking-widest">
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold text-textMain">{value}</p>
      </div>
    </CustomTooltip>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-surfaceHighlight rounded-xl w-32" />
          <div className="h-40 bg-surfaceHighlight rounded-2xl w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 bg-surfaceHighlight rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-textMuted mb-4">User not found</p>
          <button
            onClick={() => navigate("/admin/users")}
            className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors point"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-primary hover:text-blue-700 transition-colors mb-8 font-semibold point"
        >
          <ArrowLeft size={20} />
          Back to Users
        </button>

        {/* User Profile Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
            <div className="w-32 h-32 rounded-2xl bg-primary flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-primary/30 overflow-hidden shrink-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-textMain mb-2">
                    {user.name}
                  </h1>
                  <p className="text-sm text-textMuted mb-3">{user.email}</p>
                  <div className="flex items-center gap-3">
                    {user.role === "admin" ? (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                        <Shield size={16} />
                        Admin
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold text-sm">
                        <Users size={16} />
                        User
                      </div>
                    )}
                  </div>
                </div>
                <StatusBadge user={user} />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-bold text-textMuted uppercase tracking-widest mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-textMuted mb-1">Member Since</p>
                <p className="font-semibold text-textMain">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-textMuted mb-1">Last Login</p>
                <p className="font-semibold text-textMain">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-xs text-textMuted mb-1">Tier</p>
                <p className="font-semibold text-textMain">{user.tier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-textMain mb-4">
              Performance & Activity
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Activity}
                label="Total Quizzes"
                value={stats.totalQuizzes}
                tooltip="Number of quizzes completed by this user"
              />
              <StatCard
                icon={CheckCircle2}
                label="Passed"
                value={stats.quizzesPassed}
                tooltip="Quizzes with score ≥ 60%"
              />
              <StatCard
                icon={XCircle}
                label="Failed"
                value={stats.quizzesFailed}
                tooltip="Quizzes with score < 60%"
              />
              <StatCard
                icon={Percent}
                label="Pass Rate"
                value={`${stats.accuracyPercent}%`}
                tooltip="Percentage of passed quizzes"
              />
              <StatCard
                icon={Zap}
                label="Avg Score"
                value={`${stats.averageScore}%`}
                tooltip="Average score across all quizzes"
              />
              <StatCard
                icon={Clock}
                label="Time Spent"
                value={`${Math.round(stats.timeSpentMinutes)}m`}
                tooltip="Total minutes spent taking quizzes"
              />
              <StatCard
                icon={Calendar}
                label="First Quiz"
                value={
                  stats.firstQuizDate
                    ? new Date(stats.firstQuizDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )
                    : "—"
                }
                tooltip="Date of first quiz attempt"
              />
              <StatCard
                icon={Calendar}
                label="Last Activity"
                value={
                  stats.lastActivity
                    ? new Date(stats.lastActivity).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"
                }
                tooltip="Most recent activity"
              />
            </div>
          </div>
        )}

        {/* Device & Sessions */}
        {stats?.devices && stats.devices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-textMain mb-4">
              Active Devices & IP History
            </h2>
            <div className="space-y-2">
              {stats.devices.map((device, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surfaceHighlight/20 rounded-xl border border-border/50 flex items-between justify-between"
                >
                  <div>
                    <p className="font-semibold text-textMain text-sm">
                      {device.deviceName}
                    </p>
                    <p className="text-xs text-textMuted">
                      IP: {device.ipAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-textMuted">
                      {new Date(device.lastActive).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status History */}
        {user.statusHistory && user.statusHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-textMain mb-4">
              Status History
            </h2>
            <div className="space-y-2">
              {user.statusHistory
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      entry.action === "banned" || entry.action === "disabled"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-textMain capitalize">
                          {entry.action}
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-textMuted mt-1">
                            Reason: {entry.reason}
                          </p>
                        )}
                        {entry.adminId && (
                          <p className="text-xs text-textMuted">
                            By: {entry.adminId.name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-textMuted">
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-textMain mb-6">
            Account Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Role Toggle Button */}
            {user.role === "user" ? (
              <CustomTooltip
                content="Grant admin privileges to this user"
                position="top"
              >
                <button
                  onClick={handlePromoteToAdmin}
                  disabled={promoting}
                  className="w-full px-6 py-4 rounded-2xl bg-blue-500/20 dark:bg-blue-800/30 border border-blue-500/20 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 dark:hover:bg-blue-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {promoting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      <span>Make Admin</span>
                    </>
                  )}
                </button>
              </CustomTooltip>
            ) : (
              <CustomTooltip
                content={
                  currentUser?._id === userId
                    ? "You cannot demote yourself"
                    : "Demote this admin back to user"
                }
                position="top"
              >
                <button
                  onClick={handleDemoteAdmin}
                  disabled={demoting || currentUser?._id === userId}
                  className="w-full px-6 py-4 rounded-2xl bg-purple-500/20 dark:bg-purple-800/30 border border-purple-500/20 text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/30 dark:hover:bg-purple-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {demoting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      <span>Demote Admin</span>
                    </>
                  )}
                </button>
              </CustomTooltip>
            )}

            {/* Disable Account Button */}
            <CustomTooltip
              content={
                user.active
                  ? "Disable this account. User will be logged out."
                  : "Re-enable this account"
              }
              position="top"
            >
              <button
                onClick={handleDisableAccount}
                disabled={disabling}
                className="w-full px-6 py-4 rounded-2xl bg-amber-500/20 dark:bg-amber-800/30 border border-amber-500/20 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 dark:hover:bg-amber-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {disabling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : user.active ? (
                  <>
                    <UserX size={18} />
                    <span>Disable</span>
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    <span>Enable</span>
                  </>
                )}
              </button>
            </CustomTooltip>

            {/* Ban Account Button */}
            <CustomTooltip
              content={
                user.banned
                  ? "Lift the ban on this user"
                  : "Permanently ban this user. All sessions will end."
              }
              position="top"
            >
              <button
                onClick={handleBanAccount}
                disabled={banning}
                className="w-full px-6 py-4 rounded-2xl bg-red-500/20 dark:bg-red-800/30 border border-red-500/20 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-500/30 dark:hover:bg-red-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {banning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : user.banned ? (
                  <>
                    <Ban size={18} />
                    <span>Unban</span>
                  </>
                ) : (
                  <>
                    <Ban size={18} />
                    <span>Ban</span>
                  </>
                )}
              </button>
            </CustomTooltip>
          </div>
        </div>

        {/* Promote to Admin Modal */}
        <ConfirmActionModal
          isOpen={showPromoteModal}
          title="Promote to Admin"
          message={`Are you sure you want to promote "${user?.name}" to admin? They will gain access to the admin dashboard and all admin privileges.`}
          confirmText="Promote"
          cancelText="Cancel"
          isDangerous={false}
          onConfirm={confirmPromoteToAdmin}
          onCancel={() => setShowPromoteModal(false)}
          isLoading={promoting}
        />

        {/* Demote Admin Modal (using ConfirmActionModal for consistency) */}
        <ConfirmActionModal
          isOpen={showDemoteModal}
          title="Demote from Admin"
          message={`Are you sure you want to demote "${user?.name}" from admin? They will lose access to the admin dashboard and all admin privileges.`}
          confirmText="Demote"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={confirmDemoteAdmin}
          onCancel={() => setShowDemoteModal(false)}
          isLoading={demoting}
        />

        {/* Disable Account Modal */}
        <ConfirmActionModal
          isOpen={showDisableModal}
          title={user?.active ? "Disable Account" : "Enable Account"}
          message={
            user?.active
              ? `Are you sure you want to disable "${user?.name}"'s account? They will be logged out on their next request.`
              : `Are you sure you want to enable "${user?.name}"'s account? They will be able to access the platform again.`
          }
          confirmText={user?.active ? "Disable" : "Enable"}
          cancelText="Cancel"
          isDangerous={user?.active}
          onConfirm={confirmDisableAccount}
          onCancel={() => setShowDisableModal(false)}
          isLoading={disabling}
        />

        {/* Ban Account Modal */}
        <ConfirmActionModal
          isOpen={showBanModal}
          title={user?.banned ? "Unban User" : "Ban User"}
          message={
            user?.banned
              ? `Are you sure you want to unban "${user?.name}"? They will be able to access the platform again.`
              : `Are you sure you want to ban "${user?.name}"? They will be permanently banned and logged out immediately. All their sessions will be terminated.`
          }
          confirmText={user?.banned ? "Unban" : "Ban"}
          cancelText="Cancel"
          isDangerous={!user?.banned}
          onConfirm={confirmBanAccount}
          onCancel={() => setShowBanModal(false)}
          isLoading={banning}
        />
      </div>
    </div>
  );
}

export default AdminUserDetail;
