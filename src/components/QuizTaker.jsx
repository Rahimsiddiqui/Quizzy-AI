import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import AssignmentIcon from "@mui/icons-material/Assignment";

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
  ChevronRight,
  BookOpen,
  ChevronLeft,
  Lock,
  Loader2,
  ChevronDown,
  FileText,
  File,
  Bot,
} from "lucide-react";
import { toast } from "react-toastify";

import StorageService from "../services/storageService.js";
import {
  generateAndSaveReview,
  gradeAnswer,
} from "../services/geminiService.js";
import { QuestionType } from "../../server/config/types.js";
import PrintView from "./PrintView.jsx";
import AchievementCelebration from "./AchievementCelebration.jsx";
import StudyBuddy from "./StudyBuddy.jsx";

const parseBoldText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

const cleanQuestionText = (text) => {
  if (!text) return text;
  // Remove format markers like (True/False), [True/False], (Multiple Choice), [MCQ], [2], etc.
  return (
    text
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
      // Remove marks in brackets like [2], [3], etc.
      .replace(/\s*\[\d+\]\s*$/g, "")
      .trim()
  );
};

const TrueFalseOptions = ["True", "False"];

const QuizIntroView = ({ quiz, startQuiz }) => (
  <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl text-center">
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary dark:text-blue-400">
      <Layers className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-textMain mb-2">Ready to start?</h2>
    <p className="text-textMuted mb-8 max-w-md mx-auto">
      This quiz contains <strong>{quiz.questions.length}</strong> questions
      covering <strong>{truncateText(quiz.topic, 20)}</strong>. There is no time
      limit, but try to answer as accurately as possible.
    </p>

    <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <HelpCircle className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">{quiz.questions.length}</div>
        <div className="text-xs text-textMuted">Questions</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <BarChart2 className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">{quiz.totalMarks || "-"}</div>
        <div className="text-xs text-textMuted">Marks</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <Clock className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">
          ~{Math.ceil(quiz.questions.length * 0.5)}m
        </div>
        <div className="text-xs text-textMuted">Est. Time</div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row gap-4 justify-center">
      <button
        onClick={startQuiz}
        className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 point"
      >
        <Play className="w-5 h-5 fill-current" /> Start Quiz
      </button>
    </div>
  </div>
);

