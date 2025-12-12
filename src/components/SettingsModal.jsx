import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  AlertCircle,
  Check,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import StorageService from "../services/storageService.js";

const SettingsModal = ({ onClose, user, refreshUser }) => {
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system"
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
  }, []);

  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("fontSize") || "normal"
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [limitAlerts, setLimitAlerts] = useState(() =>
    JSON.parse(
      localStorage.getItem("limitAlerts") || '{"enabled": true, "threshold": 1}'
    )
  );

  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // 2FA State
  const [twoFAMethod, setTwoFAMethod] = useState("totp");
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [twoFASetupStep, setTwoFASetupStep] = useState(1); // Step 1: Choose method, Step 2: Scan QR, Step 3: Verify, Step 4: Backup codes
  const [twoFAQRCode, setTwoFAQRCode] = useState(null);
  const [twoFASecret, setTwoFASecret] = useState(null);
  const [twoFAToken, setTwoFAToken] = useState("");
  const [twoFABackupCodes, setTwoFABackupCodes] = useState([]);
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({});

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "subscription", label: "Subscription", icon: Settings },
    { id: "usage", label: "Usage Limits", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const htmlElement = document.documentElement;

    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else if (theme === "light") {
      htmlElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    const htmlElement = document.documentElement;

    const fontSizeMap = {
      small: "14px",
      normal: "16px",
      large: "18px",
    };

    htmlElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  useEffect(() => {
    if (user?.connectedAccounts) {
      setConnectedAccounts(user.connectedAccounts);
    }
  }, [user]);

  // Listen for OAuth updates from OAuthCallback
  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event.detail;
      if (updatedUser?.connectedAccounts) {
        setConnectedAccounts(updatedUser.connectedAccounts);
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Current password only required if user has previously set one
    if (user?.passwordIsUserSet && !currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // Validate password using same rules as registration
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        toast.error("Password must contain at least one uppercase letter");
        return;
      }
      if (!/\d/.test(newPassword)) {
        toast.error("Password must contain at least one digit");
        return;
      }
      toast.error("Password does not meet requirements");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            currentPassword: currentPassword || "",
            newPassword,
          }),
        }
      );

      if (response.ok) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(
          "Failed to change password. Please check your current password."
        );
      }
    } catch (error) {
      toast.error("Error changing password");
      console.error(error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/delete-account",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Account deleted. Redirecting...");
        StorageService.logout();
        window.location.href = "/login";
      } else {
        toast.error("Failed to delete account");
      }
    } catch (error) {
      toast.error("Error deleting account");
      console.error(error);
    }
  };

  // Handle limit alerts
  const handleLimitAlertsChange = () => {
    const updated = {
      ...limitAlerts,
      enabled: !limitAlerts.enabled,
    };
    setLimitAlerts(updated);
    localStorage.setItem("limitAlerts", JSON.stringify(updated));
    toast.success(`Limit alerts ${updated.enabled ? "enabled" : "disabled"}`);
  };

  // Handle feedback submission
  const handleSendFeedback = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setIsSendingFeedback(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/support/feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            feedback,
            userEmail: user?.email,
          }),
        }
      );

      if (response.ok) {
        toast.success("Feedback sent successfully. Thank you!");
        setFeedback("");
      } else {
        toast.error("Failed to send feedback");
      }
    } catch (error) {
      toast.error("Error sending feedback");
      console.error(error);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Handle 2FA - Initiate setup
  const handleInitiate2FA = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/2fa/initiate",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTwoFASecret(data.secret);
        setTwoFAQRCode(data.qrCode);
        setTwoFASetupStep(2);
        toast.info("Scan the QR code with your authenticator app");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to initiate 2FA");
      }
    } catch (error) {
      toast.error("Error initiating 2FA");
      console.error(error);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFAToken.trim()) {
      toast.error("Please enter the verification code from your authenticator");
      return;
    }

    setIsEnabling2FA(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/2fa/enable",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            method: twoFAMethod,
            token: twoFAToken,
            secret: twoFASecret,
            phone: twoFAMethod === "sms" ? "" : undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTwoFABackupCodes(data.backupCodes);
        setTwoFASetupStep(4);
        toast.success("2FA enabled successfully!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to enable 2FA");
      }
    } catch (error) {
      toast.error("Error enabling 2FA");
      console.error(error);
    } finally {
      setIsEnabling2FA(false);
    }
  };

  // Handle 2FA - Disable
  const handleDisable2FA = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to disable 2FA? This will reduce your account security."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/2fa/disable",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            password: currentPassword || "", // Optional for OAuth users
          }),
        }
      );

      if (response.ok) {
        toast.success("2FA has been disabled");
        setTwoFAStatus(null);
        setShowTwoFASetup(false);
        refreshUser();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to disable 2FA");
      }
    } catch (error) {
      toast.error("Error disabling 2FA");
      console.error(error);
    }
  };

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      const token = StorageService.getToken();

      // Only fetch if we have a valid token
      if (!token || token.trim() === "") {
        console.warn("No token available for 2FA status check");
        setTwoFAStatus({
          twoFAEnabled: false,
          twoFAMethod: "none",
          backupCodesCount: 0,
        });
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/2fa/status",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTwoFAStatus(data);
        } else if (response.status === 401) {
          // Unauthorized - token is invalid or expired
          setTwoFAStatus({
            twoFAEnabled: false,
            twoFAMethod: "none",
            backupCodesCount: 0,
          });
        } else if (response.status === 404) {
          // 404 means endpoint not found
          setTwoFAStatus({
            twoFAEnabled: false,
            twoFAMethod: "none",
            backupCodesCount: 0,
          });
        }
      } catch (error) {
        console.warn("Could not fetch 2FA status:", error.message);
        // Set default status if fetch fails
        setTwoFAStatus({
          twoFAEnabled: false,
          twoFAMethod: "none",
          backupCodesCount: 0,
        });
      }
    };

    fetch2FAStatus();
  }, []);

  const handleOAuthConnect = async (provider) => {
    try {
      const oauthConfigs = {
        Google: {
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          scopes: ["openid", "email", "profile"],
        },
        GitHub: {
          clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
          authUrl: "https://github.com/login/oauth/authorize",
          scopes: ["user:email"],
        },
      };

      const config = oauthConfigs[provider];
      if (!config || !config.clientId) {
        toast.error(
          `${provider} OAuth not configured. Please set credentials in .env`
        );
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: config.scopes.join(" "),
        state: Math.random().toString(36).substring(7),
      });

      localStorage.setItem("oauthProvider", provider.toLowerCase());
      localStorage.setItem("authMode", "settings");

      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      toast.error(`Failed to connect ${provider}`);
      console.error(error);
    }
  };

  // Handle logout from session
  const handleLogoutSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}/logout`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${StorageService.getToken()}`,
        },
      });

      if (response.ok) {
        toast.success("Session ended");
        refreshUser();
      }
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  // Calculate usage percentage
  const getProgressWidth = (used, max) => {
    if (max === Infinity) return "0%";
    if (used === null || used === undefined) return "0%";
    return `${Math.min(100, Math.max(0, (used / max) * 100))}%`;
  };

  // Get tier limits
  const tierLimits = {
    Free: { generationsRemaining: 7, pdfUploadsRemaining: 3 },
    Basic: { generationsRemaining: 30, pdfUploadsRemaining: 15 },
    Pro: { generationsRemaining: Infinity, pdfUploadsRemaining: Infinity },
  };

  const maxQuizzes =
    tierLimits[user?.tier || "Free"]?.generationsRemaining || 7;
  const maxPdfs = tierLimits[user?.tier || "Free"]?.pdfUploadsRemaining || 3;
  const usedQuizzes = maxQuizzes - (user?.limits?.generationsRemaining || 0);
  const usedPdfs = maxPdfs - (user?.limits?.pdfUploadsRemaining || 0);

  // Tab rendering logic
  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Profile Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Change Password
              </h3>
              {!user?.passwordIsUserSet && (
                <div
                  className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm"
                  id="custom-box"
                >
                  💡 You signed up with OAuth. Set a password below to enable
                  email/password login on any device.
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {user?.passwordIsUserSet && (
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div className="space-y-1 relative group">
                  <label className="block text-sm font-medium text-textMuted mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 ${
                        newPassword &&
                        !/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(newPassword)
                          ? "border-red-300 bg-red-50/10"
                          : "border-border"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-textMuted hover:text-textMain cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div
                      className={`text-[10px] mt-1 ml-1 leading-tight transition-colors duration-200 absolute -bottom-5 left-0 w-full ${
                        !/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(newPassword)
                          ? "text-red-500 font-medium"
                          : "text-green-600"
                      }`}
                    >
                      Min 6 chars & include a number and uppercase letter
                    </div>
                  )}
                </div>
                <div className={`relative ${newPassword.length > 0 && "mt-8"}`}>
                  <label className="block text-sm font-medium text-textMuted mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 ${
                        confirmPassword && newPassword !== confirmPassword
                          ? "border-red-300 bg-red-50/10"
                          : confirmPassword && newPassword === confirmPassword
                          ? "border-green-300 bg-green-50/10"
                          : "border-border"
                      }`}
                    />
                    {confirmPassword && newPassword === confirmPassword ? (
                      <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                    ) : confirmPassword && newPassword !== confirmPassword ? (
                      <X className="absolute right-3 top-3.5 w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <div className="text-[10px] -bottom-5 mt-1 ml-1 text-red-500 font-medium">
                      Passwords do not match
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors point"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Connected Accounts
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthConnect("Google")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surfaceHighlight border border-border hover:bg-surface transition-colors point"
                >
                  <span className="text-textMain font-medium">Google</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      connectedAccounts?.google
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {connectedAccounts?.google ? "Connected" : "Connect"}
                  </span>
                </button>
                <button
                  onClick={() => handleOAuthConnect("GitHub")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surfaceHighlight border border-border hover:bg-surface transition-colors point"
                >
                  <span className="text-textMain font-medium">GitHub</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      connectedAccounts?.github
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {connectedAccounts?.github ? "Connected" : "Connect"}
                  </span>
                </button>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Danger Zone
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleDeleteAccount}
                  className="w-full px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors point"
                  id="delete-btn"
                >
                  Delete Account
                </button>
                <p className="text-xs text-textMuted">
                  Permanently delete your account and all associated data.
                </p>
              </div>
            </div>
          </div>
        );

      case "subscription":
        return (
          <div className="space-y-6">
            <div
              id="current-plan-box"
              className="border border-blue-200 rounded-lg p-6 bg-linear-to-r from-sky-50 to-indigo-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-textMuted">Current Plan</p>
                  <h3 className="text-2xl font-bold text-textMain">
                    {user?.tier || "Free"}
                  </h3>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-semibold ${
                    user?.tier === "Pro"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : user?.tier === "Basic"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Active
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-textMain">Plan Benefits</h4>
              {user?.tier === "Free" && (
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>• 7 Quizzes per day</li>
                  <li>• 3 Flashcard sets per day</li>
                  <li>• Max 10 questions per quiz</li>
                  <li>• 3 PDF uploads per day</li>
                </ul>
              )}
              {user?.tier === "Basic" && (
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>• 30 Quizzes per day</li>
                  <li>• 15 Flashcard sets per day</li>
                  <li>• Max 25 questions per quiz</li>
                  <li>• 15 PDF uploads per day</li>
                </ul>
              )}
              {user?.tier === "Pro" && (
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>• Unlimited quizzes</li>
                  <li>• Unlimited flashcard sets</li>
                  <li>• Max 45 questions per quiz</li>
                  <li>• Unlimited PDF uploads</li>
                </ul>
              )}
            </div>

            <button
              onClick={() => (window.location.href = "/subscription")}
              className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors point"
            >
              View All Plans
            </button>
          </div>
        );

      case "usage":
        return (
          <div className="space-y-6">
            {user?.tier === "Pro" ? (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ✓ You have unlimited usage with your Pro plan
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-textMain mb-4">
                  Daily Quotas
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-textMain">
                        Quiz Generations Left
                      </label>
                      <span className="text-sm font-bold text-primary">
                        {user?.limits?.generationsRemaining || 0} /{" "}
                        {maxQuizzes === Infinity ? "∞" : maxQuizzes}
                      </span>
                    </div>
                    {maxQuizzes !== Infinity && (
                      <div className="custom-bar w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                          style={{
                            width: getProgressWidth(usedQuizzes, maxQuizzes),
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-textMain">
                        PDF Imports Left
                      </label>
                      <span className="text-sm font-bold text-primary">
                        {user?.limits?.pdfUploadsRemaining || 0} /{" "}
                        {maxPdfs === Infinity ? "∞" : maxPdfs}
                      </span>
                    </div>
                    {maxPdfs !== Infinity && (
                      <div className="custom-bar w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300"
                          style={{
                            width: getProgressWidth(usedPdfs, maxPdfs),
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Limit Alerts
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={limitAlerts.enabled}
                  onChange={handleLimitAlertsChange}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-textMain">
                  Notify me when I have {limitAlerts.threshold} item(s)
                  remaining
                </span>
              </label>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">Theme</h3>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  } cursor-pointer hover:border-primary transition-colors`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === "light"}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <Sun className="w-5 h-5 text-textMain" />
                  <span className="text-textMain font-medium">Light</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  } cursor-pointer hover:border-primary transition-colors`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <Moon className="w-5 h-5 text-textMain" />
                  <span className="text-textMain font-medium">Dark</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  } cursor-pointer hover:border-primary transition-colors`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === "system"}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <Monitor className="w-5 h-5 text-textMain" />
                  <span className="text-textMain font-medium">System</span>
                </label>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Accessibility
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMain mb-2">
                    Font Size
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-textMain bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary point"
                  >
                    <option value="small">Small (14px)</option>
                    <option value="normal">Normal (16px)</option>
                    <option value="large">Large (18px)</option>
                  </select>
                  <p className="text-xs text-textMuted mt-2">
                    Font size will be applied site-wide
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Two-Factor Authentication
              </h3>
              <div className="bg-surface border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-textMuted">
                  Add an extra layer of security to your account with time-based
                  OTP (TOTP) or SMS.
                </p>
              </div>

              {twoFAStatus?.twoFAEnabled ? (
                <div className="space-y-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      2FA is enabled
                    </p>
                  </div>
                  <p className="text-xs text-green-600">
                    Method:{" "}
                    {twoFAStatus.twoFAMethod === "totp"
                      ? "Authenticator App"
                      : "SMS"}
                  </p>
                  {twoFAStatus.backupCodesCount > 0 && (
                    <p className="text-xs text-green-600">
                      Backup codes remaining: {twoFAStatus.backupCodesCount}
                    </p>
                  )}
                  <button
                    onClick={handleDisable2FA}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : !showTwoFASetup ? (
                <button
                  onClick={() => {
                    setShowTwoFASetup(true);
                    setTwoFASetupStep(1);
                  }}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors point"
                >
                  Enable 2FA
                </button>
              ) : (
                <div className="space-y-4 p-4 rounded-lg bg-surfaceHighlight border border-border">
                  {twoFASetupStep === 1 && (
                    <>
                      <p className="text-sm font-medium text-textMain">
                        Choose your 2FA method:
                      </p>
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface/30">
                        <input
                          type="radio"
                          name="twoFAMethod"
                          value="totp"
                          checked={twoFAMethod === "totp"}
                          onChange={(e) => setTwoFAMethod(e.target.value)}
                          className="w-4 h-4 accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-textMain">
                            TOTP (Authenticator App)
                          </p>
                          <p className="text-xs text-textMuted">
                            Use Google Authenticator, Authy, or similar apps
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface/30">
                        <input
                          type="radio"
                          name="twoFAMethod"
                          value="sms"
                          checked={twoFAMethod === "sms"}
                          onChange={(e) => setTwoFAMethod(e.target.value)}
                          className="w-4 h-4 accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-textMain">
                            SMS
                          </p>
                          <p className="text-xs text-textMuted">
                            Receive 2FA codes via text message
                          </p>
                        </div>
                      </label>
                      <button
                        onClick={handleInitiate2FA}
                        className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors point"
                      >
                        Next
                      </button>
                    </>
                  )}

                  {twoFASetupStep === 2 && (
                    <>
                      <p className="text-sm font-medium text-textMain">
                        Scan this QR code with your authenticator app:
                      </p>
                      {twoFAQRCode && (
                        <div className="flex justify-center p-4 bg-surface rounded-lg border border-border">
                          <img
                            src={twoFAQRCode}
                            alt="2FA QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                      )}
                      <div
                        id="manual-code"
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <p className="text-xs text-yellow-700">
                          <strong>Can't scan?</strong> Enter this code manually:
                        </p>
                        <p className="text-sm font-mono font-bold text-yellow-900 mt-1 break-all">
                          {twoFASecret}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-textMain mb-2 block">
                          Enter the 6-digit code from your app:
                        </label>
                        <input
                          type="text"
                          maxLength="6"
                          value={twoFAToken}
                          onChange={(e) =>
                            setTwoFAToken(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="000000"
                          className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setTwoFASetupStep(1);
                            setTwoFAToken("");
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-border text-textMain font-semibold hover:bg-surface transition-colors point"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleEnable2FA}
                          disabled={isEnabling2FA}
                          className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors point"
                        >
                          {isEnabling2FA ? "Verifying..." : "Verify & Enable"}
                        </button>
                      </div>
                    </>
                  )}

                  {twoFASetupStep === 4 && (
                    <>
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-3">
                          ✓ 2FA enabled successfully!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mb-4">
                          Save these backup codes in a safe place. You can use
                          them if you lose access to your authenticator app:
                        </p>
                        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded border border-green-300 mb-4">
                          {twoFABackupCodes.map((code, idx) => (
                            <code
                              key={idx}
                              className="text-xs font-mono text-textMain"
                            >
                              {code}
                            </code>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              twoFABackupCodes.join("\n")
                            );
                            toast.success("Backup codes copied!");
                          }}
                          className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-sm mb-2"
                        >
                          Copy Backup Codes
                        </button>
                        <button
                          onClick={() => {
                            setShowTwoFASetup(false);
                            setTwoFASetupStep(1);
                            setTwoFAToken("");
                            refreshUser();
                          }}
                          className="w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Active Sessions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border">
                  <div>
                    <p className="text-sm font-medium text-textMain">
                      Current Session
                    </p>
                    <p className="text-xs text-textMuted">
                      {navigator.userAgent.includes("Windows")
                        ? "Windows"
                        : "Device"}{" "}
                      •{" "}
                      {navigator.userAgent.includes("Chrome")
                        ? "Chrome"
                        : "Browser"}{" "}
                      • {window.location.hostname}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>
                {user?.sessions && user.sessions.length > 1 && (
                  <>
                    {user.sessions.map(
                      (session, idx) =>
                        idx !== 0 && (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border"
                          >
                            <div>
                              <p className="text-sm font-medium text-textMain">
                                {session.deviceName}
                              </p>
                              <p className="text-xs text-textMuted">
                                Last active:{" "}
                                {new Date(
                                  session.lastActive
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleLogoutSession(session.id)}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
                            >
                              Logout
                            </button>
                          </div>
                        )
                    )}
                  </>
                )}
              </div>
              <button className="delete-btn w-full mt-4 px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors point">
                Logout from All Devices
              </button>
            </div>
          </div>
        );

      case "support":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Need Help?
              </h3>
              <div className="space-y-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:border-primary hover:bg-surface transition-colors"
                >
                  <span className="text-textMain font-medium">
                    Help Center & FAQs
                  </span>
                  <span className="text-textMuted">→</span>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:border-primary hover:bg-surface transition-colors"
                >
                  <span className="text-textMain font-medium">
                    Contact Support
                  </span>
                  <span className="text-textMuted">→</span>
                </a>
                <a
                  href="https://github.com/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:border-primary hover:bg-surface transition-colors"
                >
                  <span className="text-textMain font-medium">
                    Report a Bug
                  </span>
                  <span className="text-textMuted">→</span>
                </a>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Send Feedback
              </h3>
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your feedback or suggestions..."
                  className="w-full px-4 py-3 rounded-lg bg-surfaceHighlight border border-border text-textMain placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={isSendingFeedback || !feedback.trim()}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
                >
                  {isSendingFeedback ? "Sending..." : "Send Feedback"}
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[90vh] sm:h-[85vh] md:h-[90vh] sm:max-w-4xl bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm p-3 sm:p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
            <h2 className="text-lg sm:text-2xl font-extrabold text-textMain">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-textMuted hover:text-textMain rounded-full transition-colors point hover:bg-surface"
            title="Close"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="hidden md:flex md:w-48 bg-surface border-r gap-4 border-border flex-col p-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-medium point hover:pl-5.5 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm pl-5.5"
                      : "text-textMuted hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <TabIcon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Tab Buttons */}
          <div className="md:hidden flex flex-col w-full">
            <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-surfaceHighlight text-textMuted hover:text-textMain"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 sm:px-7 py-5 md:p-8 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
