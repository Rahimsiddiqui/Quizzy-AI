import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Brain,
  Zap,
  BookOpen,
  BarChart3,
  Star,
} from "lucide-react";

import OptimizedImage from "./OptimizedImage";
import ScrollAnimated from "./ScrollAnimated";
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
    <div className="min-h-screen bg-background text-textMain dark:text-textMain/95 animate-fade-in-up">
      <SEO
        title="AI-Powered Study Platform"
        description="Qubli AI helps students pass exams by turning their notes, PDFs, and topics into instant quizzes, flashcards, and practice tests. Instead of rereading notes for hours, Qubli forces active recall — the same technique used by top students — so you learn faster, remember longer, and walk into the exam hall confident."
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
            <span className="text-primary bg-clip-text">
              Qubli AI
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl text-textMuted mb-9 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            Generate intelligent quizzes, create flashcards, and ace your exams
            with our AI-powered learning platform.
          </p>

          <div
            className="flex flex-col sm:flex-row max-w-3xl mx-auto gap-4 sm:gap-6 justify-center mb-12 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            {auth?.isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 w-[90%] md:w-[40%] mx-auto rounded-xl bg-primary dark:bg-blue-700 text-white hover:text-white/95 font-bold text-md xl:text-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-sm hover:shadow-primary/30 flex items-center justify-center gap-2 point dark:hover:bg-blue-700/90 group"
              >
                Go to Dashboard <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-8 py-4 w-[90%] md:w-[45%] mx-auto rounded-xl bg-primary dark:bg-blue-700 text-white hover:text-white/95 font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-sm hover:shadow-primary/30 flex items-center justify-center gap-2 point dark:hover:bg-blue-700/90 group"
                >
                  Start Learning Free <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
                </button>
                <button
                  onClick={() => navigate("/demo")}
                  className="px-8 py-4 w-[90%] md:w-[42%] mx-auto rounded-xl border border-border text-textMain/95 font-bold text-md xl:text-lg bg-surfaceHighlight/80 hover:bg-surfaceHighlight dark:bg-surfaceHighlight/30 dark:hover:bg-surfaceHighlight/50 transition-colors hover:border-primary/30 dark:hover:border-blue-600/80 point"
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
            {[{number: "10K+", label: "Active Users"},
              {number: "100K+", label: "Quizzes Created"},
              {number: "4.9/5", label: "User Rating"}
              ].map((item) => (
                <div key={item.label} className="p-6 rounded-2xl bg-surface/80 glass border border-border hover:shadow-sm-custom hover:scale-102 transition-all duration-300">
                  <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-500">
                {item.number}
              </div>
              <div className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-2">
                {item.label}
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimated
            animationClass="animate-fade-in-up"
            delay={100}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 md:mb-5">
              Powerful Features
            </h2>
          </ScrollAnimated>
          <ScrollAnimated
            animationClass="animate-fade-in-up"
            delay={200}
          >
            <p className="text-center text-textMuted text-base mb-16 max-w-2xl mx-auto">
              Everything you need to study smarter, not harder
            </p>
          </ScrollAnimated>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Generated Quizzes",
                description:
                  "Instantly generate smart quizzes from any topic using advanced AI technology. Perfect for any subject and learning level.",
              },
              {
                icon: BookOpen,
                title: "Smart Flashcards",
                description:
                  "Automatically convert quiz answers into interactive flashcards with spaced repetition for optimal retention.",
              },
              {
                icon: BarChart3,
                title: "Detailed Analytics",
                description:
                  "Track your progress with comprehensive analytics and insights to identify areas for improvement.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Experience instant quiz generation and seamless performance across all devices and network speeds.",
              },
            ].map((feature, index) => (
              <ScrollAnimated
                key={index}
                animationClass={`animate-slide-in-${index % 2 === 0 ? 'left' : 'right'}`}
                delay={(index / 2) * 100}
                className="p-8 bg-background dark:bg-background/75 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 hover:scale-101"
              >
                <div className="w-12 h-12 bg-primary/10 dark:bg-blue-800/25 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary dark:text-blue-500" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-textMain dark:text-textMain/95">
                  {feature.title}
                </h3>
                <p className="text-textMuted">{feature.description}</p>
              </ScrollAnimated>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="text-lg font-semibold text-primary hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-500/80 transition-all group"
            >
              Explore All Features <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimated
            animationClass="animate-fade-in-up"
            delay={100}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 md:mb-5">
              Loved by Students
            </h2>
          </ScrollAnimated>
          <ScrollAnimated
            animationClass="animate-fade-in-up"
            delay={200}
          >
            <p className="text-center text-textMuted text-base mb-16 max-w-2xl mx-auto">
              See what our users have to say about their learning journey
            </p>
          </ScrollAnimated>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Pre-Med Student",
                image: "/images/review-sarah.png",
                rating: 5,
                review:
                  "Qubli AI completely transformed how I study. The AI-generated quizzes are so relevant and the flashcards help me retain information way better.",
              },
              {
                name: "James Smith",
                role: "College Student",
                image: "/images/review-smith.png",
                rating: 5,
                review:
                  "I improved my exam scores by 30% in just one month of using Qubli AI. The analytics showed exactly what I needed to focus on, and the study recommendations were spot-on.",
              },
              {
                name: "Dr. Emily Rodriguez",
                role: "High School Teacher",
                image: "/images/review-emily.avif",
                rating: 5,
                review:
                  "As a teacher, I use Qubli AI to create assessments for my students. It saves me so much time and the AI suggestions are incredibly accurate. My students love the interactive format!",
              },
              {
                name: "James Lee",
                role: "MBA Student",
                rating: 5,
                review:
                  "The flashcard system with spaced repetition is incredible. I've tried many study apps, but Qubli AI is by far the most effective. The time I save allows me to focus on deeper learning.",
              },
            ].map((testimonial, index) => (
              <ScrollAnimated
                key={index}
                animationClass="animate-fade-in-up"
                delay={(index / 2) * 100}
                margin="-50px"
                className="p-8 bg-surface dark:bg-surface/80 rounded-xl border border-border hover:border-primary/30 dark:hover-bg-blue-800/80 transition-all hover:scale-101 duration-200 hover:shadow-md hover:shadow-primary/10"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <p className="text-textMuted mb-6">{testimonial.review}</p>
                <div className="flex items-center gap-3 pt-6 border-t border-border">
                  {testimonial.image ? (
                    <div className="w-12 h-12">
                      <OptimizedImage
                        className="w-12 h-12 rounded-full"
                        src={testimonial.image}
                        alt={testimonial.name}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full text-white bg-primary/90 dark:bg-blue-800/50 flex items-center justify-center text-xl font-bold uppercase">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-textMain dark:text-textMain/95">
                      {testimonial.name}
                    </span>
                    <p className="text-sm text-textMuted">{testimonial.role}</p>
                  </div>
                </div>
              </ScrollAnimated>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/testimonials"
              className="text-lg font-semibold text-primary hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-500/80 transition-all group"
            >
              Read More Testimonials <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
        <ScrollAnimated
          animationClass="animate-fade-in-up"
          delay={200}
          margin="-50px"
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-lg text-textMuted mb-8">
            Join thousands of students who use Qubli AI to boost their learning.
          </p>
          {auth?.isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-3 mx-auto rounded-xl bg-primary dark:bg-blue-700 text-white hover:text-white/95 font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-sm hover:shadow-primary/30 flex items-center justify-center gap-2 point dark:hover:bg-blue-700/90 group"
            >
              Go To Dashboard <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-10 py-3 mx-auto rounded-xl bg-primary dark:bg-blue-700 text-white hover:text-white/95 font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-sm hover:shadow-primary/30 flex items-center justify-center gap-2 point dark:hover:bg-blue-700/90 group"
            >
              Get Started Free <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          )}
          <p className="text-textMuted text-sm mt-4">
            No credit card required. Free forever for basic features.
          </p>
        </ScrollAnimated>
      </section>
    </div>
  );
};

export default LandingPage;
