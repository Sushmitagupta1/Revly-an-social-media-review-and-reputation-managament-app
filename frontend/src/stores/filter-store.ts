import { create } from "zustand"

function getPresetRange(preset: string): { from: string | null; to: string | null } {
  const now = new Date()
  const toStr = now.toISOString().split("T")[0]
  switch (preset) {
    case "Today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: start.toISOString().split("T")[0], to: toStr }
    }
    case "Yesterday": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] }
    }
    case "Past 7 Days": {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return { from: start.toISOString().split("T")[0], to: toStr }
    }
    case "Past 30 Days": {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { from: start.toISOString().split("T")[0], to: toStr }
    }
    case "All Time":
      return { from: null, to: null }
    default:
      return { from: null, to: null }
  }
}

interface FilterState {
  selectedBrand: string
  selectedLocations: string[]
  dateRange: { from: string | null; to: string | null }
  datePreset: string
  selectedPlatforms: string[]
  setBrand: (brand: string) => void
  setLocations: (locations: string[]) => void
  setDateRange: (from: string | null, to: string | null) => void
  setDatePreset: (preset: string) => void
  setPlatforms: (platforms: string[]) => void
}

const defaultPreset = "Past 7 Days"

export const useFilterStore = create<FilterState>((set) => ({
  selectedBrand: "Upper Crust",
  selectedLocations: [],
  dateRange: getPresetRange(defaultPreset),
  datePreset: defaultPreset,
  selectedPlatforms: [],
  setBrand: (brand) => set({ selectedBrand: brand }),
  setLocations: (locations) => set({ selectedLocations: locations }),
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  setDatePreset: (preset) => set({ datePreset: preset, dateRange: getPresetRange(preset) }),
  setPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
}))
