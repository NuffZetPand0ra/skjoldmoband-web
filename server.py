import json
import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="static")

DB_PATH = os.environ.get("DB_PATH", "data.db")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "skjoldmo")

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


def init_db():
    with get_db() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)"
        )
        existing = conn.execute("SELECT id FROM config WHERE id = 1").fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO config (id, data) VALUES (1, ?)",
                [json.dumps(DEFAULT_CONFIG, ensure_ascii=False)],
            )


@app.route("/api/config", methods=["GET"])
def get_config():
    with get_db() as conn:
        row = conn.execute("SELECT data FROM config WHERE id = 1").fetchone()
        if row:
            return app.response_class(row["data"], mimetype="application/json")
        return jsonify(DEFAULT_CONFIG)


@app.route("/api/config", methods=["POST"])
def save_config():
    password = request.headers.get("X-Admin-Password", "")
    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401
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
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("DEBUG", "").lower() == "true")
