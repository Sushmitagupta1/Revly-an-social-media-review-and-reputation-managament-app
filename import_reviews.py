import json, sqlite3, uuid

with open("D:/Revly/zomato_reviews.json") as f:
    reviews = json.load(f)

conn = sqlite3.connect("D:/Revly/backend/revly.db")
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM reviews WHERE platform = 'zomato'")
existing = c.fetchone()[0]
print(f"Existing zomato reviews: {existing}")

MOCK_BRAND_ID = "550e8400-e29b-41d4-a716-446655440000"

saved = 0
skipped = 0
for r in reviews:
    pid = r["platform_review_id"]
    c.execute("SELECT id FROM reviews WHERE platform = 'zomato' AND platform_review_id = ?", (pid,))
    if c.fetchone():
        skipped += 1
        continue

    rating = r["rating"]
    text = r.get("text", "")
    if rating >= 4:
        sentiment = "positive"
    elif rating <= 2:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    c.execute(
        "INSERT INTO reviews (id, brand_id, platform, platform_review_id, reviewer_name, rating, text, sentiment, is_resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))",
        (str(uuid.uuid4()), MOCK_BRAND_ID, "zomato", pid, r["reviewer_name"], rating, text, sentiment),
    )
    saved += 1

conn.commit()
conn.close()
print(f"Saved: {saved}, Skipped: {skipped}")
print(f"Total zomato reviews now: {saved + existing}")
