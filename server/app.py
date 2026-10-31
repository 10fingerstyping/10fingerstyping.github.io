import os
import re
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = os.environ.get("DB_PATH", str(BASE_DIR / "users.db"))

app = Flask(__name__)
CORS(app)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
MIN_PASSWORD_LEN = 8
MAX_UNIT_LEN = 4
MAX_LESSON_INDEX = 20
MIN_COMPLETED_ACCURACY = 90.0


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'user',
            created_at    TEXT    NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT    PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TEXT    NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS progress (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            unit           TEXT    NOT NULL,
            lesson         INTEGER NOT NULL,
            completed      INTEGER NOT NULL DEFAULT 0,
            best_accuracy  REAL    NOT NULL DEFAULT 0,
            best_wpm       REAL    NOT NULL DEFAULT 0,
            attempts       INTEGER NOT NULL DEFAULT 0,
            updated_at     TEXT    NOT NULL,
            UNIQUE(user_id, unit, lesson)
        )
        """
    )
    db.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)")
    db.commit()
    db.close()


def user_public(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"],
        "created_at": row["created_at"],
    }


def error(message, status=400):
    return jsonify({"ok": False, "error": message}), status


def create_session(db, user_id):
    token = secrets.token_hex(32)
    db.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now_iso()),
    )
    return token


def bearer_token():
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return ""


def current_user():
    token = bearer_token()
    if not token:
        return None
    db = get_db()
    return db.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ?",
        (token,),
    ).fetchone()


def require_user():
    user = current_user()
    if user is None:
        return None, error("Pro uložení pokroku se musíte přihlásit.", 401)
    return user, None


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "status": "up"})


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip()

    if not username:
        return error("Uživatelské jméno je povinné.")
    if len(username) < 3:
        return error("Uživatelské jméno musí mít alespoň 3 znaky.")
    if not email:
        return error("E-mail je povinný.")
    if not EMAIL_RE.match(email):
        return error("E-mail nemá správný tvar.")
    if len(password) < MIN_PASSWORD_LEN:
        return error(f"Heslo musí mít alespoň {MIN_PASSWORD_LEN} znaků.")
    if role not in ("user", "student", "teacher"):
        return error("Neplatná role.")

    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return error("Účet s tímto e-mailem už existuje.", 409)
    if db.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone():
        return error("Toto uživatelské jméno je už obsazené.", 409)

    password_hash = generate_password_hash(password)
    created_at = now_iso()
    cur = db.execute(
        "INSERT INTO users (username, email, password_hash, role, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (username, email, password_hash, role, created_at),
    )
    token = create_session(db, cur.lastrowid)
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify({"ok": True, "user": user_public(row), "token": token}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error("Zadejte e-mail a heslo.")

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return error("Nesprávný e-mail nebo heslo.", 401)

    token = create_session(db, row["id"])
    db.commit()
    return jsonify({"ok": True, "user": user_public(row), "token": token})


@app.post("/api/logout")
def logout():
    token = bearer_token()
    if token:
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        db.commit()
    return jsonify({"ok": True})


@app.get("/api/progress")
def get_progress():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    db = get_db()
    rows = db.execute(
        "SELECT unit, lesson, completed, best_accuracy, best_wpm, attempts, updated_at "
        "FROM progress WHERE user_id = ? ORDER BY unit, lesson",
        (user["id"],),
    ).fetchall()

    return jsonify(
        {
            "ok": True,
            "user": user_public(user),
            "progress": [
                {
                    "unit": row["unit"],
                    "lesson": row["lesson"],
                    "completed": bool(row["completed"]),
                    "best_accuracy": row["best_accuracy"],
                    "best_wpm": row["best_wpm"],
                    "attempts": row["attempts"],
                    "updated_at": row["updated_at"],
                }
                for row in rows
            ],
        }
    )


@app.post("/api/progress")
def save_progress():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    unit = str(data.get("unit") or "").strip().lower()
    lesson = data.get("lesson")

    if not unit or len(unit) > MAX_UNIT_LEN or not re.match(r"^[a-z0-9_]+$", unit):
        return error("Neplatná jednotka.")
    try:
        lesson = int(lesson)
    except (TypeError, ValueError):
        return error("Neplatná lekce.")
    if lesson < 1 or lesson > MAX_LESSON_INDEX:
        return error("Neplatná lekce.")

    try:
        accuracy = float(data.get("accuracy") or 0)
    except (TypeError, ValueError):
        accuracy = 0.0
    try:
        wpm = float(data.get("wpm") or 0)
    except (TypeError, ValueError):
        wpm = 0.0

    accuracy = max(0.0, min(100.0, accuracy))
    wpm = max(0.0, min(300.0, wpm))
    completed = bool(data.get("completed")) and accuracy >= MIN_COMPLETED_ACCURACY

    db = get_db()
    updated_at = now_iso()
    db.execute(
        """
        INSERT INTO progress
            (user_id, unit, lesson, completed, best_accuracy, best_wpm, attempts, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(user_id, unit, lesson) DO UPDATE SET
            completed     = CASE WHEN excluded.completed = 1 THEN 1 ELSE progress.completed END,
            best_accuracy = MAX(progress.best_accuracy, excluded.best_accuracy),
            best_wpm      = MAX(progress.best_wpm, excluded.best_wpm),
            attempts      = progress.attempts + 1,
            updated_at    = excluded.updated_at
        """,
        (
            user["id"],
            unit,
            lesson,
            1 if completed else 0,
            accuracy,
            wpm,
            updated_at,
        ),
    )
    db.commit()

    row = db.execute(
        "SELECT unit, lesson, completed, best_accuracy, best_wpm, attempts, updated_at "
        "FROM progress WHERE user_id = ? AND unit = ? AND lesson = ?",
        (user["id"], unit, lesson),
    ).fetchone()

    return jsonify(
        {
            "ok": True,
            "progress": {
                "unit": row["unit"],
                "lesson": row["lesson"],
                "completed": bool(row["completed"]),
                "best_accuracy": row["best_accuracy"],
                "best_wpm": row["best_wpm"],
                "attempts": row["attempts"],
                "updated_at": row["updated_at"],
            },
        }
    )


if __name__ == "__main__":
    init_db()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
