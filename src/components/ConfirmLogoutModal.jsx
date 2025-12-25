import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

const ConfirmLogoutModal = ({
  open,
  onClose,
  onConfirm,
  isProcessing = false,
  title = "Confirm",
  description = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="pointer-events-auto bg-surface dark:bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>

                <h3 className="text-2xl font-bold text-center text-textMain">
                  {title}
                </h3>

                <div className="text-sm text-textMuted text-center">
                  {description}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-surfaceHighlight dark:bg-[#374151] text-textMain font-medium hover:bg-gray-200 dark:hover:bg-[#4B5563] transition-colors disabled:opacity-50 disabled:cursor-not-allowed point"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 dark:bg-amber-700 text-white font-medium hover:bg-amber-700 dark:hover:bg-amber-800 transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 point"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>{confirmLabel}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmLogoutModal;
