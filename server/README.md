# Vibe YouTube Scraper (FastAPI)

## 설치

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 실행

```bash
uvicorn main:app --reload --port 8000
```

## 엔드포인트

- `GET /search?q=검색어` — YouTube 검색 (API 키 불필요)
- `GET /search?q=검색어&continuation=...` — 다음 페이지
- `GET /health` — 헬스 체크

## Next.js 연동

`.env.local`에 추가:
```
YOUTUBE_SCRAPER_URL=http://localhost:8000
```
