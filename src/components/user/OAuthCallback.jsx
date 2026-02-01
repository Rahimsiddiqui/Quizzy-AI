import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const provider = localStorage.getItem("oauthProvider");
        const authMode = localStorage.getItem("authMode");

        if (!code || !provider) {
          toast.error("Invalid OAuth callback");
          navigate("/auth");
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(
          `${apiUrl}/api/auth/oauth/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider,
              code,
              redirectUri: window.location.origin + "/oauth/callback",
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.removeItem("oauthProvider");
          localStorage.removeItem("authMode");

          window.dispatchEvent(
            new CustomEvent("userUpdated", { detail: data.user })
          );

          toast.success("Successfully logged in with " + provider);

          if (authMode === "settings") {
            navigate("/dashboard", { replace: true });
            window.location.reload();
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          const error = await response.json();
          toast.error(error.message || "OAuth authentication failed");
          navigate("/auth");
        }
      } catch {
        // OAuth callback processing failed; notify user and redirect
        toast.error("Error processing OAuth callback");
        navigate("/auth");
      }
    };

    hasProcessed.current = true;
    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-textMuted">Processing login...</p>
      </div>
    </main>
  );
};

export default OAuthCallback;
