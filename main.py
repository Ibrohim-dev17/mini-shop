"""
Uzum Market orqa tomoni (backend).
- Bitta tizimda ko'p do'kon (multi-tenant): har do'konning o'z ma'lumoti, o'z kaliti, o'z tarifi.
- Baza: DATABASE_URL o'zgaruvchisi. SQLite ham, PostgreSQL ham ishlaydi (kod o'zgarmaydi).
- Frontend o'zgarmaydi: GET /api/products?shop=<slug> eski database.json bilan bir xil JSON beradi.
"""
import hashlib
import json
import os
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import Body, Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, create_engine, delete, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

# ---------------------------------------------------------------- sozlamalar
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shop.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

MASTER_KEY = os.getenv("MASTER_KEY", "")          # sizning (egasining) kalitingiz: do'kon ochish uchun
DEFAULT_SHOP = os.getenv("DEFAULT_SHOP", "demo")   # ?shop= berilmasa shu do'kon
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

# Tariflar: kerak bo'lsa o'zgartiring. None = cheklovsiz
PLANS: Dict[str, Dict[str, Optional[int]]] = {
    "trial":    {"products": 30,   "stories": 5,   "banners": 3},
    "start":    {"products": 300,  "stories": 20,  "banners": 10},
    "business": {"products": 3000, "stories": 100, "banners": 30},
    "pro":      {"products": None, "stories": None, "banners": None},
}

# URL qismi -> JSON kaliti
KINDS = {
    "categories": "categories",
    "products": "products",
    "banners": "banners",
    "stories": "stories",
    "sections": "home_sections",
}

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Shop(Base):
    __tablename__ = "shops"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    api_key: Mapped[str] = mapped_column(String(64))
    plan: Mapped[str] = mapped_column(String(20), default="trial")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)


class Item(Base):
    """Barcha yozuvlar (kategoriya, mahsulot, banner, storis, bo'lim) bitta jadvalda; to'liq obyekt `data` ichida."""
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20), index=True)
    ext_id: Mapped[int] = mapped_column(Integer, index=True)   # frontenddagi id
    sort: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[dict] = mapped_column(JSON)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ---------------------------------------------------------------- ilova
