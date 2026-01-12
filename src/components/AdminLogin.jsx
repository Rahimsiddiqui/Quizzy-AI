import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/adminService";
import { toast } from "react-toastify";
import { Mail, Lock, Loader2, LogIn, Shield } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      toast.success("Welcome back!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden animate-fade-in-up">
      {/* Background Decorative Elements */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900 rounded-full blur-[120px] opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-950 rounded-full blur-[120px] opacity-60" />

      <div className="w-full max-w-md z-10">
        {/* Login Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-slate-300 dark:shadow-slate-700 px-5 py-8 xs:px-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Logo Inside Form */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-indigo-600 to-indigo-700 dark:bg-linear-to-br dark:from-indigo-900 dark:via-indigo-800 dark:to-indigo-700 rounded-2xl shadow-lg shadow-indigo-300 dark:shadow-indigo-900 text-white">
                <Shield size={28} strokeWidth={2.5} />
              </div>
            </div>
            {/* Branding */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-textMain tracking-tight">
                Qubli Admin
              </h1>
              <p className="text-textMuted mt-2 font-medium">
                Please enter your details to sign in
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-400 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-10 py-3 bg-surfaceHighlight border border-border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 disabled:opacity-60"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold hover:underline text-primary dark:text-blue-500 point"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-10 py-3 bg-surfaceHighlight border border-border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800/90 dark:bg-slate-700/50 hover:bg-slate-800 dark:hover:bg-slate-700/40 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-200 dark:shadow-slate-800 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
          {/* Footer */}
          <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            Not an admin?{" "}
            <button className="font-semibold text-primary dark:text-blue-500 hover:underline point">
              Back to Main Site
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
