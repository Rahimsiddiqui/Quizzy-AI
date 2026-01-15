import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  BarChart3,
  User,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import { getQuizDetail } from "../../services/adminService";

function AdminQuizDetail() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [closingQuestion, setClosingQuestion] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getQuizDetail(quizId);
        setQuiz(data.quiz);
      } catch (error) {
        console.error("Error fetching quiz:", error);
        toast.error("Failed to load quiz details");
        setTimeout(() => navigate("/admin/quizzes"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownloadQuiz = () => {
    if (!quiz) return;

    const quizData = {
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      totalMarks: quiz.totalMarks,
      examStyle: quiz.examStyle,
      score: quiz.score,
      creator: quiz.creator,
      createdAt: new Date(quiz.createdAt).toLocaleString(),
      questions: quiz.questions,
    };

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," +
        encodeURIComponent(JSON.stringify(quizData, null, 2))
    );
    element.setAttribute("download", `${quiz.title}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Quiz downloaded successfully");
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up w-full pb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="p-2 point hover:bg-surface rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="text-textMain" />
          </button>
          <h1 className="text-4xl font-bold text-textMain tracking-tight">
            Loading...
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="space-y-8 animate-fade-in-up w-full pb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="p-2 hover:bg-surface rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="text-textMain" />
          </button>
          <h1 className="text-4xl font-bold text-textMain tracking-tight">
            Quiz Not Found
          </h1>
        </div>
        <div className="text-center py-20 text-textMuted">
          <p>The quiz you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up w-full pb-10">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="p-2 hover:bg-surface rounded-xl transition-all point"
            title="Back to quizzes"
          >
            <ArrowLeft size={20} className="text-textMain" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-textMain tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-textMuted mt-2">
              Complete quiz details and analytics
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadQuiz}
          className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-blue-700 dark:hover:bg-blue-700/80 hover:bg-blue-700 text-white rounded-xl point font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          <Download size={18} />
          Download
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quiz Info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Quiz Overview Card */}
          <div className="bg-surface border shadow-md-custom border-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-textMuted uppercase tracking-[0.15em] mb-6">
              Quiz Overview
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-textMuted font-semibold uppercase">
                  Title
                </label>
                <p className="text-textMain dark:text-textMain/90 font-medium mt-2 wrap-break-word">
                  {quiz.title}
                </p>
              </div>

              {/* Topic */}
              <div>
                <label className="text-xs text-textMuted font-semibold uppercase flex items-center gap-2">
                  <Layers
                    size={14}
                    className="text-primary dark:text-blue-500"
                  />
                  Topic
                </label>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surfaceHighlight border border-border">
                  <span className="text-sm font-medium text-textMain dark:text-textMain/90">
                    {quiz.topic}
                  </span>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs text-textMuted font-semibold uppercase">
                  Difficulty
                </label>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                      quiz.difficulty === "Easy"
                        ? "bg-emerald-200/70 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-500"
                        : quiz.difficulty === "Medium"
                        ? "bg-amber-200/70 text-amber-600 dark:bg-amber-800/30"
                        : "bg-red-200 text-red-600 dark:bg-red-800/30 dark:text-red-500"
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
              </div>

              {/* Creator */}
              <div className="my-5">
                <label className="text-xs text-textMuted font-semibold uppercase flex items-center gap-2">
                  <User size={14} className="text-primary dark:text-blue-500" />
                  Created By
                </label>
                <p className="text-textMain dark:text-textMain/90 font-medium mt-2">
                  {quiz.creator}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-textMuted font-semibold uppercase flex items-center gap-2">
                  <Calendar
                    size={14}
                    className="text-primary dark:text-blue-500"
                  />
                  Created On
                </label>
                <p className="text-textMain dark:text-textMain/90 font-medium mt-2">
                  {new Date(quiz.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-textMuted text-xs mt-1">
                  {new Date(quiz.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Exam Style */}
              {quiz.examStyle && (
                <div>
                  <label className="text-xs text-textMuted font-semibold uppercase">
                    Exam Style
                  </label>
                  <p className="text-textMain dark:text-textMain/90 font-medium mt-2">
                    {quiz.examStyle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-surface shadow-md-custom border border-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-textMuted uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
              <BarChart3
                size={16}
                className="text-primary dark:text-blue-500"
              />
              Performance
            </h2>

            <div className="space-y-4">
              {/* Score */}
              <div>
                <label className="text-xs text-textMuted font-semibold uppercase">
                  Score
                </label>
                <div className="mt-3 relative">
                  <div className="w-full bg-surfaceHighlight border border-border rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-primary to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${quiz.score || 0}%` }}
                    />
                  </div>
                  <p className="text-textMain dark:text-textMain/80 font-bold mt-2 text-lg">
                    {quiz.score || 0}%
                  </p>
                </div>
              </div>

              {/* Total Marks */}
              {quiz.totalMarks && (
                <div>
                  <label className="text-xs text-textMuted font-semibold uppercase">
                    Total Marks
                  </label>
                  <p className="text-textMain dark:text-textMain/80 font-bold mt-2 text-lg">
                    {quiz.totalMarks}
                  </p>
                </div>
              )}

              {/* Time Spent */}
              {quiz.timeSpentMinutes > 0 && (
                <div>
                  <label className="text-xs text-textMuted font-semibold uppercase flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    Time Spent
                  </label>
                  <p className="text-textMain font-bold mt-2">
                    {quiz.timeSpentMinutes} minutes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Questions */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl shadow-md-custom overflow-hidden dark:bg-slate-900/40">
            <div className="px-6 py-4 border-b border-border bg-surfaceHighlight/50 dark:bg-slate-800/50">
              <h2 className="text-sm font-bold text-textMuted uppercase tracking-[0.15em]">
                Questions ({quiz.questions?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {!quiz.questions || quiz.questions.length === 0 ? (
                <div className="px-6 py-12 text-center text-textMuted">
                  <HelpCircle size={32} className="mx-auto mb-4 opacity-50" />
                  <p>No questions available for this quiz.</p>
                </div>
              ) : (
                quiz.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      onClick={() => {
                        if (expandedQuestion === qIndex) {
                          setClosingQuestion(qIndex);
                          setTimeout(() => {
                            setExpandedQuestion(null);
                            setClosingQuestion(null);
                          }, 300);
                        } else {
                          setExpandedQuestion(qIndex);
                        }
                      }}
                      className="w-full px-6 py-4 hover:bg-surfaceHighlight/30 transition-colors text-left point"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-blue-800/30 text-primary dark:text-blue-400 text-xs font-bold">
                              {qIndex + 1}
                            </span>
                            <p className="text-textMain dark:text-textMain/80 font-semibold flex-1 wrap-break-word">
                              {question.question ||
                                question.text ||
                                `Question ${qIndex + 1}`}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-textMuted transition-transform duration-300 ${
                            expandedQuestion === qIndex ? "rotate-180" : ""
                          }`}
                        >
                          {expandedQuestion === qIndex ? "−" : "+"}
                        </div>
                      </div>
                    </button>

                    {(expandedQuestion === qIndex ||
                      closingQuestion === qIndex) && (
                      <div
                        className={`px-6 py-4 bg-surfaceHighlight/20 space-y-4 ${
                          closingQuestion === qIndex
                            ? "collapse-animation"
                            : "expand-animation"
                        }`}
                      >
                        {/* Options */}
                        {question.options && question.options.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">
                              Options
                            </h4>
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => {
                                const isCorrect =
                                  option === question.correctAnswer;
                                const isUserAnswer =
                                  option === question.userAnswer;
                                return (
                                  <div
                                    key={oIndex}
                                    className={`p-3 rounded-lg border transition-all ${
                                      isCorrect
                                        ? "bg-emerald-100/50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700"
                                        : isUserAnswer
                                        ? "bg-red-100/50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                                        : "bg-surface border-border dark:bg-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isCorrect && (
                                        <CheckCircle2
                                          size={16}
                                          className="text-emerald-600 dark:text-emerald-400 shrink-0"
                                        />
                                      )}
                                      {isUserAnswer && !isCorrect && (
                                        <XCircle
                                          size={16}
                                          className="text-red-600 dark:text-red-400 shrink-0"
                                        />
                                      )}
                                      <span className="text-sm text-textMain wrap-break-word">
                                        {option}
                                      </span>
                                      {isCorrect && (
                                        <span className="ml-auto text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                          Correct
                                        </span>
                                      )}
                                      {isUserAnswer && !isCorrect && (
                                        <span className="ml-auto text-xs font-semibold text-red-700 dark:text-red-300">
                                          User's Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Correct Answer */}
                        {question.correctAnswer && (
                          <div>
                            <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                              Correct Answer
                            </h4>
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100/50 border border-emerald-300 rounded-lg dark:bg-emerald-900/20 dark:border-emerald-700">
                              <CheckCircle2
                                size={16}
                                className="text-emerald-600 dark:text-emerald-400 shrink-0"
                              />
                              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200 wrap-break-word">
                                {question.correctAnswer}
                              </p>
                              <button
                                onClick={() =>
                                  handleCopyText(question.correctAnswer)
                                }
                                className="ml-auto p-2 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/70 rounded transition-all point"
                                title="Copy to clipboard"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div>
                            <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                              Explanation
                            </h4>
                            <p className="text-sm text-textMain bg-surfaceHighlight/50 border border-border rounded-lg p-3 wrap-break-word dark:bg-slate-800/50">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminQuizDetail;
