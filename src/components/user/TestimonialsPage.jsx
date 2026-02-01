import { Star } from "lucide-react";
import ScrollAnimated from "./ScrollAnimated";
import OptimizedImage from "./OptimizedImage";
import PublicPageLayout from "./PublicPageLayout";

const TestimonialsPage = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Pre-Med Student",
      rating: 5,
      review: "Qubli AI completely transformed how I study. The AI-generated quizzes are so relevant and the flashcards help me retain information way better. I've improved my grades significantly!",
      image: "/images/review-sarah.png",
    },
    {
      name: "James Smith",
      role: "College Student",
      rating: 5,
      review: "I improved my exam scores by 30% in just one month of using Qubli AI. The analytics showed exactly what I needed to focus on, and the study recommendations were spot-on.",
      image: "/images/review-smith.png",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "High School Teacher",
      rating: 5,
      review: "As a teacher, I use Qubli AI to create assessments for my students. It saves me so much time and the AI suggestions are incredibly accurate. My students love the interactive format!",
      image: "/images/review-emily.avif",
    },
    {
      name: "James Lee",
      role: "MBA Student",
      rating: 5,
      review: "The flashcard system with spaced repetition is incredible. I've tried many study apps, but Qubli AI is by far the most effective. The time I save allows me to focus on deeper learning.",
      image: "JL",
      bg: "bg-primary",
    },
    {
      name: "Priya Patel",
      role: "GMAT Test Taker",
      rating: 5,
      review: "I used Qubli AI to prepare for the GMAT and scored 750! The AI-generated practice questions are incredibly close to the actual test format. Highly recommend!",
      image: "PP",
      bg: "bg-green-600",
    },
    {
      name: "David Thompson",
      role: "College Sophomore",
      rating: 5,
      review: "The offline functionality is a game-changer. I can study anywhere without worrying about internet connection. Plus, the app is lightning-fast and never crashes.",
      image: "DT",
      bg: "bg-amber-600",
    },
    {
      name: "Lisa Wang",
      role: "Medical Student",
      rating: 5,
      review: "The detailed analytics help me understand my learning patterns. I can see which topics I'm strong in and where I need improvement. This data-driven approach changed my study strategy.",
      image: "LW",
      bg: "bg-violet-600",
    },
    {
      name: "Ahmed Hassan",
      role: "Engineering Student",
      rating: 5,
      review: "Qubli AI's ability to generate quizzes on complex technical topics is exceptional. The questions test real understanding, not just memorization. Best study tool I've found!",
      image: "AH",
      bg: "bg-purple-600",
    },
    {
      name: "Victoria Miller",
      role: "Law School Student",
      rating: 5,
      review: "The customizable difficulty levels mean I can start easy and gradually increase the challenge. Perfect for building confidence and mastering difficult concepts progressively.",
      image: "VM",
      bg: "bg-pink-600",
    },
  ];

  return (
    <PublicPageLayout
      pageTitle="Testimonials"
      description="Join thousands of students who've transformed their learning with Qubli AI. Read their success stories."
      heroTitle="Loved by"
      heroHighlight="Students Worldwide"
      heroSubtitle="Join thousands of students who've transformed their learning with Qubli AI. Read their success stories below."
      showCta={true}
      ctaTitle="Ready to Join Our Community?"
      ctaSubtitle="Start your learning journey with Qubli AI today."
    >
      {/* Testimonials Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollAnimated
                key={index}
                animationClass="animate-fade-in-up"
                delay={(index / 2) * 100}
                margin="-50px"
                className="p-8 bg-surfaceHighlight/80 dark:bg-surfaceHighlight/50 rounded-xl border border-border hover:border-primary/30 dark:hover-bg-blue-800/80 transition-all hover:scale-101 duration-200 hover:shadow-md hover:shadow-primary/10"
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
                  {!testimonial.bg ? (
                    <div className="w-12 h-12">
                      <OptimizedImage
                        className="w-12 h-12 rounded-full"
                        src={testimonial.image}
                        alt={testimonial.name}
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-full text-white ${testimonial.bg} flex items-center justify-center text-xl font-bold uppercase`}>
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <ScrollAnimated
          animationClass="animate-fade-in-up"
          delay={200}
          margin="-50px"
          className="grid min-[500px]:grid-cols-3 text-center gap-4 sm:gap-18 max-w-5xl mx-auto"
        >
          {[
            { number: "10K+", label: "Active Users" },
            { number: "100K+", label: "Quizzes Created" },
            { number: "4.9/5", label: "User Rating" },
          ].map((item, index) => (
            <div
              key={index}
              className="p-6 py-8 rounded-2xl max-w-xs bg-surface/80 glass border border-border hover:shadow-sm-custom hover:scale-102 transition-all duration-300"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-500">
                {item.number}
              </div>
              <div className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-2">
                {item.label}
              </div>
            </div>
          ))}
        </ScrollAnimated>
      </section>
    </PublicPageLayout>
  );
};

export default TestimonialsPage;
