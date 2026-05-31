import json
import os
from contextlib import contextmanager
from copy import deepcopy
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, session
from sqlalchemy import Integer, String, create_engine, delete, func, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__, static_folder="static")

DB_PATH = os.environ.get("DB_PATH", "data.db")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "skjoldmo")
PASSWORD_PEPPER = os.environ.get("PASSWORD_PEPPER", "dev-pepper")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")

app.secret_key = SECRET_KEY
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "").lower() == "true",
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(collation="NOCASE"), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    presskit: Mapped[str] = mapped_column(String, nullable=False, default="")


class SocialLink(Base):
    __tablename__ = "social_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    platform: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False, default="")
    handle: Mapped[str] = mapped_column(String, nullable=False, default="")
    desc_da: Mapped[str] = mapped_column(String, nullable=False, default="")
    desc_en: Mapped[str] = mapped_column(String, nullable=False, default="")


class Show(Base):
    __tablename__ = "shows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    month: Mapped[str] = mapped_column(String, nullable=False)
    day: Mapped[str] = mapped_column(String, nullable=False)
    year: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="tickets")
    ticket_url: Mapped[str] = mapped_column(String, nullable=False, default="")


class LocalizedText(Base):
    __tablename__ = "localized_texts"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    da: Mapped[str] = mapped_column(String, nullable=False, default="")
    en: Mapped[str] = mapped_column(String, nullable=False, default="")


class SchemaMigration(Base):
    __tablename__ = "schema_migrations"

    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    applied_at: Mapped[str] = mapped_column(String, nullable=False, server_default=text("CURRENT_TIMESTAMP"))


engine = create_engine(f"sqlite:///{DB_PATH}", future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)

DEFAULT_CONFIG = {
    "email": "info@skjoldmoband.com",
    "presskit": "",
    "links": {
        "facebook": "https://facebook.com/skjoldmoband",
        "instagram": "https://instagram.com/skjoldmoband",
        "tiktok": "https://tiktok.com/@skjoldmoband",
    },
    "handles": {
        "facebook": "@skjoldmoband",
        "instagram": "@skjoldmoband",
        "tiktok": "@skjoldmoband",
    },
    "desc": {
        "facebook": {"da": "Koncertdatoer & nyt fra bandet", "en": "Concert dates & news"},
        "instagram": {"da": "Billeder fra vejen & scenen", "en": "Photos from the road & stage"},
        "tiktok": {"da": "Sange & små øjeblikke", "en": "Songs & small moments"},
    },
    "shows": [
        {
            "m": "JUN",
            "d": "14",
            "y": "2026",
            "name": "Skovtårnet Sessions",
            "city": "Gisselfeld · DK",
            "status": "tickets",
            "ticket_url": "",
        },
        {
            "m": "JUL",
            "d": "26",
            "y": "2026",
            "name": "Tønder Folk · Aftenscenen",
            "city": "Tønder · DK",
            "status": "tickets",
            "ticket_url": "",
        },
        {
            "m": "AUG",
            "d": "08",
            "y": "2026",
            "name": "Smukfest — Bøgescenen",
            "city": "Skanderborg · DK",
            "status": "soldout",
            "ticket_url": "",
        },
        {
            "m": "SEP",
            "d": "19",
            "y": "2026",
            "name": "Huset",
            "city": "Aarhus · DK",
            "status": "tickets",
            "ticket_url": "",
        },
        {
            "m": "OKT",
            "d": "31",
            "y": "2026",
            "name": "Samhain — Allehelgensnat",
            "city": "København · DK",
            "status": "free",
            "ticket_url": "",
        },
    ],
    "text": {
        "tagline": {
            "da": "Nordisk folkemusik fra de dybe skove",
            "en": "Nordic folk from the deep woods",
        },
        "connect_intro": {
            "da": "Følg med på de platforme, hvor vi deler nye sange, billeder og nyt om, hvor vi spiller næste gang.",
            "en": "Follow along on the platforms where we share new songs, photos and word of where we play next.",
        },
        "about": {
            "da": "Skjoldmø er et nordisk folkeband, der væver gamle ballader, dronestrenge og skovmørke harmonier. Guitar, cello og stemme — rodfæstet i skandinavisk tradition og skovens stilhed.",
            "en": "Skjoldmø is a Nordic folk band weaving old ballads, drone strings and forest-dark harmonies. Guitar, cello and voice — rooted in Scandinavian tradition and the quiet of the woods.",
        },
    },
}


SOCIAL_PLATFORMS = ("facebook", "instagram", "tiktok")
TEXT_KEYS = ("tagline", "connect_intro", "about")


