import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogoClick = () => {
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full border-b border-border z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-bold text-xl text-primary dark:text-blue-400 hover:opacity-80 transition-opacity point"
        >
          <Brain className="w-7 h-7" />
          <span>Quizzy AI</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-3 hover:bg-surfaceHighlight rounded-[5px] transition-all duration-300 point"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 transition-all duration-300" />
          ) : (
            <Menu className="w-6 h-6 transition-all duration-300" />
          )}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/features"
            className={`transition-colors duration-200 ${
              isActive("/features")
                ? "text-primary font-semibold"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            Features
          </a>
          <a
            href="/testimonials"
            className={`transition-colors duration-200 ${
              isActive("/testimonials")
                ? "text-primary font-semibold"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            Testimonials
          </a>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 point"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Mobile sidebar menu - slides from right */}
      <div
        className={`fixed top-16 right-0 h-max bg-surface border-l border-border md:hidden z-50 transition-all duration-300 ease-out transform rounded-lg ${
          mobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        } w-max max-w-xs max-h-[calc(100vh-64px)] overflow-y-auto`}
      >
        <div className="px-6 py-6 space-y-4 flex flex-col">
          <a
            href="/features"
            onClick={() => setMobileMenuOpen(false)}
            className={`pl-2 pr-4 py-3 rounded-[5px] transition-all text-textMain duration-200 border-b border-border ${
              isActive("/features")
                ? "bg-surfaceHighlight text-textMain/80 font-semibold pl-5"
                : "hover:text-textMain hover:bg-surfaceHighlight hover:translate-x-1"
            }`}
          >
            Features
          </a>
          <a
            href="/testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className={`pl-2 pr-4 py-3 rounded-[5px] transition-all text-textMain duration-200 border-b border-border ${
              isActive("/testimonials")
                ? "bg-surfaceHighlight text-textMain/80 font-semibold pl-4"
                : "hover:text-textMain hover:bg-surfaceHighlight hover:translate-x-1"
            }`}
          >
            Testimonials
          </a>
          <button
            onClick={() => {
              navigate("/auth");
              setMobileMenuOpen(false);
            }}
            className="px-6 py-3 rounded-[5px] bg-primary text-white font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 point"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
