import { cn } from "@/lib/utils";
import { CONFIDENCE_CONFIG, getConfidenceTier } from "@/types/chat";

interface ConfidenceBadgeProps {
  score: number;
  showScore?: boolean;
}

export function ConfidenceBadge({
  score,
  showScore = false,
}: ConfidenceBadgeProps) {
  const tier = getConfidenceTier(score);
  const config = CONFIDENCE_CONFIG[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-extrabold",
        config.bgColor,
        config.borderColor,
        config.color,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": tier === "high",
          "bg-amber-500": tier === "medium",
          "bg-rose-500": tier === "low",
        })}
      />
      {config.label}
      {showScore && (
        <span className="opacity-60 font-normal">
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}
