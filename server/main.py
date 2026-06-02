from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import innertube
from typing import Optional
import re

app = FastAPI(title="Vibe YouTube Scraper")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

client = innertube.InnerTube("WEB")


def parse_duration(text: str) -> str:
    """'4:32' 형식 그대로 반환, 없으면 빈 문자열"""
    return text if text else ""


def extract_videos(contents: list) -> list[dict]:
    videos = []
    for item in contents:
        vr = item.get("videoRenderer") or item.get("compactVideoRenderer")
        if not vr:
            continue
        video_id = vr.get("videoId", "")
        if not video_id:
            continue

        title = (
            vr.get("title", {}).get("runs", [{}])[0].get("text", "")
            or vr.get("title", {}).get("simpleText", "")
        )
        artist = (
            vr.get("ownerText", {}).get("runs", [{}])[0].get("text", "")
            or vr.get("shortBylineText", {}).get("runs", [{}])[0].get("text", "")
        )
        duration = (
            vr.get("lengthText", {}).get("simpleText", "")
            or vr.get("lengthText", {}).get("runs", [{}])[0].get("text", "")
        )
        thumbs = vr.get("thumbnail", {}).get("thumbnails", [])
        thumbnail = next(
            (t["url"] for t in thumbs if t.get("width", 0) >= 320),
            thumbs[-1]["url"] if thumbs else f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
        )
        # ?sqp=... 쿼리 제거
        thumbnail = thumbnail.split("?")[0]

        if title:
            videos.append({
                "id": video_id,
                "title": title,
                "artist": artist,
                "thumbnailUrl": thumbnail,
                "duration": parse_duration(duration),
            })
        if len(videos) >= 10:
            break
    return videos


@app.get("/search")
async def search_youtube(
    q: str = Query(..., min_length=1),
    continuation: Optional[str] = None,
):
    try:
        if continuation:
            data = client.search(continuation_data=continuation)
        else:
            # params: EgIQAQ== = 음악 필터
            data = client.search(query=q, params="EgIQAQ%3D%3D")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    videos: list[dict] = []
    next_continuation: Optional[str] = None

    # 응답 구조 파싱
    primary = (
        data.get("contents", {})
        .get("twoColumnSearchResultsRenderer", {})
        .get("primaryContents", {})
        .get("sectionListRenderer", {})
        .get("contents", [])
    )
    # continuation 응답
    if not primary:
        primary = (
            data.get("onResponseReceivedCommands", [{}])[0]
            .get("appendContinuationItemsAction", {})
            .get("continuationItems", [])
        )

    for section in primary:
        items = section.get("itemSectionRenderer", {}).get("contents", [])
        if items:
            videos.extend(extract_videos(items))

        cont = (
            section.get("continuationItemRenderer", {})
            .get("continuationEndpoint", {})
            .get("continuationCommand", {})
            .get("token")
        )
        if cont:
            next_continuation = cont

        if len(videos) >= 10:
            break

    return {
        "items": videos[:10],
        "nextContinuation": next_continuation,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
