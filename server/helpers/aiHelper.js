// --- Core Dependencies ---
import { v4 as uuidv4 } from "uuid";

// --- Server Config Imports ---
import { EXAM_STYLES } from "../config/constants.js";
import { SubscriptionTier, QuestionType } from "../config/types.js";

import { toast } from "react-toastify";

// --- Gemini Configuration ---
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const API_KEY = process.env.GEMINI_API_KEY;

const PRO_MODEL = "gemini-2.5-flash";
const BASIC_MODEL = "gemini-2.5-flash";

async function retryGeminiRequest(fn, retries = 5, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status || err.status;

      // Retry only on overload or rate-limit
      if (status === 503 || status === 429) {
        console.warn(`Gemini overloaded → retrying (${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err; // non-retryable error
      }
    }
  }

  console.error(`AI failed after ${retries} retries.`);
}

// Helper function to build the final API URL
const getApiUrl = (model) =>
  `${BASE_URL}/${model}:generateContent?key=${API_KEY}`;

// Select appropriate model based on user's tier
const selectModel = (user) => {
  if (
    !user ||
    user.tier === SubscriptionTier.Free ||
    user.tier === SubscriptionTier.Basic
  )
    return BASIC_MODEL;
  if (user.tier === SubscriptionTier.Pro) return PRO_MODEL;
  return BASIC_MODEL;
};

// Map string to QuestionType enum
const mapStringTypeToEnum = (typeStr) => {
  if (!typeStr) return QuestionType.MCQ;
  const normalized = typeStr.toLowerCase();

  if (
    normalized.includes("mcq") ||
    normalized.includes("choice") ||
    normalized.includes("multiple")
  )
    return QuestionType.MCQ;

  if (normalized.includes("true") || normalized.includes("false"))
    return QuestionType.TrueFalse;

  if (normalized.includes("short")) return QuestionType.ShortAnswer;

  if (normalized.includes("long") || normalized.includes("essay"))
    return QuestionType.Essay;

  if (normalized.includes("fill")) return QuestionType.FillInTheBlank;

  return QuestionType.MCQ; // fallback
};

// Structured JSON schema for the AI response
const quizResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          type: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctAnswer: { type: "STRING" },
          explanation: { type: "STRING" },
          marks: { type: "NUMBER" },
        },
        required: ["text", "type", "correctAnswer", "explanation", "marks"],
      },
    },
  },
  required: ["title", "questions"],
};

const detectQuestionType = (q) => {
  // Prefer AI-provided type
  if (q.type) return mapStringTypeToEnum(q.type);

  // Fallback detection based on options/content
  if (q.options?.length === 4) return QuestionType.MCQ;
  if (q.options?.length === 2) return QuestionType.TrueFalse;
  if (q.text.length > 100) return QuestionType.Essay;
  if (q.text.length > 30) return QuestionType.ShortAnswer;
  return QuestionType.MCQ; // default
};

// --- Generate Quiz Helper ---
export const generateQuizHelper = async (clientData, user) => {
  const {
    topic,
    difficulty,
    questionCount,
    types,
    totalMarks,
    examStyleId = "standard",
    fileData,
  } = clientData;

  const model = selectModel(user);

  const styleConfig = EXAM_STYLES.find((s) => s.id === examStyleId);
  const styleLabel = styleConfig ? styleConfig.label : "Standard";

  let styleInstruction = "";
  switch (examStyleId) {
    case "caie_o":
    case "caie_a":
      styleInstruction =
        "Strictly follow Cambridge Assessment International Education (CAIE) style. Use command words like 'State', 'Define', 'Explain', 'Discuss'. Ensure marking schemes are precise.";
      break;
    case "sindh_board":
      styleInstruction =
        "Strictly follow Sindh Board (Pakistan) curriculum style. Focus on bookish definitions and typical board exam phrasing.";
      break;
    case "class_test":
      styleInstruction =
        "Format as a standard school unit test. Focus on checking conceptual understanding of the specific chapter/topic.";
      break;
    case "sat":
      styleInstruction =
        "Format as an SAT aptitude test. Focus on logic, critical thinking, and standard SAT phrasing.";
      break;
    default:
      styleInstruction = "";
  }

  const typeString = types.join(", ");

  // Build prompt - special handling for PDF mode
  const isPdfMode =
    typeof topic === "string" && topic.includes("attached document");

  let prompt = `Generate a ${difficulty} level quiz about "${topic}".
**Exam Style: ${styleLabel}**. ${styleInstruction}

The quiz should have exactly ${questionCount} questions.
The Total Marks for the entire quiz must equal exactly ${totalMarks}. Distribute these marks logically among the questions based on their complexity.
Include a mix of the following question types: ${typeString}.

${
  isPdfMode
    ? "**CRITICAL: ALL questions MUST be based ONLY on the content of the attached document(s). Do NOT generate questions about topics not covered in the document. Every question must be answerable from the document content.**\n"
    : ""
}
- For each question, include a field "type" exactly as one of: MCQ, TrueFalse, ShortAnswer, Essay, FillInTheBlank.
- For 'MCQ', provide 4 options, DON'T PROVIDE WITH OPTIONS PREFIXES LIKE 'A. or B.'.
- For 'TrueFalse', provide 2 options (True, False).
- For Short/Long Answer, 'options' can be empty array.
- Return JSON only.
- Question marks must be whole numbers, not numbers like 2.5, 3.5, etc.s`;

  const parts = [{ text: prompt }];

  // Handle both single file and array of files
  if (fileData) {
    const filesArray = Array.isArray(fileData) ? fileData : [fileData];
    console.log(`Processing ${filesArray.length} file(s) for quiz generation`);

    for (const file of filesArray) {
      if (file && file.mimeType && file.data) {
        console.log(`Adding file with mime type: ${file.mimeType}`);
        parts.push({
          inlineData: { mimeType: file.mimeType, data: file.data },
        });
      }
    }

    if (filesArray.length > 0 && filesArray[0]?.mimeType) {
      parts[0].text += ` Use the attached document${
        filesArray.length > 1 ? "s" : ""
      } context to generate relevant questions.`;
    }
  }

  const contents = [{ role: "user", parts }];

  const payload = {
    contents,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: quizResponseSchema,
      temperature: 0.7,
    },
  };

  try {
    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          const error = new Error("Gemini API Error");
          error.response = { status: res.status, text };
          throw error;
        }
        return res;
      })
    );

    const resultText = await response.text();

    if (!response.ok) {
      console.error("Failed to generate quiz. Try again.");
      throw new Error(
        `API call failed with status ${
          response.status
        }. Details: ${resultText.substring(0, 100)}...`
      );
    }

    let result;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch (err) {
      console.error("Failed to parse JSON:", err, "Raw response:", resultText);
      result = null;
    }

    const candidate = result.candidates.find((c) => {
      const text = c.content?.parts?.[0]?.text;
      if (!text) return false;
      try {
        const data = JSON.parse(text);
        return Array.isArray(data.questions) && data.questions.length;
      } catch {
        return false;
      }
    });

    if (!candidate) throw new Error("No valid AI candidate found");

    let data;
    try {
      data = candidate.content.parts[0].text
        ? JSON.parse(candidate.content.parts[0].text)
        : null;
    } catch (err) {
      console.error("Failed to parse AI content JSON:", err);
      data = null;
    }

    if (!data) throw new Error("AI returned invalid or empty quiz data");

    const questions = data.questions.map((q) => ({
      id: uuidv4(),
      type: detectQuestionType(q),
      text: q.text,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks || 1,
    }));

    console.info("Quiz generated successfully!");

    return {
      title: data.title || `${topic} Quiz`,
      topic,
      difficulty,
      questions,
      createdAt: Date.now(),
      totalQuestions: questions.length,
      totalMarks,
      examStyle: styleLabel,
    };
  } catch (error) {
    toast.error("AI Review temporarily unavailable.");
    throw new Error(
      "Failed to generate quiz. Please try again or check server logs."
    );
  }
};

// --- Generate Performance Review Helper ---
export const generatePerformanceReviewHelper = async (user, quizzes) => {
  const completedQuizzes = quizzes.filter((q) => q.score !== undefined);
  if (!completedQuizzes.length)
    return "Complete some quizzes to get an AI-powered performance review!";

  const model = selectModel(user);

  const summary = completedQuizzes
    .map(
      (q) =>
        `- Topic: ${q.topic}, Score: ${q.score}%, Date: ${new Date(
          q.createdAt
        ).toLocaleDateString()}`
    )
    .join("\n");

  const prompt = `You are an elite educational coach. Analyze this quiz history for ${user.name}:

${summary}

Output: A sharp, direct, high-impact review.
- Identify 1 key strength prefixing with **Key Strength:**.
- Identify 1 critical weakness prefixing with **Critical Weakness:**.
- Give 1 actionable next step prefixing with **Next Step:**.
- Do NOT start with ${user.name}.
- Do NOT start the review with 'Review:'.
- For the words that need bolding use **WORD**, not *WORD*.
- Do NOT mention difficulty levels or quiz structure in the topic name, just the core topic itself.`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const payload = { contents };

  try {
    const response = await fetch(getApiUrl(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resultText = await response.text();

    if (!response.ok) {
      console.error("Gemini API Review Error:", resultText);
      throw new Error(`Review API failed: ${response.status}`);
    }

    let result;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch (err) {
      console.error("Failed to parse JSON:", err, "Raw response:", resultText);
      result = null;
    }

    const review = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.info("Performance review generated!");

    return review;
  } catch (e) {
    console.error("Performance review error:", e);
    throw new Error("AI Review temporarily unavailable.");
  }
};
