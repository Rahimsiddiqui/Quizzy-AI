import React, { useState } from "react";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";

import Navbar from "./Navbar.jsx";

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
    } catch (err) {
      toast.error("Could not send message. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            We’re Here to <br />
            <span className="text-primary dark:text-blue-500 bg-clip-text">
              Help
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto">
            Have questions, need assistance, or want to share feedback? Reach
            out to us, and we’ll get back to you promptly to make your Qubli AI
            experience seamless.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={submit}
            className="space-y-6 border border-border pb-10 pt-12 px-4 sm:px-6 md:px-8 rounded-lg shadow-md"
          >
            <div>
              <h2 className="text-4xl text-textMain text-center font-semibold mb-8">
                Contact Us
              </h2>
              <label htmlFor="email" className="text-lg font-medium mb-2 flex">
                Email
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-textMain focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="flex text-lg font-medium mb-2"
              >
                Message
                <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-textMain focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 resize-none"
                placeholder="Tell us what you need help with..."
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className={`px-8 py-3.5 rounded-lg font-semibold block mx-auto bg-primary/90 hover:bg-primary dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white hover:text-white/90 ${
                sending ? "opacity-50 cursor-not-allowed" : "point"
              }`}
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  Sending
                  <CircularProgress size={18} sx={{ color: "white" }} />
                </span>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