const QuizResultsView = ({
  quiz,
  quizFlashcards,
  navigate,
  manualCreateFlashcards,
  setActiveTab,
  isCreatingFlashcards,
  onAskAI,
}) => (
  <div className="space-y-6">
    {/* Summary Card */}
    <div className="bg-surface p-6 md:p-8 rounded-2xl border border-border shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-xl font-bold text-textMain mb-1">
          Quiz Completed!
        </h2>
        <p className="text-textMuted">Here is how you performed.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
        <div className="text-center md:text-right">
          <div className="text-4xl font-bold text-primary dark:text-blue-400">
            {quiz.score}%
          </div>
          <p className="text-xs text-textMuted uppercase tracking-wide font-semibold">
            Final Score
          </p>
        </div>
        <div className="hidden sm:block h-12 w-px bg-border"></div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {quizFlashcards?.length === 0 || !quiz?.isFlashcardSet ? (
            <button
              onClick={manualCreateFlashcards}
              disabled={isCreatingFlashcards}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/80 dark:text-indigo-300 dark:hover:bg-indigo-900 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border border-indigo-100 dark:border-indigo-700 point disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingFlashcards ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Flashcards</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" /> Create Flashcards
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("flashcards")}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900 transition-colors point"
            >
              <BookOpen className="w-4 h-4" /> Study Flashcards
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Review Questions List */}
    <div className="space-y-6">
      {quiz.questions.map((q, idx) => (
        <div
          key={q.id}
          className={`p-6 rounded-xl border transition-all shadow-xl ${
            q.isCorrect
              ? "bg-green-100/70 border-green-300 hover:bg-green-100 dark:bg-green-900/70 dark:border-green-700 dark:hover:bg-green-900/80  "
              : "bg-red-100/70 border-red-300 hover:bg-red-100 dark:bg-red-900/70 dark:border-red-700 dark:hover:bg-red-900/80"
          }`}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3">
              <span
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  q.isCorrect
                    ? "bg-green-300 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-300 text-red-800 dark:bg-red-900 dark:text-red-300"
                }
              `}
              >
                {idx + 1}
              </span>
              <h3 className="font-medium text-textMain pt-0.75">
                {cleanQuestionText(q.text)}
              </h3>
            </div>
            <div className="flex items-center justify-center gap-4">
              {(q.marks || q.aiTotalMarks) && (
                <span
                  className={`text-sm font-semibold bg-white/50 dark:bg-surfaceHighlight mt-0.75 px-2 py-1 rounded border border-black/5 min-w-22 text-center`}
                >
                  {q.aiMarks ?? (q.isCorrect ? q.marks : 0)}/
                  {q.aiTotalMarks ?? q.marks}{" "}
                  {(q.aiTotalMarks ?? q.marks) <= 1 ? "mark" : "marks"}
                </span>
              )}
              <button
                onClick={() => onAskAI(q)}
                className="p-1.5 bg-primary/10 text-primary dark:bg-blue-400/10 dark:text-blue-400 rounded-lg hover:bg-primary/20 dark:hover:bg-blue-400/20 transition-colors mt-0.5 point"
                title="Ask AI about this question"
              >
                <Bot className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-sm ml-0 md:ml-11">
            <div className="p-3 rounded-lg border border-border/50 bg-white dark:bg-surfaceHighlight">
              <span className="block text-xs text-textMuted mb-2 uppercase tracking-wide">
                Your Answer
              </span>
              <div
                className={`font-medium max-h-23 overflow-y-auto ${
                  q.isCorrect
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {q.userAnswer || "(No answer)"}
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

          {/* AI Justification - for subjective questions */}
          {q.aiJustification && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 ml-0 md:ml-11 mb-3">
              <span className="block text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide font-semibold">
                AI Examiner Feedback
              </span>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {q.aiJustification}
              </div>
              {q.aiSuggestion && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300 italic">
                  💡 <strong>To improve:</strong> {q.aiSuggestion}
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-black/10 dark:border-white/20 text-sm text-textMuted ml-0 md:ml-11">
            <span className="font-semibold text-textMain">Explanation:</span>{" "}
            {q.explanation}
          </div>
        </div>
      ))}
    </div>

    <button
      onClick={() => navigate("/dashboard")}
      className="w-full py-4 bg-surface hover:bg-surfaceHighlight text-textMain rounded-xl font-bold transition-colors border border-border shadow-sm point"
    >
      Back to Dashboard
    </button>
  </div>
);

const StudyFlashcards = ({
  quizFlashcards,
  quiz,
  manualCreateFlashcards,
  isCreatingFlashcards,
  flashcardsResetKey,
}) => {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Clamp index when flashcards change (avoid out-of-range)
  useEffect(() => {
    if (!quizFlashcards || quizFlashcards.length === 0) {
      setCardIndex(0);
      setFlipped(false);
      return;
    }
    setCardIndex((idx) => Math.min(idx, quizFlashcards.length - 1));
  }, [quizFlashcards?.length]);

  // When a reset key changes (new flashcards created), force index back to 0 and show a tiny placeholder to avoid flashing a stale card
  useEffect(() => {
    if (flashcardsResetKey == null) return;
    if (!quizFlashcards || quizFlashcards.length === 0) return;

    setIsResetting(true);
    setCardIndex(0);
    setFlipped(false);

    const raf = requestAnimationFrame(() => setIsResetting(false));
    return () => cancelAnimationFrame(raf);
  }, [flashcardsResetKey, quizFlashcards?.length]);

  // Keyboard navigation: left/right/space. Ignore when typing in inputs.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
      if (isEditable || !quizFlashcards?.length) return;

      if (e.code === "ArrowRight" || e.key === "ArrowRight") {
        e.preventDefault();
        setCardIndex((prev) => (prev + 1) % quizFlashcards.length);
      } else if (e.code === "ArrowLeft" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCardIndex(
          (prev) => (prev - 1 + quizFlashcards.length) % quizFlashcards.length
        );
      } else if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizFlashcards?.length]);

  // Reset flip on card change
  useEffect(() => {
    setFlipped(false);
  }, [cardIndex]);

  if (isResetting) {
    return (
      <div className="text-center py-12 bg-surface rounded-2xl border border-border">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
        <div className="text-textMuted">Preparing flashcards...</div>
      </div>
    );
  }

  if (quizFlashcards?.length === 0 || !quiz?.isFlashcardSet) {
    return (
      <div className="text-center py-12 bg-surface rounded-2xl border border-border">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-textMain mb-2">
          No Flashcards Created
        </h3>
        <p className="text-[15px] text-textMuted mb-6">
          Flashcards were not generated for this quiz.
        </p>
        <button
          onClick={manualCreateFlashcards}
          disabled={isCreatingFlashcards}
          className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm point disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {isCreatingFlashcards ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Flashcards</span>
            </>
          ) : (
            "Generate Flashcards Now"
          )}
        </button>
      </div>
    );
  }

  const card = quizFlashcards[cardIndex];

  const nextCard = () => {
    if (!quizFlashcards?.length) return;
    setCardIndex((prev) => (prev + 1) % quizFlashcards.length);
  };

  const prevCard = () => {
    if (!quizFlashcards?.length) return;
    setCardIndex(
      (prev) => (prev - 1 + quizFlashcards.length) % quizFlashcards.length
    );
  };

  return (
    <div className="max-w-2xl mx-auto h-[65vh] flex flex-col">
      <div className="flex justify-between items-center mb-4 text-textMuted text-sm">
        <span>
          Card <strong>{cardIndex + 1}</strong> of{" "}
          <strong>{quizFlashcards.length}</strong>
        </span>
        <span className="text-textMuted">Tap card to flip</span>
      </div>

      <div className="flex-1 relative mb-8" style={{ perspective: "1000px" }}>
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-full h-full relative cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            transformOrigin: "center",
            willChange: "transform",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 350ms cubic-bezier(0.645, 0.045, 0.355, 1)",
            minHeight: "300px",
          }}
        >
          {/* Front - Question */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-primary dark:text-blue-400 tracking-widest uppercase">
              Question
            </span>
            <div className="text-xl font-medium text-textMain overflow-y-auto max-h-full custom-scrollbar">
              {parseBoldText(card.front)}
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(0)",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-secondary dark:text-indigo-300 tracking-widest uppercase">
              Answer
            </span>
            <div className="text-lg text-textMain overflow-y-auto max-h-full whitespace-pre-wrap custom-scrollbar">
              {parseBoldText(card.back)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          onClick={prevCard}
          className="flex-1 py-3 rounded-xl bg-surfaceHighlight hover:bg-surface border border-transparent hover:border-border transition-all font-medium text-textMain flex items-center justify-center gap-2 point"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={nextCard}
          className="flex-1 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 point"
        >
          Next Card <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

const QuizTaker = ({ user, onComplete, onLimitUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [status, setStatus] = useState("intro"); // intro, active, completed
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizFlashcards, setQuizFlashcards] = useState([]);
  const [activeTab, setActiveTab] = useState("exam"); // exam, flashcards
  const [isStudyBuddyOpen, setIsStudyBuddyOpen] = useState(false);
  const [customStudyContext, setCustomStudyContext] = useState(null);
  const [initialAIPrompt, setInitialAIPrompt] = useState(null);
  const [isCreatingFlashcards, setIsCreatingFlashcards] = useState(false);
  // Increment this key to force remounting the StudyFlashcards component when new cards are created
  const [flashcardsResetKey, setFlashcardsResetKey] = useState(0);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalFormat, setExportModalFormat] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(true);

  // Achievement celebration state
  const [celebratingAchievement, setCelebratingAchievement] = useState(null);

  const isLast = quiz && currentIdx === quiz.questions.length - 1;

  useEffect(() => {
    if (!user) return;

    // If navigate state contains the saved quiz (from generator), use it directly
    if (
      location?.state?.quiz &&
      String(location.state.quiz._id || location.state.quiz.id) === String(id)
    ) {
      const q = location.state.quiz;
      (async () => {
        try {
          // Check if quiz is disabled
          if (q.isActive === false) {
            toast.error(
              "The quiz you selected is disabled. Please Contact support at rahimsiddiqui122@gmail.com to enable your quiz"
            );
            navigate("/dashboard");
            return;
          }

          const allCards = (await StorageService.getFlashcards(user._id)) || [];
          const qId = q._id || q.id;
          const relevantCards = allCards.filter(
            (c) =>
              String(c.quizId) === String(qId) ||
              String(c.quizId) === String(q._id) ||
              String(c.quizId) === String(q.id)
          );
          const isFlashcardSet = relevantCards.length > 0;
          const updatedQuiz = { ...q, isFlashcardSet };

          setQuiz(updatedQuiz);
          setQuizFlashcards(relevantCards);
          setCurrentIdx(0);

          if (q.score !== undefined) {
            setStatus("completed");
            const prevAnswers = {};
            q.questions.forEach((ques) => {
              const qid = ques.id || ques._id;
              prevAnswers[qid] = ques.userAnswer || "";
            });
            setAnswers(prevAnswers);
          } else {
            // Always show the intro page; the user must click Start Quiz
            setStatus("intro");
          }
          setIsFetching(false);
        } catch {
          // Hydration from nav state failed - fallback to fetch flow
        }
      })();
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let isMounted = true;
    let timeoutId = null;

    async function fetchQuiz() {
      try {
        const response = await StorageService.getQuizzes(user._id);

        // Handle both paginated and non-paginated responses
        const quizzes = response?.quizzes || response || [];

        // Use fallback pattern for quiz ID matching with string comparison
        const q = quizzes.find(
          (qq) => String(qq._id) === String(id) || String(qq.id) === String(id)
        );

        if (!q) {
          // If quiz not found and we haven't retried yet, retry after a short delay
          if (retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(fetchQuiz, 500);
            return;
          }
          if (isMounted) navigate("/dashboard");
          return;
        }

        // Check if quiz is disabled
        if (q.isActive === false) {
          if (isMounted) {
            toast.error(
              "The quiz you selected is disabled. Please Contact support at rahimsiddiqui122@gmail.com to enable your quiz"
            );
            navigate("/dashboard");
          }
          return;
        }

        // Fetch flashcards for this quiz
        const allCards = (await StorageService.getFlashcards(user._id)) || [];
        const qId = q._id || q.id;

        // Match flashcards using fallback pattern
        const relevantCards = allCards.filter(
          (c) =>
            String(c.quizId) === String(qId) ||
            String(c.quizId) === String(q._id) ||
            String(c.quizId) === String(q.id)
        );

        const isFlashcardSet = relevantCards.length > 0;
        const updatedQuiz = { ...q, isFlashcardSet };

        if (isMounted) {
          setQuiz(updatedQuiz);
          setQuizFlashcards(relevantCards);

          if (q.score !== undefined) {
            setStatus("completed");
            const prevAnswers = {};
            q.questions.forEach((ques) => {
              const qid = ques.id || ques._id;
              prevAnswers[qid] = ques.userAnswer || "";
            });
            setAnswers(prevAnswers);
          } else {
            setStatus("intro");
          }
          setIsFetching(false);
        }
      } catch {
        // Failed to fetch quiz - navigate back to dashboard
        if (isMounted) {
          setIsFetching(false);
          navigate("/dashboard");
        }
      }
    }

    fetchQuiz();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, navigate, user, location?.state?.quiz]);

  if (isFetching || !quiz) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress sx={{ color: "#2563eb" }} />
      </div>
    );
  }

  const startQuiz = () => setStatus("active");

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleAnswer = (val) => {
    if (status === "completed" || !quiz) return;
    const qid = quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;
    const currentQId =
      quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;

    setIsSubmitting(true);
    try {
      // Grade each question - use AI for Short Answer and Essay
      // Grade each question - use a sequential loop to avoid hitting AI rate limits
      const gradedQuestions = [];
      for (const q of quiz.questions) {
        const qid = q.id || q._id;
        const userAnswer = answers[qid] || "";

        // Check if this is a subjective question type
        const isSubjective =
          q.type === QuestionType.ShortAnswer ||
          q.type === QuestionType.Essay ||
          q.type === "Short Answer" ||
          q.type === "Essay";

        if (isSubjective && userAnswer.trim()) {
          // AI grading for subjective questions
          try {
            const gradeResult = await gradeAnswer(q, userAnswer, quiz.topic);
            gradedQuestions.push({
              ...q,
              userAnswer,
              isCorrect: gradeResult.marksAwarded >= (q.marks || 1) * 0.5, // 50%+ is considered correct
              aiMarks: gradeResult.marksAwarded,
              aiTotalMarks: gradeResult.totalMarks,
              aiJustification: gradeResult.justification,
              aiSuggestion: gradeResult.suggestion,
            });
          } catch (gradeErr) {
            console.error("AI grading failed for question:", qid, gradeErr);
            // Fallback: mark as needs manual review
            gradedQuestions.push({
              ...q,
              userAnswer,
              isCorrect: false,
              aiMarks: 0,
              aiTotalMarks: q.marks || 1,
              aiJustification:
                "Unable to grade automatically. Please review manually.",
              aiSuggestion: null,
            });
          }
        } else {
          // Simple string comparison for MCQ, True/False, etc.
          const isCorrect =
            userAnswer.toLowerCase().trim() ===
            q.correctAnswer?.toLowerCase().trim();
          gradedQuestions.push({
            ...q,
            userAnswer,
            isCorrect,
            aiMarks: isCorrect ? q.marks || 1 : 0,
            aiTotalMarks: q.marks || 1,
          });
        }
      }

      // Calculate score based on AI-awarded marks
      const totalMarksAwarded = gradedQuestions.reduce(
        (sum, q) => sum + (q.aiMarks || 0),
        0
      );
      const totalMarksAvailable = gradedQuestions.reduce(
        (sum, q) => sum + (q.aiTotalMarks || q.marks || 1),
        0
      );
      const score =
        totalMarksAvailable > 0
          ? Math.round((totalMarksAwarded / totalMarksAvailable) * 100)
          : 0;

      const updatedQuiz = {
        ...quiz,
        score,
        completedAt: Date.now(),
        isFlashcardSet: quiz.isFlashcardSet || false,
        questions: gradedQuestions,
      };

      // Save and use server response if available
      const saved = await StorageService.saveQuiz(updatedQuiz);
      const finalQuiz =
        saved && (saved._id || saved.id)
          ? { ...updatedQuiz, ...saved }
          : updatedQuiz;

      // Award EXP for quiz completion
      try {
        const expResult = await StorageService.awardQuizCompletionExp(
          score,
          finalQuiz.totalMarks || 100
        );
        if (
          expResult &&
          expResult.achievements &&
          expResult.achievements.length > 0
        ) {
          // Show celebration for the first achievement
          setCelebratingAchievement(expResult.achievements[0]);

          // Refresh user data to update EXP and level in real-time
          const updatedUser = await StorageService.getCurrentUser();
          if (updatedUser) {
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(
              new CustomEvent("userUpdated", { detail: updatedUser })
            );
          }

          // Show toasts for additional achievements (if any)
          if (expResult.achievements.length > 1) {
            expResult.achievements.slice(1).forEach((ach) => {
              toast.success(`🎉 Achievement Unlocked: ${ach.name}!`);
            });
          }
        }
      } catch (expErr) {
        console.error("Error awarding EXP:", expErr);
      }

      // Replace the current history state so hydration uses the saved quiz and we avoid refetch races
      navigate(`/quiz/${id}`, { replace: true, state: { quiz: finalQuiz } });
      setQuiz(finalQuiz);
      setCurrentIdx(0);
      setStatus("completed");

      // Generate and save AI review after quiz completion
      try {
        const updatedQuizzes = await StorageService.getQuizzes(user._id);
        await generateAndSaveReview(user, updatedQuizzes);
      } catch (_reviewErr) {
        // Review generation failed but quiz was saved; don't interrupt the user
        console.error("Review generation failed:", _reviewErr);
      }

      if (onComplete) onComplete();
    } catch {
      // Failed to submit quiz - notify user
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    const currentQId =
      quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;
    setCurrentIdx((prev) => Math.min(quiz.questions.length - 1, prev + 1));
  };

  const handleExport = async (format) => {
    // Check PDF export limits for non-Pro users
    if (user.tier !== "Pro" && (user.limits?.pdfExportsRemaining ?? 0) <= 0) {
      toast.error(
        "You have reached your monthly export limit. Upgrade to Pro for unlimited exports."
      );
      return;
    }

    // DOCX export only for Basic and Pro tiers
    if (format === "docx" && user.tier === "Free") {
      toast.error(
        "DOCX export is only available for Basic and Pro tiers. Upgrade to unlock this feature."
      );
      return;
    }

    setShowExportDropdown(false);

    // Show modal for PDF and DOCX to ask about answer sheet
    if ((format === "pdf" || format === "docx") && user.tier !== "Free") {
      setExportModalFormat(format);
      setShowExportModal(true);
      return;
    }

    // For Free and Basic tier PDF export, proceed directly
    if (format === "pdf" && (user.tier === "Free" || user.tier === "Basic")) {
      setIsExporting(true);
      try {
        const success = await StorageService.decrementPdfExport();
        if (!success) {
          toast.error(
            "Failed to decrement PDF export limit. Please try again."
          );
          setIsExporting(false);
          return;
        }
        onLimitUpdate();
        await exportToPdf();
        toast.success("Quiz exported as PDF successfully!");
      } catch {
        toast.error("Failed to export quiz as PDF");
      } finally {
        setIsExporting(false);
      }
    }
  };

  const handleExportConfirm = async () => {
    setShowExportModal(false);
    setIsExporting(true);

    try {
      if (exportModalFormat === "pdf") {
        // Decrement PDF export for non-Pro users
        if (user.tier !== "Pro") {
          const success = await StorageService.decrementPdfExport();
          if (!success) {
            toast.error(
              "Failed to decrement PDF export limit. Please try again."
            );
            setIsExporting(false);
            return;
          }
          onLimitUpdate();
        }
        await exportToPdf();

        if (includeAnswerSheet) {
          await exportAnswerSheetToPdf();
          toast.success("Quiz & Answer sheet exported as PDF successfully!");
        } else {
          toast.success("Quiz exported as PDF successfully!");
        }
      } else if (exportModalFormat === "docx") {
        // DOCX export is only available for Basic and Pro tiers (not Free)
        // Pro users have unlimited exports, Basic users have monthly limits
        if (user.tier === "Basic") {
          const success = await StorageService.decrementPdfExport();
          if (!success) {
            toast.error(
              "You have reached your monthly export limit. Upgrade to Pro for unlimited."
            );
            setIsExporting(false);
            return;
          }
          onLimitUpdate();
        }

        await exportToDocx();

        if (includeAnswerSheet) {
          await exportAnswerSheetToDocx();
          toast.success("Quiz & Answer sheet exported as DOCX successfully!");
        } else {
          toast.success("Quiz exported as DOCX successfully!");
        }
      }
    } catch {
      toast.error("Failed to export quiz");
    } finally {
      setIsExporting(false);
      setExportModalFormat(null);
    }
  };

  const exportToPdf = async () => {
    if (!quiz) return;

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create a container element for PDF content
    const container = document.createElement("div");
    container.style.padding = "40px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.lineHeight = "1.6";
    container.style.color = "#1f2937";
    container.style.backgroundColor = "white";
    container.style.width = "210mm";

    // Header
    const header = document.createElement("div");
    header.style.background =
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
    header.style.color = "white";
    header.style.padding = "30px";
    header.style.borderRadius = "8px";
    header.style.marginBottom = "30px";
    header.style.textAlign = "center";

    const title = document.createElement("h1");
    title.style.fontSize = "32px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "10px";
    title.textContent = quiz.topic;
    header.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.style.fontSize = "14px";
    subtitle.style.margin = "0";
    subtitle.style.color = "rgba(255, 255, 255, 0.9)";
    subtitle.textContent = "Assessment Quiz";
    header.appendChild(subtitle);
    container.appendChild(header);

    // Metadata
    const metaContainer = document.createElement("div");
    metaContainer.style.display = "grid";
    metaContainer.style.gridTemplateColumns = "1fr 1fr";
    metaContainer.style.gap = "20px";
    metaContainer.style.background = "#f8fafc";
    metaContainer.style.padding = "24px";
    metaContainer.style.borderRadius = "8px";
    metaContainer.style.marginBottom = "30px";
    metaContainer.style.borderLeft = "5px solid #2563eb";

    const metaData = [
      { label: "Difficulty", value: quiz.difficulty },
      { label: "Questions", value: quiz.questions.length },
      { label: "Total Marks", value: quiz.totalMarks || "N/A" },
      { label: "Date", value: formattedDate },
    ];

    metaData.forEach((item) => {
      const metaItem = document.createElement("div");
      const label = document.createElement("div");
      label.style.fontSize = "11px";
      label.style.fontWeight = "700";
      label.style.color = "#2563eb";
      label.style.textTransform = "uppercase";
      label.style.letterSpacing = "0.7px";
      label.style.marginBottom = "4px";
      label.textContent = item.label;

      const value = document.createElement("div");
      value.style.fontSize = "18px";
      value.style.fontWeight = "600";
      value.style.color = "#1f2937";
      value.textContent = item.value;

      metaItem.appendChild(label);
      metaItem.appendChild(value);
      metaContainer.appendChild(metaItem);
    });
    container.appendChild(metaContainer);

    // Questions Section
    const questionsTitle = document.createElement("h2");
    questionsTitle.style.fontSize = "20px";
    questionsTitle.style.fontWeight = "700";
    questionsTitle.style.color = "#1f2937";
    questionsTitle.style.margin = "30px 0 20px 0";
    questionsTitle.style.paddingBottom = "10px";
    questionsTitle.style.borderBottom = "2px solid #2563eb";
    questionsTitle.textContent = "Questions";
    container.appendChild(questionsTitle);

    // Questions
    quiz.questions.forEach((q, idx) => {
      const questionBlock = document.createElement("div");
      questionBlock.style.marginBottom = "25px";
      questionBlock.style.padding = "18px";
      questionBlock.style.border = "1px solid #e5e7eb";
      questionBlock.style.borderRadius = "8px";
      questionBlock.style.backgroundColor = "white";
      questionBlock.style.borderLeft = "4px solid #2563eb";
      questionBlock.style.pageBreakInside = "avoid";

      // Question header with number
      const qHeader = document.createElement("div");
      qHeader.style.display = "flex";
      qHeader.style.alignItems = "flex-start";
      qHeader.style.gap = "12px";
      qHeader.style.marginBottom = "14px";

      const qNumber = document.createElement("div");
      qNumber.style.background =
        "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
      qNumber.style.color = "white";
      qNumber.style.width = "36px";
      qNumber.style.height = "36px";
      qNumber.style.borderRadius = "50%";
      qNumber.style.display = "flex";
      qNumber.style.alignItems = "center";
      qNumber.style.justifyContent = "center";
      qNumber.style.fontWeight = "700";
      qNumber.style.fontSize = "15px";
      qNumber.style.flexShrink = "0";
      qNumber.textContent = idx + 1;

      const qText = document.createElement("div");
      qText.style.flex = "1";

      const qTextMain = document.createElement("div");
      qTextMain.style.fontWeight = "600";
      qTextMain.style.color = "#1f2937";
      qTextMain.style.fontSize = "15px";
      qTextMain.style.lineHeight = "1.5";
      qTextMain.textContent = cleanQuestionText(q.text);

      const qMarks = document.createElement("div");
      qMarks.style.background = "#fbbf24";
      qMarks.style.color = "#92400e";
      qMarks.style.padding = "4px 10px";
      qMarks.style.borderRadius = "5px";
      qMarks.style.fontSize = "12px";
      qMarks.style.fontWeight = "700";
      qMarks.style.marginTop = "8px";
      qMarks.style.display = "inline-block";
      qMarks.textContent = `${q.marks || 1} marks`;

      qText.appendChild(qTextMain);
      qText.appendChild(qMarks);
      qHeader.appendChild(qNumber);
      qHeader.appendChild(qText);
      questionBlock.appendChild(qHeader);

      // Options
      const optionsContainer = document.createElement("div");
      optionsContainer.style.marginLeft = "48px";
      optionsContainer.style.marginTop = "12px";

      if (
        q.type === "MCQ" ||
        q.type === "MSQ" ||
        q.type === QuestionType.MCQ ||
        q.type === QuestionType.MSQ
      ) {
        (q.options || []).forEach((option) => {
          const optDiv = document.createElement("div");
          optDiv.style.marginBottom = "10px";
          optDiv.style.padding = "10px 14px";
          optDiv.style.background = "#f9fafb";
          optDiv.style.borderRadius = "6px";
          optDiv.style.borderLeft = "3px solid #3b82f6";
          optDiv.style.color = "#374151";
          optDiv.style.fontSize = "14px";
          optDiv.style.lineHeight = "1.5";
          optDiv.textContent = "◆ " + option;
          optionsContainer.appendChild(optDiv);
        });
      } else if (q.type === "TrueFalse" || q.type === QuestionType.TRUE_FALSE) {
        ["True", "False"].forEach((opt) => {
          const optDiv = document.createElement("div");
          optDiv.style.marginBottom = "10px";
          optDiv.style.padding = "10px 14px";
          optDiv.style.background = "#f9fafb";
          optDiv.style.borderRadius = "6px";
          optDiv.style.borderLeft = "3px solid #3b82f6";
          optDiv.style.color = "#374151";
          optDiv.style.fontSize = "14px";
          optDiv.textContent = "◆ " + opt;
          optionsContainer.appendChild(optDiv);
        });
      } else if (
        q.type === "ShortAnswer" ||
        q.type === QuestionType.SHORT_ANSWER
      ) {
        const lineDiv = document.createElement("div");
        lineDiv.style.borderBottom = "2px dotted #cbd5e1";
        lineDiv.style.height = "28px";
        lineDiv.style.marginTop = "12px";
        optionsContainer.appendChild(lineDiv);
      }

      questionBlock.appendChild(optionsContainer);
      container.appendChild(questionBlock);
    });

    // Footer
    const footer = document.createElement("div");
    footer.style.marginTop = "50px";
    footer.style.paddingTop = "20px";
    footer.style.borderTop = "1px solid #e5e7eb";
    footer.style.textAlign = "center";
    footer.style.color = "#6b7280";
    footer.style.fontSize = "12px";
    const footerText = document.createElement("p");
    footerText.style.margin = "0";
    footerText.textContent = `Generated by Qubli AI • ${formattedDate}`;
    footer.appendChild(footerText);
    container.appendChild(footer);

    // Position container off-screen but visible to DOM
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.zIndex = "-9999";
    container.style.visibility = "hidden";
    document.body.appendChild(container);

    try {
      // Wait for DOM to render the elements
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF from the created DOM
      const opt = {
        margin: 10,
        filename: `${quiz.topic.replace(/\s+/g, "_")}_Quiz.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, allowTaint: true, useCORS: true },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Generate PDF from the created DOM
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(container).save();
    } finally {
      document.body.removeChild(container);
    }
  };

  const exportAnswerSheetToPdf = async () => {
    if (!quiz) return;

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create a container element for PDF content
    const container = document.createElement("div");
    container.style.padding = "40px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.lineHeight = "1.6";
    container.style.color = "#1f2937";
    container.style.backgroundColor = "white";
    container.style.width = "210mm";

    // Header
    const header = document.createElement("div");
    header.style.background =
      "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    header.style.color = "white";
    header.style.padding = "30px";
    header.style.borderRadius = "8px";
    header.style.marginBottom = "30px";
    header.style.textAlign = "center";

    const title = document.createElement("h1");
    title.style.fontSize = "32px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "10px";
    title.textContent = quiz.topic;
    header.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.style.fontSize = "18px";
    subtitle.style.fontWeight = "600";
    subtitle.style.marginBottom = "8px";
    subtitle.textContent = "Answer Sheet";
    header.appendChild(subtitle);

    const date = document.createElement("p");
    date.style.color = "rgba(255, 255, 255, 0.9)";
    date.style.fontSize = "13px";
    date.style.margin = "0";
    date.textContent = formattedDate;
    header.appendChild(date);
    container.appendChild(header);

    // Metadata
    const metaContainer = document.createElement("div");
    metaContainer.style.display = "grid";
    metaContainer.style.gridTemplateColumns = "1fr 1fr";
    metaContainer.style.gap = "20px";
    metaContainer.style.background = "#f0fdf4";
    metaContainer.style.padding = "24px";
    metaContainer.style.borderRadius = "8px";
    metaContainer.style.marginBottom = "30px";
    metaContainer.style.borderLeft = "5px solid #10b981";

    const metaData = [
      { label: "Total Questions", value: quiz.questions.length },
      { label: "Difficulty Level", value: quiz.difficulty || "Standard" },
    ];

    metaData.forEach((item) => {
      const metaItem = document.createElement("div");
      const label = document.createElement("div");
      label.style.fontSize = "11px";
      label.style.fontWeight = "700";
      label.style.color = "#10b981";
      label.style.textTransform = "uppercase";
      label.style.letterSpacing = "0.7px";
      label.style.marginBottom = "4px";
      label.textContent = item.label;

      const value = document.createElement("div");
      value.style.fontSize = "18px";
      value.style.fontWeight = "600";
      value.style.color = "#1f2937";
      value.textContent = item.value;

      metaItem.appendChild(label);
      metaItem.appendChild(value);
      metaContainer.appendChild(metaItem);
    });
    container.appendChild(metaContainer);

    // Answers Section
    const answersTitle = document.createElement("h2");
    answersTitle.style.fontSize = "20px";
    answersTitle.style.fontWeight = "700";
    answersTitle.style.color = "#1f2937";
    answersTitle.style.margin = "30px 0 20px 0";
    answersTitle.style.paddingBottom = "10px";
    answersTitle.style.borderBottom = "2px solid #10b981";
    answersTitle.textContent = "Answer Key";
    container.appendChild(answersTitle);

    // Answers
    quiz.questions.forEach((q, idx) => {
      const answerBlock = document.createElement("div");
      answerBlock.style.marginBottom = "25px";
      answerBlock.style.padding = "15px";
      answerBlock.style.border = "1px solid #d1fae5";
      answerBlock.style.borderRadius = "8px";
      answerBlock.style.background = "#f0fdf4";
      answerBlock.style.pageBreakInside = "avoid";

      // Question header
      const qHeader = document.createElement("div");
      qHeader.style.display = "flex";
      qHeader.style.alignItems = "flex-start";
      qHeader.style.gap = "10px";
      qHeader.style.marginBottom = "12px";

      const qNumber = document.createElement("span");
      qNumber.style.background = "#10b981";
      qNumber.style.color = "white";
      qNumber.style.width = "30px";
      qNumber.style.height = "30px";
      qNumber.style.borderRadius = "50%";
      qNumber.style.display = "flex";
      qNumber.style.alignItems = "center";
      qNumber.style.justifyContent = "center";
      qNumber.style.fontWeight = "700";
      qNumber.style.fontSize = "14px";
      qNumber.style.flexShrink = "0";
      qNumber.textContent = idx + 1;

      const qText = document.createElement("span");
      qText.style.fontWeight = "600";
      qText.style.color = "#1f2937";
      qText.style.fontSize = "15px";
      qText.textContent = cleanQuestionText(q.text);

      qHeader.appendChild(qNumber);
      qHeader.appendChild(qText);
      answerBlock.appendChild(qHeader);

      // Answer section
      const answerSection = document.createElement("div");
      answerSection.style.marginTop = "10px";
      answerSection.style.padding = "12px";
      answerSection.style.background = "white";
      answerSection.style.borderLeft = "3px solid #10b981";
      answerSection.style.borderRadius = "4px";

      const answerLabel = document.createElement("span");
      answerLabel.style.fontWeight = "700";
      answerLabel.style.color = "#047857";
      answerLabel.style.fontSize = "12px";
      answerLabel.style.textTransform = "uppercase";
      answerLabel.style.letterSpacing = "0.5px";
      answerLabel.style.marginBottom = "6px";
      answerLabel.style.display = "block";
      answerLabel.textContent = "✓ Correct Answer";
      answerSection.appendChild(answerLabel);

      const answerText = document.createElement("div");
      answerText.style.color = "#374151";
      answerText.style.fontSize = "14px";
      answerText.style.lineHeight = "1.6";
      answerText.style.marginBottom = "8px";
      answerText.textContent = q.correctAnswer;
      answerSection.appendChild(answerText);

      if (q.explanation) {
        const explanationDiv = document.createElement("div");
        explanationDiv.style.paddingTop = "8px";
        explanationDiv.style.borderTop = "1px solid #d1fae5";
        explanationDiv.style.marginTop = "8px";
        explanationDiv.style.fontStyle = "italic";
        explanationDiv.style.color = "#4b5563";
        explanationDiv.style.fontSize = "13px";
        explanationDiv.style.lineHeight = "1.6";

        const strongExp = document.createElement("strong");
        strongExp.textContent = "Explanation: ";
        explanationDiv.appendChild(strongExp);
        explanationDiv.appendChild(document.createTextNode(q.explanation));
        answerSection.appendChild(explanationDiv);
      }

      answerBlock.appendChild(answerSection);
      container.appendChild(answerBlock);
    });

    // Footer
    const footer = document.createElement("div");
    footer.style.marginTop = "40px";
    footer.style.paddingTop = "20px";
    footer.style.borderTop = "2px solid #e5e7eb";
    footer.style.textAlign = "center";
    footer.style.color = "#6b7280";
    footer.style.fontSize = "12px";
    const footerText = document.createElement("p");
    footerText.style.margin = "0";
    footerText.textContent = `Answer Sheet Generated by Qubli AI • ${formattedDate}`;
    footer.appendChild(footerText);
    container.appendChild(footer);

    // Position container off-screen but visible to DOM
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.zIndex = "-9999";
    container.style.visibility = "hidden";
    document.body.appendChild(container);

    try {
      // Wait for DOM to render the elements
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF from the created DOM
      const opt = {
        margin: 10,
        filename: `${quiz.topic.replace(/\s+/g, "_")}_AnswerSheet.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, allowTaint: true, useCORS: true },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Generate PDF from the created DOM
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(container).save();
    } finally {
      document.body.removeChild(container);
    }
  };

  const exportToDocx = async () => {
    if (!quiz) return;

    // Create simple HTML content optimized for DOCX compatibility
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              line-height: 1.5;
              color: #000;
              background: white;
            }

            .header {
              background-color: #3b82f6;
              color: white;
              margin: 0 0 30px 0;
              text-align: center;
            }

            .header h1 {
              font-size: 48px;
              font-weight: bold;
              margin: 15px 0 10px 0;
            }

            .header p {
              font-size: 18px;
              font-weight: 600;
              margin: 5px 0;
            }

            .quiz-info {
              margin-bottom: 20px;
              width: 100%;
              border-collapse: collapse;
            }

            .quiz-info td {
              width: 25%;
              padding: 10px;
              vertical-align: top;
            }

            .info-card {
              background-color: #f3f4f6;
              text-align: center;
              border-left: 6px solid #3b82f6;
            }

            .info-card strong {
              display: block;
              color: #000;
              font-size: 19px;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .info-card p {
              color: #000;
              font-size: 17px;
              font-weight: bold;
              margin: 0;
            }

            .section-title {
              font-size: 45px;
              font-weight: bold;
              color: #000;
              margin: 40px 0 30px 0;
              border-bottom: 3px solid #3b82f6;
              text-align: center;
              padding-bottom: 15px;
            }

            .question {
              margin-bottom: 30px;
              page-break-inside: avoid;
              display: flex;
            }

            .question-number {
              font-weight: bold;
              font-size: 22px;
              white-space: nowrap;
            }

            .question-text {
              font-size: 21px;
              font-weight: bold;
              color: #000;
              margin-bottom: 17px;
              line-height: 1.5;
              display: block;
            }

            .question-meta {
              display: inline;
              margin-left: 12px;
            }

            .options {
              margin-left: 20px;
              margin-top: 5px;
            }

            .option {
              margin: 4px 0 7px 0;
              background-color: #f9fafb;
              font-size: 17px;
              color: #000;
              padding-left: 12px;
              border-left: 4px solid #3b82f6;
            }

            .true-false-options {
              margin-left: 20px;
              margin-top: 5px;
            }

            .true-false-option {
              margin: 4px 0 7px 0;
              background-color: #f9fafb;
              font-size: 16px;
              color: #000;
              padding-left: 12px;
              border-left: 4px solid #3b82f6;
            }

            .short-answer-space {
              margin-left: 20px;
              margin-top: 5px;
              color: #666;
              font-size: 13px;
            }

            footer {
              margin-top: 50px;
              padding-top: 10px;
              border-top: 3px solid #ccc;
              text-align: center;
            }

            footer p {
              color: #666;
              font-weight: bold;
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <br>
            <br>
            <br>
            <h1>${quiz.topic}</h1>
            <br>
            <p>Quiz Document</p>
            <p>Generated on ${formattedDate}</p>
            <br>
            <br>
            <br>
            <br>
          </div>

          <table class="quiz-info">
            <tr>
              <td><div class="info-card"><i><br><strong>Difficulty Level</strong><p>${
                quiz.difficulty || "Standard"
              }</p><br><i></div></td>
              <td><div class="info-card"><i><br><strong>Total Questions</strong><p>${
                quiz.questions.length
              } Qs</p><br><i></div></td>
              <td><div class="info-card"><i><br><strong>Total Marks</strong><p>${
                quiz.totalMarks || "N/A"
              } Marks</p><br><i></div></td>
              <td><div class="info-card"><i><br><strong>Exam Style</strong><p>${
                quiz.examStyle || "Standard"
              }</p><br><i></div></td>
            </tr>
          </table>

          <div class="questions-container">
            <div class="section-title">Questions</div>
    `;

    quiz.questions.forEach((q, idx) => {
      htmlContent += `
        <div class="question">
          <div class="question-text">
            <span class="question-number">Q${
              idx + 1
            }.</span> ${cleanQuestionText(q.text)}`;

      if (q.marks) {
        htmlContent += ` <span style="margin-right: 16px;">[${q.marks}]</span>`;
      }

      const typeLabel =
        {
          MCQ: "Multiple Choice",
          "Multiple Choice": "Multiple Choice",
          MSQ: "Multiple Select",
          "Multiple Select": "Multiple Select",
          TrueFalse: "True/False",
          "True/False": "True/False",
          ShortAnswer: "Short Answer",
          "Short Answer": "Short Answer",
          Essay: "Essay",
          FillInTheBlank: "Fill in the Blank",
          "Fill in the Blank": "Fill in the Blank",
          LongAnswer: "Long Answer",
          "Long Answer": "Long Answer",
        }[q.type] || q.type;

      htmlContent += ` <span style="margin-right: 16px;">[${typeLabel}]</span>
          </div>`;

      if (
        q.type === QuestionType.MCQ ||
        q.type === QuestionType.MSQ ||
        q.type === "MCQ" ||
        q.type === "MSQ"
      ) {
        htmlContent += `<div class="options">`;
        (q.options || []).forEach((option, optIdx) => {
          htmlContent += `<div class="option">
            <i><span style="font-weight: 600; margin-right: 8px;">
              ${String.fromCharCode(65 + optIdx)}.
            </span>
            ${option}
          </div></i>`;
        });
        htmlContent += `</div>`;
      } else if (q.type === QuestionType.TRUE_FALSE || q.type === "TrueFalse") {
        htmlContent += `<div class="true-false-options">
          <div class="true-false-option">☐ True</div>
          <div class="true-false-option">☐ False</div>
        </div>`;
      } else if (
        q.type === QuestionType.SHORT_ANSWER ||
        q.type === "ShortAnswer"
      ) {
        htmlContent += `<div class="short-answer-space">____________________________</div>`;
      }

      htmlContent += `</div>`;
    });

    htmlContent += `
          </div>

          <footer>
            <p>© Qubli AI | All rights reserved</p>
            <p>This document is confidential</p>
          </footer>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quiz.topic.replace(
      /\s+/g,
      "_"
    )}_Quiz_${formattedDate.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAnswerSheetToDocx = async () => {
    if (!quiz) return;

    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              line-height: 1.5;
              color: #000;
              background: white;
            }

            .header {
              background-color: #10b981;
              color: white;
              margin: 0 0 30px 0;
              text-align: center;
            }

            .header h1 {
              font-size: 48px;
              font-weight: bold;
              margin: 25px 0 15px 0;
            }

            .header .subtitle {
              font-size: 18px;
              font-weight: bold;
              margin: 12px 0;
            }

            .header p {
              font-size: 18px;
              font-weight: 600;
              margin: 10px 0;
            }

            .quiz-info {
              margin-bottom: 20px;
              width: 100%;
              border-collapse: collapse;
            }

            .quiz-info td {
              width: 50%;
              padding: 10px;
              vertical-align: top;
            }

            .info-card {
              background-color: #f0fdf4;
              margin: 8px 0;
              flex: 1;
            }

            .info-card strong {
              display: block;
              color: #000;
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .info-card p {
              color: #000;
              font-size: 15px;
              font-weight: bold;
              margin: 0;
            }

            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #000;
              margin: 20px 0 10px 0;
              border-bottom: 3px solid #10b981;
            }

            .answer-item {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }

            .answer-number {
              color: #10b981;
              font-weight: bold;
              display: inline;
            }

            .question-text {
              font-size: 14px;
              font-weight: bold;
              color: #000;
              margin-bottom: 8px;
              line-height: 1.5;
            }

            .answer-section {
              margin-bottom: 10px;
              margin-left: 20px;
            }

            .answer-label {
              font-size: 12px;
              font-weight: bold;
              color: #10b981;
              margin-bottom: 4px;
            }

            .answer-text {
              font-size: 13px;
              color: #000;
              background-color: #f9fafb;
              margin-bottom: 8px;
              line-height: 1.5;
            }

            .explanation {
              margin-left: 20px;
              font-size: 12px;
              color: #4b5563;
              font-style: italic;
              line-height: 1.5;
              padding-top: 6px;
              border-top: 1px solid #ddd;
            }

            footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 11px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <br>
            <h1>${quiz.topic}</h1>
            <br>
            <div class="subtitle">Answer Sheet</div>
            <p>Generated on ${formattedDate}</p>
            <br>
            <br>
          </div>

          <table class="quiz-info">
            <tr>
              <td><div class="info-card"><br><strong>Total Questions</strong><p>${
                quiz.questions.length
              }</p><br></div></td>
              <td><div class="info-card"><br><strong>Difficulty Level</strong><p>${
                quiz.difficulty || "Standard"
              }</p><br></div></td>
            </tr>
          </table>

          <div class="answers-container">
            <div class="section-title">Answers & Explanations</div>
    `;

    quiz.questions.forEach((q, idx) => {
      htmlContent += `
        <div class="answer-item">
          <div class="answer-header">
            <div class="answer-number">${idx + 1}</div>
            <div style="flex: 1;">
              <div class="question-text">${cleanQuestionText(q.text)}</div>
            </div>
          </div>
          <div class="answer-content">
            <div class="answer-section">
              <div class="answer-label">✓ Correct Answer</div>
              <div class="answer-text">${q.correctAnswer}</div>
            </div>
      `;

      if (q.explanation) {
        htmlContent += `
            <div class="explanation">
              <strong>Explanation:</strong> ${q.explanation}
            </div>
        `;
      }

      htmlContent += `
          </div>
        </div>
      `;
    });

    htmlContent += `
          </div>

          <footer>
            <p>© Qubli AI - Answer Sheet</p>
            <p>All rights reserved. This document is confidential.</p>
          </footer>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quiz.topic.replace(
      /\s+/g,
      "_"
    )}_AnswerSheet_${formattedDate.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const manualCreateFlashcards = async () => {
    if (!quiz || !user) return;
    if (quiz.isFlashcardSet) {
      toast.info("Flashcards already created for this quiz.");
      return;
    }

    // Check quota for users with limited flashcard generations (Free/Basic)
    if (
      user.tier !== "Pro" &&
      (user.limits?.flashcardGenerationsRemaining ?? 0) <= 0
    ) {
      toast.error(
        "You have reached your monthly flashcard generation limit. Upgrade to Pro for unlimited generations."
      );
      return;
    }

    setIsCreatingFlashcards(true);
    try {
      const quizIdKey = quiz._id;
      const cards = quiz.questions.map((q) => {
        const qid = q.id || q._id;
        return {
          id: `fc_${qid}`,
          userId: user._id,
          quizId: quizIdKey,
          front: cleanQuestionText(q.text),
          back: `${q.correctAnswer}\n\n${
            q.explanation || "No explanation provided."
          }`,
          nextReview: Date.now(),
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
        };
      });

      await StorageService.saveFlashcards(cards);

      const updatedQuiz = { ...quiz, isFlashcardSet: true };
      const saved = await StorageService.saveQuiz(updatedQuiz);
      const finalQuiz =
        saved && (saved._id || saved.id)
          ? { ...updatedQuiz, ...saved }
          : updatedQuiz;

      // Decrement user's flashcard generation quota
      const success = await StorageService.decrementFlashcardGeneration();
      if (!success) {
        toast.error(
          "Failed to decrement flashcard quota. Please try again later."
        );
      }

      // Award EXP for flashcard creation
      try {
        const expResult = await StorageService.awardFlashcardCreationExp(
          cards.length
        );

        // If achievements were unlocked, dispatch event to update navbar
        if (
          expResult &&
          expResult.achievements &&
          expResult.achievements.length > 0
        ) {
          // Show celebration for the first achievement
          setCelebratingAchievement(expResult.achievements[0]);

          // Show toasts for additional achievements (if any)
          if (expResult.achievements.length > 1) {
            expResult.achievements.slice(1).forEach((ach) => {
              toast.success(`🎉 Achievement Unlocked: ${ach.name}!`);
            });
          }

          const updatedUser = await StorageService.getCurrentUser();
          if (updatedUser) {
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(
              new CustomEvent("userUpdated", { detail: updatedUser })
            );
          }
        }
      } catch (_expErr) {
        console.error("Error awarding EXP for flashcards:", _expErr);
      }

      setQuiz(finalQuiz);
      setQuizFlashcards(cards);
      // Force StudyFlashcards to remount so it starts on the first card (avoids showing stale index)
      setFlashcardsResetKey((k) => k + 1);
      setActiveTab("flashcards");

      // Let parent know limits changed so UI updates
      if (onLimitUpdate) onLimitUpdate();
    } catch {
      toast.error("Failed to create flashcards. Please try again.");
    } finally {
      setIsCreatingFlashcards(false);
    }
  };

  const currentQ = quiz.questions[currentIdx];
  const currentQId = currentQ?.id || currentQ?._id;
  const hasAnsweredCurrent =
    !!answers[currentQId] && answers[currentQId]?.trim() !== ""; // Added optional chaining

  const fullTitle = quiz.title;

  return (
    <>
      <PrintView quiz={quiz} />
      {celebratingAchievement && (
        <AchievementCelebration
          achievement={celebratingAchievement}
          onClose={() => setCelebratingAchievement(null)}
        />
      )}
      <div className="max-w-2xl mx-auto no-print animate-fade-in-up pb-12">
        {/* Common Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-textMuted hover:text-textMain flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surfaceHighlight point"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1
                className="text-2xl font-bold text-textMain truncate"
                title={fullTitle}
              >
                {fullTitle}
              </h1>
            </div>
            <div className="flex gap-2 mt-1 ml-10 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  quiz.difficulty === "Easy"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : quiz.difficulty === "Medium"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }
`}
              >
                {quiz.difficulty}
              </span>
              <span className="text-xs text-textMuted py-0.5 uppercase tracking-wider truncate max-w-37.5 border border-border px-2 rounded">
                {quiz.examStyle || "Standard"}
              </span>
              {quiz.totalMarks && (
                <span className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-bold">
                  Max Marks: {quiz.totalMarks}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={
                status !== "completed" ||
                (user.tier !== "Pro" &&
                  (user.limits?.pdfExportsRemaining ?? 0) <= 0) ||
                isExporting
              }
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all font-bold shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs point hover:shadow-lg"
              title={
                status !== "completed"
                  ? "Finish quiz to export"
                  : `Export (${user.limits?.pdfExportsRemaining} left)`
              }
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
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold text-textMain disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 point group"
                >
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors">
                    <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div>PDF Document</div>
                    <div className="text-xs text-textMuted font-normal">
                      All tiers
                    </div>
                  </div>
                </button>
                {user.tier !== "Free" && (
                  <button
                    onClick={() => handleExport("docx")}
                    disabled={isExporting}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold text-textMain disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 border-t border-border point group"
                  >
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                      <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div>Word Document</div>
                      <div className="text-xs text-textMuted font-normal">
                        Basic & Pro
                      </div>
                    </div>
                  </button>
                )}
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
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : "text-textMuted hover:text-textMain/85"
            }`}
          >
            <AssignmentIcon sx={{ width: 20, height: 20 }} /> Quiz Mode
          </button>
          <button
            onClick={() => status === "completed" && setActiveTab("flashcards")}
            disabled={status !== "completed"}
            title={
              status !== "completed"
                ? "Complete the quiz to unlock flashcards"
                : ""
            }
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              status === "completed" ? "point" : "cursor-not-allowed"
            } ${
              activeTab === "flashcards"
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : status !== "completed"
                ? "text-gray-500 dark:text-gray-400"
                : "text-textMuted hover:text-textMain/85"
            }`}
          >
            <Layers className="w-4 h-4" /> Flashcards
            {status !== "completed" && <Lock className="w-3 h-3" />}
          </button>
        </div>

        {/* --- CONTENT BASED ON TAB --- */}
        {activeTab === "flashcards" ? (
          <StudyFlashcards
            key={flashcardsResetKey}
            flashcardsResetKey={flashcardsResetKey}
            quizFlashcards={quizFlashcards}
            quiz={quiz}
            manualCreateFlashcards={manualCreateFlashcards}
            isCreatingFlashcards={isCreatingFlashcards}
          />
        ) : (
          <>
            {/* --- INTRO VIEW --- */}
            {status === "intro" && (
              <QuizIntroView quiz={quiz} startQuiz={startQuiz} />
            )}

            {/* --- RESULTS VIEW --- */}
            {status === "completed" && (
              <QuizResultsView
                quiz={quiz}
                quizFlashcards={quizFlashcards}
                navigate={navigate}
                manualCreateFlashcards={manualCreateFlashcards}
                setActiveTab={setActiveTab}
                isCreatingFlashcards={isCreatingFlashcards}
                onAskAI={(question) => {
                  setCustomStudyContext({
                    type: "quiz_review",
                    quizId: quiz._id || quiz.id,
                    topic: quiz.topic,
                    questionText: question.text,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    userAnswer: question.userAnswer,
                  });
                  // Set predefined prompt for auto-submit
                  // Use the stored isCorrect property (set by AI grading for subjective questions)
                  const prompt = question.isCorrect
                    ? `I got this question correct but I'd like to understand it deeper. Can you explain the concept behind: "${question.text}" and why the answer is "${question.correctAnswer}"?`
                    : `I got this wrong. The question was: "${
                        question.text
                      }". I answered "${
                        question.userAnswer || "nothing"
                      }" but the correct answer is "${
                        question.correctAnswer
                      }". Can you explain why my answer was wrong and help me understand the correct answer?`;
                  setInitialAIPrompt(prompt);
                  setIsStudyBuddyOpen(true);
                }}
              />
            )}

            {/* --- QUIZ ACTIVE VIEW --- */}
            {status === "active" && (
              <div className="bg-surface p-6 md:p-10 rounded-2xl border border-border shadow-xl">
                {/* Progress Bar */}
                <div className="w-full bg-surfaceHighlight h-2 rounded-full mb-8">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentIdx + 1) / quiz.questions.length) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="min-h-75 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-primary dark:text-blue-400 tracking-wide uppercase px-2 py-1 bg-primary/5 dark:bg-primary/10 rounded">
                      {currentQ.type}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-textMuted block">
                        Question {currentIdx + 1} of {quiz.questions.length}
                      </span>
                      {currentQ.marks && (
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                          {currentQ.marks} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl md:text-2xl font-medium text-textMain mb-8 leading-relaxed">
                    {cleanQuestionText(currentQ.text)}
                  </h2>

                  <div className="flex-1 space-y-3">
                    {currentQ.type === QuestionType.MCQ ||
                    currentQ.type === QuestionType.TrueFalse ? (
                      <div className="grid grid-cols-1 gap-3">
                        {(currentQ.type === QuestionType.TrueFalse
                          ? TrueFalseOptions
                          : currentQ.options
                        )?.map((opt, i) => (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(opt)}
                            className={`p-4 text-left rounded-xl border transition-all cursor-pointer ${
                              answers[currentQId] === opt
                                ? "bg-primary/10 border-primary dark:border-blue-600 text-primary dark:text-blue-500 shadow-sm ring-1 ring-primary dark:ring-blue-500 font-semibold"
                                : "bg-surface border-border text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                            }`}
                          >
                            <span className="inline-block w-6 font-mono text-gray-400  dark:text-gray-300 mr-2 font-bold">
                              {currentQ.type === QuestionType.MCQ ||
                              currentQ.type === QuestionType.TrueFalse
                                ? String.fromCharCode(65 + i) + "."
                                : ""}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[currentQId] || ""}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full min-h-37.5 p-4 bg-surfaceHighlight border border-border rounded-xl text-textMain resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row justify-between mt-8 pt-6 gap-4 border-t border-border">
                  <button
                    onClick={() =>
                      setCurrentIdx((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentIdx === 0}
                    className="px-6 py-2 text-textMuted hover:text-textMain disabled:opacity-30 disabled:hover:text-textMuted cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!hasAnsweredCurrent || isSubmitting}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Submitting...</span>
                        </>
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
                      className="px-8 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      Next Question <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Export Answer Sheet Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-border/50 animate-fade-in">
              {/* Header */}
              <div className="bg-linear-to-r from-blue-500/20 to-blue-600/20 px-6 py-6 border-b border-border">
                <h3 className="text-lg font-bold text-textMain">
                  Include Answer Sheet?
                </h3>
                <p className="text-sm text-textMuted mt-1">
                  Choose how you want to export your quiz
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Radio Option 1: With Answers */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    includeAnswerSheet
                      ? "border-blue-500 bg-blue-800/40"
                      : "border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="answerSheet"
                    checked={includeAnswerSheet}
                    onChange={() => setIncludeAnswerSheet(true)}
                    className="w-5 h-5 cursor-pointer accent-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textMain">
                      Include Answer Sheet
                    </p>
                    <p className="text-xs text-textMuted mt-0.5">
                      With correct answers and explanations
                    </p>
                  </div>
                </label>

                {/* Radio Option 2: Without Answers */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    !includeAnswerSheet
                      ? "border-blue-500 bg-blue-800/40"
                      : "border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="answerSheet"
                    checked={!includeAnswerSheet}
                    onChange={() => setIncludeAnswerSheet(false)}
                    className="w-5 h-5 cursor-pointer accent-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textMain">
                      Questions Only
                    </p>
                    <p className="text-xs text-textMuted mt-0.5">
                      Perfect for practice and self-testing
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-surfaceHighlight border-t border-border/50 flex gap-3">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportModalFormat(null);
                  }}
                  disabled={isExporting}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-textMain rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExportConfirm()}
                  disabled={isExporting}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 point shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Study Buddy */}
      {status === "completed" && (
        <>
          {!isStudyBuddyOpen && (
            <button
              onClick={() => setIsStudyBuddyOpen(true)}
              className="fixed bottom-15 right-2 sm:bottom-20 md:bottom-4 md:right-4 z-50 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 animate-fade-in-up point"
              title="Open AI Study Buddy"
            >
              <div className="bg-white/20 p-1 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold hidden xs:inline">Ask AI</span>
            </button>
          )}
          <StudyBuddy
            isOpen={isStudyBuddyOpen}
            onClose={() => {
              setIsStudyBuddyOpen(false);
              setCustomStudyContext(null);
              setInitialAIPrompt(null);
            }}
            context={
              customStudyContext || {
                type: status === "completed" ? "quiz_review" : "quiz_active",
                quizId: quiz._id || quiz.id,
                topic: quiz.topic,
                questionText: quiz.questions[currentIdx]?.text,
                correctAnswer: quiz.questions[currentIdx]?.correctAnswer,
                explanation: quiz.questions[currentIdx]?.explanation,
              }
            }
            initialPrompt={initialAIPrompt}
          />
        </>
      )}
    </>
  );
};

export default QuizTaker;
