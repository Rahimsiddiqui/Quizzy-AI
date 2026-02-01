import { Link, useLocation } from "react-router-dom";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path
      ? "text-primary dark:text-blue-500 font-semibold"
      : "hover:text-textMain transition-colors";
  };

  return (
    <footer className="bg-surface border-t border-border pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary dark:text-blue-500 mb-4 justify-center md:justify-start">
              <img
                src="/icons/favicon-main.avif"
                className="w-10 h-10"
                alt="Brand Icon"
                loading="lazy"
                decoding="async"
              />
              <span>Qubli AI</span>
            </div>
            <p className="text-textMuted text-sm">
              Making learning smarter with AI-powered quizzes and flashcards.
            </p>
          </div>

          {/* Product */}
          <div>
            <span className="font-bold text-[17px] text-textMain dark:text-textMain/95">
              Product
            </span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/testimonials" className={isActive("/testimonials")}>
                  Testimonials
                </Link>
              </li>
              <li>
                <Link to="/features" className={isActive("/features")}>
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className={isActive("/pricing")}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blogs" className={isActive("/blogs")}>
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <span className="font-bold text-[17px] text-textMain dark:text-textMain/95">
              Company
            </span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/about" className={isActive("/about")}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={isActive("/contact")}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className={isActive("/careers")}>
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <span className="font-bold text-[17px] text-textMain dark:text-textMain/95">
              Legal
            </span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/policies" className={isActive("/policies")}>
                  Policies
                </Link>
              </li>
              <li>
                <Link to="/terms" className={isActive("/terms")}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-textMuted text-sm">
              &copy; {new Date().getFullYear()} Qubli AI | All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://x.com/Qubli_AI"
                className="text-textMuted hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Qubli-AI"
                className="text-textMuted hover:text-primary transition-colors"
                aria-label="Github"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/in/qubli-ai"
                className="text-textMuted hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:qubli.ai.app@gmail.com"
                className="text-textMuted hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
