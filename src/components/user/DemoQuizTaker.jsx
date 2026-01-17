import { useState, useEffect } from "react";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Printer,
  Layers,
  Clock,
  HelpCircle,
  BarChart2,
  Play,
  Lock,
  Loader2,
  ChevronDown,
  FileText,
  File,
  Bot,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";

// Helper functions from QuizTaker
const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

const cleanQuestionText = (text) => {
  if (!text) return text;
  return text
    .replace(/\s*\(True\/False\)\s*/gi, "")
    .replace(/\s*\[True\/False\]\s*/gi, "")
    .replace(/\s*\(Multiple\s*Select\)\s*/gi, "")
    .replace(/\s*\[Multiple\s*Select\]\s*/gi, "")
    .replace(/\s*\(MSQ\)\s*/gi, "")
    .replace(/\s*\[MSQ\]\s*/gi, "")
    .replace(/\s*\(Multiple\s*Choice\)\s*/gi, "")
    .replace(/\s*\[Multiple\s*Choice\]\s*/gi, "")
    .replace(/\s*\(MCQ\)\s*/gi, "")
    .replace(/\s*\[MCQ\]\s*/gi, "")
    .replace(/\s*\(Short\s*Answer\)\s*/gi, "")
    .replace(/\s*\[Short\s*Answer\]\s*/gi, "")
    .replace(/\s*\(Long\s*Answer\)\s*/gi, "")
    .replace(/\s*\[Long\s*Answer\]\s*/gi, "")
    .replace(/\s*\(Essay\)\s*/gi, "")
    .replace(/\s*\[Essay\]\s*/gi, "")
    .replace(/\s*\(Fill\s*in\s*the\s*Blank\)\s*/gi, "")
    .replace(/\s*\[Fill\s*in\s*the\s*Blank\]\s*/gi, "")
    .replace(/\s*\(FillInTheBlank\)\s*/gi, "")
    .replace(/\s*\[FillInTheBlank\]\s*/gi, "")
    .replace(/\s*\[\d+\]\s*$/g, "")
    .trim();
};

const TrueFalseOptions = ["True", "False"];

// --- Sub-components ---

const QuizIntroView = ({ quiz, startQuiz }) => (
  <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl text-center animate-fade-in-up">
    <div className="w-20 h-20 bg-primary/10 dark:bg-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary dark:text-blue-500">
      <Layers className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-textMain dark:text-textMain/95 mb-2">
      Ready to start?
    </h2>
    <p className="text-textMuted mb-8 max-w-md mx-auto">
      This demo quiz contains <strong>{quiz.questions.length}</strong> questions
      covering <strong>{truncateText(quiz.topic, 20)}</strong>.
    </p>

    <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <HelpCircle className="w-6 h-6 text-primary dark:text-blue-500 mx-auto mb-2" />
        <div className="font-bold text-textMain dark:text-textMain/95">
          {quiz.questions.length}
        </div>
        <div className="text-xs text-textMuted">Questions</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <BarChart2 className="w-6 h-6 text-primary dark:text-blue-500 mx-auto mb-2" />
        <div className="font-bold text-textMain dark:text-textMain/95">
          {quiz.questions.length * 1}
        </div>
        <div className="text-xs text-textMuted">Marks</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <Clock className="w-6 h-6 text-primary dark:text-blue-500 mx-auto mb-2" />
        <div className="font-bold text-textMain dark:text-textMain/95">
          ~{Math.ceil(quiz.questions.length * 0.5)}m
        </div>
        <div className="text-xs text-textMuted">Est. Time</div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row gap-4 justify-center">
      <button
        onClick={startQuiz}
        className="w-full md:w-auto px-8 py-3 bg-primary dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700/85 text-white font-bold rounded-xl hover:shadow-sm shadow-primary/20 transition-all flex items-center justify-center gap-2 point"
      >
        <Play className="w-5 h-5 fill-current" /> Start Demo Quiz
      </button>
    </div>
  </div>
);

