import StorageService from "./storageService.js";

// Reuse StorageService's request helper which has proper timeout and error handling
const request = async (endpoint, method = "GET", body) => {
  return StorageService.request(endpoint, method, body);
};

/**
 * Generates a quiz by calling the secure backend endpoint with SSE support.
 * The user's tier and authentication are handled automatically by the backend
 * using the JWT token passed in the request.
 * @param {string} topic
 * @param {string} difficulty
 * @param {number} questionCount
 * @param {string[]} types
 * @param {number} totalMarks
 * @param {string} [examStyleId="standard"]
 * @param {object} [fileData]
 * @param {function} [onProgress] - Callback for progress updates
 * @returns {Promise<Quiz>} The generated Quiz object.
 */
export const generateQuiz = async (
  topic,
  difficulty,
  questionCount,
  types,
  totalMarks,
  examStyleId = "standard",
  fileData,
  onProgress,
  extraOptions = {},
) => {
  const payload = {
    topic,
    difficulty,
    questionCount,
    types,
    totalMarks,
    examStyleId,
    fileData,
    ...extraOptions,
  };

  // Get token from localStorage
  const token = localStorage.getItem("token");

  return new Promise((resolve, reject) => {
    // Use fetch with streaming response
    fetch(`${import.meta.env.VITE_API_URL}/api/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.body;
      })
      .then((body) => {
        if (!body) throw new Error("No response body");

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const read = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "progress") {
                    if (onProgress) {
                      onProgress(
                        data.percentage,
                        data.stage,
                        data.questionsGenerated,
                      );
                    }
                  } else if (data.type === "complete") {
                    resolve(data.data);
                  } else if (data.type === "error") {
                    reject(new Error(data.message));
                  }
                } catch (err) {
                  console.error(
                    "Error parsing SSE message:",
                    err,
                    "Line:",
                    line,
                  );
                }
              }
            }

            await read();
          } catch (err) {
            reject(err);
          }
        };

        read();
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        reject(err);
      });
  });
};

/**
 * Generates a demo quiz (public endpoint, strict limits).
 */
export const generateDemoQuiz = async (topic, onProgress) => {
  return new Promise((resolve, reject) => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ai/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.body;
      })
      .then((body) => {
        if (!body) throw new Error("No response body");
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const read = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "progress") {
                    if (onProgress)
                      onProgress(
                        data.percentage,
                        data.stage,
                        data.questionsGenerated,
                      );
                  } else if (data.type === "complete") {
                    resolve(data.data);
                  } else if (data.type === "error") {
                    reject(new Error(data.message));
                  }
                } catch (err) {
                  console.error("Error parsing SSE message:", err, line);
                }
              }
            }
            await read();
          } catch (err) {
            reject(err);
          }
        };
        read();
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        reject(err);
      });
  });
};

/**
 * Generates a performance review by calling the secure backend endpoint.
 * @param {object} user - The client-side UserProfile (needed to pass user.name/tier to server).
 * @param {object[]} quizzes - Array of completed quiz data.
 * @returns {Promise<string>} The AI-generated review text.
 */
export const generatePerformanceReview = async (user, quizzes) => {
  const payload = {
    user: {
      name: user.name,
      tier: user.tier,
    },
    quizzes,
  };

  // Call the secure server endpoint
  return request("/api/ai/review", "POST", payload);
};

/**
 * Executes the full cycle: generates a new AI review and saves it to the DB.
 * This function is designed to be called when a quiz is COMPLETED.
 * @param {object} user - The current user object.
 * @param {object[]} updatedQuizzes - The full list of quizzes including the new one.
 * @returns {Promise<string>} The newly generated review text.
 */
export const generateAndSaveReview = async (user, updatedQuizzes) => {
  const result = await generatePerformanceReview(user, updatedQuizzes);
  const reviewText = result.review;

  if (!reviewText) {
    throw new Error("AI review generation returned empty text.");
  }

  await StorageService.saveReview(reviewText);

  return reviewText;
};

/**
 * Sends a chat message to the AI Study Buddy.
 * @param {object[]} messages - Array of message objects {role: 'user'|'model', content: string}
 * @param {object} context - Context object {type, topic, questionText, correctAnswer, explanation}
 * @returns {Promise<string>} The AI's reply.
 */
export const chatWithAI = async (messages, context) => {
  const payload = {
    messages,
    context,
  };
  const response = await request("/api/ai/chat", "POST", payload);
  return response.reply;
};

/**
 * Grades a Short Answer or Essay question using AI.
 * @param {object} question - The question object { text, type, marks, correctAnswer }
 * @param {string} userAnswer - The student's answer
 * @param {string} topic - The quiz topic for context
 * @returns {Promise<object>} - { marksAwarded, totalMarks, justification, suggestion }
 */
export const gradeAnswer = async (question, userAnswer, topic) => {
  const payload = {
    question,
    userAnswer,
    topic,
  };
  const response = await request("/api/ai/grade", "POST", payload);
  return response;
};
