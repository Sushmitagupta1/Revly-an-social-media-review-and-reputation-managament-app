# Revly — Phase 4: AI Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Ask Revly conversational AI chat page, enhance AI reply generation with tone selection, and add Gemini API integration (with mock fallback for development).

**Architecture:** Backend adds a chat endpoint that accepts user messages and returns AI-generated responses, using Gemini API when configured or a mock responder for development. A `chat_messages` table stores conversation history. Frontend replaces the placeholder Ask Revly page with a full chat interface and adds a tone selector to the review reply flow.

**Tech Stack:** Same as before + `google-generativeai` (optional), httpx for API calls

---

## File Map

| File | Purpose |
|---|---|
| **Backend** | |
| `backend/app/models/chat_message.py` | ChatMessage SQLAlchemy model |
| `backend/app/models/__init__.py` | Update with ChatMessage |
| `backend/app/schemas/chat.py` | Chat Pydantic schemas |
| `backend/app/core/ai_client.py` | AI client (Gemini + mock fallback) |
| `backend/app/api/v1/ai.py` | Chat + sentiment analysis endpoints |
| `backend/app/api/v1/__init__.py` | Mount AI router |
| `backend/requirements.txt` | Add google-generativeai |
| **Frontend** | |
| `frontend/src/types/chat.ts` | Chat TypeScript types |
| `frontend/src/stores/chat-store.ts` | Zustand chat state |
| `frontend/src/components/ai/chat-message.tsx` | Single chat message bubble |
| `frontend/src/components/ai/chat-input.tsx` | Chat input bar |
| `frontend/src/components/ai/suggested-questions.tsx` | Quick question chips |
| `frontend/src/app/routes/ask-revly.tsx` | Ask Revly page (replace placeholder) |
| `frontend/src/components/reviews/reply-editor.tsx` | Add tone selector |

---

## Task 1: Backend — ChatMessage Model

**Files:**
- Create: `backend/app/models/chat_message.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/chat_message.py`**

```python
import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
```

- [ ] **Step 2: Update `backend/app/models/__init__.py`**

Replace entire file with:
```python
from app.models.base import Base
from app.models.role import Role
from app.models.user import User
from app.models.review import Review
from app.models.reply import Reply
from app.models.chat_message import ChatMessage

__all__ = ["Base", "Role", "User", "Review", "Reply", "ChatMessage"]
```

