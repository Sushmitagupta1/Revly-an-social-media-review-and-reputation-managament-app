import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"

const PLATFORMS = [
  { id: "google", label: "Google My Business", icon: "G" },
  { id: "zomato", label: "Zomato", icon: "Z" },
  { id: "reelo", label: "Reelo", icon: "R" },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function PlatformFilterModal({ open, onClose }: Props) {
  const { selectedPlatforms, setPlatforms } = useFilterStore()
  const [temp, setTemp] = useState<string[]>(selectedPlatforms)

  const toggle = (id: string) => {
    setTemp((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const apply = () => {
    setPlatforms(temp)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter Platforms</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
              <input
                type="checkbox"
                checked={temp.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="h-4 w-4"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded bg-info text-xs font-bold text-white">{p.icon}</span>
              <span className="text-sm text-text">{p.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
