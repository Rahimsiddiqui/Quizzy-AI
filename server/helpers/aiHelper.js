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
    return process.env.GEMINI_API_KEY_FREE;
  }
  if (user.tier === SubscriptionTier.Basic) {
    return process.env.GEMINI_API_KEY_BASIC;
  }
  if (user.tier === SubscriptionTier.Pro) {
    return process.env.GEMINI_API_KEY_PRO;
  }
  return process.env.GEMINI_API_KEY_FREE;
};

async function retryGeminiRequest(fn, retries = 5, baseDelay = 1000) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status || err.status;

      // Retry only on overload or rate-limit
      if (status === 503 || status === 429) {
        // Use exponential backoff with jitter
        const exponentialDelay = baseDelay * Math.pow(2, i);
        const jitter = Math.random() * 1000;
        const waitTime = exponentialDelay + jitter;
        console.log(
          `Retrying in ${Math.round(waitTime)}ms (rate limit/overload)`
        );
        await new Promise((res) => setTimeout(res, waitTime));
      } else if (i === retries - 1) {
        // Last attempt failed
        throw err;
      } else {
        // Non-retryable error on first attempt, retry anyway
        const delay = baseDelay * Math.pow(2, i);
        console.log(
          `Retrying in ${delay}ms (non-retryable error, will retry anyway)`
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

    for (const file of filesArray) {
      if (file && file.mimeType && file.data) {
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

  // Handle YouTube URL
  if (clientData.youtubeUrl) {
    try {
      if (sendProgress) sendProgress("Fetching video transcript", 10);
      const transcriptItems = await YoutubeTranscript.fetchTranscript(
        clientData.youtubeUrl
      );
      const transcriptText = transcriptItems.map((item) => item.text).join(" ");

      // Truncate if too long (approx 30k chars to be safe with tokens, though Pro handles more)
      const truncatedTranscript =
        transcriptText.length > 50000
          ? transcriptText.substring(0, 50000) + "... [truncated]"
          : transcriptText;

      parts.push({
        text: `\n\nVideo Transcript Context:\n${truncatedTranscript}\n\n**CRITICAL: Generate questions ONLY based on the video transcript provided above.**`,
      });
    } catch (err) {
      console.error("YouTube Transcript Error:", err);
      // Fallback: ask AI to try its internal knowledge if transcript fails, or error out.
      // For now, let's error so user knows.
      throw new Error(
        "Could not fetch YouTube transcript. Video might be missing captions."
      );
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
    if (sendProgress) sendProgress("Processing input", 15);

    // Check if model is lite variant (lite doesn't support streaming with JSON schema)
    const isLiteModel = model.includes("lite");

    let data = null;

    if (isLiteModel) {
      // Use non-streaming endpoint for lite models
      if (sendProgress) sendProgress("Generating", 25);

      const response = await retryGeminiRequest(() =>
        fetch(getApiUrl(model, apiKey), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            const error = new Error("Gemini API Error (Lite)");
            error.response = { status: res.status, text };
            throw error;
          }
          return res;
        })
      );

      if (sendProgress) sendProgress("Parsing response", 50);

      const resultText = await response.text();
      let result;
      try {
        result = resultText ? JSON.parse(resultText) : null;
      } catch {
        result = null;
      }

      if (!result || !result.candidates) {
        throw new Error("Invalid response from lite model");
      }

      const candidate = result.candidates.find((c) => {
        const text = c.content?.parts?.[0]?.text;
        if (!text) return false;
        try {
          const parsed = JSON.parse(text);
          return Array.isArray(parsed.questions) && parsed.questions.length;
        } catch {
          return false;
        }
      });

      if (!candidate) throw new Error("No valid candidate from lite model");

      try {
        data = JSON.parse(candidate.content.parts[0].text);
      } catch {
        throw new Error("Failed to parse questions from lite model");
      }
    } else {
      // Use streaming endpoint for BASIC and PRO models
      if (sendProgress) sendProgress("Streaming from AI", 30);

      const streamUrl = `${BASE_URL}/${model}:streamGenerateContent?key=${apiKey}`;

      // For streaming - use the full payload with schema
      const streamPayload = payload;

      let fullResponse = "";
      let charCount = 0;
      const estimatedTotalChars = 2000;

      try {
        console.log(
          "Starting streaming request to:",
          streamUrl.substring(0, 80)
        );

        const response = await fetch(streamUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamPayload),
        });

        console.log("Stream response status:", response.status);

        if (!response.ok) {
          const text = await response.text();
          const error = new Error(
            `Gemini API Streaming Error: ${response.status}`
          );
          error.response = { status: response.status, text };
          console.error("Stream error response:", text.substring(0, 200));
          throw error;
        }

        if (!response.body) {
          console.log("Response body is null, response:", response);
          throw new Error("Response body is null - streaming not available");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let rawStreamData = "";

        console.log("Starting to read stream...");

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("Stream reading complete");
            break;
          }

          if (!value || value.length === 0) {
            continue;
          }

          const decoded = decoder.decode(value, { stream: true });
          rawStreamData += decoded;
          charCount += decoded.length;

          const progressPercent = 30 + (charCount / estimatedTotalChars) * 40;
          if (sendProgress && progressPercent < 70) {
            sendProgress(
              "Streaming from AI",
              Math.min(Math.floor(progressPercent), 69)
            );
          }
        }

        console.log("Total raw stream data length:", rawStreamData.length);
        console.log("First 200 chars:", rawStreamData.substring(0, 200));
        console.log(
          "Last 100 chars:",
          rawStreamData.substring(rawStreamData.length - 100)
        );

        if (sendProgress) sendProgress("Parsing response", 70);

        // The Gemini API sends responses as a JSON array: [{ chunk1 }, { chunk2 }, ... ]
        try {
          const responseArray = JSON.parse(rawStreamData);
          console.log("Parsed as array with", responseArray.length, "chunks");

          if (Array.isArray(responseArray)) {
            // Extract text from each chunk
            for (const chunk of responseArray) {
              if (
                chunk.candidates &&
                chunk.candidates[0]?.content?.parts?.[0]?.text
              ) {
                fullResponse += chunk.candidates[0].content.parts[0].text;
              }
            }
          }
        } catch (arrayErr) {
          console.log(
            "Failed to parse as array, trying alternative parsing..."
          );
          throw arrayErr;
        }

        console.log("Extracted text length:", fullResponse.length);
        if (fullResponse) {
          console.log("Response preview:", fullResponse.substring(0, 200));
        }

        if (!fullResponse) {
          throw new Error("No text extracted from streaming response");
        }

        if (sendProgress) sendProgress("Parsing JSON", 75);

        try {
          data = JSON.parse(fullResponse);
        } catch (err) {
          console.error("Failed to parse extracted text as JSON:", err.message);

          // Try to repair common JSON issues from streaming
          let repairedJson = fullResponse.trim();

          // Remove any trailing incomplete content after the last complete question
          // Look for the closing structure of the quiz JSON
          const lastValidClose = repairedJson.lastIndexOf("}]}");
          if (lastValidClose > 0) {
            repairedJson = repairedJson.substring(0, lastValidClose + 3);
            console.log(
              "Truncated to last valid close at position:",
              lastValidClose
            );

            try {
              data = JSON.parse(repairedJson);
              console.log("Successfully parsed after truncation repair");
            } catch (repairErr) {
              console.error("Repair attempt failed:", repairErr.message);
              throw new Error("Failed to parse quiz JSON from stream");
            }
          } else {
            throw new Error("Failed to parse quiz JSON from stream");
          }
        }
      } catch (error) {
        // Fallback to non-streaming if streaming fails
        console.log(
          "Streaming failed, falling back to non-streaming:",
          error.message
        );

        if (sendProgress)
          sendProgress("Generating from AI (non-streaming fallback)", 30);

        const response = await retryGeminiRequest(() =>
          fetch(getApiUrl(model, apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              const err = new Error("Gemini API Error");
              err.response = { status: res.status, text };
              throw err;
            }
            return res;
          })
        );

        if (sendProgress) sendProgress("Parsing response", 70);

        const resultText = await response.text();
        let result;
        try {
          result = resultText ? JSON.parse(resultText) : null;
        } catch {
          result = null;
        }

        if (!result || !result.candidates) {
          throw new Error("Invalid response from AI");
        }

        const candidate = result.candidates.find((c) => {
          const text = c.content?.parts?.[0]?.text;
          if (!text) return false;
          try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed.questions) && parsed.questions.length;
          } catch {
            return false;
          }
        });

        if (!candidate) throw new Error("No valid candidate from AI");

        try {
          data = JSON.parse(candidate.content.parts[0].text);
        } catch {
          throw new Error("Failed to parse questions from AI");
        }
      }
    }

    if (!data || !data.questions) {
      throw new Error("AI returned invalid or empty quiz data");
    }

    if (sendProgress) sendProgress("Formatting & validating", 70);

    const questions = data.questions.map((q, idx) => {
      // Send progress for each question processed
      const progressPercent = 70 + ((idx + 1) / data.questions.length) * 15;
      if (sendProgress)
        sendProgress(
          "Formatting & validating",
          Math.floor(progressPercent),
          idx + 1
        );

      return {
        id: uuidv4(),
        type: detectQuestionType(q),
        text: q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        marks: q.marks || 1,
      };
    });

    if (sendProgress) sendProgress("Finalizing", 95);

    const quizData = {
      title: data.title || `${topic} Quiz`,
      topic,
      difficulty,
      questions,
      createdAt: Date.now(),
      totalQuestions: questions.length,
      totalMarks,
      examStyle: styleLabel,
    };

    return quizData;
  } catch (error) {
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

// --- Generate Performance Review Helper ---
export const generatePerformanceReviewHelper = async (user, quizzes) => {
  const completedQuizzes = quizzes.filter((q) => q.score !== undefined);
  if (!completedQuizzes.length)
    return "Complete some quizzes to get an AI-powered performance review!";

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
- Do NOT mention difficulty levels or quiz structure in the topic name, just the core topic itself.
- Do NOT list additional bullet points like "Physics: 60% on 12/29/2025." - Only output the three items above (Key Strength, Critical Weakness, Next Step).`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const payload = { contents };

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
          const text = await res.text();
          const error = new Error("Gemini Review API Error");
          error.response = { status: res.status, text };
          throw error;
        }
        return res;
      })
    );

    const resultText = await response.text();

    let result;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch {
      result = null;
    }

    if (!result) {
      throw new Error("Invalid review response from AI");
    }

    const review = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!review) {
      throw new Error("AI returned empty review");
    }

    return review;
  } catch {
    throw new Error("Failed to generate performance review. Please try again.");
  }
};

// --- Chat with AI Helper ---
export const chatWithAIHelper = async (user, messages, context) => {
  const model = selectModel(user);
  const apiKey = selectApiKey(user);

  // Construct system instruction based on context
  let systemInstruction = `You are Qubli AI's intelligent Study Buddy. Your goal is to help students learn, explain concepts, and answer questions based on the provided context.
  
  User Info:
  - Name: ${user.name}
  - Level: ${user.tier === "Pro" ? "Advanced" : "Student"}
  
  Guidelines:
  1. Be encouraging, helpful, and concise.
  2. If the user asks for the answer to a question in the context, try to guide them or explain the concept rather than just giving the letter (unless they are reviewing results).
  3. Use markdown for formatting (bold, italic, code blocks, lists).
  4. Keep responses strict and relevant to the study context.
  `;

  if (context) {
    if (context.type === "quiz_review") {
      systemInstruction += `\n
      Active Context: Quiz Review
      Quiz Topic: ${context.topic}
      Question being discussed: ${context.questionText}
      Correct Answer: ${context.correctAnswer}
      Explanation: ${context.explanation}
      
      The user is reviewing a specific question. Help them understand why the correct answer is correct and why their answer (if explicitly mentioned) might be wrong.`;
    } else if (context.type === "dashboard") {
      systemInstruction += `\nActive Context: Dashboard / General Study. Answer general questions or questions about their progress.`;
    }
  }

  // Convert history to Gemini format
  const history = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Add system instruction as the first part or use systemInstruction if model supports it (Gemini 1.5 does via systemInstruction param, but here we simply prepend context to the first user message or history for simplicity with existing helper structure)

  // Note: For simple chat endpoint, we might not use the full multi-turn history object if we just send the new message + history as text,
  // but using the proper structure is better.

  const payload = {
    contents: history,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
  };

  try {
    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          const error = new Error("Gemini Chat API Error");
          error.response = { status: res.status, text };
          throw error;
        }
        return res;
      })
    );

    const resultText = await response.text();
    let result;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch {
      result = null;
    }

    if (!result) throw new Error("Invalid chat response.");

    const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty response from AI.");

    return reply;
  } catch (error) {
    throw new Error(`Chat failed: ${error.message}`);
  }
};

/**
 * AI-powered grading for Short Answer and Essay questions.
 * Acts as a strict academic examiner.
 * @param {object} user - The user object (for model selection)
 * @param {object} question - The question object with text, type, marks, correctAnswer
 * @param {string} userAnswer - The student's submitted answer
 * @param {string} topic - The quiz topic for context
 * @returns {Promise<object>} - { marksAwarded, totalMarks, justification, suggestion }
 */
export const gradeAnswerHelper = async (user, question, userAnswer, topic) => {
  const apiKey = selectApiKey(user);
  const model = selectModel(user);

  const questionType =
    question.type === "Short Answer" || question.type === "ShortAnswer"
      ? "Short Answer"
      : "Essay";

  const systemInstruction = `You are a strict academic examiner. Your job is to grade student answers fairly but rigorously.

IMPORTANT RULES:
1. Be exam-realistic - do NOT be overgenerous with marks
2. For Short Answer: Award marks based on key points expected (accuracy, completeness)
3. For Essay: Distribute marks across knowledge (40%), explanation (30%), evaluation/analysis (30%)
4. Deduct marks for: inaccuracies, irrelevant content, lack of depth, poor structure
5. Award partial credit where appropriate
6. Be consistent and fair in your assessment

You MUST return ONLY valid JSON, no other text.`;

  const prompt = `Grade the following ${questionType} answer.

**Topic:** ${topic}
**Question:** ${question.text}
**Total Marks Available:** ${question.marks || 1}
${
  question.correctAnswer
    ? `**Expected Key Points/Model Answer:** ${question.correctAnswer}`
    : ""
}

**Student's Answer:** 
${userAnswer || "(No answer provided)"}

---

Evaluate based on:
- Accuracy and correctness of information
- Relevance to the question asked
- Depth of explanation (especially for essays)
- Structure and clarity of response

Award marks fairly. If the answer is empty or completely wrong, award 0.

Return ONLY this JSON structure:
{
  "marksAwarded": <number between 0 and ${question.marks || 1}>,
  "totalMarks": ${question.marks || 1},
  "justification": "<Brief 1-2 sentence explanation of why these marks were given>",
  "suggestion": "<One concise tip to improve the answer>" or null
}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.3, // Lower temperature for more consistent grading
      topP: 0.8,
    },
  };

  try {
    const response = await retryGeminiRequest(() =>
      fetch(getApiUrl(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          const error = new Error("Gemini Grading API Error");
          error.response = { status: res.status, text };
          throw error;
        }
        return res;
      })
    );

    const resultText = await response.text();
    let result;
    try {
      result = resultText ? JSON.parse(resultText) : null;
    } catch {
      result = null;
    }

    if (!result) throw new Error("Invalid grading response.");

    const replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!replyText) throw new Error("Empty response from AI.");

    // Parse the JSON from the AI response
    // Clean the response - remove markdown code blocks if present
    let cleanedReply = replyText.trim();
    if (cleanedReply.startsWith("```json")) {
      cleanedReply = cleanedReply.slice(7);
    } else if (cleanedReply.startsWith("```")) {
      cleanedReply = cleanedReply.slice(3);
    }
    if (cleanedReply.endsWith("```")) {
      cleanedReply = cleanedReply.slice(0, -3);
    }
    cleanedReply = cleanedReply.trim();

    const gradingResult = JSON.parse(cleanedReply);

    // Validate and clamp marks
    const maxMarks = question.marks || 1;
    gradingResult.marksAwarded = Math.max(
      0,
      Math.min(maxMarks, gradingResult.marksAwarded || 0)
    );
    gradingResult.totalMarks = maxMarks;

    return gradingResult;
  } catch (error) {
    console.error("Grading error:", error);
    // Return a fallback result on error
    return {
      marksAwarded: 0,
      totalMarks: question.marks || 1,
      justification:
        "Unable to grade this answer automatically. Please review manually.",
      suggestion: null,
    };
  }
};
