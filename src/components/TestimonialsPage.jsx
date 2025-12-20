import React from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import Navbar from "./Navbar.jsx";

const TestimonialsPage = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Pre-Med Student",
      rating: 5,
      text: "Quizzy AI completely transformed how I study. The AI-generated quizzes are so relevant and the flashcards help me retain information way better. I've improved my grades significantly!",
      image: "SC",
      color: "bg-blue-500",
    },
    {
      name: "Marcus Johnson",
      role: "College Junior",
      rating: 5,
      text: "I improved my exam scores by 30% in just one month of using Quizzy AI. The analytics showed exactly what I needed to focus on, and the study recommendations were spot-on.",
      image: "MJ",
      color: "bg-purple-500",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "High School Teacher",
      rating: 5,
      text: "As a teacher, I use Quizzy AI to create assessments for my students. It saves me so much time and the AI suggestions are incredibly accurate. My students love the interactive format!",
      image: "ER",
      color: "bg-green-500",
    },
    {
      name: "James Lee",
      role: "MBA Student",
      rating: 5,
      text: "The flashcard system with spaced repetition is incredible. I've tried many study apps, but Quizzy AI is by far the most effective. The time I save allows me to focus on deeper learning.",
      image: "JL",
      color: "bg-orange-500",
    },
    {
      name: "Priya Patel",
      role: "GMAT Test Taker",
      rating: 5,
      text: "I used Quizzy AI to prepare for the GMAT and scored 750! The AI-generated practice questions are incredibly close to the actual test format. Highly recommend!",
      image: "PP",
      color: "bg-pink-500",
    },
    {
      name: "David Thompson",
      role: "College Sophomore",
      rating: 5,
      text: "The offline functionality is a game-changer. I can study anywhere without worrying about internet connection. Plus, the app is lightning-fast and never crashes.",
      image: "DT",
      color: "bg-red-500",
    },
    {
      name: "Lisa Wang",
      role: "Medical Student",
      rating: 5,
      text: "The detailed analytics help me understand my learning patterns. I can see which topics I'm strong in and where I need improvement. This data-driven approach changed my study strategy.",
      image: "LW",
      color: "bg-indigo-500",
    },
    {
      name: "Ahmed Hassan",
      role: "Engineering Student",
      rating: 5,
      text: "Quizzy AI's ability to generate quizzes on complex technical topics is exceptional. The questions test real understanding, not just memorization. Best study tool I've found!",
      image: "AH",
      color: "bg-cyan-500",
    },
    {
      name: "Victoria Miller",
      role: "Law School Student",
      rating: 5,
      text: "The customizable difficulty levels mean I can start easy and gradually increase the challenge. Perfect for building confidence and mastering difficult concepts progressively.",
      image: "VM",
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Loved by <br />
            <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Students Worldwide
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto">
            Join thousands of students who've transformed their learning with
            Quizzy AI. Read their success stories below.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-background rounded-2xl border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:scale-102 animate-fade-in-up"
                style={{ animationDelay: `${(index % 3) * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-textMuted mb-6 text-lg leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <div
                    className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-textMain">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-textMuted">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-surface rounded-2xl border border-border hover:border-primary/50 transition-all">
              <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-2">
                10K+
              </div>
              <div className="text-textMuted text-lg">Happy Students</div>
            </div>
            <div className="text-center p-8 bg-surface rounded-2xl border border-border hover:border-primary/50 transition-all">
              <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-2">
                4.9/5
              </div>
              <div className="text-textMuted text-lg">Average Rating</div>
            </div>
            <div className="text-center p-8 bg-surface rounded-2xl border border-border hover:border-primary/50 transition-all">
              <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-2">
                100K+
              </div>
              <div className="text-textMuted text-lg">Quizzes Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-textMuted mb-8">
            Start your learning journey with Quizzy AI today.
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

export default TestimonialsPage;
