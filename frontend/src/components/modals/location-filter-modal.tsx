import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MOCK_LOCATIONS = [
  "Upper Crust Bakery Vastrapur",
  "Upper Crust Bakery Bopal",
  "Upper Crust Bakery Satellite",
  "Upper Crust Bakery Prahlad Nagar",
  "Upper Crust Bakery Vijay Cross Road",
  "Upper Crust Bakery Shilaj",
  "Upper Crust Bakery SG Highway",
  "Upper Crust Bakery Thaltej",
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function LocationFilterModal({ open, onClose }: Props) {
  const { selectedLocations, setLocations } = useFilterStore()
  const [search, setSearch] = useState("")
  const [temp, setTemp] = useState<string[]>(selectedLocations)

  const filtered = MOCK_LOCATIONS.filter((l) =>
    l.toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = temp.length === MOCK_LOCATIONS.length

  const toggleAll = () => {
    setTemp(allSelected ? [] : [...MOCK_LOCATIONS])
  }

  const toggle = (loc: string) => {
    setTemp((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    )
  }

  const apply = () => {
    setLocations(temp)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter Locations</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>
        <Input
          placeholder="Search locations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-64 space-y-2 overflow-y-auto">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-text">All Locations ({MOCK_LOCATIONS.length})</span>
          </label>
          {filtered.map((loc) => (
            <label key={loc} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
              <input
                type="checkbox"
                checked={temp.includes(loc)}
                onChange={() => toggle(loc)}
                className="h-4 w-4"
              />
              <span className="text-sm text-text">{loc}</span>
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
