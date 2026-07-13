import { Sparkles } from "lucide-react"

export default function AiBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-primary p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/20">
          <Sparkles className="h-5 w-5 text-info" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Set up Revly's auto response</p>
          <p className="text-xs text-text-secondary">Respond to all reviews in 30 mins</p>
        </div>
      </div>
      <button className="rounded-lg bg-info px-4 py-2 text-xs font-medium text-white hover:bg-info/90">
        Set up now →
      </button>
    </div>
  )
}
