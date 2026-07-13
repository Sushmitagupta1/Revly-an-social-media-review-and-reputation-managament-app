import { create } from "zustand"

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

export const useFilterStore = create<FilterState>((set) => ({
  selectedBrand: "Upper Crust",
  selectedLocations: [],
  dateRange: { from: null, to: null },
  datePreset: "Past 7 Days",
  selectedPlatforms: [],
  setBrand: (brand) => set({ selectedBrand: brand }),
  setLocations: (locations) => set({ selectedLocations: locations }),
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  setDatePreset: (preset) => set({ datePreset: preset }),
  setPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
}))