const QuizResultsView = ({ quiz, answers, onReset }) => {
  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q) => {
      const qid = q.id || q._id;
      if (
        answers[qid]?.toLowerCase().trim() ===
        q.correctAnswer?.toLowerCase().trim()
      ) {
        score++;
      }
    });
    return Math.round((score / quiz.questions.length) * 100);
  };

  const percentage = calculateScore();

  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    }
  }, [percentage]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary Card */}
      <div className="bg-surface p-6 md:p-8 rounded-2xl border border-border shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-textMain dark:text-textMain/95 mb-1">
            Demo Completed!
          </h2>
          <p className="text-textMuted">
            Sign up to save your progress and access full analysis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
          <div className="text-center md:text-right">
            <div className="text-4xl font-bold text-primary dark:text-blue-500">
              {percentage}%
            </div>
            <p className="text-xs text-textMuted uppercase tracking-wide font-semibold">
              Final Score
            </p>
          </div>
          <div className="hidden sm:block h-12 w-px bg-border"></div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Link
              to="/auth"
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white dark:text-white/95 rounded-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-700/90 flex items-center justify-center gap-2 text-sm font-bold hover:shadow-sm shadow-indigo-200 dark:shadow-indigo-900 transition-colors point"
            >
              <Lock className="w-4 h-4" /> Unlock Flashcards
            </Link>
          </div>
        </div>
      </div>

      {/* Sign Up Call to Action */}
      <div className="bg-surfaceHighlight border border-primary/20 dark:border-blue-500/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-textMain dark:text-textMain/95 mb-2">
          Want personalized AI feedback?
        </h3>
        <p className="text-sm text-textMuted mb-4">
          Upgrade to a full account to get detailed explanations, weak point
          analysis, and study plans.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="px-6 py-2.5 bg-primary hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Sign Up Free <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-white dark:bg-surface border border-border text-textMain dark:text-textMain/95 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Try Another Topic
          </button>
        </div>
      </div>

      {/* Review Questions List */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => {
          const qid = q.id || q._id;
          const userAnswer = answers[qid];
          const isCorrect =
            userAnswer?.toLowerCase().trim() ===
            q.correctAnswer?.toLowerCase().trim();

          return (
            <div
              key={qid}
              className={`p-6 rounded-xl border transition-all shadow-xl ${
                isCorrect
                  ? "bg-green-100/70 border-green-300 hover:bg-green-100 dark:bg-green-900/70 dark:border-green-700 dark:hover:bg-green-900/80"
                  : "bg-red-100/70 border-red-300 hover:bg-red-100 dark:bg-red-900/70 dark:border-red-700 dark:hover:bg-red-900/80"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCorrect
                        ? "bg-green-300 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-300 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <h3 className="font-medium text-textMain pt-0.75">
                    {cleanQuestionText(q.text || q.question) ||
                      `Question ${idx + 1}`}
                  </h3>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span
                    className={`text-sm font-semibold bg-white/50 dark:bg-surfaceHighlight mt-0.75 px-2 py-1 rounded border border-black/5 min-w-22 text-center`}
                  >
                    {isCorrect ? 1 : 0}/1 mark
                  </span>
                  <Link
                    to="/auth"
                    className="p-1.5 bg-blue-200/60 text-primary dark:bg-blue-800/40 dark:text-blue-500 rounded-lg hover:bg-blue-200/80 dark:hover:bg-blue-800/50 transition-colors mt-0.5 point"
                    title="Sign up to ask AI"
                  >
                    <Bot className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-sm ml-0 md:ml-11">
                <div className="p-3 rounded-lg border border-border/50 bg-white dark:bg-surfaceHighlight">
                  <span className="block text-xs text-textMuted mb-2 uppercase tracking-wide">
                    Your Answer
                  </span>
                  <div
                    className={`font-medium max-h-23 overflow-y-auto ${
                      isCorrect
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {userAnswer || "(No answer)"}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-border/50 dark:bg-surfaceHighlight">
                  <span className="block text-xs text-textMuted mb-2 uppercase tracking-wide">
                    Correct Answer
                  </span>
                  <div className="text-green-700 dark:text-green-400 font-medium max-h-23 overflow-y-auto">
                    {q.correctAnswer}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/20 text-sm text-textMuted ml-0 md:ml-11">
                <span className="font-semibold text-textMain dark:text-textMain/95">
                  Explanation:
                </span>{" "}
                {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DemoQuizTaker = ({ quiz, onReset }) => {
  const [status, setStatus] = useState("intro"); // intro, active, completed
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("exam"); // exam, flashcards
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const navigate = useNavigate();

  const currentQ = quiz.questions[currentIdx];
  const currentQId = currentQ?.id || currentQ?._id;
  const hasAnsweredCurrent = !!answers[currentQId];

  const handleAnswer = (val) => {
    if (status === "completed") return;
    setAnswers((prev) => ({ ...prev, [currentQId]: val }));
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = () => {
    if (!answers[currentQId]) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus("completed");
      setIsSubmitting(false);
    }, 800); // Fake loading delay
  };

  const handleRestrictedFeature = (featureName) => {
    toast.info(`Sign up to ${featureName}!`);
    navigate("/auth");
  };

  // Safe check for question type to handle various formats
  const isTrueFalse =
    currentQ?.type === "TrueFalse" ||
    currentQ?.type === "True/False" ||
    currentQ?.type === "Boolean";

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-fade-in-up">
      {/* Common Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/"
              className="text-textMuted hover:text-textMain dark:hover:text-textMain/95 flex items-center gap-1.5 p-2 rounded-lg hover:bg-surfaceHighlight point"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1
              className="text-2xl font-bold text-textMain dark:text-textMain/95 truncate"
              title={quiz.title}
            >
              {quiz.title}
            </h1>
          </div>
          <div className="flex gap-2 mt-1 ml-10 flex-wrap">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-200/70 text-green-600 dark:bg-green-800/45 dark:text-green-500">
              Easy
            </span>
            <span className="text-xs text-textMuted py-0.5 uppercase tracking-wider truncate max-w-37.5 border border-border px-2 rounded">
              Standard
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700/80 text-white dark:text-white/95 rounded-lg transition-all font-bold shadow-md shrink-0 uppercase tracking-wider min-w-fit text-xs point hover:shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export Quiz</span>
            <span className="sm:hidden">Export</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showExportDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showExportDropdown && (
            <div
              className="absolute top-full right-0 mt-3 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm bg-opacity-95"
              style={{ minWidth: "220px" }}
            >
              <div className="px-3 py-2 bg-linear-to-r from-blue-500/10 to-blue-600/10 border-b border-border">
                <p className="text-xs font-bold text-textMuted uppercase tracking-widest">
                  Download As
                </p>
              </div>
              <button
                onClick={() => handleRestrictedFeature("export PDF")}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold text-textMain flex items-center gap-3 point group"
              >
                <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors">
                  <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <div>PDF Document</div>
                  <div className="text-xs text-textMuted font-normal">
                    Free Preview
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleRestrictedFeature("export Word")}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold text-textMain flex items-center gap-3 border-t border-border point group"
              >
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                  <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div>Word Document</div>
                  <div className="text-xs text-textMuted font-normal">
                    Pro Feature
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex bg-surfaceHighlight p-1 rounded-xl mb-8">
        <button
          onClick={() => setActiveTab("exam")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 point ${
            activeTab === "exam"
              ? "bg-surface text-primary dark:text-blue-500 shadow-sm-custom"
              : "text-textMuted hover:text-textMain/85"
          }`}
        >
          <FileText className="w-5 h-5" /> Quiz Mode
        </button>
        <button
          onClick={() => status === "completed" && setActiveTab("flashcards")}
          disabled={status !== "completed"}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            status === "completed" ? "point" : "cursor-not-allowed"
          } ${
            activeTab === "flashcards"
              ? "bg-surface text-primary dark:text-blue-500 shadow-sm-custom"
              : status !== "completed"
                ? "text-gray-500 dark:text-gray-400"
                : "text-textMuted hover:text-textMain/85"
          }`}
        >
          <Layers className="w-4 h-4" /> Flashcards
          {status !== "completed" && <Lock className="w-3 h-3" />}
        </button>
      </div>

      {activeTab === "flashcards" ? (
        <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-primary/10 dark:bg-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary dark:text-blue-500">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-textMain dark:text-textMain/95 mb-2">
            Unlock Flashcards
          </h2>
          <p className="text-textMuted mb-8 max-w-md mx-auto">
            Sign up to automatically generate flashcards from this quiz and use
            Spaced Repetition validation to master the topic.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700/85 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Sign Up Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {status === "intro" && (
            <QuizIntroView quiz={quiz} startQuiz={() => setStatus("active")} />
          )}

          {status === "completed" && (
            <QuizResultsView quiz={quiz} answers={answers} onReset={onReset} />
          )}

          {status === "active" && (
            <div className="bg-surface p-6 md:p-10 rounded-2xl border border-border shadow-xl animate-fade-in-up">
              {/* Progress Bar */}
              <div className="w-full bg-surfaceHighlight h-2 rounded-full mb-8">
                <div
                  className="bg-primary dark:bg-blue-700 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIdx + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              <div className="min-h-75 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-primary dark:text-blue-500 tracking-wide uppercase px-3 py-1.5 bg-primary/5 dark:bg-blue-800/20 rounded-md">
                    {currentQ.type}
                  </span>
                  <div className="text-right">
                    <span className="text-sm text-textMuted block">
                      Question {currentIdx + 1} of {quiz.questions.length}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                      1 Mark
                    </span>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-medium text-textMain dark:text-textMain/95 mb-8 leading-relaxed">
                  {cleanQuestionText(currentQ.text || currentQ.question)}
                </h2>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {(isTrueFalse ? TrueFalseOptions : currentQ.options)?.map(
                      (opt, i) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(opt)}
                          className={`p-4 text-left rounded-xl border transition-all cursor-pointer ${
                            answers[currentQId] === opt
                              ? "bg-primary/10 border-primary dark:border-blue-600 text-primary dark:text-blue-500 shadow-sm ring-1 ring-primary font-semibold"
                              : "bg-surface border-border text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                          }`}
                        >
                          <span className="inline-block w-6 font-mono text-gray-400 dark:text-gray-300 mr-2 font-bold">
                            {isTrueFalse
                              ? ""
                              : String.fromCharCode(65 + i) + "."}
                          </span>
                          {opt}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row justify-between mt-8 pt-6 gap-4 border-t border-border">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-6 py-2 text-textMuted hover:text-textMain dark:hover:text-textMain/95 disabled:opacity-30 disabled:hover:text-textMuted cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentIdx === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!hasAnsweredCurrent || isSubmitting}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-700/90 text-white dark:text-white/95 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Submit Quiz <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!hasAnsweredCurrent}
                    className="px-8 py-3 bg-primary hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/90 text-white dark:text-white/95 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DemoQuizTaker;
