import { useState, useEffect } from "react";

/**
 * Reusable Optimized Image component
 * - Supports lazy loading by default
 * - Handles loading states with skeletons
 * - Error fallback
 */
const OptimizedImage = ({
  src,
  alt,
  className = "",
  skeletonClassName = "h-full w-full",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  if (error || !src) {
    return (
      <div
        className={`bg-surfaceHighlight flex items-center justify-center ${className} ${skeletonClassName}`}
      >
        <span className="text-xs text-textMuted">Image Error</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-full">
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-surfaceHighlight animate-pulse ${skeletonClassName}`}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
