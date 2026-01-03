import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AchievementCelebration = ({ achievement, onClose }) => {
  const [showButton, setShowButton] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show button after card has settled (after 0.8s)
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 800);

    // Auto-close after 5 seconds
    const closeTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(buttonTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      {/* Background Overlay with Dim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Confetti Container */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <Confetti />
      </div>

      {/* Achievement Card */}
      <motion.div
        initial={{ y: -300, opacity: 0, scale: 0.8 }}
        animate={
          isClosing
            ? { y: 100, opacity: 0, scale: 0 }
            : { y: 0, opacity: 1, scale: 1 }
        }
        exit={{ y: 300, opacity: 0, scale: 0.8 }}
        transition={
          isClosing
            ? {
                type: "spring",
                damping: 8,
                stiffness: 100,
                duration: 0.4,
              }
            : {
                type: "spring",
                damping: 15,
                stiffness: 100,
                duration: 0.8,
              }
        }
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-rose-500 rounded-3xl p-1 shadow-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 min-w-80">
            {/* Icon/Badge Container */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 12,
                  stiffness: 100,
                  delay: 0.3,
                }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 dark:from-yellow-400 dark:to-orange-500 flex items-center justify-center text-5xl shadow-lg"
              >
                {achievement.icon || "🏆"}
              </motion.div>
            </div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-textMain dark:text-white mb-2">
                🎉 Achievement Unlocked!
              </h2>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-rose-500 dark:from-yellow-400 dark:to-rose-400 bg-clip-text text-transparent mb-3">
                {achievement.name}
              </h3>
              <p className="text-textMuted dark:text-slate-300 text-sm leading-relaxed max-w-xs mx-auto mb-4">
                {achievement.description}
              </p>

              {/* EXP Award Badge */}
              {achievement.expReward && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 100,
                    delay: 0.4,
                  }}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-full text-white font-semibold text-sm mb-6 shadow-lg dark:shadow-emerald-500/20"
                >
                  +{achievement.expReward} EXP
                </motion.div>
              )}
            </motion.div>

            {/* Button */}
            <AnimatePresence>
              {showButton && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 150,
                  }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleClose}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white font-bold rounded-full shadow-lg dark:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 point"
                  >
                    Cool!
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Confetti Component
const Confetti = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 1,
    size: 8 + Math.random() * 12,
    rotation: Math.random() * 360,
  }));

  return (
    <>
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            top: -20,
            left: `${piece.left}%`,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            top: "100vh",
            opacity: 0,
            rotate: piece.rotation + 360,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
          className="fixed pointer-events-none"
        >
          <div
            className={`w-${Math.floor(piece.size / 4)} h-${Math.floor(
              piece.size / 4
            )} rounded-full`}
            style={{
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: [
                "#FFD700",
                "#FFA500",
                "#FF6B6B",
                "#4ECDC4",
                "#45B7D1",
                "#96CEB4",
              ][Math.floor(Math.random() * 6)],
              opacity: 0.8,
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

export default AchievementCelebration;
