import React from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";

const Navbar = ({ showBackButton = false }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-bold text-xl text-primary dark:text-blue-400 hover:opacity-80 transition-opacity point"
        >
          <Brain className="w-7 h-7" />
          <span>Quizzy AI</span>
        </button>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-surfaceHighlight rounded-lg transition-colors point"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/features"
            className="text-textMuted hover:text-textMain transition-colors"
          >
            Features
          </a>
          <a
            href="/testimonials"
            className="text-textMuted hover:text-textMain transition-colors"
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-4 space-y-4">
            <a
              href="/features"
              className="block text-textMuted hover:text-textMain transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="/testimonials"
              className="block text-textMuted hover:text-textMain transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <button
              onClick={() => {
                navigate("/auth");
                setMobileMenuOpen(false);
              }}
              className="w-full px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors point"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
