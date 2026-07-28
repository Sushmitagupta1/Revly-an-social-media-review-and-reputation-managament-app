import json, sqlite3, uuid

restaurants = [
    {"res_id": "110076", "name": "Upper Crust", "subzone": "Navrangpura", "city": "Ahmedabad", "rating": 4.5, "votes": 8324},
    {"res_id": "110412", "name": "Upper Crust", "subzone": "Prahlad Nagar", "city": "Ahmedabad", "rating": 4.4, "votes": 5158},
    {"res_id": "110562", "name": "Upper Crust", "subzone": "Vastrapur", "city": "Ahmedabad", "rating": 4.4, "votes": 8365},
    {"res_id": "113154", "name": "Upper Crust", "subzone": "Bopal", "city": "Ahmedabad", "rating": 3.9, "votes": 4549},
    {"res_id": "19931452", "name": "Lithosphere By Upper Crust", "subzone": "Bodakdev", "city": "Ahmedabad", "rating": 4.5, "votes": 2498},
    {"res_id": "20512260", "name": "Upper Crust Bakery", "subzone": "Prahlad Nagar", "city": "Ahmedabad", "rating": 4.4, "votes": 961},
    {"res_id": "20512310", "name": "Upper Crust Bakery", "subzone": "Kankaria", "city": "Ahmedabad", "rating": 4.4, "votes": 370},
    {"res_id": "20512997", "name": "Upper Crust Bakery", "subzone": "C G Road", "city": "Ahmedabad", "rating": 4.4, "votes": 1021},
    {"res_id": "20590610", "name": "Altitude The Rooftop By Upper Crust", "subzone": "Bodakdev", "city": "Ahmedabad", "rating": 4.2, "votes": 81},
    {"res_id": "21137468", "name": "Upper Crust Bakery", "subzone": "Prahlad Nagar", "city": "Ahmedabad", "rating": 4.3, "votes": 41},
    {"res_id": "21137716", "name": "Upper Crust Bakery", "subzone": "Bopal", "city": "Ahmedabad", "rating": 4.3, "votes": 0},
    {"res_id": "21137764", "name": "Upper Crust Bakery", "subzone": "Navrangpura", "city": "Ahmedabad", "rating": 4.0, "votes": 31},
    {"res_id": "21554718", "name": "Upper Crust", "subzone": "Bodakdev", "city": "Ahmedabad", "rating": 4.3, "votes": 0},
]

conn = sqlite3.connect('D:/Revly/backend/revly.db')
c = conn.cursor()

MOCK_BRAND_ID = '550e8400-e29b-41d4-a716-446655440000'

# Create locations
res_id_to_location_id = {}
for r in restaurants:
    loc_id = str(uuid.uuid4())
    name = f"{r['name']} ({r['subzone']})"
    address = f"{r['subzone']}, {r['city']}"
    c.execute(
        'INSERT INTO locations (id, brand_id, name, address, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
        (loc_id, MOCK_BRAND_ID, name, address, r['city'])
    )
    res_id_to_location_id[r['res_id']] = loc_id
    print(f"Created location: {name} -> {loc_id}")

# Now link reviews to locations via platform_review_id
# We need to know which res_id each review came from
# Load from zomato_reviews.json
with open('D:/Revly/zomato_reviews.json') as f:
    reviews = json.load(f)

# Build a map: platform_review_id -> res_id
review_res_map = {}
for rev in reviews:
    review_res_map[rev['platform_review_id']] = rev['res_id']

# Update reviews with location_id
updated = 0
c.execute('SELECT id, platform_review_id FROM reviews WHERE platform = "zomato"')
for row in c.fetchall():
    review_id = row[0]
    pid = row[1]
    if pid in review_res_map:
        res_id = review_res_map[pid]
        if res_id in res_id_to_location_id:
            c.execute('UPDATE reviews SET location_id = ? WHERE id = ?', (res_id_to_location_id[res_id], review_id))
            updated += 1

conn.commit()
print(f"\nLinked {updated} reviews to locations")

# Show summary
c.execute('SELECT l.name, COUNT(r.id), ROUND(AVG(r.rating), 1) FROM reviews r JOIN locations l ON r.location_id = l.id WHERE r.platform = "zomato" GROUP BY l.id ORDER BY COUNT(r.id) DESC')
print("\nLocation Summary:")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1]} reviews, avg {row[2]}")

conn.close()
