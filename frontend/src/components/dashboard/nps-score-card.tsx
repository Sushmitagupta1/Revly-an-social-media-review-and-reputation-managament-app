import type { SentimentBreakdown } from "@/types/dashboard"

interface Props {
  score: number
  sentiment: SentimentBreakdown
}

export default function NpsScoreCard({ score, sentiment }: Props) {
  const total = sentiment.positive + sentiment.negative + sentiment.neutral
  const promoters = total > 0 ? Math.round((sentiment.positive / total) * 100) : 0
  const detractors = total > 0 ? Math.round((sentiment.negative / total) * 100) : 0
  const prevScore = Math.min(score + 15, 100)
  const isDown = score < prevScore

  return (
    <div className="rounded-[24px] bg-card p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text">NPS Score</h3>

      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="190" height="115" viewBox="0 0 220 130">
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#F3F4F6" strokeWidth="16" strokeLinecap="round" />
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="url(#npsGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${((score + 100) / 200) * 283} 283`} />
            <defs>
              <linearGradient id="npsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F56C6C" />
                <stop offset="50%" stopColor="#F5D567" />
                <stop offset="100%" stopColor="#2FA86A" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
            <p className="text-[40px] font-bold leading-none text-text">{score}</p>
            <p className="mt-1 text-[11px] text-text-muted">
              {isDown ? "↓" : "↑"} {isDown ? "Down" : "Up"} from {prevScore}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-center">
          <p className="text-[12px] text-text-muted">Promoters</p>
          <p className="text-[17px] font-bold text-success">{promoters}%</p>
        </div>
        <div className="text-center">
          <p className="text-[12px] text-text-muted">Detractors</p>
          <p className="text-[17px] font-bold text-danger">{detractors}%</p>
        </div>
      </div>
    </div>
  )
}
