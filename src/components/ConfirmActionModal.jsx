import { AlertCircle } from "lucide-react";

export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-lg animate-fade-in">
        <div className="flex flex-col justify-center text-center relative z-100 items-center gap-4 mb-4">
          <div
            className={`p-3 rounded-xl ${
              isDangerous
                ? "bg-red-500/20 text-red-500"
                : "bg-blue-500/20 text-blue-500"
            }`}
          >
            <AlertCircle size={30} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-textMain mt-2 mb-4">
              {title}
            </h2>
            <p className="text-sm text-textMuted">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-textMain font-semibold hover:bg-surfaceHighlight transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDangerous
                ? "bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500/30"
                : "bg-blue-500/20 text-blue-500 border border-blue-500/20 hover:bg-blue-500/30"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
