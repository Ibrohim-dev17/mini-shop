"""
Uzum Market orqa tomoni (backend).
- Bitta tizimda ko'p do'kon (multi-tenant): har do'konning o'z ma'lumoti, o'z kaliti, o'z tarifi.
- Baza: DATABASE_URL o'zgaruvchisi. SQLite ham, PostgreSQL ham ishlaydi (kod o'zgarmaydi).
- Frontend o'zgarmaydi: GET /api/products?shop=<slug> eski database.json bilan bir xil JSON beradi.
"""
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import Body, Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine, delete, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

# ---------------------------------------------------------------- sozlamalar
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shop.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

MASTER_KEY = os.getenv("MASTER_KEY", "")          # sizning (egasining) kalitingiz: do'kon ochish uchun
DEFAULT_SHOP = os.getenv("DEFAULT_SHOP", "demo")   # ?shop= berilmasa shu do'kon
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)   # tokenlar imzosi. Serverda doimiy qilib qo'ying!
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
    "reviews": "reviews",
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

class User(Base):
    """Do'kon mijozlari. Telefon raqam bir do'kon ichida takrorlanmaydi."""
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("shop_id", "phone"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(80), default="")
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SmsCode(Base):
    __tablename__ = "sms_codes"
    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(Integer, index=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, default=0)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="new")
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    name: Mapped[str] = mapped_column(String(80), default="")
    phone: Mapped[str] = mapped_column(String(20), default="")
    address: Mapped[str] = mapped_column(String(300), default="")
    comment: Mapped[str] = mapped_column(String(300), default="")
    items: Mapped[list] = mapped_column(JSON, default=list)
    total: Mapped[int] = mapped_column(Integer, default=0)


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


_cache_ts: Dict[int, float] = {}

def build_payload(db: Session, shop: Shop) -> tuple:
    if shop.id in _cache and time.time() - _cache_ts.get(shop.id, 0) < 60:   # "haftalik sotuv" soni uchun 60 soniya
        return _cache[shop.id]
    out: Dict[str, Any] = {v: [] for v in KINDS.values()}
    rows = db.scalars(select(Item).where(Item.shop_id == shop.id).order_by(Item.sort, Item.ext_id)).all()
    for r in rows:
        for url_kind, key in KINDS.items():
            if r.kind == url_kind:
                out[key].append(r.data)
    out["settings"] = shop.settings or {}
    # Oxirgi 7 kunda sotilgan miqdor (buyurtmalardan) -> product.sold_week
    since = utcnow() - timedelta(days=7)
    sold: Dict[int, int] = {}
    for o in db.scalars(select(Order).where(Order.shop_id == shop.id, Order.created >= since, Order.status != "cancelled")).all():
        for it in o.items or []:
            sold[it.get("product_id")] = sold.get(it.get("product_id"), 0) + int(it.get("qty") or 0)
    if sold:
        out["products"] = [dict(p, sold_week=max(int(p.get("sold_week") or 0), sold[p["id"]])) if p.get("id") in sold else p for p in out["products"]]
    body = json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    etag = '"' + hashlib.sha1(body).hexdigest() + '"'
    _cache[shop.id] = (etag, body)
    _cache_ts[shop.id] = time.time()
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


# ================================================================ MIJOZLAR: kirish (SMS kod), buyurtma, sharh
ORDER_STATUSES = ("new", "confirmed", "shipping", "delivered", "cancelled")


def only_digits(v: Any) -> int:
    return int("".join(ch for ch in str(v or "") if ch.isdigit()) or 0)


def code_hash(shop_id: int, phone: str, code: str) -> str:
    return hashlib.sha256(f"{SECRET_KEY}:{shop_id}:{phone}:{code}".encode()).hexdigest()


