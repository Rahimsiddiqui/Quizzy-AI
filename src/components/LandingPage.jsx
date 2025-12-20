import React, { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import AuthForm from "./AuthForm.jsx";

const LandingPage = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-primary dark:text-blue-400">
            <Brain className="w-7 h-7" />
            <span>Quizzy AI</span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-surfaceHighlight rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-textMuted hover:text-textMain transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-textMuted hover:text-textMain transition-colors"
            >
              Testimonials
            </a>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface">
            <div className="px-4 py-4 space-y-4">
              <a
                href="#features"
                className="block text-textMuted hover:text-textMain transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="block text-textMuted hover:text-textMain transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full mb-6 border border-primary/20">
            <Zap className="w-4 h-4 text-primary dark:text-blue-400" />
            <span className="text-sm font-semibold text-primary dark:text-blue-400">
              AI-Powered Learning
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Master Any Topic with{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Quizzy AI
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-textMuted mb-8 max-w-2xl mx-auto leading-relaxed">
            Generate intelligent quizzes, create flashcards, and ace your exams
            with our AI-powered learning platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Learning Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 rounded-xl border border-border text-textMain font-bold text-lg hover:bg-surfaceHighlight transition-all hover:border-primary/50"
            >
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                10K+
              </div>
              <div className="text-sm text-textMuted">Active Users</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                100K+
              </div>
              <div className="text-sm text-textMuted">Quizzes Created</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-blue-400">
                4.9/5
              </div>
              <div className="text-sm text-textMuted">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-center text-textMuted text-lg mb-16 max-w-2xl mx-auto">
            Everything you need to study smarter, not harder
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Generated Quizzes</h3>
              <p className="text-textMuted">
                Instantly generate smart quizzes from any topic using advanced
                AI technology. Perfect for any subject and learning level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
              <p className="text-textMuted">
                Automatically convert quiz answers into interactive flashcards
                with spaced repetition for optimal retention.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Detailed Analytics</h3>
              <p className="text-textMuted">
                Track your progress with comprehensive analytics and insights to
                identify areas for improvement.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-background rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-textMuted">
                Experience instant quiz generation and seamless performance
                across all devices and network speeds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4">
            Loved by Students
          </h2>
          <p className="text-center text-textMuted text-lg mb-16 max-w-2xl mx-auto">
            See what our users have to say about their learning journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-4">
                "Quizzy AI completely transformed how I study. The AI-generated
                quizzes are so relevant and the flashcards help me retain
                information way better."
              </p>
              <div className="font-semibold">Sarah Chen</div>
              <div className="text-sm text-textMuted">Pre-Med Student</div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-4">
                "I improved my exam scores by 30% in just one month of using
                Quizzy AI. The analytics showed exactly what I needed to focus
                on."
              </p>
              <div className="font-semibold">Marcus Johnson</div>
              <div className="text-sm text-textMuted">College Junior</div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-textMuted mb-4">
                "As a teacher, I use Quizzy AI to create assessments for my
                students. It saves me so much time and the AI suggestions are
                spot-on."
              </p>
              <div className="font-semibold">Dr. Emily Rodriguez</div>
              <div className="text-sm text-textMuted">High School Teacher</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-xl text-textMuted mb-8">
            Join thousands of students using Quizzy AI to boost their learning
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-10 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 mx-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 font-bold text-lg text-primary dark:text-blue-400 mb-4">
                <Brain className="w-6 h-6" />
                <span>Quizzy AI</span>
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
                  <a href="#" className="hover:text-textMain transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-textMain transition-colors">
                    Pricing
                  </a>
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
                  <a href="#" className="hover:text-textMain transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-textMain transition-colors">
                    Contact
                  </a>
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
                  <a href="#" className="hover:text-textMain transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-textMain transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-textMuted text-sm">
                © 2024 Quizzy AI. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-textMuted hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary transition-colors"
                  aria-label="Github"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-textMuted hover:text-primary transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="sticky top-0 bg-background border-b border-border flex justify-between items-center p-6">
              <h3 className="text-xl font-bold">Get Started</h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-textMuted hover:text-textMain transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <AuthForm onLogin={handleAuthSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
