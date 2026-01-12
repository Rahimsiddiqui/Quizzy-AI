import { Crown, Check, Zap, Star } from "lucide-react";
import { toast } from "react-toastify";

import StorageService from "../services/storageService.js";
import { SubscriptionTier } from "../../server/config/types.js";

const TIER_DATA = {
  [SubscriptionTier.Free]: {
    title: "Free Starter",
    price: "$0",
    icon: Star,
    diffClass: false,
    colorClasses: {
      iconBg: "bg-gray-100 dark:bg-gray-300",
      iconText: "text-gray-500 dark:text-gray-600",
      check: "text-green-500 dark:text-green-400",x
      border: "border-border",
      buttonBg:
        "bg-surfaceHighlight hover:bg-gray-400/20 dark:hover:bg-gray-600/40",
      buttonText: "text-textMuted",
    },
    features: [
      { name: "7 Quizzes / Month", included: true },
      { name: "3 Flashcard Sets / Month", included: true },
      { name: "Max 10 Questions", included: true },
      { name: "Max 30 Marks", included: true },
      { name: "3 PDF Uploads / Month", included: true },
      { name: "3 PDF Exports / Month", included: true },
      { name: "Upload 1 PDF per quiz", included: true },
      { name: "Gemini 2.5 Lite", included: true },
    ],
  },
  [SubscriptionTier.Basic]: {
    title: "Scholar Basic",
    price: "$4.99",
    icon: Zap,
    diffClass: false,
    colorClasses: {
      iconBg: "bg-blue-100 dark:bg-blue-300",
      iconText: "text-blue-600 dark:text-blue-700",
      check: "text-blue-600 dark:text-blue-500",
      border:
        "border-blue-300 ring-2 ring-blue-100 dark:border-blue-900 dark:ring-blue-800",
      buttonBg:
        "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800",
      buttonText: "text-white",
    },
    features: [
      { name: "35 Quizzes / Month", included: true },
      { name: "17 Flashcard Sets / Month", included: true },
      { name: "Max 25 Questions", included: true },
      { name: "Max 60 Marks", included: true },
      { name: "15 PDF Uploads / Month", included: true },
      { name: "15 PDF Exports / Month", included: true },
      { name: "Upload 1 PDF per quiz", included: true },
      { name: "Gemini 2.5 Flash", included: true },
    ],
  },
  [SubscriptionTier.Pro]: {
    title: "Mastermind Pro",
    price: "$11.99",
    icon: Crown,
    diffClass: true,
    colorClasses: {
      iconBg: "bg-amber-100 dark:bg-amber-200",
      iconText: "text-amber-600 dark:text-amber-700",
      check: "text-amber-500 dark:text-amber-600",
      border:
        "border-amber-400 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-700",
      buttonBg: "",
      buttonText: "text-white",
    },
    features: [
      { name: "Unlimited Quizzes", included: true },
      { name: "Unlimited Flashcards", included: true },
      { name: "Max 45 Questions", included: true },
      { name: "Max 100 Marks", included: true },
      { name: "Unlimited PDF Uploads", included: true },
      { name: "Unlimited PDF Exports", included: true },
      { name: "Upload multiple PDF's per quiz", included: true },
      { name: "Gemini 3 Pro", included: true },
    ],
  },
};