def send_sms(phone: str, text: str) -> bool:
    """Eskiz.uz orqali SMS. ESKIZ_EMAIL va ESKIZ_PASSWORD o'rnatilmagan bo'lsa False qaytaradi."""
    email, password = os.getenv("ESKIZ_EMAIL"), os.getenv("ESKIZ_PASSWORD")
    if not (email and password):
        return False
    try:
        base = "https://notify.eskiz.uz/api"
        req = urllib.request.Request(base + "/auth/login", data=urllib.parse.urlencode({"email": email, "password": password}).encode())
        token = json.load(urllib.request.urlopen(req, timeout=10))["data"]["token"]
        data = urllib.parse.urlencode({"mobile_phone": phone.lstrip("+"), "message": text, "from": os.getenv("ESKIZ_FROM", "4546")}).encode()
        req = urllib.request.Request(base + "/message/sms/send", data=data, headers={"Authorization": "Bearer " + token})
        urllib.request.urlopen(req, timeout=10).read()
        return True
    except Exception as e:  # noqa
        print("[SMS XATO]", e)
        raise HTTPException(502, "SMS yuborib bo'lmadi")


def make_token(user: User) -> str:
    exp = int(time.time()) + 30 * 86400
    msg = f"{user.id}.{user.shop_id}.{exp}"
    return msg + "." + hmac.new(SECRET_KEY.encode(), msg.encode(), "sha256").hexdigest()[:40]


def current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    try:
        token = (authorization or "").split(" ", 1)[1]
        uid, sid, exp, sig = token.split(".")
        good = hmac.new(SECRET_KEY.encode(), f"{uid}.{sid}.{exp}".encode(), "sha256").hexdigest()[:40]
        if not hmac.compare_digest(sig, good) or int(exp) < time.time():
            raise ValueError
        user = db.get(User, int(uid))
        if not user or user.shop_id != int(sid):
            raise ValueError
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Kirish kerak")


def user_dict(u: User) -> Dict[str, Any]:
    return {"id": u.id, "phone": u.phone, "name": u.name}


def order_dict(o: Order) -> Dict[str, Any]:
    return {"id": o.id, "number": o.number, "status": o.status, "created": as_aware(o.created).isoformat(), "name": o.name,
            "phone": o.phone, "address": o.address, "comment": o.comment, "items": o.items or [], "total": o.total}


def live_shop_by_slug(db: Session, slug: str) -> Shop:
    s = find_shop(db, slug or DEFAULT_SHOP)
    if not shop_is_live(s):
        raise HTTPException(402, "Obuna muddati tugagan")
    return s


