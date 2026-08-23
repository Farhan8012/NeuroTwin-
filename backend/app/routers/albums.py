from fastapi import APIRouter, HTTPException
from app.schemas import AlbumCreate, AlbumUpdate
from app.services.json_store import JSONStore

router = APIRouter(prefix="/albums", tags=["Caregiver - Photo Albums"])

_albums_store = JSONStore("albums.json")


@router.get("")
async def list_albums():
    return _albums_store.list()


@router.post("", status_code=201)
async def create_album(album: AlbumCreate):
    return _albums_store.create({
        "title": album.title,
        "description": album.description,
        "date": album.date,
        "people_ids": album.people_ids,
        "photo_urls": album.photo_urls,
        "featured_memory_id": album.featured_memory_id,
    })


@router.get("/{album_id}")
async def get_album(album_id: str):
    item = _albums_store.get(album_id)
    if not item:
        raise HTTPException(status_code=404, detail="Album not found")
    return item


@router.put("/{album_id}")
async def update_album(album_id: str, album: AlbumUpdate):
    updates = album.dict(exclude_unset=True)
    updated = _albums_store.update(album_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Album not found")
    return updated


@router.delete("/{album_id}", status_code=204)
async def delete_album(album_id: str):
    if not _albums_store.delete(album_id):
        raise HTTPException(status_code=404, detail="Album not found")
    return None
