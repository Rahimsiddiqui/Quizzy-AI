import { useState, useRef, useEffect } from "react";

export default function CustomTooltip({ children, content, position = "top" }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const handleMouseEnter = () => setVisible(true);
  const handleMouseLeave = () => setVisible(false);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setVisible(false);
  };

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    const offset = 8;

    switch (position) {
      case "top":
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + offset;
        break;
      default:
        break;
    }

    // Clamp to viewport
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - tooltipRect.width - 8)
    );
    top = Math.max(
      8,
      Math.min(top, window.innerHeight - tooltipRect.height - 8)
    );

    setCoords({ top: Math.round(top), left: Math.round(left) });
  }, [visible, position]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      className="relative"
    >
      {children}

      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-50 px-3 py-2 text-xs font-medium text-white rounded-lg pointer-events-none"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            backgroundColor: "rgba(20, 20, 30, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
            animation: "fadeInSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 bg-black/80 rounded-[1px]"
            style={{
              ...(position === "top" && {
                bottom: "-4px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
              }),
              ...(position === "bottom" && {
                top: "-4px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
              }),
              ...(position === "left" && {
                right: "-4px",
                top: "50%",
                transform: "translateY(-50%) rotate(45deg)",
              }),
              ...(position === "right" && {
                left: "-4px",
                top: "50%",
                transform: "translateY(-50%) rotate(45deg)",
              }),
            }}
          />
          <style>{`
            @keyframes fadeInSlideUp {
              from {
                opacity: 0;
                transform: translateY(4px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
