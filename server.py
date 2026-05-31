import json
import os
import sqlite3
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, session
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
        {"m": "JUN", "d": "14", "y": "2026", "name": "Skovtårnet Sessions", "city": "Gisselfeld · DK", "status": "tickets"},
        {"m": "JUL", "d": "26", "y": "2026", "name": "Tønder Folk · Aftenscenen", "city": "Tønder · DK", "status": "tickets"},
        {"m": "AUG", "d": "08", "y": "2026", "name": "Smukfest — Bøgescenen", "city": "Skanderborg · DK", "status": "soldout"},
        {"m": "SEP", "d": "19", "y": "2026", "name": "Huset", "city": "Aarhus · DK", "status": "tickets"},
        {"m": "OKT", "d": "31", "y": "2026", "name": "Samhain — Allehelgensnat", "city": "København · DK", "status": "free"},
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


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


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
        "id": row["id"],
        "username": row["username"],
        "created_at": row["created_at"],
    }


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE id = ?",
            [user_id],
        ).fetchone()
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


def init_db():
    with get_db() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        existing = conn.execute("SELECT id FROM config WHERE id = 1").fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO config (id, data) VALUES (1, ?)",
                [json.dumps(DEFAULT_CONFIG, ensure_ascii=False)],
            )
        user_count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if not user_count:
            conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                [ADMIN_USERNAME.strip() or "admin", hash_password(ADMIN_PASSWORD)],
            )


# Ensure tables and bootstrap records exist in both local runs and WSGI hosts.
init_db()


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

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
            [username],
        ).fetchone()

    if not row or not verify_password(password, row["password_hash"]):
        return jsonify({"error": "Unauthorized"}), 401

    session.clear()
    session["user_id"] = row["id"]
    session["username"] = row["username"]
    return jsonify({"ok": True, "user": serialize_user(row)})


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/users", methods=["GET"])
@require_auth
def list_users():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, username, created_at FROM users ORDER BY created_at ASC, username ASC"
        ).fetchall()
    return jsonify({"users": [dict(row) for row in rows]})


@app.route("/api/users", methods=["POST"])
@require_auth
def create_user():
    payload = request.get_json(force=True, silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    with get_db() as conn:
        try:
            conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                [username, hash_password(password)],
            )
        except sqlite3.IntegrityError:
            return jsonify({"error": "Username already exists"}), 409
        row = conn.execute(
            "SELECT id, username, created_at FROM users WHERE username = ?",
            [username],
        ).fetchone()
    return jsonify({"ok": True, "user": dict(row)}), 201


@app.route("/api/config", methods=["GET"])
def get_config():
    with get_db() as conn:
        row = conn.execute("SELECT data FROM config WHERE id = 1").fetchone()
        if row:
            return app.response_class(row["data"], mimetype="application/json")
        return jsonify(DEFAULT_CONFIG)


@app.route("/api/config", methods=["POST"])
@require_auth
def save_config():
    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO config (id, data) VALUES (1, ?)",
            [json.dumps(data, ensure_ascii=False)],
        )
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
