import PublicPageLayout from "./PublicPageLayout";

const Terms = () => {
  const terms = [
    {
      title: "Service Overview",
      description:
        "Qubli AI is an advanced online platform designed to help users generate, practice, and learn through quizzes using AI technology. The service is intended strictly for educational purposes, allowing users to create quizzes for self-study, classroom exercises, and knowledge reinforcement. While we strive to provide accurate and useful learning tools, the platform should not be considered a replacement for formal education or professional instruction. Users are encouraged to supplement AI-generated content with verified study materials.",
    },
    {
      title: "User Accounts",
      description:
        "To access certain features of Qubli AI, users may need to create an account. Users are fully responsible for maintaining the confidentiality and security of their account credentials, including usernames and passwords. All activity performed under a user's account is the sole responsibility of the account holder. Users should immediately notify Qubli AI of any unauthorized use or security breach associated with their account to minimize potential risks.",
    },
    {
      title: "Acceptable Use",
      description:
        "Users agree to use Qubli AI responsibly and ethically. This includes refraining from misusing the platform, attempting to hack or exploit system vulnerabilities, uploading content that is illegal, harmful, or offensive, or engaging in activities that disrupt the service for others. Any form of spamming, phishing, or malicious activity is strictly prohibited. Violations of acceptable use policies may result in suspension or permanent termination of access to the platform.",
    },
    {
      title: "AI-Generated Content",
      description:
        "Qubli AI generates content using advanced machine learning algorithms. While every effort is made to produce accurate and reliable quizzes, the platform cannot guarantee the correctness or completeness of AI-generated content. Users are responsible for verifying the information and ensuring it is suitable for their intended educational purposes. AI outputs are suggestions and should be reviewed carefully before use in any learning or assessment context.",
    },
    {
      title: "Intellectual Property",
      description:
        "All intellectual property related to Qubli AI, including software, design, logos, branding, and core systems, remains the property of Qubli AI. Users retain ownership of the content they submit, such as quiz questions or study materials, but grant Qubli AI a limited license to use, display, and distribute user-generated content for platform functionality and improvement purposes. Users may not copy, modify, or distribute Qubli AI's proprietary code or branding without explicit permission.",
    },
    {
      title: "Data & Privacy",
      description:
        "Qubli AI may collect usage data, including activity logs, quiz creation patterns, and interaction metrics, to improve platform performance and user experience. Personal data is handled according to our privacy standards and is never sold to third parties. Users should review the privacy policy for details on data collection, storage, and use. Protecting user privacy is a core priority, and Qubli AI implements technical and administrative measures to safeguard user information.",
    },
    {
      title: "Availability",
      description:
        "While Qubli AI strives to maintain consistent and reliable service, we cannot guarantee uninterrupted access. The platform may experience temporary outages, maintenance periods, or feature changes without prior notice. Users should plan their usage accordingly and understand that service interruptions may occur. Qubli AI is not liable for any inconvenience or losses resulting from service unavailability.",
    },
    {
      title: "Educational Disclaimer",
      description:
        "Qubli AI is intended as a supplementary study tool and is not a substitute for teachers, formal coursework, exams, or professional educational guidance. Users should use the platform to enhance their learning but not rely solely on AI-generated content for critical assessments or decision-making. Qubli AI does not guarantee learning outcomes, and users remain responsible for their own education.",
    },
    {
      title: "Limitation of Liability",
      description:
        "Under no circumstances shall Qubli AI, its affiliates, or its team members be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the platform. This includes data loss, errors in AI-generated content, or impacts on learning outcomes. Users acknowledge that the platform is provided 'as-is' and accept all associated risks.",
    },
    {
      title: "Termination",
      description:
        "Qubli AI reserves the right to suspend or terminate accounts at any time, with or without notice, if users violate these terms or engage in harmful activities. Termination may include deletion of user accounts, content, and access to features. Users are responsible for ensuring that important content is backed up before any potential termination.",
    },
    {
      title: "Updates to Terms",
      description:
        "These Terms of Service may be updated periodically to reflect changes in the platform, legal requirements, or best practices. Users are encouraged to review the terms regularly. Continued use of Qubli AI after updates indicates acceptance of the revised terms. Significant changes may be communicated via the platform or email notifications.",
    },
    {
      title: "Governing Law",
      description:
        "These terms are governed by the applicable laws of the jurisdiction in which Qubli AI operates. Any disputes arising from the use of the platform shall be resolved in accordance with local legal regulations. Users agree to comply with all relevant laws and regulations while accessing and using Qubli AI.",
    },
  ];

  return (
    <PublicPageLayout
      pageTitle="Terms of Service"
      description="Learn how to use Qubli AI safely and responsibly. Review our terms of service, user accounts, acceptable use, and more."
      heroTitle="Terms of"
      heroHighlight="Service"
      heroSubtitle="Learn how to use Qubli AI safely and responsibly. We're here to make your practice easy and effective."
    >
      {/* Terms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto space-y-3">
          {terms.map((term, index) => (
            <div
              key={index}
              className="border-b border-border py-4 pb-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-textMain dark:text-textMain/95">
                {index + 1}. {term.title}
              </h2>
              <p className="text-textMuted mt-2">{term.description}</p>
            </div>
          ))}

          <p className="text-textMuted text-center text-sm mt-8">
            Last updated: Dec 25, 2025
          </p>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Terms;
