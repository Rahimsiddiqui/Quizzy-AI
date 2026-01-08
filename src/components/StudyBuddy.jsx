import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Loader2,
  Sparkles,
  SkipForward,
  History,
  Plus,
  ArrowLeft,
  Trash2,
  Search,
} from "lucide-react";
import { chatWithAI } from "../services/geminiService";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

// Typewriter component for gradual text reveal
const TypewriterMessage = ({ content, onComplete, speed = 15 }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const intervalRef = useRef(null);

  const skipToEnd = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDisplayedContent(content);
    setIsComplete(true);
    setIsSkipped(true);
    if (onComplete) onComplete();
  }, [content, onComplete]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isSkipped) return;

    setDisplayedContent("");
    setIsComplete(false);

    // Type word by word for smoother experience
    const words = content.split(/(\s+)/);
    let currentIndex = 0;
    let currentText = "";

    intervalRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        currentText += words[currentIndex];
        setDisplayedContent(currentText);
        currentIndex++;
      } else {
        clearInterval(intervalRef.current);
        setIsComplete(true);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, speed, isSkipped]); // Removed onComplete from deps

  return (
    <div className="relative">
      <div className="prose dark:prose-invert prose-sm max-w-none space-y-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              return (
                <code
                  className={`${className} ${
                    inline
                      ? "bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs"
                      : "block bg-black/70 dark:bg-black/30 text-white p-2 rounded-lg my-2"
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {displayedContent}
        </ReactMarkdown>
        {!isComplete && (
          <span className="inline-block w-0.5 h-4 bg-indigo-500 dark:bg-indigo-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
      {!isComplete && (
        <button
          onClick={skipToEnd}
          className="absolute -bottom-6 right-0 text-xs text-textMuted hover:text-primary flex items-center gap-1 transition-colors point"
          title="Skip to full message"
        >
          <SkipForward className="w-3 h-3" />
          Skip
        </button>
      )}
    </div>
  );
};

const StudyBuddy = ({ context, isOpen, onClose, initialPrompt }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1);
  const [view, setView] = useState("chat"); // "chat" or "history"
  const [recentChats, setRecentChats] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const initialPromptProcessedRef = useRef(null); // Track processed initialPrompts

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize and Load Chats
  useEffect(() => {
    const savedChats = localStorage.getItem("qubli_ai_chats");
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setRecentChats(parsed);
      } catch (err) {
        console.error("Failed to parse chat history", err);
      }
    }
  }, []);

  // Session Management
  useEffect(() => {
    if (!isOpen) return;

    // Check if we should resume a context-specific session
    if (context?.quizId) {
      const existingSession = recentChats.find(
        (c) => c.quizId === context.quizId
      );
      if (existingSession && currentSessionId !== existingSession.id) {
        setCurrentSessionId(existingSession.id);
        setMessages(existingSession.messages);
        return;
      }
    }

    // Default: Welcome message if no session active
    if (!currentSessionId && messages.length === 0) {
      const newId = uuidv4();
      setCurrentSessionId(newId);
      setMessages([
        {
          role: "model",
          content: context?.quizId
            ? "Hi! I'm ready to help you review this quiz. Ask me anything about the questions!"
            : "Hi! I'm your AI Study Buddy. I can help you understand any topic better. What's on your mind?",
          isTyping: false,
        },
      ]);
    }
  }, [isOpen, context?.quizId, currentSessionId, messages.length, recentChats]);

  // Persist Current Session
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    const timeoutId = setTimeout(() => {
      let updatedChats = [...recentChats];
      const sessionIdx = updatedChats.findIndex(
        (c) => c.id === currentSessionId
      );

      const sessionData = {
        id: currentSessionId,
        topic: context?.topic || "General Discussion",
        quizId: context?.quizId,
        lastUpdated: Date.now(),
        messages: messages.map((m) => ({ ...m, isTyping: false })),
      };

      if (sessionIdx >= 0) {
        updatedChats[sessionIdx] = sessionData;
      } else {
        updatedChats.unshift(sessionData);
      }

      // Limit history to 20 chats
      if (updatedChats.length > 20) {
        updatedChats = updatedChats.slice(0, 20);
      }

      setRecentChats(updatedChats);
      localStorage.setItem("qubli_ai_chats", JSON.stringify(updatedChats));
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId, context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, minimized, view, scrollToBottom]);

  useEffect(() => {
    if (typingMessageIndex >= 0) {
      const scrollInterval = setInterval(scrollToBottom, 50);
      return () => clearInterval(scrollInterval);
    }
  }, [typingMessageIndex, scrollToBottom]);

  const startNewChat = () => {
    setCurrentSessionId(uuidv4());
    setMessages([
      {
        role: "model",
        content: "New session started! What would you like to discuss today?",
        isTyping: false,
      },
    ]);
    setView("chat");
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setView("chat");
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const updated = recentChats.filter((c) => c.id !== id);
    setRecentChats(updated);
    localStorage.setItem("qubli_ai_chats", JSON.stringify(updated));
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history?")) {
      setRecentChats([]);
      localStorage.removeItem("qubli_ai_chats");
      startNewChat();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input, isTyping: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await chatWithAI(history, context);

      setMessages((prev) => {
        const newMessages = [
          ...prev,
          { role: "model", content: reply, isTyping: true },
        ];
        setTypingMessageIndex(newMessages.length - 1);
        return newMessages;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I had trouble connecting.",
          isTyping: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypingComplete = useCallback((index) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, isTyping: false } : msg))
    );
    setTypingMessageIndex(-1);
  }, []);

  // Auto-submit initialPrompt
  useEffect(() => {
    if (
      isOpen &&
      initialPrompt &&
      initialPromptProcessedRef.current !== initialPrompt &&
      !loading &&
      currentSessionId
    ) {
      initialPromptProcessedRef.current = initialPrompt;
      const userMsg = { role: "user", content: initialPrompt, isTyping: false };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const runAuto = async () => {
        try {
          // Include basic model intro in history for context
          const history = [
            {
              role: "model",
              content: "Hi! I'm ready to help you review this quiz.",
            },
            { role: "user", content: initialPrompt },
          ];
          const reply = await chatWithAI(history, context);
          setMessages((prev) => {
            const newMessages = [
              ...prev,
              { role: "model", content: reply, isTyping: true },
            ];
            setTypingMessageIndex(newMessages.length - 1);
            return newMessages;
          });
        } catch {
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };
      runAuto();
    }
  }, [isOpen, initialPrompt, loading, context, currentSessionId]);

  if (!isOpen) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-15 right-2 sm:bottom-20 md:bottom-4 md:right-4 z-50 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 animate-fade-in-up point"
      >
        <Bot className="w-6 h-6" />
        <span className="font-bold hidden xs:inline">Study Buddy</span>
      </button>
    );
  }

  const filteredChats = recentChats.filter(
    (c) =>
      c.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-300 w-full h-full flex flex-col bg-surface overflow-hidden animate-fade-in-up xs:inset-auto xs:bottom-15 xs:right-6 sm:bottom-20 sm:right-4 md:bottom-4 xs:h-[500px] xs:max-h-[80vh] xs:w-full xs:max-w-[350px] sm:max-w-[400px] xs:rounded-2xl xs:border xs:border-border xs:shadow-lg-custom">
      {/* Header */}
      <div className="p-4 bg-primary dark:bg-blue-800 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {view === "history" ? (
            <button
              onClick={() => setView("chat")}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-1.5 bg-blue-300/35 dark:bg-blue-300/30 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm">Study Buddy</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              {view === "chat" ? "Active Session" : "Recent Chats"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === "chat" ? (
            <>
              <button
                onClick={() => setView("history")}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
                title="Chat History"
              >
                <History className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={clearAllHistory}
                className="p-1.5 hover:bg-red-500/30 rounded-lg transition-colors point"
                title="Clear All History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={startNewChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-600/70 rounded-lg transition-colors point"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "history" ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
          <div className="p-4 border-b border-border bg-white dark:bg-surface">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-textMuted text-sm">
                <History className="w-8 h-8 mb-2 opacity-20" />
                No history found
              </div>
            ) : (
              filteredChats.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                    currentSessionId === session.id
                      ? "bg-primary/5 border-primary/20"
                      : "bg-white dark:bg-surface border-transparent hover:border-border hover:bg-white/50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-textMain truncate">
                        {session.topic}
                      </div>
                      <div className="text-[10px] text-textMuted mt-1">
                        {new Date(session.lastUpdated).toLocaleDateString()} ·{" "}
                        {session.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-blue-100 text-primary dark:bg-blue-800/40"
                      : "bg-indigo-100 text-indigo-600 dark:bg-indigo-800/35"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-surface border border-border text-textMain"
                  } ${msg.isTyping ? "pb-8" : ""}`}
                >
                  {msg.role === "model" ? (
                    msg.isTyping ? (
                      <TypewriterMessage
                        content={msg.content}
                        onComplete={() => handleTypingComplete(idx)}
                        speed={40}
                      />
                    ) : (
                      <div className="prose dark:prose-invert prose-sm max-w-none space-y-2">
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }) {
                              return (
                                <code
                                  className={`${className} ${
                                    inline
                                      ? "bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs"
                                      : "block bg-black/70 dark:bg-black/30 text-white p-2 rounded-lg my-2"
                                  }`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-800/35 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-surface border border-border p-3 rounded-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white mb-12 xs:mb-0 dark:bg-surface border-t border-border flex items-end gap-2 shrink-0"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none max-h-[100px] text-textMain"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-primary text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default StudyBuddy;
