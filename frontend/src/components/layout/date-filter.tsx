import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

const durationOptions = [
  { label: "Today", getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }
  }},
  { label: "Yesterday", getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] }
  }},
  { label: "Past 7 Days", getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }
  }},
  { label: "Past 30 Days", getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] }
  }},
  { label: "All Time", getRange: () => ({ from: "", to: "" }) },
]

export default function DateFilter() {
  const { datePreset, setDatePreset, dateRange, setDateRange } = useFilterStore()
  const [open, setOpen] = useState(false)
  const [tempPreset, setTempPreset] = useState(datePreset)
  const [customFrom, setCustomFrom] = useState(dateRange.from || "")
  const [customTo, setCustomTo] = useState(dateRange.to || "")

  const isCustom = tempPreset === "Custom"

  function handleApply() {
    if (isCustom) {
      setDatePreset("Custom")
      setDateRange(customFrom || null, customTo || null)
    } else {
      const opt = durationOptions.find((d) => d.label === tempPreset)
      if (opt) {
        const range = opt.getRange()
        setDatePreset(tempPreset)
        setDateRange(range.from || null, range.to || null)
      }
    }
    setOpen(false)
  }

  const currentLabel = datePreset || "All Time"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10 border border-white/5"
      >
        <Calendar className="h-4 w-4 text-accent" />
        <div className="flex-1">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Time</span>
          <div className="font-medium">{currentLabel}</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-[28px] bg-sidebar p-8 shadow-2xl border border-white/10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <span className="text-lg font-semibold text-white">Date Filter</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="mb-6">
              <span className="mb-3 block text-[10px] font-medium text-white/40 uppercase tracking-wider">Duration</span>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setTempPreset(option.label)}
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                      tempPreset === option.label
                        ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  onClick={() => setTempPreset("Custom")}
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                    tempPreset === "Custom"
                      ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  Custom
                </button>
              </div>
            </div>

            {isCustom && (
              <div className="space-y-4 rounded-2xl bg-white/5 p-5 border border-white/5 mb-6">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Start date</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">End date</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleApply}
              className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-all shadow-[0_0_25px_rgba(255,106,43,0.3)]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  )
}
