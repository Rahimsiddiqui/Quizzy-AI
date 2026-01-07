import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Brain,
  Zap,
  BookOpen,
  BarChart3,
  Users,
  Star,
  Github,
  Linkedin,
  Twitter,
  Mail,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show error message if redirected due to disabled account
  React.useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.error(message, { autoClose: 5000 });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-textMain animate-fade-in-up">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-6 border border-primary/20 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <Zap className="w-4 h-4 text-primary dark:text-blue-400" />
            <span className="text-sm font-semibold text-primary dark:text-blue-400">
              AI-Powered Learning
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Master Any Topic with <br />
            <span className="text-primary dark:text-blue-500 bg-clip-text">
              Qubli AI
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            Generate intelligent quizzes, create flashcards, and ace your exams
            with our AI-powered learning platform.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-4 w-[90%] md:w-[45%] mx-auto rounded-xl bg-primary text-white font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 flex items-center justify-center gap-2 point"
            >
              Start Learning Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-4 w-[90%] md:w-[45%] mx-auto rounded-xl border border-border text-textMain font-bold text-md xl:text-lg hover:bg-surfaceHighlight transition-all hover:border-primary/50 hover:scale-102 point"
            >
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="p-4 rounded-lg bg-surface border border-border hover:border-primary/50 hover:shadow-md hover:scale-102 transition-all">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                10K+
              </div>
              <div className="text-sm text-textMuted">Active Users</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border hover:border-primary/50 hover:shadow-md hover:scale-102 transition-all">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                100K+
              </div>
              <div className="text-sm text-textMuted">Quizzes Created</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border hover:border-primary/50 hover:shadow-md hover:scale-102 transition-all">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                4.9/5
              </div>
              <div className="text-sm text-textMuted">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Powerful Features
          </h2>
          <p
            className="text-center text-textMuted text-base mb-16 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Everything you need to study smarter, not harder
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div
              className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-3">AI-Generated Quizzes</h3>
              <p className="text-textMuted">
                Instantly generate smart quizzes from any topic using advanced
                AI technology. Perfect for any subject and learning level.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-3">Smart Flashcards</h3>
              <p className="text-textMuted">
                Automatically convert quiz answers into interactive flashcards
                with spaced repetition for optimal retention.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "500ms" }}
            >
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-3">Detailed Analytics</h3>
              <p className="text-textMuted">
                Track your progress with comprehensive analytics and insights to
                identify areas for improvement.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "600ms" }}
            >
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-3">Lightning Fast</h3>
              <p className="text-textMuted">
                Experience instant quiz generation and seamless performance
                across all devices and network speeds.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="text-lg font-semibold text-primary hover:text-blue-700 dark:text-blue-500 dark:hover:text-primary transition-colors"
            >
              Explore All Features →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Loved by Students
          </h2>
          <p
            className="text-center text-textMuted text-base mb-16 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            See what our users have to say about their learning journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div
              className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-6">
                "Qubli AI completely transformed how I study. The AI-generated
                quizzes are so relevant and the flashcards help me retain
                information way better."
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  SC
                </div>
                <div>
                  <div className="font-semibold text-textMain">Sarah Chen</div>
                  <div className="text-sm text-textMuted">Pre-Med Student</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div
              className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-6">
                "I improved my exam scores by 30% in just one month of using
                Qubli AI. The analytics showed exactly what I needed to focus
                on."
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  MJ
                </div>
                <div>
                  <div className="font-semibold text-textMain">
                    Marcus Johnson
                  </div>
                  <div className="text-sm text-textMuted">College Junior</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div
              className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all hover:scale-102 animate-fade-in-up"
              style={{ animationDelay: "500ms" }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-6">
                "As a teacher, I use Qubli AI to create assessments for my
                students. It saves me so much time and the AI suggestions are
                spot-on."
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  ER
                </div>
                <div>
                  <div className="font-semibold text-textMain">
                    Dr. Emily Rodriguez
                  </div>
                  <div className="text-sm text-textMuted">
                    High School Teacher
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/testimonials"
              className="text-lg font-semibold text-primary hover:text-blue-700 dark:text-blue-500 dark:hover:text-primary transition-colors"
            >
              Read More Testimonials →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
        <div
          className="max-w-4xl mx-auto text-center animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-lg text-textMuted mb-8">
            Join thousands of students using Qubli AI to boost their learning
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-10 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 flex items-center justify-center gap-2 mx-auto point"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-textMuted text-sm mt-4">
            No credit card required. Free forever for basic features.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 font-bold text-lg text-primary dark:text-blue-400 mb-4 justify-center md:justify-start">
                <img
                  src="/icons/favicon-main.png"
                  className="w-10 h-10"
                  alt="Brand Icon"
                  loading="lazy"
                />
                <span>Qubli AI</span>
              </div>
              <p className="text-textMuted text-sm">
                Making learning smarter with AI-powered quizzes and flashcards.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-textMuted text-sm">
                <li>
                  <Link
                    to="/features"
                    className="hover:text-textMain transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-textMain transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-textMain transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-textMuted text-sm">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-textMain transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-textMain transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-textMain transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-textMuted text-sm">
                <li>
                  <Link
                    to="/policies"
                    className="hover:text-textMain transition-colors"
                  >
                    Policies
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-textMain transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-textMuted text-sm">
                &copy; {new Date().getFullYear()} Qubli AI | All rights
                reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                  aria-label="Github"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
