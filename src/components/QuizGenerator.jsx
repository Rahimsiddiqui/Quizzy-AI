import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Type,
  Upload,
  FileText,
  GraduationCap,
  Lock,
  Check,
  Layers,
  Eye,
  ChevronDown,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { generateQuiz } from "../services/geminiService.js";
import StorageService from "../services/storageService.js";
import { TIER_LIMITS, EXAM_STYLES } from "../../server/config/constants.js";
import {
  SubscriptionTier,
  Difficulty,
  QuestionType,
} from "../../server/config/types.js";

const QuizGenerator = ({ user, onGenerateSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState("text");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [totalMarks, setTotalMarks] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState([QuestionType.MCQ]);
  const [examStyleId, setExamStyleId] = useState("standard");
  const [files, setFiles] = useState([]);
  const [generateFlashcards, setGenerateFlashcards] = useState(
    user?.tier !== "Free"
  );
  const [isDragging, setIsDragging] = useState(false);
  const [reading, setReading] = useState(false);

  const userMaxQuestions = TIER_LIMITS[user?.tier]?.maxQuestions ?? 10;
  const userMaxMarks = TIER_LIMITS[user?.tier]?.maxMarks ?? 10;

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

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let u = 0;
    let val = bytes;
    while (val >= 1024 && u < units.length - 1) {
      val /= 1024;
      u++;
    }
    return `${Math.round(val * 10) / 10} ${units[u]}`;
  };

  const processSelectedFiles = async (incomingFileList) => {
    if (!incomingFileList || incomingFileList.length === 0) return;
    const incomingArray = Array.from(incomingFileList);
    const isPro = user?.tier === "Pro";
    const currentCount = files.length;
    const incomingCount = incomingArray.length;

    if (!isPro && currentCount + incomingCount > 1) {
      if (currentCount >= 1 || incomingCount > 1) {
        toast.error("Free/Basic plans are limited to 1 PDF per quiz.");
        navigate("/subscription");
        return;
      }
    }

    const validFiles = incomingArray.filter((f) => {
      if (f.type !== "application/pdf") {
        toast.error("Skipped non-PDF files.");
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File ${f.name} too large (Max 10MB).`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    setReading(true);
    try {
      const filePromises = validFiles.map(
        (fileItem) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target.result;
              const base64 = dataUrl.split(",")[1];
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                name: fileItem.name,
                data: base64,
                mime: fileItem.type,
                size: fileItem.size,
                previewUrl: dataUrl,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileItem);
          })
      );
      const newProcessedFiles = await Promise.all(filePromises);
      setFiles((prev) => [...prev, ...newProcessedFiles]);
    } catch {
      toast.error("Failed to read one or more files.");
    } finally {
      setReading(false);
    }
  };

  const handleFileChange = (e) => {
    processSelectedFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles?.length) processSelectedFiles(dtFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handlePreview = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    const win = window.open("");
    if (win) {
      win.document.write(
        `<body style="margin:0; overflow:hidden;"><iframe width="100%" height="100%" src="${url}" frameborder="0"></iframe></body>`
      );
      win.document.title = "PDF Preview";
    }
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.length === 1
          ? prev
          : prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleExamStyleSelect = (styleId, requiredTier) => {
    if (
      (requiredTier === "Basic" && user?.tier === "Free") ||
      (requiredTier === "Pro" && user?.tier !== "Pro")
    ) {
      navigate("/subscription");
      return;
    }
    setExamStyleId(styleId);
  };

  const hasQuota = (limitType) => {
    if (user?.tier === "Pro") return true;
    return (user?.limits?.[limitType] ?? 0) > 0;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (questionCount > userMaxQuestions)
      return toast.error(`Max ${userMaxQuestions} questions allowed.`);
    if (totalMarks > userMaxMarks)
      return toast.error(`Max ${userMaxMarks} marks allowed.`);
    if (!hasQuota("generationsRemaining"))
      return toast.error(`Monthly quiz limit reached.`);
    if (generateFlashcards && !hasQuota("flashcardGenerationsRemaining"))
      return toast.error(`Monthly flashcard limit reached.`);
    if (mode === "pdf" && !hasQuota("pdfUploadsRemaining"))
      return toast.error("Monthly PDF upload limit reached.");
    if (!selectedTypes?.length)
      return toast.error("Select at least one question type");
    if (mode === "pdf" && !files.length)
      return toast.error("Upload at least one PDF file.");
    if (mode === "text" && !topic.trim()) return toast.error("Enter a topic.");

    setLoading(true);
    setProgress(0);

    // Progress callback from backend
    const handleProgress = (percentage, stage, questionsGenerated) => {
      setProgress(percentage);
    };

    try {
      const filesDataPayload =
        mode === "pdf"
          ? files.map((f) => ({ mimeType: f.mime, data: f.data }))
          : undefined;

      const promptTopic =
        mode === "pdf" ? "the attached document content" : topic;

      const quiz = await generateQuiz(
        promptTopic,
        difficulty,
        questionCount,
        selectedTypes,
        totalMarks,
        examStyleId,
        filesDataPayload,
        handleProgress
      );

      quiz.userId = user?.id;
      quiz.isFlashcardSet = generateFlashcards;

      // Save quiz using StorageService so caches are properly invalidated
      const payload = {
        ...quiz,
        isFlashcardSet: generateFlashcards,
        userId: user?._id || user?.id,
      };

      try {
        const savedQuiz = await StorageService.saveQuiz(payload);

        // Validate response contains saved quiz ID
        const quizId = savedQuiz._id || savedQuiz.id;
        if (!quizId) {
          // Server returned an unexpected response when saving the quiz
          throw new Error(
            "Quiz was created but server response was invalid. Please refresh."
          );
        }

        if (generateFlashcards) {
          const cards = quiz.questions.map((q) => ({
            id: `fc_${q._id || q.id}`,
            userId: user?._id || user?.id,
            quizId: savedQuiz._id || savedQuiz.id,
            front: cleanQuestionText(q.text),
            back: `${q.correctAnswer}\n\n${q.explanation}`,
            nextReview: Date.now(),
            interval: 0,
            repetition: 0,
            easeFactor: 2.5,
          }));
          await StorageService.saveFlashcards(cards);
          await StorageService.decrementFlashcardGeneration();

          // Award EXP for flashcard creation
          try {
            const expResult = await StorageService.awardFlashcardCreationExp(
              cards.length
            );

            if (
              expResult &&
              expResult.achievements &&
              expResult.achievements.length > 0
            ) {
              const updatedUser = await StorageService.getCurrentUser();
              if (updatedUser) {
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(
                  new CustomEvent("userUpdated", { detail: updatedUser })
                );
              }
            }
          } catch (expErr) {
            console.error("Error awarding EXP for flashcards:", expErr);
          }
        }

        if (mode === "pdf") await StorageService.decrementPdfUpload();

        // Award EXP for quiz creation
        try {
          const expResult = await StorageService.awardQuizCreationExp(
            quiz.questions.length
          );

          // If achievements were unlocked, dispatch event to update navbar
          if (
            expResult &&
            expResult.achievements &&
            expResult.achievements.length > 0
          ) {
            const updatedUser = await StorageService.getCurrentUser();
            if (updatedUser) {
              localStorage.setItem("user", JSON.stringify(updatedUser));
              window.dispatchEvent(
                new CustomEvent("userUpdated", { detail: updatedUser })
              );
            }
          }
        } catch (expErr) {
          console.error("Error awarding EXP:", expErr);
        }

        // Notify app that a quiz was generated so lists can refresh
        window.dispatchEvent(new Event("quizGenerated"));

        onGenerateSuccess();
        // Navigate and provide the saved quiz in state to avoid an extra fetch
        navigate(`/quiz/${quizId}`, { state: { quiz: savedQuiz } });
      } catch (err) {
        throw err;
      }
    } catch (error) {
      // Quiz generation failed; notify user
      toast.error(error.message || "Failed to generate quiz, try later.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleQuestionCountChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > userMaxQuestions) val = userMaxQuestions;
    setQuestionCount(val);
  };

  const handleTotalMarksChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > userMaxMarks) val = userMaxMarks;
    setTotalMarks(val);
  };

  const getGenerationMessage = (user) => {
    if (user?.role === "admin" || user?.tier === "Pro")
      return "∞ generations left this month";
    if (user?.role !== "admin" && user?.limits?.generationsRemaining === 0)
      return "Come back next month for more generations";
    return `${user?.limits?.generationsRemaining ?? 0} generation${
      user?.limits?.generationsRemaining > 1 ? "s" : ""
    } left this month`;
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <style>
        {`@keyframes gentle-bounce {0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); }}`}
      </style>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-textMain">Create New Quiz</h1>
        <div className="text-sm text-textMuted bg-surfaceHighlight px-3 py-1 rounded-full">
          {getGenerationMessage(user)}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-xl">
        <div className="flex p-1 bg-surfaceHighlight rounded-xl mb-8 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "text"
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Type className="w-4 h-4" /> Manual Topic
          </button>
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "pdf"
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8">
          <div className="space-y-4">
            {mode === "text" ? (
              <div>
                <label className="block text-sm font-bold text-textMain mb-2">
                  Quiz Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quantum Physics, French Revolution, Organic Chemistry"
                  className="w-full p-4 bg-surfaceHighlight border border-border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-textMain mb-2">
                  Upload Study Material (PDF)
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 rounded-xl p-6 transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : files.length > 0
                      ? "border-primary/20 bg-surface"
                      : "border-dashed border-border bg-transparent hover:bg-surfaceHighlight"
                  }`}
                  aria-label="PDF upload area"
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple={user?.tier === "Pro"}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {files.length > 0 ? (
                    <div className="space-y-3 relative z-20 pointer-events-none">
                      {files.map((file, index) => (
                        <div
                          key={file.id || index}
                          className="flex items-center gap-4 p-3 bg-surfaceHighlight/50 rounded-lg border border-border pointer-events-auto"
                        >
                          <div className="shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-surface/80 border border-border flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-textMain truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-textMuted">
                              {formatSize(file.size)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.previewUrl && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handlePreview(e, file.previewUrl)
                                }
                                className="p-2 hover:bg-surfaceHighlight rounded-lg text-textMuted hover:text-primary dark:hover:text-blue-500 transition-colors point"
                                title="Preview PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => removeFile(e, file.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-800/40 rounded-lg text-textMuted hover:text-red-500 dark:hover:text-red-400 transition-colors point"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {user?.tier === "Pro" && (
                        <div className="text-center text-xs text-textMuted mt-2 pointer-events-none">
                          Drop more files to add to this quiz
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 pointer-events-none">
                      {reading ? (
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      ) : (
                        <Upload
                          className={`w-12 h-12 transition-all duration-300 ${
                            isDragging ? "text-primary" : "text-textMuted"
                          }`}
                          style={{
                            animation: isDragging
                              ? "gentle-bounce 1s infinite ease-in-out"
                              : "none",
                          }}
                        />
                      )}
                      <div className="text-sm font-semibold text-textMain">
                        {reading
                          ? "Processing files..."
                          : "Drag & drop PDF here"}
                      </div>
                      {!reading && (
                        <div className="text-xs text-textMuted">
                          {user?.tier === "Pro"
                            ? "Upload multiple PDFs • Max 10MB each"
                            : "Single PDF limit • Max 10MB"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border/50 w-full" />

          <div>
            <label className="text-sm font-bold text-textMain mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary dark:text-blue-400" />{" "}
              Exam Board / Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXAM_STYLES.map((style) => {
                const isLocked =
                  (style.tier === SubscriptionTier.Basic &&
                    user?.tier === SubscriptionTier.Free) ||
                  (style.tier === SubscriptionTier.Pro &&
                    user?.tier !== SubscriptionTier.Pro);
                return (
                  <div
                    key={style.id}
                    onClick={() => handleExamStyleSelect(style.id, style.tier)}
                    className={`relative p-4 rounded-xl min-h-38 border-2 transition-all cursor-pointer flex flex-col justify-between h-full ${
                      examStyleId === style.id
                        ? "border-primary dark:border-blue-400 bg-primary/5"
                        : "border-border bg-surface hover:bg-surfaceHighlight hover:border-primary/30 dark:hover:border-blue-400/50"
                    } ${isLocked ? "opacity-70 bg-gray-50" : ""}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`font-bold text-sm ${
                            examStyleId === style.id
                              ? "text-primary dark:text-blue-400"
                              : "text-textMain"
                          }`}
                        >
                          {style.label}
                        </h4>
                        {isLocked && (
                          <Lock className="w-4 h-4 text-textMuted" />
                        )}
                        {!isLocked && examStyleId === style.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        {style.description}
                      </p>
                    </div>
                    {isLocked && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:text-orange-200 dark:bg-orange-900/90 px-2 py-1 rounded w-fit">
                        {style.tier} Plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Difficulty
              </label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {Object.values(Difficulty).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Number of Questions{" "}
                <span className="text-xs font-normal text-textMuted">
                  (Max: {userMaxQuestions})
                </span>
              </label>
              <input
                type="number"
                min={1}
                max={userMaxQuestions}
                value={questionCount}
                onChange={handleQuestionCountChange}
                className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Total Marks{" "}
                <span className="text-xs font-normal text-textMuted">
                  (Max: {userMaxMarks})
                </span>
              </label>
              <input
                type="number"
                min={1}
                max={userMaxMarks}
                value={totalMarks}
                onChange={handleTotalMarksChange}
                className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(QuestionType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedTypes.includes(type)
                        ? "bg-primary/10 dark:bg-blue-400/10 border-primary dark:border-blue-400 text-primary dark:text-blue-400 p-4 rounded"
                        : "bg-surface border-border text-textMuted hover:border-primary/50 dark:hover:border-blue-400/50 hover:bg-surfaceHighlight"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-surfaceHighlight rounded-xl border border-border">
            <div className="flex xs:flex-row flex-col xs:items-center xs:justify-between gap-4 items-center">
              <div className="xs:flex xs:items-center xs:gap-3 flex flex-col items-center gap-0">
                <div
                  className={`p-3 rounded-lg shrink-0 ${
                    generateFlashcards
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-700/80 dark:text-indigo-300"
                      : "bg-gray-200 text-gray-500 dark:bg-surface/40 dark:text-gray-300"
                  }`}
                >
                  <Layers className="w-6 h-6 xs:w-5 xs:h-5" />
                </div>
              </div>
              <div className="flex-1 text-center xs:text-left">
                <h3 className="font-semibold text-sm text-textMain">
                  Generate Flashcards
                </h3>
                <h4 className="font-semibold text-sm text-textMain/80 xs:text-textMain/80 xs:text-xs">
                  Create a study set automatically
                </h4>
              </div>
              <span
                className={`text-xs font-bold px-3.5 py-1.5 xs:px-2.5 rounded border whitespace-nowrap ${
                  user?.tier === "Pro" ||
                  user?.limits?.flashcardGenerationsRemaining > 0
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-400"
                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
                }`}
              >
                {user?.tier === "Pro"
                  ? "Unlimited"
                  : `${user?.limits?.flashcardGenerationsRemaining ?? 0} left`}
              </span>
              <button
                type="button"
                onClick={() => setGenerateFlashcards(!generateFlashcards)}
                className={`relative w-12 h-6 rounded-full transition-colors point shrink-0 ${
                  generateFlashcards
                    ? "bg-primary dark:bg-blue-600"
                    : "bg-gray-300 dark:bg-surface/60"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    generateFlashcards ? "translate-x-6" : "translate-x-0"
                  }`}
                ></span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTypes?.length}
            className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="flex flex-col items-start">
                  <span>
                    {progress < 10
                      ? "Initiating..."
                      : progress < 25
                      ? "Processing input..."
                      : progress < 75
                      ? "Generating questions..."
                      : progress < 90
                      ? "Formatting & validating..."
                      : "Finalizing..."}
                  </span>
                  <span className="text-xs font-medium opacity-90">
                    {Math.round(progress)}% completed
                  </span>
                </div>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizGenerator;
