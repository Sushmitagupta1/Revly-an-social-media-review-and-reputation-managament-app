import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESETS = ["Today", "Yesterday", "Past 7 Days", "Past 30 Days"]
const GRANULARITIES = ["Daily", "Weekly", "Monthly", "Quarterly"]

interface Props {
  open: boolean
  onClose: () => void
}

export default function DateFilterModal({ open, onClose }: Props) {
  const { datePreset, setDatePreset, dateRange, setDateRange } = useFilterStore()
  const [tempPreset, setTempPreset] = useState(datePreset)
  const [tempRange, setTempRange] = useState(dateRange)

  const apply = () => {
    setDatePreset(tempPreset)
    setDateRange(tempRange.from, tempRange.to)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter by Date</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Range</label>
          <div className="flex gap-2">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                onClick={() => setTempPreset(g)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  tempPreset === g
                    ? "border-info bg-info text-white"
                    : "border-border text-text-secondary hover:border-info"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Quick Select</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTempPreset(p)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  tempPreset === p
                    ? "border-info bg-info text-white"
                    : "border-border text-text hover:border-info"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Custom Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={tempRange.from || ""}
              onChange={(e) => setTempRange((r) => ({ ...r, from: e.target.value || null }))}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
            <input
              type="date"
              value={tempRange.to || ""}
              onChange={(e) => setTempRange((r) => ({ ...r, to: e.target.value || null }))}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
