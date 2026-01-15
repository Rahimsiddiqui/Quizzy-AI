import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CheckCircle, Clock, RotateCcw } from "lucide-react";

import StorageService from "../../services/storageService.js";

const RATING_BUTTONS = [
  {
    rating: 1,
    label: "Forgot",
    color: "red",
    tooltip: "Schedule for tomorrow",
  },
  { rating: 2, label: "Hard", color: "orange", tooltip: "Needs more practice" },
  { rating: 3, label: "Good", color: "blue", tooltip: "Average performance" },
  { rating: 4, label: "Easy", color: "green", tooltip: "Long interval" },
];

export const FlashcardReview = () => {
  const [cards, setCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const allCards = await StorageService.getFlashcards();
      const now = Date.now();
      const due = allCards
        .filter((c) => (c.nextReview || 0) <= now)
        .sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));

      setCards(allCards);
      setDueCount(due.length);
      if (due.length > 0) {
        setCurrentCard(due[0]);
      } else {
        setCurrentCard(null);
      }
      setIsFlipped(false);
    } catch (err) {
      console.error("Load cards error:", err);
      toast.error("Could not load flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  // [DX_IMPROVEMENT]: Refactor handleRate to use a cleaner helper function for next review time calculation, improving logic separation.
  const calculateNextReview = (interval, easeFactor, rating) => {
    let newInterval = interval || 0;
    let newEase = easeFactor || 2.5;

    if (rating === 1) {
      newInterval = 1; // Immediate reset to 1 day
    } else {
      // SM-2 logic implementation
      if (newInterval === 0) newInterval = 1;
      else if (newInterval === 1) newInterval = 3;
      else newInterval = Math.ceil(newInterval * newEase);

      newEase = newEase + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
      if (newEase < 1.3) newEase = 1.3;
    }

    const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;

    return { newInterval, newEase, nextReview };
  };

  const handleRate = async (rating) => {
    if (!currentCard) return;

    const { newInterval, newEase, nextReview } = calculateNextReview(
      currentCard.interval,
      currentCard.easeFactor,
      rating
    );

    const updatedCard = {
      ...currentCard,
      interval: newInterval,
      easeFactor: newEase,
      nextReview,
      repetition: (currentCard.repetition || 0) + 1,
      lastReviewed: Date.now(),
    };

    try {
      await StorageService.updateFlashcard(updatedCard);
      toast.success(
        `Card rated: ${
          RATING_BUTTONS.find((b) => b.rating === rating)?.label || "Updated"
        }!`
      );
      await loadCards();
    } catch (err) {
      console.error("Rate card error:", err);
      toast.error("Failed to save progress.");
    }
  };

  const getNextReviewDays = (interval, easeFactor, rating) => {
    const { nextReview } = calculateNextReview(interval, easeFactor, rating);
    return Math.ceil((nextReview - Date.now()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
        <RotateCcw className="w-10 h-10 text-primary animate-spin" />
        <h2 className="text-xl font-bold text-textMain mt-4">
          Loading Flashcards...
        </h2>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <RotateCcw className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-textMain mb-2">
          No flashcards yet
        </h2>
        <p className="text-textMuted max-w-sm">
          Create a quiz and enable Flashcards during generation to study
          effectively.
        </p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
        <div className="p-4 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-textMain mb-2">
          All Caught Up!
        </h2>
        <p className="text-textMuted">
          You've reviewed all your due cards for now.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Total Cards: {cards.length}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[60vh] flex flex-col pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-textMain">Review Session</h1>
        <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-bold border border-primary/20 shadow-sm">
          {dueCount} Due {dueCount > 0 ? "⚠️" : "🎉"}
        </span>
      </div>

      <div className="flex-1 relative" style={{ perspective: "1000px" }}>
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full relative cursor-pointer transition-transform duration-500`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-3xl p-10 flex flex-col items-center justify-center shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <span className="absolute top-6 left-6 text-xs font-bold text-primary tracking-widest uppercase">
              Question
            </span>
            {/* [A11Y_IMPROVEMENT]: Ensure sufficient contrast for the question text. */}
            <p className="text-xl md:text-2xl font-semibold text-center text-textMain overflow-y-auto max-h-[80%] custom-scrollbar px-2">
              {currentCard.front}
            </p>

            <div className="absolute bottom-6 text-base text-textMuted flex items-center gap-2">
              <Clock className="w-4 h-4" /> **Tap card to reveal answer**
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-surfaceHighlight border border-border rounded-3xl p-10 flex flex-col items-center justify-center shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="absolute top-6 left-6 text-xs font-bold text-indigo-600 tracking-widest uppercase">
              Answer
            </span>
            <div className="text-lg text-center text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-[80%] custom-scrollbar px-2 w-full">
              {currentCard.back}
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-8 grid grid-cols-4 gap-4 animate-fade-in-up">
          {RATING_BUTTONS.map(({ rating, label, color, tooltip }) => {
            const days = getNextReviewDays(
              currentCard.interval,
              currentCard.easeFactor,
              rating
            );

            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-200 hover:bg-${color}-100 font-medium text-sm transition-colors shadow-sm`}
                title={`${label} (${
                  days === 1 ? "Next: Tomorrow" : `${days} days`
                }) - ${tooltip}`}
              >
                {label} ({days}d)
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
