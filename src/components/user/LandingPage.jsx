import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Brain,
  Zap,
  BookOpen,
  BarChart3,
  Star,
} from "lucide-react";

import OptimizedImage from "./OptimizedImage";
import SEO from "./SEO";

const LandingPage = ({ auth }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show error message if redirected due to disabled account
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.error(message, { autoClose: 5000 });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-textMain animate-fade-in-up">
      <SEO
        title="Ace Your Exams with AI-Powered Study Tools"
        description="Qubli AI turns your notes and PDFs into instant quizzes and flashcards. Use active recall and spaced repetition to learn 10x faster."
      />
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
            {auth?.isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 w-[90%] md:w-[45%] mx-auto rounded-xl bg-primary text-white font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 flex items-center justify-center gap-2 point"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Stats */}
          <div
            className="grid min-[450px]:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="p-6 rounded-2xl glass border border-white/20 hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-400">
                10K+
              </div>
              <div className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-1">
                Active Users
              </div>
            </div>
            <div className="p-6 rounded-2xl glass border border-white/20 hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-400">
                100K+
              </div>
              <div className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-1">
                Quizzes Created
              </div>
            </div>
            <div className="p-6 rounded-2xl glass border border-white/20 hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-400">
                4.9/5
              </div>
              <div className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-1">
                User Rating
              </div>
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
                <div className="w-12 h-12">
                  <OptimizedImage
                    className="w-12 h-12 rounded-full"
                    src="/images/review-sarah.png"
                    alt="Sarah Chen"
                  />
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
                on, and the study recommendations were spot-on."
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-12 h-12">
                  <OptimizedImage
                    className="w-12 h-12 rounded-full"
                    src="/images/review-smith.png"
                    alt="James Smith"
                  />
                </div>
                <div>
                  <div className="font-semibold text-textMain">James Smith</div>
                  <div className="text-sm text-textMuted">College Student</div>
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
                incredibly accurate. My students love the interactive format!"
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-12 h-12">
                  <OptimizedImage
                    className="w-12 h-12 rounded-full"
                    src="/images/review-emily.png"
                    alt="Dr. Emily Rodriguez"
                  />
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
          {auth?.isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 flex items-center justify-center gap-2 mx-auto point"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-10 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 flex items-center justify-center gap-2 mx-auto point"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <p className="text-textMuted text-sm mt-4">
            No credit card required. Free forever for basic features.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
