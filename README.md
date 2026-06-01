# Skjoldmø Web

Official website and lightweight admin panel for Skjoldmø.

This project is a Flask app that serves a static React frontend (loaded directly in the browser via CDN) and stores editable site content in a relational SQLite schema via SQLAlchemy ORM.

## Features

- Public site served at `/`
- Admin panel served at `/admin.html`
- Config API backed by SQLAlchemy ORM + SQLite (`/api/config`)
- Automatic startup migrations with legacy JSON-config import
- Session-based admin login with username/password
- Per-user password hashes salted by Werkzeug and peppered server-side
- Danish/English copy support for key content blocks
- No frontend build pipeline required

## Tech Stack

- Backend: Flask + SQLAlchemy ORM
- Database: SQLite
- Frontend: React + ReactDOM + Babel Standalone (CDN)
- Runtime: Python

## Project Structure

```text
.
├── server.py                # Flask app, API routes, DB init
├── requirements.txt         # Python dependencies
├── static/
│   ├── index.html           # Public site entry
│   ├── admin.html           # Admin entry
│   ├── app/
│   │   ├── site-config.js   # Shared config model + API helpers
│   │   ├── shared.jsx       # Shared React components
│   │   ├── site.jsx         # Public site UI
│   │   └── admin.jsx        # Admin UI
│   └── assets/              # Images and static assets
└── data.db                  # SQLite database (ignored by git)
```

## Requirements

- Python 3.10+

Install dependencies:

```bash
pip install -r requirements.txt
```

## Running Locally

Set environment variables and start the server:

```bash
export DEBUG=true
export PORT=5000
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=your-local-password
export PASSWORD_PEPPER=your-local-pepper
export SECRET_KEY=your-local-session-secret
export DB_PATH=/workspaces/skjoldmoband-web/data.db
python server.py
```

Then open:

- Public site: `http://localhost:5000/`
- Admin panel: `http://localhost:5000/admin.html`

## Environment Variables

- `PORT` (default: `5000`): Flask server port
- `DEBUG` (default: `false`): Flask debug mode (`true` enables debug)
- `DB_PATH` (default: `data.db`): path to SQLite file
- `ADMIN_USERNAME` (default: `admin`): bootstrap username when the user table is empty
- `ADMIN_PASSWORD` (default: `skjoldmo`): bootstrap password when the user table is empty
- `PASSWORD_PEPPER` (default: `dev-pepper`): server-side secret mixed into password hashes; set a strong value in production
- `SECRET_KEY` (default: `dev-secret-key`): Flask session signing key; set a strong value in production

## How Content Is Stored

- On startup, `server.py` runs schema migrations and ensures relational tables exist.
- If the legacy `config` JSON blob table exists, its data is imported once into the relational tables.
- The public site fetches config from `GET /api/config`.
- The admin panel signs in via `POST /api/auth/login`, keeps its session in an HttpOnly cookie, and sends updates to `POST /api/config`.
- Authenticated admins can also create more users at `POST /api/users`.
- Saved changes appear immediately on the public site.

## API

### `GET /api/config`

Returns the current site configuration JSON.

### `POST /api/auth/login`

Signs in with a username and password.

Body:

- `username`
- `password`

### `POST /api/auth/logout`

Clears the current session.

### `GET /api/auth/me`

Returns the current authenticated user, if any.

### `GET /api/users`

Lists user accounts for the signed-in admin session.

### `POST /api/users`

Creates a new user account.

### `POST /api/config`

Saves configuration JSON.

Auth:

- Requires a valid signed-in session cookie

Responses:

- `200 {"ok": true}` on success
- `401 {"error": "Unauthorized"}` for bad/missing password
- `400 {"error": "Invalid JSON"}` for malformed payload

## Notes

- `data.db` is in `.gitignore`.
- Frontend code under `static/app/` is intentionally unbundled for simple editing/deployment.
- Legacy `config` table is kept as historical data after import; runtime reads/writes use relational tables.
- For production, set a strong `ADMIN_PASSWORD` and run behind a proper WSGI/HTTP setup.

## Licensing

This repository uses split licensing:

- Software source code is licensed under MIT (see `LICENSE`).
- Original creative content and branding are all rights reserved (see `CONTENT_LICENSE.md`).
- Third-party libraries/fonts/assets keep their own licenses (see `THIRD_PARTY_NOTICES.md`).

## Deploying With Render Blueprint

This repo includes a production-ready Render Blueprint at `render.yaml` and a Gunicorn startup script at `scripts/start.sh`.

### What the blueprint configures

- Python web service build/install from `requirements.txt`
- Gunicorn startup via `bash scripts/start.sh`
- Persistent disk mounted at `/var/data`
- SQLite path set to `DB_PATH=/var/data/data.db`
- Session cookie security defaults for HTTPS
- Secret env vars managed in Render dashboard (`sync: false`)

### One-time setup in Render

1. Push this repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repository and branch.
4. During setup, provide secret values for:
   - `ADMIN_PASSWORD`
   - `PASSWORD_PEPPER`
   - `SECRET_KEY`
5. Deploy.

### Important bootstrap behavior

- The first admin user is only seeded when the `users` table is empty.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` are used for that initial seed.
- After users exist, changing those env vars will not overwrite existing users.
