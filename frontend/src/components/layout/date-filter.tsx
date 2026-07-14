import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { cn } from "@/lib/utils"
import { Calendar, X } from "lucide-react"

const rangeOptions = [
  { label: "Daily", desc: "Day by day" },
  { label: "Weekly", desc: "Week by week" },
  { label: "Monthly", desc: "Month by month" },
  { label: "Quarterly", desc: "Quarter by quarter" },
]

const durationOptions = [
  { label: "Today", desc: "Current day" },
  { label: "Yesterday", desc: "Previous day" },
  { label: "Past 7 Days", desc: "Last week" },
  { label: "Past 30 Days", desc: "Last month" },
  { label: "Custom", desc: "Pick dates" },
]

export default function DateFilter() {
  const { datePreset, setDatePreset, dateRange, setDateRange } = useFilterStore()
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(dateRange.from || "")
  const [customTo, setCustomTo] = useState(dateRange.to || "")

  const isCustom = durationOptions.findIndex((d) => d.label === datePreset) === 4

  function handleDurationSelect(option: string) {
    setDatePreset(option)
  }

  function handleApply() {
    setDateRange(customFrom || null, customTo || null)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10 border border-white/5"
      >
        <Calendar className="h-4 w-4 text-accent" />
        <div className="flex-1">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Time</span>
          <div className="font-medium">{datePreset}</div>
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
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <span className="mb-3 block text-[10px] font-medium text-white/40 uppercase tracking-wider">Range</span>
              <div className="grid grid-cols-2 gap-2">
                {rangeOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setDatePreset(option.label)}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-left transition-all",
                      datePreset === option.label
                        ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-[10px] opacity-60">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <span className="mb-3 block text-[10px] font-medium text-white/40 uppercase tracking-wider">Duration</span>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleDurationSelect(option.label)}
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                      datePreset === option.label
                        ? "bg-accent text-white shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {isCustom && (
              <div className="space-y-4 rounded-2xl bg-white/5 p-5 border border-white/5">
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
                <button
                  onClick={handleApply}
                  className="w-full rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-all shadow-[0_0_25px_rgba(255,106,43,0.3)]"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
