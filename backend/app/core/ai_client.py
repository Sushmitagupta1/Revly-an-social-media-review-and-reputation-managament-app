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