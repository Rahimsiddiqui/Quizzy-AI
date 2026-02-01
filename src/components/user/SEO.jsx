import { useEffect } from "react";

/**
 * SEO Component for dynamic meta tags and structured data
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.image - Social sharing image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - OG type (website, article)
 * @param {Object} props.schema - JSON-LD schema object
 */
const SEO = ({
  title,
  description,
  image = "/og.png",
  url = window.location.href,
  type = "website",
  schema,
}) => {
  const fullTitle = `Qubli AI | ${title}`;
  const siteUrl = "https://qubli-ai.vercel.app";
  const fullImage = image.startsWith("http") ? image : `${siteUrl}${image}`;

  useEffect(() => {
    // Update Document Title
    document.title = fullTitle;

    // Update Meta Tags
    const updateMetaTag = (name, property, content) => {
      if (!content) return;

      let tag = name
        ? document.querySelector(`meta[name="${name}"]`)
        : document.querySelector(`meta[property="${property}"]`);

      if (!tag) {
        tag = document.createElement("meta");
        if (name) tag.setAttribute("name", name);
        if (property) tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMetaTag("description", null, description);
    updateMetaTag(null, "og:title", fullTitle);
    updateMetaTag(null, "og:description", description);
    updateMetaTag(null, "og:image", fullImage);
    updateMetaTag(null, "og:url", url);
    updateMetaTag(null, "og:type", type);
    updateMetaTag("twitter:title", null, fullTitle);
    updateMetaTag("twitter:description", null, description);
    updateMetaTag("twitter:image", null, fullImage);

    // Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Update Structured Data (JSON-LD)
    let schemaScript = document.getElementById("dynamic-schema");
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = "dynamic-schema";
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.innerHTML = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.innerHTML = "";
    }

    // No cleanup for title as it's better to leave it than revert to generic
  }, [fullTitle, description, fullImage, url, type, schema]);

  return null; // This component doesn't render anything
};

export default SEO;
