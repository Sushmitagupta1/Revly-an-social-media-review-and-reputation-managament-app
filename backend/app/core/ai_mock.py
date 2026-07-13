import random


def generate_reply(text: str | None, rating: int, reviewer_name: str, tone: str = "professional") -> str:
    """Generate a mock AI reply based on review rating and tone."""
    first_name = reviewer_name.split()[0] if reviewer_name else "there"

    if rating >= 4:
        positive_templates = [
            f"Thank you for the wonderful review, {first_name}! We're thrilled you had a great experience. Your feedback means the world to us, and we look forward to serving you again soon!",
            f"We really appreciate your kind words, {first_name}! It's always rewarding to know our team is delivering the quality you expect. See you next time!",
            f"Thank you so much, {first_name}! We're delighted you enjoyed your visit. Your support keeps us motivated to do our best every day.",
        ]
        return random.choice(positive_templates)

    elif rating == 3:
        neutral_templates = [
            f"Thank you for your feedback, {first_name}. We appreciate your honest review and are always looking for ways to improve. We hope to provide a better experience next time.",
            f"We value your input, {first_name}. Your comments help us identify areas to work on. We'd love the chance to make your next visit even better.",
        ]
        return random.choice(neutral_templates)

    else:
        negative_templates = [
            f"We're very sorry about your experience, {first_name}. This falls below the standards we set for ourselves. Please reach out to us directly so we can make this right.",
            f"Thank you for bringing this to our attention, {first_name}. We sincerely apologize and want to understand what went wrong. Please contact us so we can resolve this.",
            f"We're sorry to hear about your experience, {first_name}. This is not the level of service we strive for. We'd appreciate the opportunity to discuss this with you directly.",
        ]
        return random.choice(negative_templates)
