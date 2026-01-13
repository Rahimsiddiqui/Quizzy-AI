import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
  Check,
  X,
  Github,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import StorageService from "../services/storageService";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();

  // Validation Logic
  const validations = {
    name: (name) => name.length >= 6,
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: (pass) => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(pass),
  };

  // Check form validity in real-time
  useEffect(() => {
    if (isLogin) {
      const emailValid = validations.email(formData.email);
      const passValid = validations.password(formData.password);
      setIsFormValid(emailValid && passValid);
    } else {
      const nameValid = validations.name(formData.name);
      const emailValid = validations.email(formData.email);
      const passValid = validations.password(formData.password);
      setIsFormValid(nameValid && emailValid && passValid);
    }
  }, [formData, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const user = await StorageService.login(
          formData.email,
          formData.password
        );
        if (!user) {
          throw new Error("Login failed: No user data returned");
        }
        onLogin(user); // Update auth state in App
        navigate("/dashboard", { replace: true });
      } else {
        await StorageService.register(
          formData.name,
          formData.email,
          formData.password
        );
        navigate("/auth/verify-email", {
          state: { email: formData.email },
          replace: true,
        });
      }
    } catch (err) {
      setError(err.message);
      // Show toast for quick feedback on login failures
      toast.error(
        err.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth login/signup
  const handleOAuthConnect = async (provider) => {
    try {
      // OAuth URLs - Update these with your actual OAuth app credentials
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

      // Build OAuth URL
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: config.scopes.join(" "),
        state: Math.random().toString(36).substring(7),
      });

      // Store mode (login vs register) and provider in localStorage for callback handler
      localStorage.setItem("authMode", isLogin ? "login" : "signup");
      localStorage.setItem("oauthProvider", provider.toLowerCase());

      // Redirect to OAuth provider
      window.location.href = `${config.authUrl}?${params.toString()}`;
    } catch {
      // Failed to initiate OAuth flow; notify user
      toast.error(`Failed to connect ${provider}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper to render Status Icon
  const renderStatusIcon = (isValid, value) => {
    if (!value) return null;
    return isValid ? (
      <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500 dark:text-green-400 animate-fade-in" />
    ) : (
      <X className="absolute right-3 top-3.5 w-5 h-5 text-red-500 dark:text-red-400 animate-fade-in" />
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden animate-fade-in-up">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-blue-100 dark:bg-blue-900 rounded-full blur-[100px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-indigo-100 dark:bg-indigo-950 rounded-full blur-[100px] pointer-events-none opacity-60"></div>

      <div className="max-w-md w-full bg-surface py-8 px-5 sm:px-8 rounded-2xl border border-border shadow-2xl z-10 border-main transition-all duration-300">
        <div className="text-center mb-6">
          <img
            src="/icons/favicon-main.png"
            className="w-18 h-18 xs:w-20 xs:h-20 mb-4 mx-auto"
            alt="Brand Icon"
            loading="lazy"
          />
          <h1 className="text-3xl font-bold text-textMain mb-2">
            {isLogin ? "Welcome Back" : "Join Qubli AI"}
          </h1>
          <p className="text-textMuted">
            {isLogin
              ? "Enter your credentials to access your workspace."
              : "Start your intelligent learning journey."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1 relative group">
              <label className="text-xs font-medium text-textMuted ml-1">
                Full Name
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 disabled:opacity-60 ${
                    formData.name && !validations.name(formData.name)
                      ? "border-red-300 dark:border-red-400 bg-red-50/10"
                      : "border-border"
                  }`}
                  placeholder="John Doe"
                />
                {renderStatusIcon(
                  validations.name(formData.name),
                  formData.name
                )}
              </div>
              {/* Inline Hint - Only show if user has started typing */}
              {formData.name.length > 0 && (
                <div
                  className={`text-[10px] mt-1 ml-1 transition-colors duration-200 absolute -bottom-5 left-0 w-full truncate ${
                    !validations.name(formData.name)
                      ? "text-red-500 dark:text-red-400 font-medium dark:font-normal"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  Full name must be at least 6 characters
                </div>
              )}
            </div>
          )}

          <div
            className={`space-y-1 ${
              formData.name.length > 0 && "pt-3"
            } relative`}
          >
            <label className="text-xs font-medium text-textMuted ml-1">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 disabled:opacity-60 ${
                  !isLogin &&
                  formData.email &&
                  !validations.email(formData.email)
                    ? "border-red-300 dark:border-red-400 bg-red-50/10"
                    : "border-border"
                }`}
                placeholder="name@example.com"
              />
              {renderStatusIcon(
                validations.email(formData.email),
                formData.email
              )}
            </div>
            {/* Inline Hint - Only show if user has started typing */}
            {formData.email.length > 0 && (
              <div
                className={`text-[10px] mt-1 ml-1 transition-colors duration-200 absolute -bottom-5 left-0 w-full truncate ${
                  !validations.email(formData.email)
                    ? "text-red-500 dark:text-red-400 font-medium dark:font-normal"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                Enter a valid email address
              </div>
            )}
          </div>

          <div
            className={`space-y-1 ${
              formData.email.length > 0 && "pt-3"
            } relative`}
          >
            <label className="text-xs font-medium text-textMuted ml-1">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={`w-full pl-12 pr-10 py-3 bg-surfaceHighlight border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 disabled:opacity-60 ${
                  !isLogin &&
                  formData.password &&
                  !validations.password(formData.password)
                    ? "border-red-300 dark:border-red-400 bg-red-50/10"
                    : "border-border"
                }`}
                placeholder="••••••••"
              />
              {renderStatusIcon(
                validations.password(formData.password),
                formData.password
              )}
            </div>
            {/* Inline Hint - Only show if user has started typing */}
            {formData.password.length > 0 && (
              <div
                className={`text-[10px] mt-1 ml-1 leading-tight transition-colors duration-200 absolute -bottom-5 left-0 w-full ${
                  !validations.password(formData.password)
                    ? "text-red-500 dark:text-red-400 font-medium dark:font-normal"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                Min 6 chars & include a number and uppercase letter
              </div>
            )}
          </div>

          <div
            style={{
              height: formData.password.length > 0 ? "10px" : "0.1px",
            }}
          ></div>

          {error && (
            <div
              className="text-red-500 dark:text-red-300 text-sm text-center 
            bg-red-50 dark:bg-red-800/40 p-2 rounded-lg border border-red-100 dark:border-red-900 animate-fade-in"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}{" "}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* OAuth Buttons */}
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-textMuted">
                  {isLogin ? "Or sign in with" : "Or sign up with"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthConnect("Google")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-surfaceHighlight hover:bg-surface border border-border text-textMain font-medium py-2.5 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                <GoogleIcon />
                <span className="text-sm">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthConnect("GitHub")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-surfaceHighlight hover:bg-surface border border-border text-textMain font-medium py-2.5 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-textMuted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ name: "", email: "", password: "" });
                setIsFormValid(false);
              }}
              className="text-primary dark:text-blue-500 hover:underline cursor-pointer font-medium transition-colors"
              disabled={loading}
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
};

export default AuthForm;
