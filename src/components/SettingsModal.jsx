import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Trash2,
  Loader2,
  Edit3,
} from "lucide-react";
import { toast } from "react-toastify";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import StorageService from "../services/storageService.js";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

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
  const [newUsername, setNewUsername] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [showFullNameEdit, setShowFullNameEdit] = useState(false);
  const [isUpdatingFullName, setIsUpdatingFullName] = useState(false);
  const [fullNameError, setFullNameError] = useState("");
  // Generate multiple sanitized username suggestions (dots, underscores, numeric suffixes)
  const suggestedVariants = useMemo(() => {
    const baseRaw = (user?.username || user?.name || "").toString();
    let base = baseRaw.toLowerCase().replace(/\s+/g, "");
    base = base.replace(/[^a-z0-9]/g, "");
    if (!base) base = "user";

    const padTo6 = (s) =>
      s.length >= 6 ? s : s + "123456".slice(0, 6 - s.length);

    const variants = new Set();
    variants.add(padTo6(base));
    variants.add(padTo6(`${base}.me`));
    variants.add(padTo6(`${base}_`));
    variants.add(padTo6(`${base}01`));
    variants.add(padTo6(`${base}123`));
    variants.add(padTo6(`${base}.official`));

    return Array.from(variants).slice(0, 6);
  }, [user]);

  const [checkingVariants, setCheckingVariants] = useState(false);
  // Check availability for suggestion variants when editor opens or variants change
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!showUsernameEdit) return;
      if (!suggestedVariants || suggestedVariants.length === 0) return;
      setCheckingVariants(true);
      try {
        const checks = await Promise.all(
          suggestedVariants.map((v) =>
            fetch(
              `${
                import.meta.env.VITE_API_URL
              }/api/auth/check-username?username=${encodeURIComponent(v)}`
            )
              .then((r) => r.json())
              .then((d) => ({ v, available: !!d.available }))
              .catch(() => ({ v, available: false }))
          )
        );
        if (!mounted) return;
        const map = {};
        checks.forEach((c) => {
          map[c.v] = c.available;
        });
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setCheckingVariants(false);
      }
    };
    const t = setTimeout(check, 150);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [showUsernameEdit, suggestedVariants]);
  const [limitAlerts, setLimitAlerts] = useState(() =>
    JSON.parse(
      localStorage.getItem("limitAlerts") || '{"enabled": true, "threshold": 1}'
    )
  );

  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Active sessions
  const [sessions, setSessions] = useState([]);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  // Session deletion processing state (blocks other session actions while a session delete is in-flight)
  const [processingSessionId, setProcessingSessionId] = useState(null);
  const [isSessionProcessing, setIsSessionProcessing] = useState(false);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutTargetSessionId, setLogoutTargetSessionId] = useState(null);

  // Delete account modal password confirmation
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteChecksDone, setDeleteChecksDone] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState(null);
  // For non-password (OAuth) users require typing DELETE to confirm
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteConfirmError, setDeleteConfirmError] = useState(null);
  // For password-based accounts require re-entry and avoid re-checking the same password
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");
  const [lastCheckedDeletePassword, setLastCheckedDeletePassword] =
    useState("");
  const [isCheckingDeletePassword, setIsCheckingDeletePassword] =
    useState(false);

  // 2FA State
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [twoFASetupStep, setTwoFASetupStep] = useState(1); // Step 1: Scan QR, Step 2: Verify, Step 3: Backup codes
  const [twoFAQRCode, setTwoFAQRCode] = useState(null);
  const [twoFASecret, setTwoFASecret] = useState(null);
  const [twoFAToken, setTwoFAToken] = useState("");
  const [twoFABackupCodes, setTwoFABackupCodes] = useState([]);
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // If new password equals current password, show error and abort
    if (currentPassword && newPassword === currentPassword) {
      toast.error("New password must be different from old password!");
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
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
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
    } catch {
      toast.error("Error changing password");
      // Error reported to user via toast; no debug log kept here
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameError("");

    if (!newUsername.trim()) {
      setUsernameError("Username cannot be empty");
      return;
    }

    // Validate username using same rules as registration
    if (newUsername.length < 6) {
      setUsernameError("Username must be at least 6 characters");
      return;
    }

    // Check for spaces
    if (/\s/.test(newUsername)) {
      setUsernameError("Username cannot contain spaces");
      return;
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(newUsername)) {
      setUsernameError("Username cannot contain uppercase letters");
      return;
    }

    if (newUsername === user?.username) {
      toast.error("New username must be different from current username");
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/change-username`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            newUsername: newUsername.trim(),
          }),
        }
      );

      if (response.ok) {
        toast.success("Username changed successfully");
        // Close the username editor and clear local form state
        setShowUsernameEdit(false);
        setNewUsername("");
        setUsernameError("");
        // Refresh user data
        if (refreshUser) {
          refreshUser();
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setUsernameError(data.message || "Failed to change username");
      }
    } catch {
      setUsernameError("Error changing username");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleFullNameChange = async (e) => {
    e.preventDefault();
    setFullNameError("");

    if (!newFullName || !newFullName.trim()) {
      setFullNameError("Full name cannot be empty");
      return;
    }
    if (newFullName.length < 6) {
      setFullNameError("Full name must be at least 6 characters");
      return;
    }
    // Prevent full name being identical to previous full name
    if (newFullName === user?.name) {
      toast.error("New full name must be different from current full name");
      return;
    }
    // Prevent full name being identical to username
    if (user?.username && newFullName === user.username) {
      setFullNameError("Full name cannot be the same as username");
      return;
    }

    setIsUpdatingFullName(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/change-fullname`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({ newFullName: newFullName.trim() }),
        }
      );

      if (response.ok) {
        toast.success("Full name updated successfully");
        setShowFullNameEdit(false);
        setNewFullName("");
        if (refreshUser) refreshUser();
      } else {
        const data = await response.json().catch(() => ({}));
        setFullNameError(data.message || "Failed to update full name");
      }
    } catch {
      setFullNameError("Error updating full name");
    } finally {
      setIsUpdatingFullName(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  // Validate the user's password for destructive actions when required
  const checkDeletePassword = async (pw) => {
    if (!pw || pw.trim() === "") {
      setDeleteChecksDone(false);
      setDeletePasswordError(null);
      return;
    }
    setDeleteChecksDone(false);
    setDeletePasswordError(null);

    try {
      setIsCheckingDeletePassword(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/confirm-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({ password: pw }),
        }
      );

      if (res.ok) {
        setDeleteChecksDone(true);
        setDeletePasswordError(null);
        setLastCheckedDeletePassword(pw);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeletePasswordError(data?.message || "Invalid password");
        setDeleteChecksDone(false);
        setLastCheckedDeletePassword("");
      }
    } catch {
      setDeletePasswordError("Error validating password");
      setDeleteChecksDone(false);
    } finally {
      setIsCheckingDeletePassword(false);
    }
  };

  // Run password or confirmation checks (debounced) when delete modal is open
  useEffect(() => {
    if (!showDeleteModal) {
      setDeletePassword("");
      setDeletePasswordConfirm("");
      setDeleteConfirmationText("");
      setDeleteChecksDone(false);
      setDeletePasswordError(null);
      setDeleteConfirmError(null);
      setLastCheckedDeletePassword("");
      return;
    }

    // If the user signed up with OAuth and has no password, require typing DELETE to confirm
    if (!user?.passwordIsUserSet) {
      const confirmed = deleteConfirmationText === "DELETE";
      setDeleteChecksDone(confirmed);
      setDeleteConfirmError(
        deleteConfirmationText && !confirmed ? 'Type "DELETE" to confirm' : null
      );
      return;
    }

    // For password-based accounts, require the user to re-enter the password to confirm locally
    if (!deletePassword && !deletePasswordConfirm) {
      setDeleteChecksDone(false);
      setDeletePasswordError(null);
      return;
    }

    if (deletePassword !== deletePasswordConfirm) {
      setDeleteChecksDone(false);
      setDeletePasswordError("Passwords do not match");
      return;
    }

    // If we've already validated this exact password, avoid another server call
    if (lastCheckedDeletePassword === deletePassword) {
      setDeleteChecksDone(true);
      setDeletePasswordError(null);
      return;
    }

    // Otherwise debounce and validate once
    setDeleteChecksDone(false);
    setDeletePasswordError(null);
    const t = setTimeout(() => {
      checkDeletePassword(deletePassword);
    }, 500);
    return () => clearTimeout(t);
  }, [
    deletePassword,
    deletePasswordConfirm,
    deleteConfirmationText,
    showDeleteModal,
    user?.passwordIsUserSet,
    lastCheckedDeletePassword,
  ]);

  const confirmDeleteAccount = async () => {
    // Require confirmation checks to pass (password or typing DELETE)
    if (!deleteChecksDone) {
      if (user?.passwordIsUserSet) {
        toast.error(
          "Please confirm your password before deleting your account."
        );
      } else {
        toast.error('Please type "DELETE" to confirm account deletion.');
      }
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/delete-account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        StorageService.logout();
        window.location.href = "/";
      } else {
        toast.error("Failed to delete account");
        setShowDeleteModal(false);
      }
    } catch {
      toast.error("Error deleting account");
      // No debug log — user is notified and modal closed
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
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
        `${import.meta.env.VITE_API_URL}/api/support/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            feedback,
            email: user?.email,
          }),
        }
      );

      if (response.ok) {
        toast.success("Feedback sent successfully. Thank you!");
        setFeedback("");
      } else {
        toast.error("Failed to send feedback");
      }
    } catch {
      toast.error("Error sending feedback");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Handle 2FA - Initiate setup
  const handleInitiate2FA = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/2fa/initiate`,
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
    } catch {
      toast.error("Error initiating 2FA");
      // Error forwarded to user via toast; debug log removed
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
        `${import.meta.env.VITE_API_URL}/api/auth/2fa/enable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
          body: JSON.stringify({
            token: twoFAToken,
            secret: twoFASecret,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTwoFABackupCodes(data.backupCodes);
        setTwoFASetupStep(3);
        toast.success("2FA enabled successfully!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to enable 2FA");
      }
    } catch {
      toast.error("Error enabling 2FA");
      // Debug log removed; user notified via toast
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
        `${import.meta.env.VITE_API_URL}/api/auth/2fa/disable`,
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
    } catch {
      toast.error("Error disabling 2FA");
      // Debug log removed; user notified via toast
    }
  };

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      const token = StorageService.getToken();

      // Only fetch if we have a valid token
      if (!token || token.trim() === "") {
        // No token available — treat 2FA as disabled locally
        setTwoFAStatus({
          twoFAEnabled: false,
          twoFAMethod: "none",
          backupCodesCount: 0,
        });
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/2fa/status`,
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
      } catch {
        // Could not fetch 2FA status - set default to disabled
        setTwoFAStatus({
          twoFAEnabled: false,
          twoFAMethod: "none",
          backupCodesCount: 0,
        });
      }
    };

    fetch2FAStatus();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/sessions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        setSessions([]);
      }
    } catch {
      // Failed to fetch sessions — show no sessions
      setSessions([]);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (isSessionProcessing) {
      toast.info("Another session action is in progress. Please wait.");
      return;
    }

    setIsLoggingOutAll(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        StorageService.logout();
        // Emit event to trigger App.jsx logout without reload
        window.dispatchEvent(new CustomEvent("sessionLogout"));
      } else {
        toast.error("Failed to logout from all devices");
        setShowLogoutAllModal(false);
      }
    } catch {
      toast.error("Error logging out from all devices");
      // Debug logging removed; user notified via toast
      setShowLogoutAllModal(false);
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleConfirmLogoutSession = (sessionId) => {
    setLogoutTargetSessionId(sessionId);
    setProcessingSessionId(sessionId);
    setLogoutModalOpen(true);
  };

  const handleConfirmModal = async () => {
    if (!logoutTargetSessionId) return;
    setIsSessionProcessing(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/auth/sessions/${logoutTargetSessionId}/logout`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${StorageService.getToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.success("Session ended");
        if (data && data.currentSessionDeleted) {
          StorageService.logout();
          window.dispatchEvent(new CustomEvent("sessionLogout"));
        } else {
          fetchSessions();
        }
      } else if (response.status === 401) {
        StorageService.logout();
        window.dispatchEvent(new CustomEvent("sessionLogout"));
      } else {
        toast.error("Failed to end session");
      }
    } catch {
      // Failed to end session — notify user
      toast.error("Failed to end session");
    } finally {
      setIsSessionProcessing(false);
      setProcessingSessionId(null);
      setLogoutModalOpen(false);
      setLogoutTargetSessionId(null);
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
    Basic: { generationsRemaining: 35, pdfUploadsRemaining: 20 },
    Pro: { generationsRemaining: Infinity, pdfUploadsRemaining: Infinity },
  };

  // If user is an admin, treat quotas as unlimited
  const maxQuizzes =
    user?.role === "admin"
      ? Infinity
      : tierLimits[user?.tier || "Free"]?.generationsRemaining || 7;
  const maxPdfs =
    user?.role === "admin"
      ? Infinity
      : tierLimits[user?.tier || "Free"]?.pdfUploadsRemaining || 3;
  const usedQuizzes =
    maxQuizzes === Infinity
      ? 0
      : maxQuizzes - (user?.limits?.generationsRemaining || 0);
  const usedPdfs =
    maxPdfs === Infinity
      ? 0
      : maxPdfs - (user?.limits?.pdfUploadsRemaining || 0);

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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user?.name || ""}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowFullNameEdit(!showFullNameEdit);
                        setNewFullName(user?.name || "");
                        setFullNameError("");
                      }}
                      className="p-2 text-textMuted hover:text-primary dark:hover:text-blue-400 hover:bg-surfaceHighlight rounded-lg transition-all cursor-pointer shrink-0"
                      title={showFullNameEdit ? "Close form" : "Edit full name"}
                    >
                      {showFullNameEdit ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Edit3 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showFullNameEdit && (
                      <motion.form
                        onSubmit={handleFullNameChange}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-2 mt-4 overflow-hidden p-1"
                      >
                        <div className="relative group">
                          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={newFullName}
                            onChange={(e) => {
                              setNewFullName(e.target.value);
                              setFullNameError("");
                            }}
                            placeholder="Enter full name"
                            autoFocus
                            className={`w-full pl-12 pr-4 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 ${
                              fullNameError
                                ? "border-red-300 dark:border-red-400 bg-red-50/10"
                                : newFullName && newFullName.length >= 6
                                ? "border-green-300 dark:border-green-600 bg-green-50/10"
                                : "border-border"
                            }`}
                          />
                        </div>
                        {newFullName && (
                          <div className="text-xs font-medium space-y-1">
                            <div
                              className={`${
                                newFullName.length >= 6
                                  ? "text-green-500 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              ✓ Min 6 characters
                            </div>
                          </div>
                        )}
                        {fullNameError && (
                          <div className="text-xs text-red-500">
                            {fullNameError}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={
                              !newFullName ||
                              newFullName.length < 6 ||
                              isUpdatingFullName
                            }
                            className={`flex-1 font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary dark:bg-blue-700 text-white hover:text-white/90 hover:bg-blue-700 dark:hover:bg-blue-700/80 ${
                              !newFullName ||
                              ((newFullName.length < 6 || isUpdatingFullName) &&
                                "disabled:opacity-50 disabled:cursor-not-allowed")
                            }`}
                          >
                            {isUpdatingFullName ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Change Full Name"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowFullNameEdit(false);
                              setNewFullName("");
                              setFullNameError("");
                            }}
                            className="flex-1 font-semibold py-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-600 text-textMain hover:bg-gray-300 dark:hover:bg-gray-600/80 point"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user?.username || user?.name || ""}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowUsernameEdit(!showUsernameEdit);
                        const pref = (user?.username || user?.name || "")
                          .replace(/\s+/g, "")
                          .toLowerCase();
                        setNewUsername(pref);
                        setUsernameError("");
                      }}
                      className="p-2 text-textMuted hover:text-primary dark:hover:text-blue-400 hover:bg-surfaceHighlight rounded-lg transition-all cursor-pointer shrink-0"
                      title={showUsernameEdit ? "Close form" : "Edit username"}
                    >
                      {showUsernameEdit ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Edit3 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showUsernameEdit && (
                      <motion.form
                        onSubmit={handleUsernameChange}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 mt-4 overflow-hidden p-1"
                      >
                        <div className="relative group">
                          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => {
                              // Remove spaces and force lowercase to prevent invalid characters
                              const clean = e.target.value
                                .replace(/\s+/g, "")
                                .toLowerCase();
                              setNewUsername(clean);
                              setUsernameError("");
                            }}
                            placeholder="Enter new username"
                            autoFocus
                            className={`w-full pl-12 pr-4 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 ${
                              usernameError
                                ? "border-red-300 dark:border-red-400 bg-red-50/10"
                                : newUsername && newUsername.length >= 6
                                ? "border-green-300 dark:border-green-600 bg-green-50/10"
                                : "border-border"
                            }`}
                          />
                          {/* Suggested sanitized username variants (3 per row) */}
                          {showUsernameEdit && (
                            <div className="mt-3">
                              {checkingVariants ? (
                                <div className="text-sm text-textMuted">
                                  Checking suggestions...
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2">
                                  {suggestedVariants.slice(0, 3).map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => setNewUsername(v)}
                                      className={`point px-2 py-1 text-sm rounded border overflow-hidden whitespace-nowrap truncate ${
                                        newUsername === v
                                          ? "border-primary bg-primary/10"
                                          : "border-border bg-surface"
                                      }`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {newUsername &&
                          newUsername.length >= 6 &&
                          !/\s/.test(newUsername) &&
                          !/[A-Z]/.test(newUsername) &&
                          !usernameError ? (
                            <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500 dark:text-green-400" />
                          ) : newUsername &&
                            (/\s/.test(newUsername) ||
                              /[A-Z]/.test(newUsername) ||
                              newUsername.length < 6 ||
                              usernameError) ? (
                            <X className="absolute right-3 top-3.5 w-5 h-5 text-red-500 dark:text-red-400" />
                          ) : null}
                        </div>
                        {newUsername && (
                          <div className="text-xs font-medium space-y-1">
                            <div
                              className={`${
                                newUsername.length >= 6
                                  ? "text-green-500 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              ✓ Min 6 characters
                            </div>
                            <div
                              className={`${
                                !/\s/.test(newUsername)
                                  ? "text-green-500 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              ✓ No spaces allowed
                            </div>
                            <div
                              className={`mb-1 ${
                                !/[A-Z]/.test(newUsername)
                                  ? "text-green-500 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              ✓ No uppercase letters
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={
                              !newUsername ||
                              newUsername.length < 6 ||
                              /\s/.test(newUsername) ||
                              /[A-Z]/.test(newUsername) ||
                              usernameError ||
                              isUpdatingUsername
                            }
                            className={`flex-1 font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary dark:bg-blue-700 text-white hover:text-white/90 hover:bg-blue-700 dark:hover:bg-blue-700/80 ${
                              !newUsername ||
                              newUsername.length < 6 ||
                              /\s/.test(newUsername) ||
                              /[A-Z]/.test(newUsername) ||
                              ((usernameError || isUpdatingUsername) &&
                                "disabled:opacity-50 disabled:cursor-not-allowed")
                            }`}
                          >
                            {isUpdatingUsername ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Change Username"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUsernameEdit(false);
                              setNewUsername("");
                              setUsernameError("");
                            }}
                            className="flex-1 font-semibold py-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-600 text-textMain hover:bg-gray-300 dark:hover:bg-gray-600/80 point"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-lg font-bold text-textMain mb-4">
                Change Password
              </h3>
              {!user?.passwordIsUserSet && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm dark:bg-blue-900 dark:text-blue-300 dark:border-blue-500">
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
                          ? "border-red-300 dark:border-red-400 bg-red-50/10"
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
                          ? "text-red-500 dark:text-red-400 font-medium"
                          : "text-green-600 dark:text-green-400"
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
                      className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 ${
                        confirmPassword && newPassword !== confirmPassword
                          ? "border-red-300 dark:border-red-500 bg-red-50/10"
                          : confirmPassword && newPassword === confirmPassword
                          ? "border-green-300 dark:border-green-600 bg-green-50/10"
                          : "border-border"
                      }`}
                    />
                    {confirmPassword && newPassword === confirmPassword ? (
                      <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500 dark:text-green-400" />
                    ) : confirmPassword && newPassword !== confirmPassword ? (
                      <X className="absolute right-3 top-3.5 w-5 h-5 text-red-500 dark:text-red-400" />
                    ) : null}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <div className="text-[10px] -bottom-5 mt-1 ml-1 text-red-500 dark:text-red-400 font-medium">
                      Passwords do not match
                    </div>
                  )}
                </div>
                {/* Disable update until the new password regex and confirm match are fulfilled */}
                {(() => {
                  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
                  const newPasswordValid = passwordRegex.test(newPassword);
                  const passwordsMatch =
                    newPassword === confirmPassword &&
                    confirmPassword.trim() !== "";
                  const canUpdatePassword =
                    newPasswordValid && passwordsMatch && !isUpdatingPassword;

                  return (
                    <button
                      type="submit"
                      disabled={!canUpdatePassword}
                      aria-busy={isUpdatingPassword}
                      className={`w-full bg-primary dark:bg-blue-700 text-white hover:text-white/90 font-semibold py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors point`}
                    >
                      {isUpdatingPassword ? (
                        <div className="flex items-center justify-center">
                          <Loader2
                            className="w-5 h-5 animate-spin text-white"
                            aria-hidden
                          />
                          <span className="sr-only">Updating...</span>
                        </div>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  );
                })()}
              </form>
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
            <div className="border border-blue-200 rounded-lg p-6 bg-linear-to-r from-sky-50 to-indigo-100 dark:bg-linear-to-r dark:from-slate-900/50 dark:to-slate-800/50">
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
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500"
                      : user?.tier === "Basic"
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-500"
                      : "bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-400"
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
                  <li>• 7 Quizzes / Month</li>
                  <li>• 3 Flashcard sets / Month</li>
                  <li>• Max 10 questions per quiz</li>
                  <li>• 3 PDF uploads / Month</li>
                  <li>• Max 10 questions per quiz</li>
                  <li>• Max 30 marks per quiz</li>
                </ul>
              )}
              {user?.tier === "Basic" && (
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>• 35 Quizzes / Month</li>
                  <li>• 17 Flashcard sets / Month</li>
                  <li>• 15 PDF uploads / Month</li>
                  <li>• 15 PDF exports / Month</li>
                  <li>• Max 25 questions per quiz</li>
                  <li>• Max 60 marks per quiz</li>
                </ul>
              )}
              {user?.tier === "Pro" && (
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>• Unlimited quizzes</li>
                  <li>• Unlimited flashcard sets</li>
                  <li>• Unlimited PDF uploads</li>
                  <li>• Unlimited PDF exports</li>
                  <li>• Max 45 questions per quiz</li>
                  <li>• Max 100 marks per quiz</li>
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
                  Monthly Quotas
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-textMain">
                        Quiz Generations Left
                      </label>
                      <span className="text-sm font-bold text-primary">
                        {user?.role === "admin"
                          ? "∞"
                          : user?.limits?.generationsRemaining || 0}{" "}
                        / {maxQuizzes === Infinity ? "∞" : maxQuizzes}
                      </span>
                    </div>
                    {maxQuizzes !== Infinity && (
                      <div className="dark:bg-[#374151] w-full bg-gray-200 rounded-full h-2">
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
                        {user?.role === "admin"
                          ? "∞"
                          : user?.limits?.pdfUploadsRemaining || 0}{" "}
                        / {maxPdfs === Infinity ? "∞" : maxPdfs}
                      </span>
                    </div>
                    {maxPdfs !== Infinity && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
                  <FormControl fullWidth>
                    <InputLabel
                      id="font-size-label"
                      sx={{
                        color: "var(--color-textMuted)",
                        "&.Mui-focused": {
                          color: "var(--color-primary)",
                        },
                      }}
                    >
                      Font Size
                    </InputLabel>
                    <Select
                      labelId="font-size-label"
                      id="font-size-select"
                      value={fontSize}
                      label="Font Size"
                      onChange={(e) => setFontSize(e.target.value)}
                      disableScrollLock={true}
                      sx={{
                        color: "var(--color-textMain)",
                        backgroundColor: "var(--color-surface)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--color-border)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--color-border)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--color-primary)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "var(--color-textMain)",
                        },
                      }}
                      MenuProps={{
                        disableScrollLock: true,
                        PaperProps: {
                          sx: {
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-textMain)",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            maxHeight: "300px",
                            "& .MuiMenuItem-root": {
                              color: "var(--color-textMain)",
                              "&:hover": {
                                backgroundColor:
                                  "var(--color-surfaceHighlight)",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "var(--color-primary)",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "var(--color-primary)",
                                },
                              },
                            },
                            "& .MuiList-root": {
                              overflow: "auto",
                              scrollbarWidth: "auto",
                              "&::-webkit-scrollbar": {
                                width: "8px",
                              },
                              "&::-webkit-scrollbar-track": {
                                backgroundColor: "transparent",
                              },
                              "&::-webkit-scrollbar-thumb": {
                                backgroundColor: "var(--color-border)",
                                borderRadius: "4px",
                                "&:hover": {
                                  backgroundColor: "var(--color-textMuted)",
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="small">Small (14px)</MenuItem>
                      <MenuItem value="normal">Normal (16px)</MenuItem>
                      <MenuItem value="large">Large (18px)</MenuItem>
                    </Select>
                  </FormControl>
                  <p className="text-xs text-textMuted mt-2">
                    <span className="text-red-600 dark:text-red-400 text-sm mr-0.5">
                      *
                    </span>
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
              <div className="bg-blue-100 dark:bg-blue-800/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Add an extra layer of security to your account with time-based
                  authenticator codes (TOTP).
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
                    Method: Authenticator App
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
                      <p className="text-sm font-medium text-textMain mb-4">
                        Scan this QR code with your authenticator app to set up
                        2FA:
                      </p>
                      <p className="text-xs text-textMuted mb-4">
                        We recommend Google Authenticator, Authy, Microsoft
                        Authenticator, or similar apps.
                      </p>
                      <button
                        onClick={handleInitiate2FA}
                        className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors point"
                      >
                        Generate QR Code
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
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-800/40 border border-yellow-200 dark:border-[#78350f] rounded-lg">
                        <p className="text-xs text-yellow-700 dark:text-amber-500">
                          <strong>Can't scan?</strong> Enter this code manually:
                        </p>
                        <p className="text-sm font-bold text-yellow-600 dark:text-amber-500/80 mt-1 break-all tracking-wider">
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
                          className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-semibold"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setTwoFASetupStep(1);
                            setTwoFAToken("");
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-border text-textMain font-semibold hover:bg-surface/30 transition-colors point"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleEnable2FA}
                          disabled={isEnabling2FA}
                          className="flex-1 bg-primary dark:bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700/80 disabled:opacity-50 transition-colors point"
                        >
                          {isEnabling2FA ? "Verifying..." : "Verify & Enable"}
                        </button>
                      </div>
                    </>
                  )}

                  {twoFASetupStep === 3 && (
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
              <div className="relative">
                <div
                  className={`space-y-3 ${
                    isSessionProcessing ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {sessions && sessions.length > 0 ? (
                    <>
                      {sessions.map((session) => {
                        const sid = session._id || session.id;
                        return (
                          <div
                            key={sid}
                            className="flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border"
                          >
                            <div>
                              <p className="text-sm font-medium text-textMain">
                                {session.deviceName ||
                                  `${session.userAgent || "Device"}`}
                              </p>
                              <p className="text-xs text-textMuted">
                                {session.ipAddress &&
                                  `IP: ${session.ipAddress}`}
                                {session.ipAddress &&
                                  session.lastActive &&
                                  " • "}
                                {session.lastActive &&
                                  `Last active: ${new Date(
                                    session.lastActive
                                  ).toLocaleDateString()}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleConfirmLogoutSession(sid)}
                              disabled={isSessionProcessing}
                              className={`text-xs text-red-600 dark:text-red-500/90 hover:text-red-700 dark:hover:text-red-500 font-semibold point ${
                                isSessionProcessing
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {processingSessionId === sid &&
                              isSessionProcessing
                                ? "Deleting..."
                                : "Logout"}
                            </button>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-sm text-textMuted text-center py-4">
                      No sessions found
                    </p>
                  )}
                </div>
              </div>
              {sessions && sessions.length > 0 && (
                <button
                  onClick={() =>
                    !isLoggingOutAll &&
                    !isSessionProcessing &&
                    setShowLogoutAllModal(true)
                  }
                  disabled={isLoggingOutAll || isSessionProcessing}
                  className={`w-full mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold transition-colors point ${
                    isLoggingOutAll || isSessionProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isSessionProcessing
                    ? "Operation in progress..."
                    : "Logout from All Devices"}
                </button>
              )}
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
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:bg-surfaceHighlight/20 transition-colors"
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
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:bg-surfaceHighlight/20 transition-colors"
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
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-surfaceHighlight border border-border hover:bg-surfaceHighlight/20 transition-colors"
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
                  className="w-full bg-primary dark:bg-blue-700 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
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
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          className="relative w-full h-[90vh] sm:h-[85vh] md:h-[90vh] sm:max-w-4xl bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.98, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 8 }}
          transition={{ type: "spring", damping: 22, stiffness: 400 }}
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
            <div className="hidden md:flex md:w-48 bg-surface border-r gap-3 border-border flex-col p-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-medium point hover:pl-5.5 ${
                      isActive
                        ? "bg-primary/10 text-primary dark:text-blue-400 dark:shadow-slate-700 shadow-sm pl-5.5"
                        : "text-textMuted hover:bg-surfaceHighlight"
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
        </motion.div>
      </motion.div>

      {isSessionProcessing && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto">
          <div
            role="status"
            aria-live="polite"
            className="p-6 rounded-xl bg-surface/90 border border-border shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4"
          >
            <div className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/30 border-t-primary dark:border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="text-textMain text-lg font-semibold">
              Deleting session…
            </div>
            <div className="text-textMuted text-sm text-center">
              You cannot log out from other sessions or logout from all devices
              until this completes.
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="pointer-events-auto bg-surface dark:bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full mx-4"
              >
                <div className="p-6 space-y-4">
                  {/* Header Icon */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-2"
                  >
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-bold text-center text-textMain"
                  >
                    Delete Account?
                  </motion.h3>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-textMuted text-center text-sm leading-relaxed">
                      This action{" "}
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        cannot be undone
                      </span>
                      . Your account and all associated data will be permanently
                      deleted.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        The following will be deleted:
                      </p>
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                        <li>• All your quizzes and flashcards</li>
                        <li>• Your profile and settings</li>
                        <li>• All saved data</li>
                      </ul>
                    </div>

                    {/* Password confirmation (if user has a password) or text confirmation for OAuth users */}
                    {user?.passwordIsUserSet ? (
                      <div className="pt-2 space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-textMuted mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter your password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-textMuted mb-2">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            placeholder="Re-enter your password"
                            value={deletePasswordConfirm}
                            onChange={(e) =>
                              setDeletePasswordConfirm(e.target.value)
                            }
                            className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                          />

                          {/* Visual feedback: mismatch X, checking spinner, or success check */}
                          {deletePasswordConfirm &&
                          deletePasswordConfirm !== deletePassword ? (
                            <X className="absolute right-3 top-9.5 w-5 h-5 text-red-500 dark:text-red-400" />
                          ) : deletePasswordConfirm &&
                            isCheckingDeletePassword ? (
                            <Loader2 className="absolute right-3 top-9.5 w-5 h-5 animate-spin text-textMuted" />
                          ) : deletePasswordConfirm &&
                            deleteChecksDone &&
                            lastCheckedDeletePassword === deletePassword ? (
                            <Check className="absolute right-3 top-9.5 w-5 h-5 text-green-500 dark:text-green-400" />
                          ) : null}
                        </div>

                        {deletePasswordError && (
                          <div className="text-xs text-red-500 mt-1">
                            {deletePasswordError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2">
                        <label className="block text-sm font-medium text-textMuted mb-2">
                          Type <i className="font-semibold">DELETE</i> exactly
                          as shown
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type..."
                            value={deleteConfirmationText}
                            onChange={(e) =>
                              setDeleteConfirmationText(e.target.value)
                            }
                            className="w-full px-4 py-2 rounded-lg bg-surfaceHighlight border border-border text-textMain focus:outline-none focus:ring-2 focus:ring-primary"
                          />

                          {deleteConfirmationText &&
                          deleteConfirmationText !== "DELETE" ? (
                            <X className="absolute right-3 top-3.5 w-5 h-5 text-red-500 dark:text-red-400" />
                          ) : deleteConfirmationText === "DELETE" ? (
                            <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500 dark:text-green-400" />
                          ) : null}
                        </div>
                        {deleteConfirmError && (
                          <div className="text-xs text-red-500 mt-2">
                            {deleteConfirmError}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-3 pt-1"
                  >
                    <button
                      onClick={cancelDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-surfaceHighlight dark:bg-[#374151] text-textMain font-medium hover:bg-gray-200 dark:hover:bg-[#4B5563] transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                      whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                      onClick={confirmDeleteAccount}
                      disabled={isDeleting || !deleteChecksDone}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed point"
                    >
                      {isDeleting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Logout All Devices Modal */}
        {showLogoutAllModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingOutAll && setShowLogoutAllModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="pointer-events-auto bg-surface dark:bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full mx-4"
              >
                <div className="p-6 space-y-4">
                  {/* Header Icon */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-2"
                  >
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-bold text-center text-textMain"
                  >
                    Logout from All Devices?
                  </motion.h3>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-textMuted text-center text-sm leading-relaxed">
                      You will be logged out from{" "}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        all devices and sessions
                      </span>
                      . You'll need to log in again.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        This will:
                      </p>
                      <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                        <li>• Terminate all active sessions</li>
                        <li>• Log you out from all devices</li>
                        <li>• Redirect you to the login page</li>
                      </ul>
                    </div>
                  </motion.div>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-3 pt-2"
                  >
                    <button
                      onClick={() =>
                        !isLoggingOutAll && setShowLogoutAllModal(false)
                      }
                      disabled={isLoggingOutAll}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-surfaceHighlight dark:bg-[#374151] text-textMain font-medium hover:bg-gray-200 dark:hover:bg-[#4B5563] transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: isLoggingOutAll ? 1 : 1.02 }}
                      whileTap={{ scale: isLoggingOutAll ? 1 : 0.98 }}
                      onClick={handleLogoutAllDevices}
                      disabled={isLoggingOutAll}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 dark:bg-amber-700 text-white font-medium hover:bg-amber-700 dark:hover:bg-amber-800 transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 point"
                    >
                      {isLoggingOutAll ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            style={{ borderTopColor: "var(--color-primary)" }}
                          />
                          <span className="sr-only">Logging out...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Logout All
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
        <ConfirmLogoutModal
          open={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handleConfirmModal}
          isProcessing={isSessionProcessing}
          title="Logout Session"
          description="Are you sure you want to log out this session?"
          confirmLabel="Logout"
          cancelLabel="Cancel"
        />
      </AnimatePresence>
    </>
  );
};

export default SettingsModal;
