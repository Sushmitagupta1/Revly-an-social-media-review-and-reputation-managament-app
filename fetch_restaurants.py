import httpx, json, asyncio

RES_IDS = ['110076','110412','110562','113154','19931452','20512260','20512310','20512997','20590610','21137468','21137716','21137764','21554718']
COOKIES = 'fbcity=3; fre=0; rd=1380000; fbtrack=28bb1d7258ab55214ca2bc5ad2f278bf; _ga=GA1.1.1519785341.1785144049; cid=2c4e3ed9-0308-4d16-a237-3a5c99f7e944; v_uuid=471c1170-e1c2-43b8-accf-1161d390cd94; zat=0PdIQ1j5qufRApjXB_HYef73mYZeZEI3nPF7-8334fs.6epPwV4OQ4G8BLrf2qBTRenCT3HtNjOq5C_G9BnvN-4; ttaz=1787737884; hy-en=1; PHPSESSID=7c2fbb1e582427e99146715a761036bf; csrf=5cecba68b3b2fba273a774c9aaa3b900; __Host-zmxcsrft=9d520632bec4c2f55d0a486f593b5cb070285db1757cdaf85649a8ed26b05b234a23a070; socket_service_version=v2'

HEADERS = {
    'accept': 'application/json, text/plain, */*',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'referer': 'https://www.zomato.com/partners/static/js/4650.db2b757e.chunk.js',
    'cookie': COOKIES,
}

async def main():
    async with httpx.AsyncClient(timeout=30) as client:
        res_param = ','.join(RES_IDS)
        resp = await client.get(
            f'https://www.zomato.com/merchant-api/restaurants/get-all?res_id={res_param}',
            headers=HEADERS,
        )
        data = resp.json()
        results = []
        for e in data.get('entities', []):
            rating = e.get('rating_info', {}).get('aggregate_rating', 'N/A')
            votes = e.get('rating_info', {}).get('votes', 0)
            results.append({
                'res_id': str(e['id']),
                'name': e['name'],
                'subzone': e.get('subzone', ''),
                'city': e.get('city_name', ''),
                'address': e.get('address', ''),
                'rating': rating,
                'votes': votes,
            })
        with open('D:/Revly/zomato_restaurants.json', 'w') as f:
            json.dump(results, f, indent=2)
        for r in results:
            print(f"{r['res_id']}: {r['name']} ({r['subzone']}) - {r['rating']} ({r['votes']} votes)")

asyncio.run(main())
