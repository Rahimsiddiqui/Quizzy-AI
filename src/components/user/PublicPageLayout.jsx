import { useNavigate } from "react-router-dom";
import ScrollAnimated from "./ScrollAnimated";
import SEO from "./SEO";

/**
 * Reusable layout component for public-facing pages.
 * Provides consistent hero section, optional CTA, and full SEO support.
 *
 * @param {object} props
 * @param {string} props.pageTitle - Page name for browser tab (auto-formatted as "Qubli AI | {pageTitle}")
 * @param {string} props.description - Meta description (SEO)
 * @param {string} props.image - Social sharing image URL (optional)
 * @param {Object} props.schema - JSON-LD schema object for structured data (optional)
 * @param {React.ReactNode} props.heroTitle - Main hero title (can include JSX/line breaks)
 * @param {string} props.heroHighlight - Primary-colored highlight text in title
 * @param {string} props.heroSubtitle - Subtitle text below the title
 * @param {boolean} props.showCta - Whether to show the CTA section (default: false)
 * @param {string} props.ctaTitle - CTA section heading
 * @param {string} props.ctaSubtitle - CTA section description
 * @param {string} props.ctaButtonText - CTA button label (default: "Get Started Free")
 * @param {string} props.ctaButtonPath - Navigation path for CTA button (default: "/auth")
 * @param {React.ReactNode} props.children - Page-specific content
 */
const PublicPageLayout = ({
  // SEO
  pageTitle,
  description,
  image,
  schema,

  // Hero Section
  heroTitle,
  heroHighlight,
  heroSubtitle,

  // CTA Section
  showCta = false,
  ctaTitle = "Ready to Experience the Power of AI Learning?",
  ctaSubtitle = "Start using Qubli AI today and transform the way you study.",
  ctaButtonText = "Get Started Free",
  ctaButtonPath = "/auth",

  // Content
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-textMain dark:text-textMain/95 animate-fade-in-up">
      {/* Full SEO with OG tags, Twitter cards, canonical URL, and schema */}
      <SEO
        title={pageTitle}
        description={description}
        image={image}
        schema={schema}
      />

      {/* Hero Section */}
      <section className="pt-40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-17 mb-6">
            {heroTitle} <br />
            <span className="text-primary bg-clip-text">{heroHighlight}</span>
          </h1>
          <p className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Page-specific content */}
      {children}

      {/* Optional CTA Section */}
      {showCta && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-primary/10 to-blue-600/10 border-t border-b border-border">
          <ScrollAnimated
            animationClass="animate-fade-in-up"
            delay={200}
            margin="-50px"
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{ctaTitle}</h2>
            <p className="text-lg text-textMuted mb-8">{ctaSubtitle}</p>
            <button
              onClick={() => navigate(ctaButtonPath)}
              className="px-10 py-3 mx-auto rounded-xl bg-primary dark:bg-blue-700 text-white hover:text-white/95 font-bold text-md xl:text-lg hover:bg-blue-700 transition-all hover:shadow-sm hover:shadow-primary/30 flex items-center justify-center gap-2 point dark:hover:bg-blue-700/90 group"
            >
              {ctaButtonText}{" "}
              <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </button>
          </ScrollAnimated>
        </section>
      )}
    </div>
  );
};

export default PublicPageLayout;