app = FastAPI(title="Uzum Market API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["ETag"])

_cache: Dict[int, tuple] = {}   # shop_id -> (etag, bytes)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Shop)):
            key = os.getenv("DEMO_KEY") or secrets.token_urlsafe(24)
            db.add(Shop(slug=DEFAULT_SHOP, name="Demo", api_key=key, plan="pro"))
            db.commit()
            print(f"[BOSHLANG'ICH] '{DEFAULT_SHOP}' do'koni ochildi. Admin kaliti: {key}")


def get_db():
    with SessionLocal() as db:
        yield db


# ---------------------------------------------------------------- yordamchilar
def find_shop(db: Session, slug: str) -> Shop:
    shop = db.scalar(select(Shop).where(Shop.slug == slug))
    if not shop:
        raise HTTPException(404, "Do'kon topilmadi")
    return shop


def check_admin(shop: Shop, key: Optional[str]) -> None:
    ok = bool(key) and (secrets.compare_digest(key, shop.api_key) or (MASTER_KEY and secrets.compare_digest(key, MASTER_KEY)))
    if not ok:
        raise HTTPException(401, "Kalit noto'g'ri (X-Admin-Key)")


def check_master(key: Optional[str]) -> None:
    if not MASTER_KEY or not key or not secrets.compare_digest(key, MASTER_KEY):
        raise HTTPException(401, "MASTER_KEY noto'g'ri yoki serverda o'rnatilmagan")


def shop_is_live(shop: Shop) -> bool:
    exp = as_aware(shop.expires_at)
    return shop.active and (exp is None or exp > utcnow())


def limit_for(shop: Shop, kind: str) -> Optional[int]:
    return PLANS.get(shop.plan, PLANS["trial"]).get(kind)


def count_kind(db: Session, shop: Shop, kind: str) -> int:
    return db.scalar(select(func.count()).select_from(Item).where(Item.shop_id == shop.id, Item.kind == kind)) or 0


def check_limit(db: Session, shop: Shop, kind: str, adding: int = 1, replacing: int = 0) -> None:
    lim = limit_for(shop, kind)
    if lim is not None and count_kind(db, shop, kind) - replacing + adding > lim:
        raise HTTPException(403, f"'{shop.plan}' tarifida {kind} soni {lim} tadan oshmasligi kerak. Tarifni oshiring.")


def next_ext_id(db: Session, shop: Shop, kind: str) -> int:
    return (db.scalar(select(func.max(Item.ext_id)).where(Item.shop_id == shop.id, Item.kind == kind)) or 0) + 1


def invalidate(shop_id: int) -> None:
    _cache.pop(shop_id, None)


def build_payload(db: Session, shop: Shop) -> tuple:
    if shop.id in _cache:
        return _cache[shop.id]
    out: Dict[str, Any] = {v: [] for v in KINDS.values()}
    rows = db.scalars(select(Item).where(Item.shop_id == shop.id).order_by(Item.sort, Item.ext_id)).all()
    for r in rows:
        for url_kind, key in KINDS.items():
            if r.kind == url_kind:
                out[key].append(r.data)
    out["settings"] = shop.settings or {}
    body = json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    etag = '"' + hashlib.sha1(body).hexdigest() + '"'
    _cache[shop.id] = (etag, body)
    return _cache[shop.id]


def replace_all(db: Session, shop: Shop, payload: Dict[str, Any]) -> Dict[str, int]:
    if not isinstance(payload, dict):
        raise HTTPException(400, "JSON obyekt bo'lishi kerak")
    for url_kind, key in KINDS.items():
        lim = limit_for(shop, url_kind)
        n = len(payload.get(key) or [])
        if lim is not None and n > lim:
            raise HTTPException(403, f"'{shop.plan}' tarifida {url_kind} soni {lim} tadan oshmasligi kerak (siz {n} ta yubordingiz).")
    counts = {}
    db.execute(delete(Item).where(Item.shop_id == shop.id))
    for url_kind, key in KINDS.items():
        items = payload.get(key) or []
        counts[key] = len(items)
        for i, obj in enumerate(items):
            if not isinstance(obj, dict):
                raise HTTPException(400, f"{key} ichida obyekt bo'lmagan element bor")
            ext = obj.get("id")
            if not isinstance(ext, int):
                ext = i + 1
                obj["id"] = ext if url_kind == "banners" else obj.get("id", ext)
            db.add(Item(shop_id=shop.id, kind=url_kind, ext_id=ext if isinstance(ext, int) else i + 1, sort=i, data=obj))
    if isinstance(payload.get("settings"), dict):
        shop.settings = payload["settings"]
    db.commit()
    invalidate(shop.id)
    return counts


# ---------------------------------------------------------------- ochiq API (frontend uchun)
@app.get("/api/health")
def health():
    return {"ok": True, "time": utcnow().isoformat()}


@app.get("/api/products")
def public_data(request: Request, response: Response, shop: str = "", db: Session = Depends(get_db)):
    """Eski database.json bilan bir xil shakldagi JSON."""
    s = find_shop(db, shop or DEFAULT_SHOP)
    if not shop_is_live(s):
        raise HTTPException(402, "Obuna muddati tugagan")
    etag, body = build_payload(db, s)
    headers = {"ETag": etag, "Cache-Control": "public, max-age=30"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)


# ---------------------------------------------------------------- admin: ma'lumotlarni boshqarish
@app.put("/api/admin/{shop}/import", tags=["admin"])
def import_json(shop: str, payload: Dict[str, Any] = Body(...), x_admin_key: Optional[str] = Header(None),
                db: Session = Depends(get_db)):
    """Butun database.json ni yuboring: do'kon ma'lumoti to'liq almashtiriladi."""
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    return {"ok": True, "counts": replace_all(db, s, payload)}


@app.post("/api/admin/{shop}/import-file", tags=["admin"])
async def import_file(shop: str, file: UploadFile = File(...), x_admin_key: Optional[str] = Header(None),
                      db: Session = Depends(get_db)):
    """database.json faylini tanlab yuklash (telefondan qulay)."""
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    try:
        payload = json.loads((await file.read()).decode("utf-8"))
    except Exception:
        raise HTTPException(400, "Fayl to'g'ri JSON emas")
    return {"ok": True, "counts": replace_all(db, s, payload)}


@app.get("/api/admin/{shop}/{kind}", tags=["admin"])
def list_items(shop: str, kind: str, x_admin_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    if kind not in KINDS:
        raise HTTPException(404, f"kind: {', '.join(KINDS)}")
    rows = db.scalars(select(Item).where(Item.shop_id == s.id, Item.kind == kind).order_by(Item.sort, Item.ext_id)).all()
    return [r.data for r in rows]


@app.post("/api/admin/{shop}/{kind}", tags=["admin"], status_code=201)
def create_item(shop: str, kind: str, obj: Dict[str, Any] = Body(...), x_admin_key: Optional[str] = Header(None),
                db: Session = Depends(get_db)):
    """Yangi element qo'shish. `id` berilmasa o'zi beriladi."""
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    if kind not in KINDS:
        raise HTTPException(404, f"kind: {', '.join(KINDS)}")
    check_limit(db, s, kind)
    ext = obj.get("id") if isinstance(obj.get("id"), int) else next_ext_id(db, s, kind)
    if db.scalar(select(Item.id).where(Item.shop_id == s.id, Item.kind == kind, Item.ext_id == ext)):
        raise HTTPException(409, "Bu id band")
    obj["id"] = ext
    db.add(Item(shop_id=s.id, kind=kind, ext_id=ext, sort=next_ext_id(db, s, kind), data=obj))
    db.commit()
    invalidate(s.id)
    return obj


@app.put("/api/admin/{shop}/{kind}/{ext_id}", tags=["admin"])
def update_item(shop: str, kind: str, ext_id: int, obj: Dict[str, Any] = Body(...),
                x_admin_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Elementni to'liq almashtirish (yo'q bo'lsa yaratadi)."""
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    if kind not in KINDS:
        raise HTTPException(404, f"kind: {', '.join(KINDS)}")
    obj["id"] = ext_id
    row = db.scalar(select(Item).where(Item.shop_id == s.id, Item.kind == kind, Item.ext_id == ext_id))
    if row:
        row.data = obj
    else:
        check_limit(db, s, kind)
        db.add(Item(shop_id=s.id, kind=kind, ext_id=ext_id, sort=next_ext_id(db, s, kind), data=obj))
    db.commit()
    invalidate(s.id)
    return obj


@app.delete("/api/admin/{shop}/{kind}/{ext_id}", tags=["admin"])
def delete_item(shop: str, kind: str, ext_id: int, x_admin_key: Optional[str] = Header(None),
                db: Session = Depends(get_db)):
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    if kind not in KINDS:
        raise HTTPException(404, f"kind: {', '.join(KINDS)}")
    res = db.execute(delete(Item).where(Item.shop_id == s.id, Item.kind == kind, Item.ext_id == ext_id))
    db.commit()
    invalidate(s.id)
    return {"ok": True, "deleted": res.rowcount}


@app.put("/api/admin/{shop}/settings", tags=["admin"])
def put_settings(shop: str, settings: Dict[str, Any] = Body(...), x_admin_key: Optional[str] = Header(None),
                 db: Session = Depends(get_db)):
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    s.settings = settings
    db.commit()
    invalidate(s.id)
    return settings


# ---------------------------------------------------------------- egasi uchun: do'konlar va tariflar
@app.post("/api/master/shops", tags=["master"], status_code=201)
def create_shop(body: Dict[str, Any] = Body(..., examples=[{"slug": "dokon1", "name": "Do'kon 1", "plan": "trial", "expires_at": "2026-11-01T00:00:00+05:00"}]),
                x_master_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    check_master(x_master_key)
    slug = str(body.get("slug", "")).strip().lower()
    if not slug or not slug.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(400, "slug: faqat harf, raqam, - va _")
    if db.scalar(select(Shop.id).where(Shop.slug == slug)):
        raise HTTPException(409, "Bu slug band")
    plan = body.get("plan", "trial")
    if plan not in PLANS:
        raise HTTPException(400, f"plan: {', '.join(PLANS)}")
    exp = body.get("expires_at")
    s = Shop(slug=slug, name=body.get("name", ""), plan=plan, api_key=secrets.token_urlsafe(24),
             expires_at=datetime.fromisoformat(exp) if exp else None)
    db.add(s)
    db.commit()
    return {"slug": s.slug, "api_key": s.api_key, "plan": s.plan, "expires_at": exp}


@app.get("/api/master/shops", tags=["master"])
def list_shops(x_master_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    check_master(x_master_key)
    out = []
    for s in db.scalars(select(Shop).order_by(Shop.id)).all():
        out.append({"slug": s.slug, "name": s.name, "plan": s.plan, "active": s.active,
                    "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                    "live": shop_is_live(s), "products": count_kind(db, s, "products")})
    return out


@app.patch("/api/master/shops/{slug}", tags=["master"])
def update_shop(slug: str, body: Dict[str, Any] = Body(...), x_master_key: Optional[str] = Header(None),
                db: Session = Depends(get_db)):
    """Tarifni almashtirish, to'lov muddatini uzaytirish, do'konni o'chirish/yoqish."""
    check_master(x_master_key)
    s = find_shop(db, slug)
    if "plan" in body:
        if body["plan"] not in PLANS:
            raise HTTPException(400, f"plan: {', '.join(PLANS)}")
        s.plan = body["plan"]
    if "active" in body:
        s.active = bool(body["active"])
    if "name" in body:
        s.name = str(body["name"])
    if "expires_at" in body:
        s.expires_at = datetime.fromisoformat(body["expires_at"]) if body["expires_at"] else None
    db.commit()
    invalidate(s.id)
    return {"ok": True, "slug": s.slug, "plan": s.plan, "active": s.active,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None}
