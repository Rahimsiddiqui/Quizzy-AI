import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import PublicPageLayout from "./PublicPageLayout";

const Contact = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`${import.meta.env.VITE_API_URL}/api/support/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({ feedback: message, email: email || null }),
      });
      setMessage("");
      setEmail("");
      toast.success("Thanks for the feedback! We appreciate it.");
    } catch {
      toast.error("Could not send message. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicPageLayout
      pageTitle="Contact Us"
      description="Have questions, need assistance, or want to share feedback? Reach out to us."
      heroTitle="We're Here to"
      heroHighlight="Help"
      heroSubtitle="Have questions, need assistance, or want to share feedback? Reach out to us, and we'll get back to you promptly to make your Qubli AI experience seamless."
    >
      {/* Contact Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-textMain dark:text-textMain/95 mb-4 tracking-tight">
              Get in Touch
            </h2>
            <p className="text-lg text-textMuted">
              Have a question or want to work together? Drop us a message.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="bg-surface/50 backdrop-blur-sm border border-border/60 px-4 py-6 min-[450px]:px-6 sm:p-10 rounded-2xl shadow-xl space-y-8"
          >
            <div className="grid grid-cols-1 gap-8">
              {/* Email Field */}
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold uppercase tracking-wider text-textMuted mb-2 transition-colors group-focus-within:text-primary dark:group-focus-within:text-blue-500"
                >
                  Email Address<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-border bg-surfaceHighlight/40 dark:bg-surfaceHighlight/50 text-textMain dark:text-textMain/95 dark:placeholder:text-textMain/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 placeholder:opacity-50"
                  placeholder="name@company.com"
                />
              </div>

              {/* Message Field */}
              <div className="group">
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold uppercase tracking-wider text-textMuted mb-2 transition-colors group-focus-within:text-primary dark:group-focus-within:text-blue-500"
                >
                  Your Message<span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="w-full px-4 py-4 rounded-xl border border-border bg-surfaceHighlight/40 dark:bg-surfaceHighlight/50 text-textMain dark:text-textMain/95 dark:placeholder:text-textMain/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none placeholder:opacity-50"
                  placeholder="How can we help you?"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] shadow-md hover:shadow-primary/20 ${
                sending
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70"
                  : "bg-primary hover:bg-blue-700 text-white point dark:bg-blue-700 dark:hover:bg-blue-700/80"
              }`}
            >
              {sending ? (
                <span className="flex items-center justify-center gap-3">
                  <CircularProgress size={20} sx={{ color: "white" }} />
                  Processing...
                </span>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Contact;
