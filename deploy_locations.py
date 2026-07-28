import httpx, json, sys

RENDER_URL = "https://revly-an-social-media-review-and.onrender.com/api/v1/zomato"

restaurants = [
    {"res_id": "110076", "name": "Upper Crust (Navrangpura)", "subzone": "Navrangpura", "city": "Ahmedabad", "address": "Aarohi Complex, Vijay Cross Road, Navrangpura, Ahmedabad"},
    {"res_id": "110412", "name": "Upper Crust (Prahlad Nagar)", "subzone": "Prahlad Nagar", "city": "Ahmedabad"},
    {"res_id": "110562", "name": "Upper Crust (Vastrapur)", "subzone": "Vastrapur", "city": "Ahmedabad"},
    {"res_id": "113154", "name": "Upper Crust (Bopal)", "subzone": "Bopal", "city": "Ahmedabad"},
    {"res_id": "19931452", "name": "Lithosphere By Upper Crust (Bodakdev)", "subzone": "Bodakdev", "city": "Ahmedabad"},
    {"res_id": "20512260", "name": "Upper Crust Bakery (Prahlad Nagar)", "subzone": "Prahlad Nagar", "city": "Ahmedabad"},
    {"res_id": "20512310", "name": "Upper Crust Bakery (Kankaria)", "subzone": "Kankaria", "city": "Ahmedabad"},
    {"res_id": "20512997", "name": "Upper Crust Bakery (C G Road)", "subzone": "C G Road", "city": "Ahmedabad"},
    {"res_id": "20590610", "name": "Altitude The Rooftop By Upper Crust (Bodakdev)", "subzone": "Bodakdev", "city": "Ahmedabad"},
    {"res_id": "21137468", "name": "Upper Crust Bakery (Prahlad Nagar 2)", "subzone": "Prahlad Nagar", "city": "Ahmedabad"},
    {"res_id": "21137716", "name": "Upper Crust Bakery (Bopal)", "subzone": "Bopal", "city": "Ahmedabad"},
    {"res_id": "21137764", "name": "Upper Crust Bakery (Navrangpura)", "subzone": "Navrangpura", "city": "Ahmedabad"},
    {"res_id": "21554718", "name": "Upper Crust (Bodakdev)", "subzone": "Bodakdev", "city": "Ahmedabad"},
]

with open("D:/Revly/zomato_reviews.json") as f:
    reviews = json.load(f)

def log(msg):
    print(msg, flush=True)

# Step 1: Create locations
log("=== Step 1: Creating locations on Render ===")
resp = httpx.post(f"{RENDER_URL}/setup-locations", json={"locations": restaurants}, timeout=60)
loc_data = resp.json()
mapping = loc_data.get("mapping", {})
log(f"Created: {loc_data.get('created')} locations")
for res_id, loc_id in mapping.items():
    log(f"  {res_id} -> {loc_id}")

# Step 2: Import reviews with location_ids
log("\n=== Step 2: Importing reviews with location linking ===")
batch_size = 50
total_saved = 0
total_skipped = 0
total_loc_updated = 0

for i in range(0, len(reviews), batch_size):
    batch = reviews[i:i+batch_size]
    enriched = []
    for r in batch:
        loc_id = mapping.get(r["res_id"], "")
        enriched.append({
            "platform_review_id": r["platform_review_id"],
            "reviewer_name": r["reviewer_name"],
            "rating": r["rating"],
            "text": r.get("text", ""),
            "res_id": r.get("res_id", ""),
            "location_id": loc_id,
        })
    try:
        resp = httpx.post(f"{RENDER_URL}/bulk-import", json={"reviews": enriched}, timeout=60)
        data = resp.json()
        saved = data.get("saved", 0)
        skipped = data.get("skipped", 0)
        loc_up = data.get("updated_location", 0)
        total_saved += saved
        total_skipped += skipped
        total_loc_updated += loc_up
        batch_num = i // batch_size + 1
        log(f"Batch {batch_num}: saved={saved}, skipped={skipped}, loc_updated={loc_up}")
    except Exception as e:
        log(f"Batch {i//batch_size+1} FAILED: {e}")

log(f"\n=== Done ===")
log(f"Total saved: {total_saved}")
log(f"Total skipped: {total_skipped}")
log(f"Total location links updated: {total_loc_updated}")
