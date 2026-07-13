export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface ChatResponse {
  reply: ChatMessage
  suggestions: string[]
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
}