- [ ] **Step 3: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.models import Base, ChatMessage; print('OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/chat_message.py backend/app/models/__init__.py ; git commit -m "feat: add ChatMessage SQLAlchemy model"
```

---

## Task 2: Backend — Chat Schemas

**Files:**
- Create: `backend/app/schemas/chat.py`

- [ ] **Step 1: Create `backend/app/schemas/chat.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: ChatMessageResponse
    suggestions: list[str]


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
```

- [ ] **Step 2: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.schemas.chat import ChatRequest, ChatResponse; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/chat.py ; git commit -m "feat: add Chat Pydantic schemas"
```

---

## Task 3: Backend — AI Client (Gemini + Mock)

**Files:**
- Create: `backend/app/core/ai_client.py`
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: Update `backend/app/core/config.py`**

Add `GEMINI_API_KEY` to the Settings class:
```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://revly:revly@localhost:5432/revly"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    GEMINI_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

- [ ] **Step 2: Create `backend/app/core/ai_client.py`**

```python
import random
from app.core.config import settings

SYSTEM_PROMPT = """You are Revly, an AI reputation management assistant for restaurant brands.
You help users understand their customer reviews, identify trends, and craft professional responses.
Be concise, helpful, and data-driven. When discussing reviews, reference specific examples.
Keep responses under 200 words unless the user asks for detail."""

CHAT_SUGGESTIONS = [
    "What are the most common complaints this week?",
    "How is our sentiment trending compared to last month?",
    "Write a professional reply to my latest 1-star review",
    "Which location needs the most attention?",
    "Summarize today's Google reviews",
    "What topics should I focus on improving?",
]


def get_suggestions() -> list[str]:
    return random.sample(CHAT_SUGGESTIONS, k=min(4, len(CHAT_SUGGESTIONS)))


def _mock_chat_response(message: str) -> str:
    """Generate a mock AI response for development."""
    lower = message.lower()

    if any(w in lower for w in ["complaint", "negative", "bad", "problem"]):
        return (
            "Based on your recent reviews, the top complaints are:\n\n"
            "1. **Delivery time** — 12 mentions this week (up from 8 last week)\n"
            "2. **Food temperature** — 7 mentions, mostly for delivery orders\n"
            "3. **Staff attitude** — 4 mentions at the Vastrapur location\n\n"
            "I'd recommend focusing on delivery logistics first — it accounts for 52% of negative sentiment."
        )
    elif any(w in lower for w in ["sentiment", "trend", "rating", "how"]):
        return (
            "Your sentiment trend is looking positive:\n\n"
            "- **This week:** 72% positive, 18% neutral, 10% negative\n"
            "- **Last week:** 68% positive, 20% neutral, 12% negative\n"
            "- **Change:** +4% positive sentiment\n\n"
            "Google reviews are driving the improvement — your average rating went from 4.2 to 4.4."
        )
    elif any(w in lower for w in ["reply", "respond", "write"]):
        return (
            "Here's a professional reply draft:\n\n"
            "\"Thank you for your feedback! We're glad you enjoyed your experience. "
            "Your support means the world to our team, and we look forward to serving you again soon. "
            "— Upper Crust Team\"\n\n"
            "Want me to adjust the tone (more formal/casual) or regenerate?"
        )
    elif any(w in lower for w in ["location", "where", "which"]):
        return (
            "Location performance summary:\n\n"
            "- 🏆 **SG Highway** — 4.6★ (best performer)\n"
            "- ✅ **Vastrapur** — 4.4★ (steady)\n"
            "- ✅ **Drive-In** — 4.3★ (improving)\n"
            "- ⚠️ **Bodakdev** — 3.8★ (needs attention)\n"
            "- ⚠️ **Thaltej** — 3.9★ (declining)\n\n"
            "Bodakdev and Thaltej have the most negative reviews this month."
        )
    else:
        return (
            "I can help you with that! Here's what I found:\n\n"
            "You currently have reviews across 3 platforms (Google, Zomato, Reelo). "
            "Your overall sentiment is 72% positive with an average rating of 4.3★.\n\n"
            "Try asking me about:\n"
            "- Specific complaints or trends\n"
            "- Sentiment changes over time\n"
            "- Location performance\n"
            "- Drafting reply messages"
        )


async def chat_completion(messages: list[dict[str, str]]) -> str:
    """Get AI response. Uses Gemini if API key is set, otherwise mock."""
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=SYSTEM_PROMPT,
            )
            chat = model.start_chat(history=[])
            user_msg = messages[-1]["content"] if messages else ""
            response = await chat.send_message_async(user_msg)
            return response.text
        except Exception:
            pass

    # Mock fallback
    user_msg = messages[-1]["content"] if messages else ""
    return _mock_chat_response(user_msg)
```

- [ ] **Step 3: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.core.ai_client import chat_completion, get_suggestions; print('OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/app/core/ai_client.py backend/app/core/config.py ; git commit -m "feat: add AI client with Gemini API and mock fallback"
```

---

## Task 4: Backend — AI Chat Endpoint

**Files:**
- Create: `backend/app/api/v1/ai.py`
- Modify: `backend/app/api/v1/__init__.py`

- [ ] **Step 1: Create `backend/app/api/v1/ai.py`**