@contextmanager
def get_session():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def normalize_config(payload):
    cfg = deepcopy(DEFAULT_CONFIG)
    if not isinstance(payload, dict):
        return cfg

    cfg["email"] = str(payload.get("email", cfg["email"]))
    cfg["presskit"] = str(payload.get("presskit", cfg["presskit"]))

    links = payload.get("links") or {}
    handles = payload.get("handles") or {}
    desc = payload.get("desc") or {}
    for platform in SOCIAL_PLATFORMS:
        cfg["links"][platform] = str(links.get(platform, cfg["links"][platform]))
        cfg["handles"][platform] = str(handles.get(platform, cfg["handles"][platform]))
        item = desc.get(platform) or {}
        cfg["desc"][platform]["da"] = str(item.get("da", cfg["desc"][platform]["da"]))
        cfg["desc"][platform]["en"] = str(item.get("en", cfg["desc"][platform]["en"]))

    text_payload = payload.get("text") or {}
    for key in TEXT_KEYS:
        item = text_payload.get(key) or {}
        cfg["text"][key]["da"] = str(item.get("da", cfg["text"][key]["da"]))
        cfg["text"][key]["en"] = str(item.get("en", cfg["text"][key]["en"]))

    raw_shows = payload.get("shows")
    if isinstance(raw_shows, list):
        cfg["shows"] = []
        for show in raw_shows:
            if not isinstance(show, dict):
                continue
            cfg["shows"].append(
                {
                    "m": str(show.get("m", "")),
                    "d": str(show.get("d", "")),
                    "y": str(show.get("y", "")),
                    "name": str(show.get("name", "")),
                    "city": str(show.get("city", "")),
                    "status": str(show.get("status", "tickets")),
                    "ticket_url": str(show.get("ticket_url", "")),
                }
            )
    return cfg


def get_legacy_blob_config(db_conn):
    has_table = db_conn.execute(
        text("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'config'")
    ).fetchone()
    if not has_table:
        return None
    row = db_conn.execute(text("SELECT data FROM config WHERE id = 1")).fetchone()
    if not row or not row[0]:
        return None
    try:
        return json.loads(row[0])
    except json.JSONDecodeError:
        return None


def write_config_to_relational(db: Session, config_payload):
    cfg = normalize_config(config_payload)

    settings = db.get(SiteSettings, 1)
    if not settings:
        settings = SiteSettings(id=1)
        db.add(settings)
    settings.email = cfg["email"]
    settings.presskit = cfg["presskit"]

    existing_social = {
        row.platform: row
        for row in db.scalars(select(SocialLink).where(SocialLink.platform.in_(SOCIAL_PLATFORMS))).all()
    }
    for platform in SOCIAL_PLATFORMS:
        row = existing_social.get(platform)
        if not row:
            row = SocialLink(platform=platform)
            db.add(row)
        row.url = cfg["links"][platform]
        row.handle = cfg["handles"][platform]
        row.desc_da = cfg["desc"][platform]["da"]
        row.desc_en = cfg["desc"][platform]["en"]

    existing_texts = {row.key: row for row in db.scalars(select(LocalizedText)).all()}
    for key in TEXT_KEYS:
        row = existing_texts.get(key)
        if not row:
            row = LocalizedText(key=key)
            db.add(row)
        row.da = cfg["text"][key]["da"]
        row.en = cfg["text"][key]["en"]

    db.execute(delete(Show))
    for idx, show in enumerate(cfg["shows"]):
        db.add(
            Show(
                sort_order=idx,
                month=show["m"],
                day=show["d"],
                year=show["y"],
                name=show["name"],
                city=show["city"],
                status=show["status"],
                ticket_url=show["ticket_url"],
            )
        )


def read_config_from_relational(db: Session):
    cfg = deepcopy(DEFAULT_CONFIG)

    settings = db.get(SiteSettings, 1)
    if settings:
        cfg["email"] = settings.email
        cfg["presskit"] = settings.presskit

    for row in db.scalars(select(SocialLink)).all():
        if row.platform not in SOCIAL_PLATFORMS:
            continue
        cfg["links"][row.platform] = row.url
        cfg["handles"][row.platform] = row.handle
        cfg["desc"][row.platform]["da"] = row.desc_da
        cfg["desc"][row.platform]["en"] = row.desc_en

    for row in db.scalars(select(LocalizedText)).all():
        if row.key in TEXT_KEYS:
            cfg["text"][row.key]["da"] = row.da
            cfg["text"][row.key]["en"] = row.en

    cfg["shows"] = []
    rows = db.scalars(select(Show).order_by(Show.sort_order.asc(), Show.id.asc())).all()
    for row in rows:
        cfg["shows"].append(
            {
                "m": row.month,
                "d": row.day,
                "y": row.year,
                "name": row.name,
                "city": row.city,
                "status": row.status,
                "ticket_url": row.ticket_url,
            }
        )
    return cfg


