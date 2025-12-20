import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, BookOpen, BarChart3, Brain } from "lucide-react";
import Navbar from "./Navbar.jsx";

const FeaturesPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Generated Quizzes",
      description:
        "Instantly generate smart quizzes from any topic using advanced AI technology. Our intelligent system analyzes your subject matter and creates questions that test understanding at multiple levels - from basic recall to complex application.",
      benefits: [
        "Instantly generate from any topic or uploaded documents",
        "Multiple question types (MCQ, short answer, essay)",
        "Customizable difficulty levels",
        "Covers all major subjects and topics",
      ],
    },
    {
      icon: BookOpen,
      title: "Smart Flashcards",
      description:
        "Automatically convert quiz answers into interactive flashcards with spaced repetition for optimal retention. Our system learns from your performance and adjusts the review schedule based on your learning patterns.",
      benefits: [
        "Auto-generated from quiz content",
        "Spaced repetition algorithm",
        "Visual learning support with images",
        "Progress tracking and analytics",
      ],
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description:
        "Track your progress with comprehensive analytics and insights to identify areas for improvement. Get detailed reports on your learning journey, strengths, and areas that need more focus.",
      benefits: [
        "Performance metrics and scores",
        "Topic-wise breakdown analysis",
        "Time spent tracking",
        "Improvement recommendations",
      ],
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Experience instant quiz generation and seamless performance across all devices and network speeds. Our optimized platform ensures you can study anywhere, anytime without delays.",
      benefits: [
        "Sub-second quiz generation",
        "Works offline with local storage",
        "Optimized for all devices",
        "Zero lag study experience",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Powerful Features for <br />
            <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Smarter Learning
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto">
            Discover how Quizzy AI's advanced features help you study more
            effectively and ace your exams.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto space-y-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
              >
                <div className={isEven ? "order-1" : "order-2"}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-8 h-8 text-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-4">
                        {feature.title}
                      </h2>
                      <p className="text-textMuted text-lg mb-6">
                        {feature.description}
                      </p>
                      <div className="space-y-3">
                        <p className="font-semibold text-textMain mb-3">
                          Key Benefits:
                        </p>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 text-textMuted"
                            >
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`order-${
                    isEven ? 2 : 1
                  } p-8 bg-background rounded-2xl border border-border hover:border-primary/30 transition-all`}
                >
                  <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <IconComponent className="w-24 h-24 text-primary/40 dark:text-blue-400/40" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Experience the Power of AI Learning?
          </h2>
          <p className="text-lg text-textMuted mb-8">
            Start using Quizzy AI today and transform the way you study.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 hover:scale-102 point"
          >
            Get Started Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
