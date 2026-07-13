import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; platform: string; avg_rating?: number; review_count?: number }) => void
}

export default function CompetitorForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState("google")
  const [rating, setRating] = useState("")
  const [count, setCount] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      platform,
      avg_rating: rating ? parseFloat(rating) : undefined,
      review_count: count ? parseInt(count) : undefined,
    })
    setName("")
    setRating("")
    setCount("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Competitor</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input placeholder="Competitor name" value={name} onChange={(e) => setName(e.target.value)} />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="google">Google</option>
          <option value="zomato">Zomato</option>
          <option value="reelo">Reelo</option>
        </select>
        <Input type="number" step="0.1" min="0" max="5" placeholder="Avg rating" value={rating} onChange={(e) => setRating(e.target.value)} />
        <Input type="number" min="0" placeholder="Review count" value={count} onChange={(e) => setCount(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={!name.trim()}>Add Competitor</Button>
    </form>
  )
}
