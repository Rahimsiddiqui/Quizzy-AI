import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { request } from "../services/api.js";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  // DX: Added optional chaining to location.state to safely access email
  const email = location.state?.email;

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error("Verification code expired!");
      setCode("");
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // The 'email' passed here is already checked for null/undefined below,
      // but optional chaining ensures it's handled gracefully if the check were missed.
      const response = await request("/api/auth/verify-email", "POST", {
        email,
        code,
      });

      localStorage.setItem("token", response.token);
      // Added optional chaining to safely stringify response.user just in case
      localStorage.setItem("user", JSON.stringify(response.user ?? {}));

      // Notify app about updated user so auth state can update
      window.dispatchEvent(
        new CustomEvent("userUpdated", { detail: response.user })
      );

      toast.success("Email verified successfully!");
      navigate("/dashboard");
    } catch (err) {
      if (err.message.includes("expired")) {
        toast.error("Code expired. Please request a new one.");
      } else {
        toast.error(err.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      // Added optional chaining to email, though it's checked in the conditional render
      await request("/api/auth/resend-code", "POST", { email });
      toast.success("New code sent to your email!");
      setTimeLeft(1800); // Reset timer
      setCode("");
    } catch (err) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            No email found. Please register again.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 point"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex justify-center items-center min-h-screen bg-linear-to-br from-primary/10 to-secondary/10 p-4 animate-fade-in-up">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl py-8 px-5 sm:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-primary dark:text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-textMain mb-2">
            Verify Your Email
          </h1>
          <p className="text-textMuted">
            We sent a 6-digit code to <br />
            <span className="font-semibold text-textMain">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-textMain mb-2">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-border rounded-lg focus:border-primary dark:focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-textMuted mb-1">Code expires in</p>
            <p
              className={`text-2xl font-bold ${
                timeLeft < 300
                  ? "text-red-600 dark:text-red-500"
                  : "text-primary dark:text-blue-500"
              }`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary dark:bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-primary/90 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 point"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-textMuted text-center mb-4">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendCode}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-primary dark:text-blue-400 font-semibold border-2 border-primary dark:border-blue-500 rounded-lg hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all point"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmail;