const TierCard = ({ tier, currentTier, handleUpgrade }) => {
  const data = TIER_DATA[tier];
  const Icon = data.icon;
  const isCurrent = currentTier === tier;

  let buttonText;
  let disabled = false;

  const tierOrder = [
    SubscriptionTier.Free,
    SubscriptionTier.Basic,
    SubscriptionTier.Pro,
  ];
  const tierIndex = tierOrder.indexOf(tier);
  const currentIndex = tierOrder.indexOf(currentTier);

  if (tier === currentTier) {
    buttonText = "Current Plan";
    disabled = true;
  } else if (tierIndex > currentIndex) {
    buttonText = "Upgrade Now";
  } else {
    buttonText = "Downgrade";
  }

  const shadowClass =
    tier === SubscriptionTier.Basic
      ? "shadow-md shadow-blue-500 dark:shadow-blue-600/40"
      : tier === SubscriptionTier.Pro &&
        "shadow-md shadow-amber-300 dark:shadow-amber-600/40";

  return (
    <div
      className={`bg-surface rounded-2xl p-8 border ${
        data.colorClasses.border
      } ${shadowClass} flex flex-col h-full relative overflow-hidden ${
        tier !== SubscriptionTier.Pro
          ? "transition-all hover:scale-[1.01] duration-300"
          : ""
      }`}
    >
      {tier === SubscriptionTier.Pro && (
        <>
          <div className="absolute top-0 inset-x-0 h-1.5"></div>
          <div className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-300 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200 shadow-sm">
            Best Value
          </div>
        </>
      )}

      <div className={`mb-6 p-4 ${data.colorClasses.iconBg} w-fit rounded-xl`}>
        <Icon className={`w-8 h-8 ${data.colorClasses.iconText}`} />
      </div>

      <h3 className="text-xl font-bold text-textMain mb-2">{data.title}</h3>
      <div className="text-4xl font-bold text-textMain mb-6">
        {data.price}{" "}
        <span className="text-sm text-textMuted font-medium">/ month</span>
      </div>

      <ul className="space-y-4 mb-8 flex-1 border-t border-border pt-6">
        {data.features.map((feature) => (
          <li key={feature.name} className="flex items-center gap-3 text-sm">
            <Check
              className={`w-5 h-5 shrink-0 ${
                feature.included
                  ? data.colorClasses.check
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />
            <span
              className={`${
                feature.included
                  ? tier === SubscriptionTier.Free
                    ? "text-textMuted"
                    : "text-textMain font-medium"
                  : "text-gray-500 dark:text-gray-400 line-through"
              }`}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => handleUpgrade(tier)}
        disabled={disabled}
        className={`w-full py-4 rounded-xl point ${
          data.diffClass
            ? "bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 text-white shadow-lg shadow-amber-500/50 dark:shadow-amber-600/30"
            : data.colorClasses.buttonBg
        } ${
          data.colorClasses.buttonText
        } text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto ${
          isCurrent ? "border border-border/50 shadow-none" : ""
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};

const Subscription = ({ user, onUpgrade }) => {
  const currentTier = user?.tier || SubscriptionTier.Free;

  const handleUpgrade = async (tier) => {
    const confirmPayment = window.confirm(
      `Proceed to change plan to ${TIER_DATA[tier].title} for ${TIER_DATA[tier].price}/month? (Simulated)`
    );
    if (!confirmPayment) return;

    try {
      await StorageService.upgradeTier(tier);
      const updatedUser = await StorageService.refreshUser();
      window.dispatchEvent(
        new CustomEvent("userUpdated", { detail: updatedUser })
      );
      toast.success(`Plan updated to ${updatedUser.tier}`);
      if (onUpgrade) onUpgrade();
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleRefund = async () => {
    const confirmRefund = window.confirm(
      "Request a refund? You will lose access to premium features immediately. This action cannot be undone."
    );
    if (!confirmRefund) return;

    try {
      await StorageService.requestRefund();
      toast.success("Refund request submitted. Check your email for details.");
      if (onUpgrade) onUpgrade();
    } catch {
      toast.error("Failed to request refund. Please contact support.");
    }
  };

  return (
    <div className="py-6 md:py-10">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-textMain flex items-center gap-3">
          <Crown className="w-7 h-7 text-amber-500" /> Subscription Plans
        </h1>
        <p className="text-textMuted mt-2">
          Choose the plan that best fits your study needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <TierCard
          tier={SubscriptionTier.Free}
          currentTier={currentTier}
          handleUpgrade={handleUpgrade}
        />
        <TierCard
          tier={SubscriptionTier.Basic}
          currentTier={currentTier}
          handleUpgrade={handleUpgrade}
        />
        <TierCard
          tier={SubscriptionTier.Pro}
          currentTier={currentTier}
          handleUpgrade={handleUpgrade}
        />
      </div>

      {currentTier !== SubscriptionTier.Free && (
        <div className="mt-10 pt-8 border-t border-border">
          <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-textMain mb-4.5">
              Want to request a refund?
            </h3>
            <p className="text-textMuted mb-5">
              We offer a 30-day money-back guarantee on all paid subscriptions.
              If you're not satisfied, you can request a full refund with no
              questions asked.
            </p>
            <button
              onClick={handleRefund}
              className="px-6 py-2 bg-red-700/90 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-semibold transition-all point"
            >
              Request Refund
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-textMuted mt-8 border-t border-border pt-4">
        *Payments are simulated in this environment. No real charges will occur.
      </p>
    </div>
  );
};

export default Subscription;
