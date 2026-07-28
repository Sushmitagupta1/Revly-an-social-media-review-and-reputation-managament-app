import json, httpx, asyncio

RENDER_URL = "https://revly-an-social-media-review-and.onrender.com/api/v1/zomato/bulk-import"

with open("D:/Revly/zomato_reviews.json") as f:
    reviews = json.load(f)

print(f"Total reviews to import: {len(reviews)}")

async def main():
    batch_size = 50
    total_saved = 0
    total_skipped = 0

    async with httpx.AsyncClient(timeout=60) as client:
        for i in range(0, len(reviews), batch_size):
            batch = reviews[i:i+batch_size]
            payload = {"reviews": batch}
            try:
                resp = await client.post(RENDER_URL, json=payload)
                data = resp.json()
                saved = data.get("saved", 0)
                skipped = data.get("skipped", 0)
                total_saved += saved
                total_skipped += skipped
                print(f"Batch {i//batch_size + 1}: saved={saved}, skipped={skipped} (total saved={total_saved})")
            except Exception as e:
                print(f"Batch {i//batch_size + 1} failed: {e}")

    print(f"\nDone! Total saved: {total_saved}, Total skipped: {total_skipped}")

asyncio.run(main())
