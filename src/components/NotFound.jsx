import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

/**
 * A clean, minimal 404 page that matches the public page boilerplate.
 * Supports dark mode, larger typography, and responsive design.
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col items-center justify-center p-6 transition-colors duration-300 animate-fade-in-up">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full text-center"
      >
        <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-wide uppercase text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 rounded-full mb-8">
          404 Error
        </span>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
          Oops! <br />
          <span className="text-primary dark:text-blue-500 bg-clip-text">
            Page Not Found
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-textMuted mb-12 max-w-2xl mx-auto leading-relaxed">
          The page you are looking for doesn't exist or has been moved. Don't
          worry, even the best explorers get lost sometimes!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-surface border border-border text-textMain rounded-xl hover:bg-background transition-all duration-200 font-bold active:scale-95 hover:scale-102 point shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-primary dark:bg-blue-700 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700/80 transition-all duration-200 font-bold active:scale-95 hover:scale-102 point shadow-lg hover:shadow-primary/30"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      </motion.div>

      {/* Subtle Background Detail */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 dark:from-primary/10 via-transparent to-transparent" />
      </div>
    </div>
  );
};

export default NotFound;
