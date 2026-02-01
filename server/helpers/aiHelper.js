import { v4 as uuidv4 } from "uuid";
import { YoutubeTranscript } from "youtube-transcript";

// --- Server Config Imports ---
import { EXAM_STYLES } from "../config/constants.js";
import { SubscriptionTier, QuestionType } from "../config/types.js";

// --- Gemini Configuration ---
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const PRO_MODEL = "gemini-3-pro-preview";
const BASIC_MODEL = "gemini-2.5-flash";
const FREE_MODEL = "gemini-2.5-flash-lite";

// Select API key based on user tier
const selectApiKey = (user) => {
  if (!user || user.tier === SubscriptionTier.Free) {
    return process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_API_KEY_BASIC;
  }
  if (user.tier === SubscriptionTier.Basic) {
    return process.env.GEMINI_API_KEY_BASIC;
  }
  if (user.tier === SubscriptionTier.Pro) {
    return process.env.GEMINI_API_KEY_PRO;
  }
  return process.env.GEMINI_API_KEY_FREE;
};

/**
 * Robust retry wrapper for Gemini API calls.
 * Handles rate limits (429) and server overloads (503) with exponential backoff and jitter.
 */
async function retryGeminiRequest(fn, retries = 5, baseDelay = 1000) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status || err.status;

      // Retry only on overload (503), rate-limit (429), or internal errors (5xx)
      // Do NOT retry on 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), or 404 (Not Found)
      if (status === 503 || status === 429 || (status >= 500 && status < 600) || !status) {
        // Use exponential backoff with jitter
        const exponentialDelay = baseDelay * Math.pow(2, i);
        const jitter = Math.random() * 1000;
        const waitTime = exponentialDelay + jitter;
        console.log(
          `Gemini busy/rate-limited. Retrying in ${Math.round(
            waitTime
          )}ms (Attempt ${i + 1}/${retries})...`
        );
        await new Promise((res) => setTimeout(res, waitTime));
      } else if (i === retries - 1) {
        throw err;
      } else {
        // For other errors, we still attempt a standard retry as transient network issues occur
        const delay = baseDelay * Math.pow(2, i);
        console.log(
          `Transient error detected. Retrying in ${delay}ms (Attempt ${
            i + 1
          }/${retries})...`
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  const errorInfo = lastError ? `${lastError.message}` : "Unknown error";
  throw new Error(
    `AI service failed after ${retries} retry attempts: ${errorInfo}`
  );
}

// Helper function to build the final API URL
const getApiUrl = (model, apiKey) =>
  `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

// Select appropriate model based on user's tier
const selectModel = (user) => {
  if (!user || user.tier === SubscriptionTier.Free) return FREE_MODEL;
  if (user.tier === SubscriptionTier.Basic) return BASIC_MODEL;
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

  return QuestionType.MCQ; 
};

/**
 * Validates and repairs JSON strings returned by the AI.
 * Handles markdown code blocks and common formatting issues.
 */
const cleanAndParseJSON = (text) => {
  if (!text) return null;
  let cleaned = text.trim();

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    const firstNewLine = cleaned.indexOf("\n");
    if (firstNewLine !== -1) {
      cleaned = cleaned.substring(firstNewLine);
    }
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.lastIndexOf("```"));
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("Direct JSON parse failed, attempting repair...");
    // Try to find the first '{' and last '}'
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch (innerErr) {
        console.error("JSON Repair failed:", innerErr.message);
        return null;
      }
    }
    return null;
  }
};