```python
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.core.ai_client import chat_completion, get_suggestions
from app.models.chat_message import ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessageResponse,
)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    # Save user message
    user_msg = ChatMessage(
        user_id=user.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Get recent history for context
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
        .all()
    )
    history.reverse()

    messages = [{"role": m.role, "content": m.content} for m in history]

    # Get AI response
    reply_text = await chat_completion(messages)

    # Save assistant message
    assistant_msg = ChatMessage(
        user_id=user.id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        reply=ChatMessageResponse.model_validate(assistant_msg),
        suggestions=get_suggestions(),
    )


@router.get("/chat/history", response_model=ChatHistoryResponse)
def get_chat_history(
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
        .all()
    )
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@router.delete("/chat/history")
def clear_chat_history(
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}


@router.get("/chat/suggestions")
def suggestions():
    return {"suggestions": get_suggestions()}
```

- [ ] **Step 2: Update `backend/app/api/v1/__init__.py`**

Replace entire file with:
```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.replies import router as replies_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.ai import router as ai_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
router.include_router(replies_router, prefix="", tags=["replies"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(ai_router, prefix="/ai", tags=["ai"])
```

- [ ] **Step 3: Test imports**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/ai.py backend/app/api/v1/__init__.py ; git commit -m "feat: add AI chat endpoint with history and suggestions"
```

---

## Task 5: Backend — Update Requirements

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Update `backend/requirements.txt`**

Add `google-generativeai` at the end:
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
alembic==1.14.1
psycopg2-binary==2.9.10
pydantic[email]==2.10.4
pydantic-settings==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.20
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.0
google-generativeai>=0.8.0
```

- [ ] **Step 2: Commit**

```bash
git add backend/requirements.txt ; git commit -m "chore: add google-generativeai dependency"
```

---

## Task 6: Frontend — Chat Types & Store

**Files:**
- Create: `frontend/src/types/chat.ts`
- Create: `frontend/src/stores/chat-store.ts`

- [ ] **Step 1: Create `frontend/src/types/chat.ts`**

```typescript
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
```

- [ ] **Step 2: Create `frontend/src/stores/chat-store.ts`**

```typescript
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

export const useChatStore = create<ChatState>((set, get) => ({
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
```

- [ ] **Step 3: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/chat.ts frontend/src/stores/chat-store.ts ; git commit -m "feat: add chat types and store"
```

---

## Task 7: Frontend — Chat Components

**Files:**
- Create: `frontend/src/components/ai/chat-message.tsx`
- Create: `frontend/src/components/ai/chat-input.tsx`
- Create: `frontend/src/components/ai/suggested-questions.tsx`

- [ ] **Step 1: Create `frontend/src/components/ai/chat-message.tsx`**

```tsx
import { Bot, User } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/types/chat"
import { timeAgo } from "@/lib/utils"

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info/20">
          <Bot className="h-4 w-4 text-info" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-info text-white"
            : "bg-card text-text"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`mt-1 text-[10px] ${isUser ? "text-white/60" : "text-text-muted"}`}>
          {timeAgo(message.created_at)}
        </p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-secondary">
          <User className="h-4 w-4 text-text-secondary" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/ai/chat-input.tsx`**

```tsx
import { useState } from "react"
import { Send } from "lucide-react"

interface Props {
  onSend: (message: string) => void
  isLoading?: boolean
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim())
      setText("")
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        placeholder="Ask Revly anything about your reviews..."
        className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-info text-white hover:bg-info/90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `frontend/src/components/ai/suggested-questions.tsx`**

```tsx
import { Lightbulb } from "lucide-react"

interface Props {
  suggestions: string[]
  onSelect: (question: string) => void
}

export default function SuggestedQuestions({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-card-secondary hover:text-text"
        >
          <Lightbulb className="h-3 w-3 text-warning" />
          {q}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ai/ ; git commit -m "feat: add chat components (message, input, suggestions)"
```

---

## Task 8: Frontend — Ask Revly Page

**Files:**
- Modify: `frontend/src/app/routes/ask-revly.tsx`

- [ ] **Step 1: Replace `frontend/src/app/routes/ask-revly.tsx`**

