import { create } from "zustand"
import type { User } from "@/types/user"
import apiClient from "@/lib/api-client"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, fullName) => {
    const { data } = await apiClient.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      const { data } = await apiClient.get("/users/me")
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
