import { create } from "zustand"
import type { Location } from "@/types/location"
import apiClient from "@/lib/api-client"

interface LocationState {
  locations: Location[]
  total: number
  isLoading: boolean
  fetchLocations: () => Promise<void>
  createLocation: (data: { name: string; address?: string; city?: string }) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [], total: 0, isLoading: false,
  fetchLocations: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/locations")
    set({ locations: data.locations, total: data.total, isLoading: false })
  },
  createLocation: async (body) => {
    await apiClient.post("/locations", body)
    get().fetchLocations()
  },
  deleteLocation: async (id) => {
    await apiClient.delete(`/locations/${id}`)
    get().fetchLocations()
  },
}))