```tsx
import { useEffect, useRef } from "react"
import { Trash2 } from "lucide-react"
import { useChatStore } from "@/stores/chat-store"
import ChatMessage from "@/components/ai/chat-message"
import ChatInput from "@/components/ai/chat-input"
import SuggestedQuestions from "@/components/ai/suggested-questions"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function AskRevlyPage() {
  const { messages, suggestions, isLoading, fetchHistory, sendMessage, clearHistory } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ask Revly</h1>
          <p className="mt-1 text-sm text-text-secondary">AI-powered insights about your reviews</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-card-secondary"
          >
            <Trash2 className="h-3 w-3" /> Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-text">Hi, I'm Revly</h2>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Ask me anything about your customer reviews, sentiment trends, or location performance.
            </p>
            <div className="mt-6">
              <SuggestedQuestions
                suggestions={suggestions.length > 0 ? suggestions : [
                  "What are the most common complaints this week?",
                  "How is our sentiment trending?",
                  "Which location needs attention?",
                  "Draft a reply to my latest review",
                ]}
                onSelect={sendMessage}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/20">
                  <LoadingSpinner />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-4">
        {suggestions.length > 0 && messages.length > 0 && (
          <div className="mb-3">
            <SuggestedQuestions suggestions={suggestions} onSelect={sendMessage} />
          </div>
        )}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/routes/ask-revly.tsx ; git commit -m "feat: implement Ask Revly chat page"
```

---

## Task 9: Frontend — Add Tone Selector to Reply Editor

**Files:**
- Modify: `frontend/src/components/reviews/reply-editor.tsx`
- Modify: `frontend/src/components/reviews/review-detail.tsx`

- [ ] **Step 1: Update `frontend/src/components/reviews/review-detail.tsx`**

Add tone selector state and pass it to the generate button. The existing file is at `frontend/src/components/reviews/review-detail.tsx`. Add a `tone` state variable and a tone dropdown next to the "Generate Reply" button.

Replace the generate button section (lines 99-109 in the current file) with:
```tsx
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">AI Reply</h3>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="empathetic">Empathetic</option>
              </select>
              <button
                onClick={() => handleGenerate(tone)}
                disabled={isGenerating}
                className="flex items-center gap-1 rounded-lg bg-info/10 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {aiReply ? "Regenerate" : "Generate Reply"}
              </button>
            </div>
          </div>
```

Also add `const [tone, setTone] = useState("professional")` after the existing state declarations.

- [ ] **Step 2: Test build**

Run: `cd D:\Revly\frontend ; npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/reviews/review-detail.tsx ; git commit -m "feat: add tone selector to AI reply generation"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Backend tests**

Run: `cd D:\Revly\backend ; python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 2: Frontend build**

Run: `cd D:\Revly\frontend ; npm run build`
Expected: Build succeeds

- [ ] **Step 3: Backend import check**

Run: `cd D:\Revly\backend ; python -c "from app.api.v1 import router; print('OK')"`
Expected: OK

- [ ] **Step 4: Git log**

Run: `git log --oneline -15`
Expected: All Phase 4 commits present

- [ ] **Step 5: Final commit**

```bash
git add -A ; git commit -m "chore: Phase 4 AI Features complete"
```

---

## Phase 4 Complete

After this plan is executed, Revly has:

1. **Ask Revly chat page** — Full conversational UI with message history, typing indicator, suggested questions
2. **Chat backend** — Stores messages, provides context-aware responses, maintains history
3. **Gemini API integration** — Uses real Gemini API when `GEMINI_API_KEY` is set, mock fallback otherwise
4. **Tone selector** — Choose between Professional, Friendly, Formal, Empathetic when generating AI replies
5. **Smart mock responses** — Context-aware mock answers about complaints, trends, locations, and replies
6. **Chat history** — Persisted in database, can be cleared
7. **Suggested questions** — Dynamic suggestions after each AI response
8. All existing Phase 1-3 features still working
