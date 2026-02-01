import { Link } from "react-router-dom";
import PublicPageLayout from "./PublicPageLayout";

const Policies = () => {
  const policiesData = [
    {
      id: "refund",
      title: "Refund Policy",
      sections: [
        {
          heading: "30-Day Money-Back Guarantee",
          content:
            "We offer a 30-day money-back guarantee on all paid subscriptions. If you're not satisfied with Qubli AI within 30 days of purchase, you can request a full refund with no questions asked.",
        },
        {
          heading: "How to Request a Refund",
          content: null,
          list: [
            "Log in to your account and navigate to the subscription page",
            'Click "Request Refund" or contact support at qubli.ai.app@gmail.com',
            "Provide your reason for the refund request",
            "We will process your request within 5 business days",
            "Refunds are issued to the original payment method",
          ],
          listType: "ordered",
        },
        {
          heading: "Refund Eligibility",
          content: null,
          list: [
            "Refund requests must be made within 30 days of purchase",
            "For annual plans, refunds are available within 30 days of the initial purchase date",
            "Refunds are only available for unused or underutilized subscriptions",
            "Abuse of the refund policy may result in account suspension",
          ],
          listType: "unordered",
        },
      ],
    },
    {
      id: "billing",
      title: "Billing & Payments",
      sections: [
        {
          heading: "Subscription Billing",
          content:
            "Paid subscriptions are billed monthly based on your chosen plan. Billing occurs on the same date each month. You will receive a receipt via email after each charge.",
        },
        {
          heading: "Payment Methods",
          content:
            "We accept all major credit cards (Visa, Mastercard, American Express) and digital payment methods. All payments are processed securely using industry-standard encryption.",
        },
        {
          heading: "Failed Payments",
          content:
            "If a payment fails, we will attempt to retry on the next billing cycle. If payment continues to fail, your subscription may be suspended. You can update your payment method in account settings to avoid service interruption.",
        },
        {
          heading: "Cancellation",
          content:
            "You can cancel your subscription at any time from the subscription page or by contacting support. Cancellation takes effect at the end of your billing period. No partial refunds are issued for early cancellation.",
        },
      ],
    },
    {
      id: "usage",
      title: "Usage Policy",
      sections: [
        {
          heading: "Fair Use",
          content:
            "Qubli AI is designed for personal and educational use. Users must not use the service to generate content for commercial resale, mass distribution, or other unauthorized purposes without explicit written consent.",
        },
        {
          heading: "Rate Limits",
          content:
            "Free users are limited to a certain number of quiz and flashcard generations per month. Paid users receive higher limits. Exceeding limits may result in temporary suspension of access.",
        },
        {
          heading: "Prohibited Activities",
          content: null,
          list: [
            "Attempting to reverse-engineer or hack the service",
            "Using automated tools to bypass rate limits or scrape data",
            "Uploading copyrighted content without permission",
            "Generating content that promotes hate, violence, or illegal activity",
            "Sharing accounts or credentials with others",
            "Using the service for any illegal or harmful purpose",
          ],
          listType: "unordered",
        },
        {
          heading: "Violations",
          content:
            "Violations of this policy may result in account suspension or permanent termination without refund. We reserve the right to investigate suspicious activity and take appropriate action.",
        },
      ],
    },
    {
      id: "data",
      title: "Data & Privacy",
      sections: [
        {
          heading: "Data Retention",
          content:
            "We retain your account data and generated content as long as your account is active. Upon account deletion, personal data is removed within 30 days. Generated quizzes and flashcards are permanently deleted.",
        },
        {
          heading: "Content Ownership",
          content:
            "You retain all rights to content you create and upload. By using Qubli AI, you grant us a non-exclusive license to process, store, and display your content as necessary to provide the service. We do not claim ownership of your study materials.",
        },
      ],
    },
    {
      id: "ip",
      title: "Intellectual Property",
      sections: [
        {
          heading: "IP Rights",
          content:
            "Qubli AI, including its software, designs, and trademarks, is the intellectual property of Qubli AI or its licensors. You may not reproduce, modify, or distribute any part of the service without explicit written permission.",
        },
        {
          heading: "Third-Party Content",
          content:
            "Qubli AI may include third-party content and integrations. Use of such content is subject to the applicable third-party terms and licenses.",
        },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Liability",
      sections: [
        {
          heading: "Service Availability",
          content:
            'Qubli AI is provided "as is" and "as available." We aim for 99.9% uptime but do not guarantee uninterrupted service. We are not responsible for outages, data loss, or service interruptions.',
        },
        {
          heading: "Accuracy of Content",
          content:
            "While we strive to provide accurate AI-generated quizzes and flashcards, we do not guarantee the accuracy, completeness, or fitness of generated content for any particular purpose. Users are responsible for reviewing and verifying all generated content.",
        },
        {
          heading: "Limitation of Liability",
          content:
            "To the fullest extent permitted by law, Qubli AI and its owners shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to Policies",
      sections: [
        {
          heading: null,
          content:
            "We may update these policies at any time. Material changes will be communicated to users via email or in-app notification. Continued use of the service after changes constitutes acceptance of the updated policies.",
        },
      ],
    },
    {
      id: "contact",
      title: "Questions?",
      sections: [
        {
          heading: null,
          content:
            "If you have any questions about these policies or need further clarification, please contact us. We're happy to help and aim to respond within 48 business hours.",
          link: { text: "contact us", to: "/contact" },
        },
      ],
    },
  ];

  return (
    <PublicPageLayout
      pageTitle="Policies & Guidelines"
      description="Learn about Qubli AI's refund policy, billing terms, usage guidelines, and data privacy practices."
      heroTitle="Policies &"
      heroHighlight="Guidelines"
      heroSubtitle="At Qubli AI, we strive for transparency and fairness. Learn about our refund process, payment terms, and policies to ensure a smooth experience for all users."
    >
      {/* Policies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto space-y-12">
          {policiesData.map((policy) => (
            <div key={policy.id}>
              <h2 className="text-4xl font-bold text-textMain dark:text-textMain/95 pb-6 md:pb-8 mb-10 md:mb-12 text-center border-border border-b">
                {policy.title}
              </h2>

              {policy.sections.map((section, idx) => (
                <div key={idx} className={section.heading ? "mt-6" : ""}>
                  {section.heading && (
                    <h3 className="text-2xl font-semibold text-textMain dark:text-textMain/95 mb-3">
                      {section.heading}
                    </h3>
                  )}

                  {section.content && (
                    <p className="text-textMuted mb-4">
                      {section.content}
                      {section.link && (
                        <>
                          {" "}
                          <Link
                            to={section.link.to}
                            className="text-primary font-semibold dark:text-blue-500 hover:underline"
                          >
                            {section.link.text}
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  )}

                  {section.list && section.listType === "ordered" && (
                    <ol className="list-decimal pl-6 text-textMuted space-y-2 mb-4">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  )}

                  {section.list && section.listType === "unordered" && (
                    <ul className="list-disc pl-6 text-textMuted space-y-2 mb-4">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}

          <p className="text-textMuted text-sm border-t text-center border-border pt-6 mt-8">
            Last updated: Dec 25, 2025
          </p>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Policies;
