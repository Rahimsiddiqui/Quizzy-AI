import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = ({ auth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full border-b border-border z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 font-bold text-[1.4rem] text-primary dark:text-blue-500 hover:opacity-90 transition-opacity point"
        >
          <img
            src="/icons/favicon-main.avif"
            className="w-11 h-11"
            alt="Brand Icon"
            loading="lazy"
            decoding="async"
          />
          <span>Qubli AI</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-3 hover:bg-surfaceHighlight rounded-[5px] transition-all duration-300 point"
          aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 transition-all duration-300" />
          ) : (
            <Menu className="w-6 h-6 transition-all duration-300" />
          )}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/features"
            className={`transition-colors duration-200 ${
              isActive("/features")
                ? "text-primary dark:text-blue-500 font-semibold"
                : "text-textMuted hover:text-textMain dark:hover:text-textMain/95"
            }`}
          >
            Features
          </Link>
          <Link
            to="/blogs"
            className={`transition-colors duration-200 ${
              isActive("/blogs")
                ? "text-primary dark:text-blue-500 font-semibold"
                : "text-textMuted hover:text-textMain dark:hover:text-textMain/95"
            }`}
          >
            Blogs
          </Link>
          <Link
            to="/testimonials"
            className={`transition-colors duration-200 ${
              isActive("/testimonials")
                ? "text-primary dark:text-blue-500 font-semibold"
                : "text-textMuted hover:text-textMain dark:hover:text-textMain/95"
            }`}
          >
            Testimonials
          </Link>

          {auth?.isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-7.5 py-2 rounded-lg bg-primary text-white hover:text-white/95 font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-700/90 hover:shadow-sm shadow-primary/20 point"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 point"
            >
              Get Started
            </button>
          )}
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
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className={`pl-2 pr-4 py-3 rounded-[5px] transition-all text-textMain duration-200 border-b border-border ${
              isActive("/features")
                ? "bg-surfaceHighlight text-textMain/80 font-semibold pl-5"
                : "hover:text-textMain hover:bg-surfaceHighlight hover:translate-x-1"
            }`}
          >
            Features
          </Link>
          <Link
            to="/blogs"
            onClick={() => setMobileMenuOpen(false)}
            className={`pl-2 pr-4 py-3 rounded-[5px] transition-all text-textMain duration-200 border-b border-border ${
              isActive("/blogs")
                ? "bg-surfaceHighlight text-textMain/80 font-semibold pl-5"
                : "hover:text-textMain hover:bg-surfaceHighlight hover:translate-x-1"
            }`}
          >
            Blogs
          </Link>
          <Link
            to="/testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className={`pl-2 pr-4 py-3 rounded-[5px] transition-all text-textMain duration-200 border-b border-border ${
              isActive("/testimonials")
                ? "bg-surfaceHighlight text-textMain/80 font-semibold pl-4"
                : "hover:text-textMain hover:bg-surfaceHighlight hover:translate-x-1"
            }`}
          >
            Testimonials
          </Link>

          {auth?.isAuthenticated ? (
            <button
              onClick={() => {
                navigate("/dashboard");
                setMobileMenuOpen(false);
              }}
              className="px-7.5 py-3 rounded-[5px] bg-primary text-white dark:text-white/95 font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 point"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/auth");
                setMobileMenuOpen(false);
              }}
              className="px-6 py-3 rounded-[5px] bg-primary text-white font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 point"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