def ensure_admin_user(db: Session):
    count = db.scalar(select(func.count()).select_from(User)) or 0
    if count:
        return
    try:
        with db.begin_nested():
            db.add(User(username=(ADMIN_USERNAME.strip() or "admin"), password_hash=hash_password(ADMIN_PASSWORD)))
            db.flush()
    except IntegrityError:
        pass


def migration_1_initial_relational(db_conn):
    Base.metadata.create_all(bind=db_conn)
    legacy = get_legacy_blob_config(db_conn)
    seed = legacy if isinstance(legacy, dict) else DEFAULT_CONFIG

    with Session(bind=db_conn, autoflush=False, expire_on_commit=False) as db:
        has_settings = db.get(SiteSettings, 1) is not None
        if not has_settings:
            write_config_to_relational(db, seed)
        ensure_admin_user(db)
        db.commit()


def migration_2_add_show_ticket_url(db_conn):
    has_shows = db_conn.execute(
        text("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'shows'")
    ).fetchone()
    if not has_shows:
        return

    cols = {
        row[1]
        for row in db_conn.execute(text("PRAGMA table_info(shows)")).fetchall()
    }
    if "ticket_url" in cols:
        return

    db_conn.execute(
        text("ALTER TABLE shows ADD COLUMN ticket_url TEXT NOT NULL DEFAULT ''")
    )


MIGRATIONS = [
    (1, "initial_relational_schema", migration_1_initial_relational),
    (2, "add_show_ticket_url", migration_2_add_show_ticket_url),
]


def run_migrations():
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

    with engine.connect() as conn:
        applied = set(conn.execute(text("SELECT version FROM schema_migrations")).scalars().all())

    for version, name, migrate_fn in MIGRATIONS:
        if version in applied:
            continue
        with engine.begin() as conn:
            migrate_fn(conn)
            conn.execute(
                text(
                    "INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (:version, :name)"
                ),
                {"version": version, "name": name},
            )


def hash_password(password):
    return generate_password_hash(
        password + PASSWORD_PEPPER,
        method="pbkdf2:sha256",
        salt_length=16,
    )


def verify_password(password, password_hash):
    return check_password_hash(password_hash, password + PASSWORD_PEPPER)


def serialize_user(row):
    return {
        "id": row.id,
        "username": row.username,
        "created_at": row.created_at,
    }


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    with get_session() as db:
        row = db.get(User, user_id)
    if row:
        return row
    session.clear()
    return None


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if get_current_user() is None:
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)

    return wrapper


# Ensure schema and seed data exist in both local runs and WSGI hosts.
run_migrations()


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False})
    return jsonify({"authenticated": True, "user": serialize_user(user)})


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(force=True, silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    with get_session() as db:
        row = db.scalar(select(User).where(func.lower(User.username) == username.lower()))

    if not row or not verify_password(password, row.password_hash):
        return jsonify({"error": "Unauthorized"}), 401

    session.clear()
    session["user_id"] = row.id
    session["username"] = row.username
    return jsonify({"ok": True, "user": serialize_user(row)})


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/users", methods=["GET"])
@require_auth
def list_users():
    with get_session() as db:
        rows = db.scalars(select(User).order_by(User.created_at.asc(), User.username.asc())).all()
    return jsonify({"users": [serialize_user(row) for row in rows]})


@app.route("/api/users", methods=["POST"])
@require_auth
def create_user():
    payload = request.get_json(force=True, silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    with get_session() as db:
        existing = db.scalar(select(User).where(func.lower(User.username) == username.lower()))
        if existing:
            return jsonify({"error": "Username already exists"}), 409

        row = User(username=username, password_hash=hash_password(password))
        db.add(row)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "Username already exists"}), 409
        db.refresh(row)
        user = serialize_user(row)
    return jsonify({"ok": True, "user": user}), 201


@app.route("/api/config", methods=["GET"])
def get_config():
    with get_session() as db:
        cfg = read_config_from_relational(db)
    return app.response_class(json.dumps(cfg, ensure_ascii=False), mimetype="application/json")


@app.route("/api/config", methods=["POST"])
@require_auth
def save_config():
    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    with get_session() as db:
        write_config_to_relational(db, data)
    return jsonify({"ok": True})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    if not path:
        path = "index.html"
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("DEBUG", "").lower() == "true")
