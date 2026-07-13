import { Lightbulb } from "lucide-react"

interface Props {
  suggestions: string[]
  onSelect: (question: string) => void
}

export default function SuggestedQuestions({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-card-secondary hover:text-text"
        >
          <Lightbulb className="h-3 w-3 text-warning" />
          {q}
        </button>
      ))}
    </div>
  )
}
