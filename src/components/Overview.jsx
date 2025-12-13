import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  Clock,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import StorageService from "../services/storageService.js";
import { generateAndSaveReview } from "../services/geminiService.js";

const formatQuizDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const formatUpdateTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  bgColorClass,
  textColorClass,
  diffClass,
}) => (
  <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 ${bgColorClass} ${textColorClass} rounded-xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
        {title}
      </p>
      <p
        className={`${
          diffClass ? "text-xl" : "text-2xl"
        } font-bold text-textMain`}
      >
        {value}
      </p>
    </div>
  </div>
);

const Overview = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [aiReview, setAiReview] = useState("");
  const [loading, setLoading] = useState(false);

  const { completedQuizzes, avgScore } = useMemo(() => {
    const completed = quizzes.filter((q) => q?.score !== undefined);
    const totalScore = completed.reduce((acc, q) => acc + (q?.score ?? 0), 0);
    const average = completed.length
      ? Math.round(totalScore / completed.length)
      : 0;
    return { completedQuizzes: completed, avgScore: average };
  }, [quizzes]);

  useEffect(() => {
    async function loadInitialData() {
      const userQuizzes = await StorageService?.getQuizzes(user?.id);
      setQuizzes(userQuizzes ?? []);

      const storedReview = await StorageService?.getLastReview();
      if (storedReview) {
        setAiReview(storedReview?.text ?? "");
      } else if (
        userQuizzes?.filter((q) => q?.score !== undefined).length > 0
      ) {
        setLoading(true);
        try {
          const reviewText = await generateAndSaveReview(user, userQuizzes);
          setAiReview(reviewText ?? "");
        } catch (e) {
          console.error("Initial AI Review Generation Failed:", e);
          setAiReview("Could not generate initial review at this time.");
        } finally {
          setLoading(false);
        }
      }
    }
    loadInitialData();
  }, [user?.id]);

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const navigate = useNavigate();

  const handleRowClick = (quizId) => {
    if (quizId) navigate(`/quiz/${quizId}`);
  };

  const formatReviewText = (text) => {
    if (typeof text !== "string") text = String(text ?? "");

    return text.split("\n").map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="mb-2">
          {parts.map((part, i) =>
            (part?.startsWith("**") || part?.startsWith("*")) &&
            (part?.endsWith("**") || part?.endsWith("*")) ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-textMain tracking-tight">
          Performance Overview
        </h1>
        <div className="text-sm text-textMuted bg-surface px-4 py-2 rounded-full border border-border shadow-sm flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Last Updated: {formatUpdateTime()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Trophy}
          title="Completed Quizzes"
          value={completedQuizzes.length}
          bgColorClass="bg-blue-100 dark:bg-blue-900"
          textColorClass="text-blue-600 dark:text-blue-300"
          diffClass={false}
        />
        <StatCard
          icon={Target}
          title="Avg Score"
          value={avgScore ? avgScore + "%" : "N/A"}
          bgColorClass="bg-green-100 dark:bg-green-900"
          textColorClass="text-green-600 dark:text-green-300"
          diffClass={false}
        />
        <StatCard
          icon={Calendar}
          title="Joined Since"
          value={formatQuizDate(user?.limits?.lastReset ?? Date.now())}
          bgColorClass="bg-purple-100 dark:bg-purple-900"
          textColorClass="text-purple-600 dark:text-purple-300"
          diffClass={true}
        />
      </div>

      <div className="p-8 rounded-3xl border border-indigo-100 dark:border-indigo-700/80 shadow-lg relative overflow-hidden group bg-linear-to-r from-[#e6e9f3] to-[#eef2ff] dark:bg-linear-to-r dark:from-[#1e293b] dark:to-[#0f172a]">
        <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 shrink-0 dark:shadow-indigo-900">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-textMain mb-3 flex items-center gap-2">
              AI Performance Coach
              {loading && (
                <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400 animate-pulse">
                  Analyzing...
                </span>
              )}
            </h2>
            {loading ? (
              <div
                className="space-y-3 max-w-2xl opacity-50 pt-2"
                aria-live="polite"
                aria-label="Loading AI review"
              >
                <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-11/12 animate-pulse"></div>
                <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : (
              <div className="prose prose-indigo text-gray-700 dark:text-gray-300 text-lg leading-relaxed font-medium whitespace-pre-line">
                {completedQuizzes.length > 0 ? (
                  <>{formatReviewText(aiReview)}</>
                ) : (
                  <p>
                    Complete at least one quiz to unlock your personalized AI
                    assessment!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg text-textMain">
            Recent History ({completedQuizzes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-auto min-w-[600px]">
            <thead className="bg-surfaceHighlight text-textMuted font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 pl-6 w-55">Quiz Title</th>
                <th className="p-5 text-center w-20">Date Taken</th>
                <th className="p-5 text-center w-20">Difficulty</th>
                <th className="p-5 text-center w-20">Score</th>
                <th className="p-5 text-center w-30">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedQuizzes
                .slice()
                .reverse()
                .map((q) => {
                  const obtainedMarks =
                    q?.score !== undefined && q?.totalMarks
                      ? Math.round((q.score / 100) * q.totalMarks)
                      : null;

                  return (
                    <tr
                      key={q?.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                      onClick={() =>
                        (q?._id || q?.id) && handleRowClick(q._id || q.id)
                      }
                    >
                      <td className="p-5 pl-6 font-semibold text-textMain group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                        {truncateText(q?.title ?? "", 40)}
                      </td>
                      <td className="p-5 text-textMuted text-center whitespace-nowrap">
                        {formatQuizDate(q?.createdAt ?? Date.now())}
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            q?.difficulty === "Easy"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                              : q?.difficulty === "Medium"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              q?.difficulty === "Easy"
                                ? "bg-green-500"
                                : q?.difficulty === "Medium"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          {q?.difficulty ?? "Unknown"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`font-extrabold text-base ${
                            (q?.score ?? 0) >= 80
                              ? "text-green-600"
                              : (q?.score ?? 0) >= 50
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {q?.score ?? 0}%
                        </span>
                      </td>
                      <td className="p-5 font-medium">
                        {obtainedMarks !== null ? (
                          <div className="flex items-baseline gap-1 justify-center">
                            <span className="text-textMain font-bold text-lg">
                              {obtainedMarks}
                            </span>
                            <span className="text-textMuted text-xs">
                              / {q?.totalMarks ?? 0}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              {completedQuizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-textMuted">
                    <BarChart3 className="w-6 h-6 mx-auto mb-3" />
                    No history available yet. Start a quiz to see your progress!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
