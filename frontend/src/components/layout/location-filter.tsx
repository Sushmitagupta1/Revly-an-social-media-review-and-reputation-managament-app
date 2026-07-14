import { useState, useEffect, useRef, useMemo } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { cn } from "@/lib/utils"
import { MapPin, X, Search } from "lucide-react"
import apiClient from "@/lib/api-client"

interface Location {
  id: string
  name: string
}

export default function LocationFilter() {
  const { selectedLocations, setLocations } = useFilterStore()
  const [open, setOpen] = useState(false)
  const [locations, setLocationsList] = useState<Location[]>([])
  const [tempSelected, setTempSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchLocations() {
      try {
        const { data } = await apiClient.get("/locations")
        setLocationsList(data.locations || [])
      } catch {
        setLocationsList([])
      }
    }
    fetchLocations()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return locations
    const q = search.toLowerCase()
    return locations.filter((l) => l.name.toLowerCase().includes(q))
  }, [locations, search])

  const allSelected = filtered.length > 0 && filtered.every((l) => tempSelected.includes(l.name))
  const someSelected = filtered.some((l) => tempSelected.includes(l.name)) && !allSelected

  const currentLabel = selectedLocations.length === 0
    ? "All Locations"
    : selectedLocations.length === 1
      ? selectedLocations[0]
      : `${selectedLocations.length} locations`

  function handleOpen() {
    setTempSelected([...selectedLocations])
    setSearch("")
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  function handleToggle(locName: string) {
    setTempSelected((prev) =>
      prev.includes(locName) ? prev.filter((l) => l !== locName) : [...prev, locName]
    )
  }

  function handleToggleAll() {
    if (allSelected) {
      setTempSelected((prev) => prev.filter((n) => !filtered.find((l) => l.name === n)))
    } else {
      const names = filtered.map((l) => l.name)
      setTempSelected((prev) => [...new Set([...prev, ...names])])
    }
  }

  function handleApply() {
    setLocations(tempSelected)
    setOpen(false)
  }

  function handleCancel() {
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10 border border-white/5"
      >
        <MapPin className="h-4 w-4 text-accent" />
        <div className="flex-1 min-w-0">
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Location</span>
          <div className="font-medium truncate">{currentLabel}</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative z-10 flex w-full max-w-md flex-col rounded-[28px] bg-sidebar border border-white/10 shadow-2xl overflow-hidden" style={{ maxHeight: "80vh" }}>
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <span className="text-lg font-semibold text-white">Select Locations</span>
              </div>
              <button
                onClick={handleCancel}
                className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full rounded-[14px] border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2" style={{ maxHeight: "40vh" }}>
              {filtered.length > 0 && (
                <button
                  onClick={handleToggleAll}
                  className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-[14px] font-medium transition-all text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    allSelected ? "border-accent bg-accent" : someSelected ? "border-accent bg-accent/50" : "border-white/30"
                  )}>
                    {allSelected && <span className="text-[10px] text-white">✓</span>}
                    {someSelected && <span className="text-[10px] text-white">−</span>}
                  </div>
                  Select All ({filtered.length})
                </button>
              )}

              {filtered.map((loc) => {
                const isSelected = tempSelected.includes(loc.name)
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleToggle(loc.name)}
                    className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-[14px] font-medium transition-all text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                      isSelected ? "border-accent bg-accent" : "border-white/30"
                    )}>
                      {isSelected && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    {loc.name}
                  </button>
                )
              })}

              {filtered.length === 0 && locations.length > 0 && (
                <p className="text-center text-[13px] text-white/40 py-8">No locations found</p>
              )}

              {locations.length === 0 && (
                <p className="text-center text-[13px] text-white/40 py-8">No locations added yet</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 p-6 pt-4">
              <span className="text-[13px] text-white/50">{tempSelected.length} Location{tempSelected.length !== 1 ? "s" : ""} Selected</span>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="rounded-[14px] bg-white/5 px-5 py-2.5 text-[13px] font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="rounded-[14px] bg-accent px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
