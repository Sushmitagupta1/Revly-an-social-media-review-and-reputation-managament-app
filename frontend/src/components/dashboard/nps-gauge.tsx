import { cn } from "@/lib/utils"

interface Props {
  score: number
}

function getNpsColor(score: number): string {
  if (score >= 50) return "text-success"
  if (score >= 0) return "text-warning"
  return "text-danger"
}

function getNpsLabel(score: number): string {
  if (score >= 70) return "Excellent"
  if (score >= 50) return "Great"
  if (score >= 0) return "Needs Improvement"
  return "Critical"
}

export default function NpsGauge({ score }: Props) {
  const clamped = Math.max(-100, Math.min(100, score))

  return (
    <div className="rounded-2xl bg-card p-6 flex flex-col items-center">
      <h3 className="mb-4 text-sm font-semibold text-text">NPS Score</h3>
      <div className="relative h-28 w-40">
        <svg viewBox="0 0 200 100" className="h-full w-full">
          <path
            d="M 10 90 A 90 90 0 0 1 190 90"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 10 90 A 90 90 0 0 1 190 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${((clamped + 100) / 200) * 283} 283`}
            className={getNpsColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className={cn("text-3xl font-bold", getNpsColor(score))}>{score}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-text-secondary">{getNpsLabel(score)}</p>
    </div>
  )
}
