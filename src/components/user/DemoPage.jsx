import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Sparkles, Loader2, Zap } from "lucide-react";
import DemoQuizTaker from "./DemoQuizTaker";
import { generateDemoQuiz } from "../../services/geminiService";

const DemoPage = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percentage: 0 });

  useEffect(() => {
    // Check for demo usage limit
    const hasUsedDemo = localStorage.getItem("qubli_demo_used");
    if (hasUsedDemo) {
      setLimitReached(true);
    }
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error("Please enter a topic");

    setLoading(true);
    setProgress({ stage: "Initializing...", percentage: 5 });

    try {
      const generatedQuiz = await generateDemoQuiz(topic, (pct, stage) => {
        setProgress({ percentage: pct, stage });
      });

      setQuiz(generatedQuiz);
      localStorage.setItem("qubli_demo_used", "true");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to generate demo quiz");
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = () => {
    // In a real scenario, this wouldn't reset the limit, just the view.
    // Since limit is set, they'll see the limit screen if they refresh,
    // but the 'Try Another' button in QuizTaker calls this.
    // If they already used it, we shouldn't let them generate again properly,
    // but for UX flow let's check limit again.
    const hasUsedDemo = localStorage.getItem("qubli_demo_used");
    if (hasUsedDemo) {
      setLimitReached(true);
      setQuiz(null);
    } else {
      setQuiz(null);
      setTopic("");
    }
  };

  if (limitReached) {
    return (
      <div className="min-h-screen bg-background text-textMain flex items-center justify-center pt-30 pb-20 px-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-2xl border border-border shadow-xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🚀
          </div>
          <h1 className="text-2xl font-bold mb-3">
            You've used your free demo!
          </h1>
          <p className="text-textMuted mb-8">
            We hope you enjoyed Qubli AI. To generate unlimited quizzes, track
            your progress, and access premium features, create a free account
            today.
          </p>
          <div className="space-y-3">
            <Link
              to="/auth"
              className="block w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all"
            >
              Exlpore Full Version (Free)
            </Link>
            <Link
              to="/"
              className="block w-full py-3 text-textMuted font-semibold hover:text-textMain transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textMain dark:text-textMain/95">
      <ToastContainer position="top-center" theme="colored" />

      <main className="pt-38 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
              <div className="relative w-20 h-20 mb-8">
                <Loader2 className="w-full h-full text-primary dark:text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary dark:text-blue-500">
                    {progress.percentage}%
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Generating your quiz...
              </h2>
              <p className="text-textMuted">{progress.stage}</p>
            </div>
          ) : quiz ? (
            <DemoQuizTaker quiz={quiz} onReset={resetDemo} />
          ) : (
            <div className="max-w-xl mx-auto animate-fade-in-up">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 md:mb-5 bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Try Qubli AI Instantly
                </h1>
                <p className="text-textMuted text-lg">
                  Generate a quick 5-question quiz on any topic. No login
                  required.
                </p>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-lg-custom">
                <form onSubmit={handleGenerate}>
                  <label className="block text-textMain dark:text-textMain/95 text-sm font-bold mb-3 ml-1">
                    What do you want to learn?
                  </label>
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Photosynthesis, World War II, Calculus..."
                      className="w-full bg-surfaceHighlight border border-border rounded-xl p-4 pl-12 text-lg outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                      autoFocus
                    />
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary dark:text-blue-500" />
                  </div>

                  <button
                    type="submit"
                    disabled={!topic.trim()}
                    className="w-full py-4 bg-primary hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white dark:text-white/95 font-bold rounded-xl text-lg hover:shadow-sm cursor-pointer hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" /> Generate Free Quiz
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-center text-textMuted">
                    This demo is limited to 1 generation.{" "}
                    <Link
                      to="/auth"
                      className="text-primary dark:text-blue-500 font-semibold hover:underline"
                    >
                      Sign up for free
                    </Link>{" "}
                    to get unlimited access.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DemoPage;
