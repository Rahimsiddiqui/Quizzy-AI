import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, ChevronDown, Star, Zap, Crown } from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

const Pricing = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const pricingData = {
    intro:
      "Choose the perfect plan to unlock your learning potential. From casual learners to serious students, we have a plan for everyone.",
    plans: [
      {
        id: "free",
        name: "Free Starter",
        price: "$0",
        period: "/forever",
        description: "Perfect for exploring and light studying",
        highlighted: false,
        cta: "Get Started",
        ctaPath: "/auth",
        icon: Star,
        iconBg: "bg-gray-100 dark:bg-gray-300",
        iconText: "text-gray-500 dark:text-gray-600",
        checkColor: "text-green-500 dark:text-green-400",
        features: [
          { name: "7 Quizzes / Month", included: true },
          { name: "3 Flashcard Sets / Month", included: true },
          { name: "Max 10 Questions", included: true },
          { name: "Max 30 Marks", included: true },
          { name: "3 PDF Uploads / Month", included: true },
          { name: "3 PDF Exports / Month", included: true },
          { name: "Upload 1 PDF per quiz", included: true },
          { name: "Gemini 2.5 Lite", included: true },
        ],
      },
      {
        id: "basic",
        name: "Scholar Basic",
        price: "$4.99",
        period: "/month",
        description: "For serious learners who want more",
        highlighted: false,
        cta: "Upgrade Now",
        ctaPath: "/auth",
        icon: Zap,
        iconBg: "bg-blue-100 dark:bg-blue-300",
        iconText: "text-blue-600 dark:text-blue-700",
        checkColor: "text-blue-600 dark:text-blue-500",
        features: [
          { name: "35 Quizzes / Month", included: true },
          { name: "17 Flashcard Sets / Month", included: true },
          { name: "Max 25 Questions", included: true },
          { name: "Max 60 Marks", included: true },
          { name: "15 PDF Uploads / Month", included: true },
          { name: "15 PDF Exports / Month", included: true },
          { name: "Upload 1 PDF per quiz", included: true },
          { name: "Gemini 2.5 Flash", included: true },
        ],
      },
      {
        id: "pro",
        name: "Mastermind Pro",
        price: "$11.99",
        period: "/month",
        description: "Maximum power for maximum results",
        highlighted: true,
        cta: "Go Pro",
        ctaPath: "/auth",
        icon: Crown,
        iconBg: "bg-amber-100 dark:bg-amber-200",
        iconText: "text-amber-600 dark:text-amber-700",
        checkColor: "text-amber-500 dark:text-amber-600",
        features: [
          { name: "Unlimited Quizzes", included: true },
          { name: "Unlimited Flashcards", included: true },
          { name: "Max 45 Questions", included: true },
          { name: "Max 100 Marks", included: true },
          { name: "Unlimited PDF Uploads", included: true },
          { name: "Unlimited PDF Exports", included: true },
          { name: "Upload multiple PDF's per quiz", included: true },
          { name: "Gemini 3 Pro", included: true },
        ],
      },
    ],
    comparison: [
      {
        feature: "Monthly Quiz Generations",
        free: "7",
        basic: "35",
        pro: "Unlimited",
      },
      {
        feature: "Monthly Flashcard Sets",
        free: "3",
        basic: "17",
        pro: "Unlimited",
      },
      {
        feature: "PDF Uploads per Month",
        free: "3",
        basic: "15",
        pro: "Unlimited",
      },
      {
        feature: "Question Limit",
        free: "10",
        basic: "25",
        pro: "45",
      },
      {
        feature: "Latest Modal",
        free: "No",
        basic: "No",
        pro: "Yes",
      },
    ],
    faq: [
      {
        q: "Can I change my subscription plan at any time?",
        a: "Yes. You can upgrade or downgrade your plan whenever you want, and changes are applied almost instantly.",
      },
      {
        q: "Do you offer a free trial?",
        a: "Yes. Our Free plan works as a trial with limited features, and you can upgrade at any time to unlock full access.",
      },
      {
        q: "What is your refund policy?",
        a: "All paid subscriptions come with a 30-day money-back guarantee. You can request a refund with no questions asked.",
      },
      {
        q: "Is customer support available?",
        a: "Yes. Our support team is available to help you with any questions or issues you may have.",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pricingData.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <PublicPageLayout
      pageTitle="Pricing Plans"
      description="Choose the perfect plan for your learning. From Free Starter to Pro Mastermind."
      heroTitle="Simple, Transparent"
      heroHighlight="Pricing"
      heroSubtitle={pricingData.intro}
    >
      {/* Schema for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Pricing Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingData.plans.map((plan) => {
              const IconComponent = plan.icon;
              const borderClasses = {
                free: "border-border",
                basic:
                  "border-blue-300 ring-2 ring-blue-100 dark:border-blue-900 dark:ring-blue-800",
                pro: "border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-700",
              };
              const shadowClasses = {
                free: "",
                basic: "shadow-lg shadow-blue-500 dark:shadow-blue-600/40",
                pro: "shadow-lg shadow-amber-300 dark:shadow-amber-600/40",
              };
              return (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-2xl border transition-all hover:scale-102 bg-background dark:bg-background/40 ${
                    borderClasses[plan.id]
                  } ${shadowClasses[plan.id]} ${
                    plan.highlighted ? "md:scale-105 md:hover:scale-105" : ""
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-amber-100 dark:bg-amber-300 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200 shadow-sm">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`mb-4 p-3 w-fit rounded-xl ${plan.iconBg}`}>
                      <IconComponent className={`w-7 h-7 ${plan.iconText}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-textMain mb-3">
                      {plan.name}
                    </h3>
                    <p className="text-textMuted text-sm mb-4.5">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-textMain">
                        {plan.price}
                      </span>
                      <span className="text-textMuted">{plan.period}</span>
                    </div>
                  </div>

                  <Link
                    to={plan.ctaPath}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mb-8 ${
                      plan.highlighted
                        ? "bg-primary dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700/90"
                        : "border border-border text-textMain hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="space-y-3 border-t border-border pt-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 mt-0.5 shrink-0 ${
                            feature.included
                              ? plan.checkColor
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                        <span
                          className={`${
                            feature.included
                              ? "text-textMuted"
                              : "text-gray-500 dark:text-gray-400 line-through"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-textMain mb-6 text-center">
            Plan Comparison
          </h2>
          <p className="text-textMuted text-center mb-12">
            Detailed breakdown of all plan features
          </p>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/70 border-b border-border">
                  <th className="px-6 py-4 text-left font-bold text-textMain dark:text-textMain/95">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain dark:text-textMain/95">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain dark:text-textMain/95">
                    Basic
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain dark:text-textMain/95">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingData.comparison.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border bg-surface/20 dark:bg-surface/30 hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-textMain dark:text-textMain/95">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-textMuted">
                      {row.free}
                    </td>
                    <td className="px-6 py-4 text-center text-textMuted">
                      {row.basic}
                    </td>
                    <td className="px-6 py-4 text-center text-primary dark:text-blue-500 font-semibold">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-textMain dark:text-textMain/95 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <p className="text-textMuted text-center mb-12">
            Common questions about our pricing and plans
          </p>

          <div className="space-y-4">
            {pricingData.faq.map((item, idx) => (
              <div
                key={idx}
                className="border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30 bg-background/60 dark:bg-background/40 dark:hover:border-blue-600"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-surface/50 transition-colors text-left group point"
                >
                  <h3 className="font-semibold text-textMain dark:text-textMain/95 text-sm sm:text-base group-hover:text-primary dark:group-hover:text-blue-500 transition-colors">
                    {item.q}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary dark:text-blue-500 shrink-0 transition-transform duration-300 ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === idx ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 py-4 bg-surface/30 border-t border-border/50">
                    <p className="text-textMuted text-sm sm:text-base leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-textMuted mb-4">
              Still have questions? We're here to help!
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-textMuted text-sm border-t max-w-4xl mx-auto border-border pt-6 mt-8 text-center">
          Last updated: Dec 25, 2025
        </p>
      </section>
    </PublicPageLayout>
  );
};

export default Pricing;
