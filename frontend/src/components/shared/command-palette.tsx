import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Search, LayoutDashboard, MapPin, Star, Settings, X } from "lucide-react"

const commands = [
  { label: "Dashboard", path: "/overview", icon: LayoutDashboard },
  { label: "Location Leaderboard", path: "/location-leaderboard", icon: MapPin },
  { label: "Reviews", path: "/reviews", icon: Star },
  { label: "Account", path: "/account", icon: Settings },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelected(0)
  }, [query])

  function handleSelect(path: string) {
    navigate(path)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => (s + 1) % filtered.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => (s - 1 + filtered.length) % filtered.length)
    } else if (e.key === "Enter" && filtered[selected]) {
      handleSelect(filtered[selected].path)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-2xl shadow-accent/30 hover:scale-105 transition-all"
      >
        <Search className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages..."
                className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-background transition-colors">
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.path}
                  onClick={() => handleSelect(cmd.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    i === selected ? "bg-accent text-white" : "text-text hover:bg-background"
                  )}
                >
                  <cmd.icon className="h-4 w-4" />
                  {cmd.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-text-muted">No results</p>
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-[10px] text-text-muted">
              ↑↓ Navigate · Enter Select · Esc Close
            </div>
          </div>
        </div>
      )}
    </>
  )
}
