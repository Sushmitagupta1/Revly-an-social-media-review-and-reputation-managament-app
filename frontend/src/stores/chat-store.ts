import { create } from "zustand"
import type { ChatMessage } from "@/types/chat"
import apiClient from "@/lib/api-client"

interface ChatState {
  messages: ChatMessage[]
  suggestions: string[]
  isLoading: boolean
  fetchHistory: () => Promise<void>
  sendMessage: (message: string) => Promise<void>
  clearHistory: () => Promise<void>
  setSuggestions: (suggestions: string[]) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  suggestions: [],
  isLoading: false,

  fetchHistory: async () => {
    try {
      const { data } = await apiClient.get<{ messages: ChatMessage[] }>("/ai/chat/history")
      set({ messages: data.messages })
    } catch {
      // Ignore errors on initial load
    }
  },

  sendMessage: async (message: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }))

    try {
      const { data } = await apiClient.post<{ reply: ChatMessage; suggestions: string[] }>(
        "/ai/chat",
        { message }
      )
      set((s) => ({
        messages: [...s.messages, data.reply],
        suggestions: data.suggestions,
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
    }
  },

  clearHistory: async () => {
    try {
      await apiClient.delete("/ai/chat/history")
      set({ messages: [], suggestions: [] })
    } catch {
      // Ignore
    }
  },

  setSuggestions: (suggestions) => set({ suggestions }),
}))
