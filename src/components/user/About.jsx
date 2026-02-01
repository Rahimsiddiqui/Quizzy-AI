import { Link } from "react-router-dom";
import PublicPageLayout from "./PublicPageLayout";

const About = () => {
  const aboutData = {
    intro:
      "Qubli AI helps learners study smarter by turning study material into targeted quizzes and spaced-repetition flashcards. We combine research-backed learning techniques with AI to make studying faster and more effective.",
    sections: [
      {
        id: "mission",
        title: "Our Mission",
        content:
          "We believe everyone can learn more efficiently with the right tools. Our mission is to lower the friction of learning by providing simple, accurate, and trustworthy study aids that adapt to each learner.",
      },
      {
        id: "vision",
        title: "Our Vision",
        content:
          "We envision a future where learning is personalized, engaging, and accessible to everyone. By leveraging AI and educational science, we aim to transform how people approach studying and skill development.",
      },
      {
        id: "values",
        title: "Our Values",
        content: null,
        items: [
          {
            label: "Accuracy",
            description:
              "We prioritize precise, fact-checked content generation.",
          },
          {
            label: "Accessibility",
            description:
              "We make learning tools affordable and easy to use for all.",
          },
          {
            label: "Privacy",
            description:
              "Your data is yours. We never sell or misuse personal information.",
          },
          {
            label: "Innovation",
            description:
              "We continuously improve our AI and learning methodologies.",
          },
        ],
      },
      {
        id: "how-it-works",
        title: "How It Works",
        content:
          "Provide text, upload notes, or describe the topic you want to study. Qubli AI generates quizzes and flashcards, which you can review using our study interface powered by spaced repetition.",
      },
      {
        id: "features",
        title: "Key Features",
        content: null,
        features: [
          "AI-powered quiz and flashcard generation",
          "Spaced repetition scheduling for optimal retention",
          "Export and print-friendly study views",
          "Privacy-first design and user control over data",
          "Multi-format input (text, images, PDFs)",
          "Real-time performance analytics",
        ],
      },
      {
        id: "why-choose",
        title: "Why Choose Qubli AI?",
        content: null,
        reasons: [
          {
            title: "Time-Saving",
            description:
              "Generate quizzes in seconds instead of hours of manual preparation.",
          },
          {
            title: "Research-Backed",
            description:
              "Our spaced repetition algorithm is based on proven cognitive science.",
          },
          {
            title: "Affordable",
            description:
              "Quality learning tools at a fraction of traditional tutoring costs.",
          },
          {
            title: "User-Friendly",
            description:
              "Intuitive interface designed for students and educators alike.",
          },
        ],
      },
    ],
  };

  return (
    <PublicPageLayout
      pageTitle="About Us"
      description="Learn about Qubli AI - the AI-powered study tool that helps learners study smarter with quizzes and flashcards."
      heroTitle="About"
      heroHighlight="Qubli AI"
      heroSubtitle={aboutData.intro}
    >
      {/* About Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface dark:bg-surface/90">
        <div className="max-w-4xl mx-auto space-y-12">
          {aboutData.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-3xl font-bold text-textMain dark:text-textMain/95 mb-4">
                {section.title}
              </h2>

              {section.content && (
                <p className="text-textMuted mb-6">{section.content}</p>
              )}

              {section.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-8 bg-background dark:bg-background/50 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 hover:scale-102"
                    >
                      <h3 className="text-lg font-bold text-textMain dark:text-textMain/95 mb-3">
                        {item.label}
                      </h3>
                      <p className="text-textMuted">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.features && (
                <ul className="list-disc pl-6 text-textMuted space-y-2">
                  {section.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              )}

              {section.reasons && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {section.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-8 bg-background dark:bg-background/50 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 hover:scale-102"
                    >
                      <h3 className="text-lg font-bold text-textMain dark:text-textMain/95 mb-3">
                        {reason.title}
                      </h3>
                      <p className="text-textMuted">{reason.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Contact CTA */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-textMuted">
              Want to get in touch? We'd love to hear from you. Visit our{" "}
              <Link
                to="/contact"
                className="text-primary dark:text-blue-500 hover:underline font-semibold"
              >
                contact page
              </Link>{" "}
              to reach out with questions, feedback, or partnership inquiries.
            </p>
          </div>

          <p className="text-textMuted text-sm border-t border-border pt-6">
            Last updated: Dec 25, 2025
          </p>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default About;
