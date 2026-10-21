import os
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

EMAIL_RE = __import__("re").compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
MIN_PASSWORD_LEN = 8


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
    created_at = datetime.now(timezone.utc).isoformat()
    cur = db.execute(
        "INSERT INTO users (username, email, password_hash, role, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (username, email, password_hash, role, created_at),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify({"ok": True, "user": user_public(row)}), 201


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

    return jsonify({"ok": True, "user": user_public(row)})


if __name__ == "__main__":
    init_db()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
