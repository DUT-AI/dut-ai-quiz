import asyncio
import httpx

async def test():
    api_key = "sk-QuuvQH0eE4dW8K5q0jyxuIJTvpkar0QCGOTmW9bKH0Q"
    url = "https://manage.dutai.site/api/v1/teams?skip=0&limit=100"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Content length: {len(response.content)}")
        print(f"Content preview: {response.text[:100]}")
        try:
            data = response.json()
            print("JSON valid")
        except Exception as e:
            print(f"JSON invalid: {e}")

if __name__ == "__main__":
    asyncio.run(test())