// Structured JSON schema for the AI response (used for models that support responseSchema)
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
export const generateQuizHelper = async (clientData, user, sendProgress) => {
  const {
    topic,
    difficulty,
    questionCount,
    types,
    totalMarks,
    examStyleId = "standard",
    fileData,
  } = clientData;

  // Send initial progress
  if (sendProgress) sendProgress("Initializing", 5);

  const model = selectModel(user);
  const apiKey = selectApiKey(user);

  const styleConfig = EXAM_STYLES.find((s) => s.id === examStyleId);
  const styleLabel = styleConfig ? styleConfig.label : "Standard";

  let styleInstruction = "";
  switch (examStyleId) {
    case "caie_o":
    case "caie_a":
      styleInstruction =
        "Strictly follow Cambridge Assessment International Education (CAIE) style. Use command words like 'State', 'Define', 'Explain', 'Discuss'. Ensure marking schemes are precise and based on syllabus keywords.";
      break;
    case "sindh_board":
      styleInstruction =
        "Strictly follow Sindh Board (Pakistan) curriculum style. Focus on bookish definitions, rote-learning key phrases, and typical board exam phrasing found in past papers.";
      break;
    case "class_test":
      styleInstruction =
        "Format as a standard school unit test. Focus on checking conceptual understanding of the specific chapter/topic provided.";
      break;
    case "sat":
      styleInstruction =
        "Format as an SAT aptitude test. Focus on logic, critical thinking, evidence-based reasoning, and standard SAT phrasing.";
      break;
    default:
      styleInstruction =
        "Maintain a high academic standard for a general audience.";
  }

  const typeString = types.join(", ");

  // Build prompt - special handling for PDF mode
  const isPdfMode =
    typeof topic === "string" &&
    (topic.includes("attached document") || topic.includes("PDF"));

  let prompt = `Generate a ${difficulty} level quiz about "${topic}" designed for high-retention active recall.
**Exam Style: ${styleLabel}**. ${styleInstruction}

The quiz should have exactly ${questionCount} questions.
The total Marks for the entire quiz must equal exactly ${totalMarks}. Distribute these marks based on question complexity.
Include a mix of the following question types: ${typeString}.

**LEARNING OBJECTIVES:**
1. Focus on "High-Yield" concepts — the facts most likely to appear in an exam.
2. Avoid trivial details; prioritize conceptual understanding and application of knowledge.
3. For MCQs, ensure distractors (wrong answers) are plausible and address common misconceptions.

${
  isPdfMode
    ? "**CRITICAL: ALL questions MUST be based ONLY on the content of the attached document(s). Do NOT generate questions about topics not covered in the document. Every question must be answerable from the document content.**\n"
    : ""
}

**JSON RESPONSE FORMAT:**
- Return a single, valid JSON object with "title" and "questions" array.
- For each question:
  - "type": MCQ, TrueFalse, ShortAnswer, Essay, or FillInTheBlank.
  - "text": The question string.
  - "options": Array of strings (4 for MCQ, 2 for True/False, empty for others). No prefixes like A) or 1).
  - "correctAnswer": The correct string.
  - "explanation": A detailed 2-3 sentence explanation of WHY this is correct, focusing on the underlying concept.
  - "marks": Integer.`;

  const parts = [{ text: prompt }];

  // Handle both single file and array of files (PDF/Images)
  if (fileData) {
    const filesArray = Array.isArray(fileData) ? fileData : [fileData];

    for (const file of filesArray) {
      if (file && file.mimeType && file.data) {
        parts.push({
          inlineData: { mimeType: file.mimeType, data: file.data },
        });
      }
    }

    if (filesArray.length > 0) {
      parts[0].text += ` Use the provided context from the attached file(s) to generate these questions.`;
    }
  }

  // --- Robust YouTube Logic Integration ---
  if (clientData.youtubeUrl) {
    if (sendProgress) sendProgress("Fetching video transcript", 10);

    const extractVideoId = (url) => {
      if (!url) return null;
      const m =
        url.match(
          /(?:v=|\/v\/|youtu\.be\/|\/embed\/|watch\?v=|&v=)([0-9A-Za-z_-]{11})/
        ) || url.match(/^([0-9A-Za-z_-]{11})$/);
      return m ? m[1] : null;
    };

    const decodeHtmlEntities = (str) =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    const videoId = extractVideoId(clientData.youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL provided.");

    let transcriptText = "";

    // Step 1: Try the library
    try {
      console.log(`Attempting library fetch for video: ${videoId}`);
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      if (items && items.length) {
        transcriptText = items.map((it) => it.text).join(" ");
        console.log("Library fetch successful.");
      }
    } catch (libErr) {
      console.warn(
        "YoutubeTranscript library failed, attempting scrape fallback...",
        libErr.message
      );
    }

    // Step 2: Robust Scrape Fallback
    if (!transcriptText) {
      try {
        console.log("Starting fallback scrape...");
        const USER_AGENT =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";

        // Add timeout for YouTube fetch
        const ytController = new AbortController();
        const ytTimeout = setTimeout(() => ytController.abort(), 10000); // 10 second timeout

        const pageResp = await fetch(
          `https://www.youtube.com/watch?v=${videoId}`,
          {
            headers: {
              "User-Agent": USER_AGENT,
              "Accept-Language": "en-US,en;q=0.9",
            },
            signal: ytController.signal,
          }
        );
        clearTimeout(ytTimeout);

        const html = await pageResp.text();

        // Check for specific blocking indicators
        if (html.includes("Sign in")) {
          console.warn("YouTube Sign-in/Age Restriction detected.");
          throw new Error(
            "This video is age-restricted or requires sign-in. The server cannot access it automatically."
          );
        }

        // Enhanced regex
        const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

        if (match) {
          const playerJson = JSON.parse(match[1]);
          const captionTracks =
            playerJson?.captions?.playerCaptionsTracklistRenderer
              ?.captionTracks;

          if (captionTracks && captionTracks.length > 0) {
            console.log(`Found ${captionTracks.length} caption tracks.`);
            // Prefer English
            let track =
              captionTracks.find((t) => t.languageCode === "en") ||
              captionTracks[0];

            const baseUrl = track.baseUrl.replace(/\\u0026/g, "&");

            const fetchHeaders = {
              "User-Agent": USER_AGENT,
              Referer: `https://www.youtube.com/watch?v=${videoId}`,
            };

            // Try JSON3 format first
            console.log("Fetching transcript (json3)...");
            const capController = new AbortController();
            const capTimeout = setTimeout(() => capController.abort(), 10000);
            const capResp = await fetch(`${baseUrl}&fmt=json3`, {
              headers: fetchHeaders,
              signal: capController.signal,
            });
            clearTimeout(capTimeout);
            const capText = await capResp.text();

            if (capText.trim().startsWith("{")) {
              const capJson = JSON.parse(capText);
              transcriptText = (capJson.events || [])
                .map((ev) =>
                  ev.segs ? ev.segs.map((s) => s.utf8 || "").join("") : ""
                )
                .join(" ");
            }

            // If JSON3 is empty/failed, try XML parsing fallback
            if (!transcriptText) {
              console.log("JSON3 failed/empty, trying XML...");
              const xmlController = new AbortController();
              const xmlTimeout = setTimeout(() => xmlController.abort(), 10000);
              const xmlResp = await fetch(baseUrl, { headers: fetchHeaders, signal: xmlController.signal });
              clearTimeout(xmlTimeout);
              const xml = await xmlResp.text();

              // Check for empty body specifically
              if (!xml || xml.trim().length === 0) {
                console.warn(
                  "XML transcript fetch returned empty body (likely bot detection)."
                );
              } else {
                const matches = [
                  ...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi),
                ];
                transcriptText = matches
                  .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, " ")))
                  .join(" ");
              }
            }
          } else {
            console.warn("No captionTracks found in player response.");
          }
        } else {
          console.warn(
            "Could not find ytInitialPlayerResponse in HTML. (Consent page or serious block?)"
          );
        }
      } catch (scrapeErr) {
        console.warn("Scraping fallback failed:", scrapeErr.message);
        // If we identified a specific error (e.g; age restriction), re-throw it to be caught below
        if (
          scrapeErr.message.includes("age-restricted") ||
          scrapeErr.message.includes("requires sign-in")
        ) {
          throw scrapeErr;
        }
      }
    }

    // final check: Only error out if everything failed
    if (!transcriptText || transcriptText.trim().length === 0) {
      console.error(
        `Failed to fetch transcript for ${videoId} after all attempts.`
      );
      throw new Error(
        "Could not fetch YouTube transcript. The video might be age-restricted, private, or blocked by YouTube's anti-bot protection. Please try another video or copy the transcript text manually."
      );
    }

    // Truncate to stay within Gemini context safely
    const truncatedTranscript =
      transcriptText.length > 25000
        ? transcriptText.substring(0, 25000) + "... [truncated]"
        : transcriptText;

    parts.push({
      text: `\n\nVideo Transcript Context:\n${truncatedTranscript}\n\n**CRITICAL: Generate questions ONLY based on this video transcript content.**`,
    });
  }

  const payload = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: model.includes("lite") ? undefined : quizResponseSchema,
      temperature: 0.7,
    },
  };

  try {
    if (sendProgress) sendProgress("Processing input", 15);

    const isLiteModel = model.includes("lite");
    let data = null;

    if (isLiteModel) {
      if (sendProgress) sendProgress("Generating (Standard)", 30);

      const response = await retryGeminiRequest(() =>
        fetch(getApiUrl(model, apiKey), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Gemini Lite API Error: ${res.status} - ${text}`);
          }
          return res;
        })
      );

      const resultText = await response.text();
      const resultJson = JSON.parse(resultText);
      const aiText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) throw new Error("Lite model returned empty content.");
      data = cleanAndParseJSON(aiText);
    } else {
      // PRO/BASIC Models use Streaming for performance
      if (sendProgress) sendProgress("Streaming from AI", 30);
      const streamUrl = `${BASE_URL}/${model}:streamGenerateContent?key=${apiKey}`;

      try {
        const response = await fetch(streamUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Stream Error: ${response.status}`);
        if (!response.body) throw new Error("Readable stream not available.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let rawStreamData = "";
        let fullResponseText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decoded = decoder.decode(value, { stream: true });
          rawStreamData += decoded;

          // Progress simulation during stream
          if (sendProgress) {
            const currentPercent = Math.min(
              30 + rawStreamData.length / 100,
              70
            );
            sendProgress("Receiving AI data", Math.floor(currentPercent));
          }
        }

        // Gemini Stream returns an array of chunks
        const chunks = JSON.parse(rawStreamData);
        if (Array.isArray(chunks)) {
          chunks.forEach((chunk) => {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              fullResponseText += chunk.candidates[0].content.parts[0].text;
            }
          });
        }

        if (sendProgress) sendProgress("Parsing response", 75);
        data = cleanAndParseJSON(fullResponseText);
      } catch (streamError) {
        console.warn(
          "Streaming failed, falling back to POST:",
          streamError.message
        );
        // Fallback to non-streaming
        const response = await retryGeminiRequest(() =>
          fetch(getApiUrl(model, apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        );
        const text = await response.text();
        const json = JSON.parse(text);
        data = cleanAndParseJSON(
          json.candidates?.[0]?.content?.parts?.[0]?.text
        );
      }
    }

    if (!data || !data.questions || !Array.isArray(data.questions)) {
      console.error("Invalid AI Response Data:", JSON.stringify(data, null, 2));
      throw new Error("AI failed to provide a valid list of questions.");
    }

    if (sendProgress) sendProgress("Finalizing questions", 85);

    // Format and validate output structure
    const questions = data.questions.map((q) => ({
      id: uuidv4(),
      type: detectQuestionType(q),
      text: q.text || q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "Correct based on provided context.",
      marks: Number(q.marks) || 1,
    }));

    if (sendProgress) sendProgress("Complete", 100);

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
    console.error("Quiz Generation Fatal Error:", error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

/**
 * AI-powered performance review based on quiz history.
 */
export const generatePerformanceReviewHelper = async (user, quizzes) => {
  const completedQuizzes = quizzes.filter((q) => q.score !== undefined);
  if (!completedQuizzes.length)
    return "Complete some quizzes to get an AI-powered performance review!";

  const summary = completedQuizzes
    .map((q) => {
      let behaviorInfo = "";
      if (q.behavioralData) {
        const avgTime =
          Object.values(q.behavioralData).reduce(
            (acc, b) => acc + (b.timeSpent || 0),
            0
          ) / (q.questions.length || 1);
        const totalChanges = Object.values(q.behavioralData).reduce(
          (acc, b) => acc + (b.changes || 0),
          0
        );
        behaviorInfo = ` (Avg Time: ${Math.round(
          avgTime
        )}s/q, Changes: ${totalChanges})`;
      }
      return `- Topic: ${q.topic}, Score: ${q.score}%, Date: ${new Date(
        q.createdAt
      ).toLocaleDateString()}${behaviorInfo}`;
    })
    .join("\n");

  const prompt = `You are an elite educational coach. Analyze this quiz history for ${user.name}:

${summary}

Output a sharp, direct, high-impact review:
- **Key Strength:** ...
- **Critical Weakness:** ...
- **Next Step:** ...

Guidelines:
- Do NOT start with the user's name.
- Use bold **WORD** for emphasis.
- Keep it concise and academic.`;

  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

  try {
    const model = selectModel(user);
    const apiKey = selectApiKey(user);

    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Gemini Review API Error: ${res.status} - ${errorText}`);
          throw new Error(`Gemini Review API Error: ${res.status}`);
        }
        return res;
      })
    );

    const resultJson = await response.json();
    const reviewText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reviewText) {
      console.warn("Gemini returned an empty review candidate.");
      return "Review unavailable at this moment.";
    }

    return reviewText;
  } catch (err) {
    console.error("Performance Review Logic Error:", err);
    throw new Error("Failed to generate performance review.");
  }
};

/**
 * Interactive Study Buddy Chat Helper.
 */
export const chatWithAIHelper = async (user, messages, context) => {
  const model = selectModel(user);
  const apiKey = selectApiKey(user);

  let systemInstruction = `You are Qubli AI's Study Buddy. Help ${user.name} learn.
Guidelines:
1. Discuss ONLY academic or study-related topics.
2. Be concise and use Markdown.
3. NEVER reveal your internal model names (${model}) or API keys.
4. If a user is stuck on a quiz, guide them to the logic rather than just the answer.`;

  if (context?.type === "quiz_review") {
    systemInstruction += `\nCurrently reviewing: ${context.topic}. 
    Question: ${context.questionText}. 
    Correct: ${context.correctAnswer}.`;
  }

  const history = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const payload = {
    contents: history,
    systemInstruction: { parts: [{ text: systemInstruction }] },
  };

  try {
    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Gemini Chat API Error");
        return res;
      })
    );

    const result = await response.json();
    return (
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't process that."
    );
  } catch (error) {
    throw new Error(`Chat connection failed: ${error.message}`);
  }
};

/**
 * Strict academic grading for Essay and Short Answer questions.
 */
export const gradeAnswerHelper = async (user, question, userAnswer, topic) => {
  const apiKey = selectApiKey(user);
  const model = selectModel(user);

  const systemInstruction = `You are a strict academic examiner.
  1. Grade rigorously based on factual accuracy and depth.
  2. Award partial marks where appropriate.
  3. Return ONLY valid JSON.`;

  const prompt = `Grade this student answer for the topic: ${topic}.
  
  Question: ${question.text}
  Marks: ${question.marks || 1}
  Expected: ${question.correctAnswer || "General topic knowledge"}
  Student Answer: ${userAnswer || "(No answer provided)"}
  
  Return JSON:
  {
    "marksAwarded": <number>,
    "totalMarks": ${question.marks || 1},
    "justification": "Why this mark?",
    "suggestion": "How to improve?"
  }`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  try {
    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Gemini Grading Error");
        return res;
      })
    );

    const resultText = await response.text();
    const resultJson = JSON.parse(resultText);
    const aiText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text;

    const grading = cleanAndParseJSON(aiText);
    if (!grading) throw new Error("Failed to parse grading result.");

    const max = question.marks || 1;

    // Robust marks parsing: handle "4.5/5", "4.5", 4.5
    let awarded = 0;
    if (typeof grading.marksAwarded === "number") {
      awarded = grading.marksAwarded;
    } else if (typeof grading.marksAwarded === "string") {
      const match = grading.marksAwarded.match(/([\d.]+)/);
      awarded = match ? parseFloat(match[1]) : 0;
    }

    return {
      marksAwarded: Math.max(0, Math.min(max, awarded)),
      totalMarks: max,
      justification: grading.justification || "Evaluated by AI examiner.",
      suggestion: grading.suggestion || "Review the key concepts.",
    };
  } catch (error) {
    console.error("Grading error:", error);
    return {
      marksAwarded: 0,
      totalMarks: question.marks || 1,
      justification:
        "Automatic grading failed. Please consult your instructor.",
      suggestion: null,
    };
  }
};