@app.post("/api/auth/request-code", tags=["mijoz"])
def request_code(body: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    shop = live_shop_by_slug(db, str(body.get("shop") or ""))
    phone = str(body.get("phone") or "").strip()
    if not (phone.startswith("+998") and len(phone) == 13 and phone[1:].isdigit()):
        raise HTTPException(400, "Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak")
    now = utcnow()
    last = db.scalar(select(SmsCode).where(SmsCode.shop_id == shop.id, SmsCode.phone == phone).order_by(SmsCode.id.desc()))
    if last and (now - as_aware(last.created)).total_seconds() < 45:
        raise HTTPException(429, "Kodni qayta so'rash uchun biroz kuting")
    hour = db.scalar(select(func.count()).select_from(SmsCode).where(SmsCode.shop_id == shop.id, SmsCode.phone == phone,
                                                                     SmsCode.created > now - timedelta(hours=1))) or 0
    if hour >= 5:
        raise HTTPException(429, "Juda ko'p urinish. Keyinroq qayta urinib ko'ring")
    code = str(secrets.randbelow(90000) + 10000)
    db.add(SmsCode(shop_id=shop.id, phone=phone, code_hash=code_hash(shop.id, phone, code), created=now, expires=now + timedelta(minutes=5)))
    db.commit()
    if send_sms(phone, f"{shop.name or 'Do`kon'}: tasdiqlash kodi {code}"):
        return {"ok": True}
    if os.getenv("SMS_DEV", "1") == "1":          # SMS provayder sozlanmagan: faqat sinov uchun kod javobda qaytadi
        return {"ok": True, "dev_code": code}
    raise HTTPException(503, "SMS xizmati sozlanmagan")


@app.post("/api/auth/verify", tags=["mijoz"])
def verify_code(body: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    shop = live_shop_by_slug(db, str(body.get("shop") or ""))
    phone, code = str(body.get("phone") or "").strip(), str(body.get("code") or "").strip()
    row = db.scalar(select(SmsCode).where(SmsCode.shop_id == shop.id, SmsCode.phone == phone).order_by(SmsCode.id.desc()))
    if not row or as_aware(row.expires) < utcnow() or row.attempts >= 5:
        raise HTTPException(400, "Kod eskirgan. Yangi kod so'rang")
    if not secrets.compare_digest(row.code_hash, code_hash(shop.id, phone, code)):
        row.attempts += 1
        db.commit()
        raise HTTPException(400, "Kod noto'g'ri")
    db.execute(delete(SmsCode).where(SmsCode.shop_id == shop.id, SmsCode.phone == phone))
    name = str(body.get("name") or "").strip()[:40]
    user = db.scalar(select(User).where(User.shop_id == shop.id, User.phone == phone))
    if not user:
        user = User(shop_id=shop.id, phone=phone, name=name, created=utcnow())
        db.add(user)
    elif name and not user.name:
        user.name = name
    db.commit()
    return {"token": make_token(user), "user": user_dict(user)}


@app.get("/api/me", tags=["mijoz"])
def get_me(user: User = Depends(current_user)):
    return user_dict(user)


@app.put("/api/me", tags=["mijoz"])
def put_me(body: Dict[str, Any] = Body(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.name = str(body.get("name") or "").strip()[:40]
    db.commit()
    return user_dict(user)


@app.get("/api/orders", tags=["mijoz"])
def my_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())).all()
    return [order_dict(o) for o in rows]


def variant_key(color: Any, size: Any) -> str:
    return f"{'' if color is None else color}|{'' if size is None else size}"


@app.post("/api/orders", tags=["mijoz"], status_code=201)
def create_order(body: Dict[str, Any] = Body(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    shop = db.get(Shop, user.shop_id)
    if not shop or not shop_is_live(shop):
        raise HTTPException(402, "Obuna muddati tugagan")
    raw = body.get("items")
    if not isinstance(raw, list) or not raw or len(raw) > 50:
        raise HTTPException(400, "Buyurtmada mahsulot yo'q")
    rows = {r.ext_id: r for r in db.scalars(select(Item).where(Item.shop_id == shop.id, Item.kind == "products")).all()}
    # bir xil variantlarni birlashtirish
    lines: Dict[tuple, int] = {}
    for it in raw:
        try:
            pid, qty = int(it.get("product_id")), int(it.get("qty") or 1)
        except Exception:
            raise HTTPException(400, "Noto'g'ri mahsulot")
        if pid not in rows or qty < 1 or qty > 99:
            raise HTTPException(400, "Mahsulot topilmadi")
        k = (pid, it.get("color"), it.get("size"))
        lines[k] = lines.get(k, 0) + qty
    snap, total = [], 0
    work = {pid: dict(rows[pid].data) for pid in {k[0] for k in lines}}
    for (pid, color, size), qty in lines.items():
        data = work[pid]
        vs = dict(data["variant_stock"]) if isinstance(data.get("variant_stock"), dict) else None
        key = variant_key(color, size)
        avail = int(vs.get(key, 0)) if vs is not None else int(data.get("stock", 10))
        name = data.get("name")
        if qty > avail:
            raise HTTPException(409, f"Omborda yetarli emas: {name.get('uz') if isinstance(name, dict) else name} ({avail} ta qolgan)")
        if vs is not None:
            vs[key] = avail - qty
            data["variant_stock"] = vs
            data["stock"] = sum(int(v) for v in vs.values())
        elif "stock" in data:
            data["stock"] = avail - qty
        col = next((c for c in (data.get("colors") or []) if c.get("id") == color), None)
        image = ((col or {}).get("images") or data.get("images") or [""])[0]
        price = only_digits(data.get("price"))
        total += price * qty
        snap.append({"product_id": pid, "name": name, "image": image, "price": price, "color": color,
                     "color_name": (col or {}).get("name"), "size": size, "qty": qty, "reviewed": False})
    for pid, data in work.items():           # qoldiqni kamaytirish
        rows[pid].data = data
    number = (db.scalar(select(func.max(Order.number)).where(Order.shop_id == shop.id)) or 1000) + 1
    order = Order(shop_id=shop.id, user_id=user.id, number=number, status="new", created=utcnow(),
                  name=str(body.get("name") or user.name)[:80], phone=user.phone, address=str(body.get("address") or "")[:300],
                  comment=str(body.get("comment") or "")[:300], items=snap, total=total)
    db.add(order)
    db.commit()
    invalidate(shop.id)
    return order_dict(order)


@app.post("/api/reviews", tags=["mijoz"], status_code=201)
def create_review(body: Dict[str, Any] = Body(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Sharh faqat yetkazilgan buyurtmadagi mahsulotga, bir marta qoldiriladi."""
    order = db.get(Order, int(only_digits(body.get("order_id"))))
    pid = int(only_digits(body.get("product_id")))
    if not order or order.user_id != user.id or order.status != "delivered":
        raise HTTPException(403, "Sharh faqat yetkazilgan buyurtma uchun")
    items = [dict(i) for i in (order.items or [])]
    target = next((i for i in items if i.get("product_id") == pid and not i.get("reviewed")), None)
    if not target:
        raise HTTPException(409, "Bu mahsulotga sharh allaqachon qoldirilgan")
    rating = int(body.get("rating") or 0)
    if rating < 1 or rating > 5:
        raise HTTPException(400, "Baho 1 dan 5 gacha")
    photos = [p for p in (body.get("photos") or [])[:3] if isinstance(p, str) and p.startswith("data:image/") and len(p) < 450_000]
    shop = db.get(Shop, user.shop_id)
    ext = next_ext_id(db, shop, "reviews")
    review = {"id": ext, "product_id": pid, "name": None if body.get("anonymous") else (user.name or None), "rating": rating,
              "text": str(body.get("text") or "")[:600], "date": date.today().isoformat(), "color": body.get("color"),
              "size": body.get("size"), "photos": photos}
    db.add(Item(shop_id=shop.id, kind="reviews", ext_id=ext, sort=ext, data=review))
    target["reviewed"] = True
    order.items = items
    db.commit()
    invalidate(shop.id)
    return review

# ---------------------------------------------------------------- admin: buyurtmalarni ko'rish va holatini o'zgartirish
@app.get("/api/orders-admin/{shop}", tags=["admin"])
def admin_orders(shop: str, x_admin_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    rows = db.scalars(select(Order).where(Order.shop_id == s.id).order_by(Order.id.desc()).limit(500)).all()
    return [order_dict(o) for o in rows]


@app.patch("/api/orders-admin/{shop}/{order_id}", tags=["admin"])
def admin_set_status(shop: str, order_id: int, body: Dict[str, Any] = Body(...), x_admin_key: Optional[str] = Header(None),
                     db: Session = Depends(get_db)):
    """status: new, confirmed, shipping, delivered, cancelled. 'delivered' bo'lgach mijoz sharh qoldira oladi."""
    s = find_shop(db, shop)
    check_admin(s, x_admin_key)
    o = db.get(Order, order_id)
    if not o or o.shop_id != s.id:
        raise HTTPException(404, "Buyurtma topilmadi")
    if body.get("status") not in ORDER_STATUSES:
        raise HTTPException(400, "status: " + ", ".join(ORDER_STATUSES))
    o.status = body["status"]
    db.commit()
    return order_dict(o)

