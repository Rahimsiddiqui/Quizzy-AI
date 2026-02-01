import { useRef } from "react";
import { useInView } from "framer-motion";
    
const ScrollAnimated = ({ children, animationClass, className = "", delay = 0, margin = "-100px" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin });
  
  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? animationClass : "opacity-0"}`}
      style={isInView && delay ? { animationDelay: `${delay}ms` } : {}}
    >
      {children}
    </div>
  );
};

export default ScrollAnimated;