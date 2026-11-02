import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
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
# Nová osnova má jeden tábor = jednu lekci. `unit` nese identifikátor lekce
# (číslo tábora) a `lesson` je z důvodu kompatibility vždy 1.
MAX_UNIT_LEN = 8
MAX_LESSON_INDEX = 200
MIN_COMPLETED_ACCURACY = 90.0
# Odměny: drahokamy za první dokončení lekce, zmrazení za drahokamy.
GEMS_PER_LESSON = 10
FREEZE_PRICE = 30
MAX_FREEZES = 3
MAX_ACTIVE_DATE_AHEAD_DAYS = 1  # tolerance kvůli časovým pásmům
# XP: každá lekce dá XP podle přesnosti. Denní úkoly se plní za den.
XP_PER_LESSON_MAX = 30
XP_PER_LEVEL = 100
DAILY_QUEST_LESSONS = 2
DAILY_QUEST_XP = 50
DAILY_QUEST_LESSONS_REWARD = 15
DAILY_QUEST_XP_REWARD = 20
DAILY_QUEST_CLAIMS = {
    "lessons": {
        "progress": "lessons",
        "target": DAILY_QUEST_LESSONS,
        "claimed": "lessons_claimed",
        "reward": DAILY_QUEST_LESSONS_REWARD,
    },
    "xp": {
        "progress": "xp",
        "target": DAILY_QUEST_XP,
        "claimed": "xp_claimed",
        "reward": DAILY_QUEST_XP_REWARD,
    },
}


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
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS rewards (
            user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            gems         INTEGER NOT NULL DEFAULT 0,
            xp           INTEGER NOT NULL DEFAULT 0,
            streak       INTEGER NOT NULL DEFAULT 0,
            best_streak  INTEGER NOT NULL DEFAULT 0,
            freezes      INTEGER NOT NULL DEFAULT 0,
            last_active  TEXT,
            updated_at   TEXT    NOT NULL
        )
        """
    )
    # Starší databáze tabulku rewards už má, jen bez sloupce xp.
    reward_columns = {row[1] for row in db.execute("PRAGMA table_info(rewards)")}
    if "xp" not in reward_columns:
        db.execute("ALTER TABLE rewards ADD COLUMN xp INTEGER NOT NULL DEFAULT 0")
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS daily_quests (
            user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            day              TEXT    NOT NULL,
            lessons          INTEGER NOT NULL DEFAULT 0,
            xp               INTEGER NOT NULL DEFAULT 0,
            lessons_claimed  INTEGER NOT NULL DEFAULT 0,
            xp_claimed       INTEGER NOT NULL DEFAULT 0,
            updated_at       TEXT    NOT NULL,
            PRIMARY KEY (user_id, day)
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS rewarded_lessons (
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            unit        TEXT    NOT NULL,
            lesson      INTEGER NOT NULL,
            awarded_at  TEXT    NOT NULL,
            PRIMARY KEY (user_id, unit, lesson)
        )
        """
    )
    db.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_rewarded_user ON rewarded_lessons(user_id)")
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


def parse_active_date(value):
    """Datum aktivity posílá klient podle svého místního kalendáře."""
    parsed = None
    if isinstance(value, str):
        try:
            parsed = datetime.strptime(value.strip()[:10], "%Y-%m-%d").date()
        except ValueError:
            parsed = None
    if parsed is None:
        return datetime.now(timezone.utc).date()

    # Malá tolerance kvůli časovým pásmům, ale ne libovolně daleko v budoucnosti.
    limit = datetime.now(timezone.utc).date() + timedelta(days=MAX_ACTIVE_DATE_AHEAD_DAYS)
    return min(parsed, limit)


def ensure_rewards(db, user_id):
    """Vrátí řádek odměn a při prvním použití doplní drahokamy za hotové lekce."""
    row = db.execute("SELECT * FROM rewards WHERE user_id = ?", (user_id,)).fetchone()
    if row is not None:
        return row

    now = now_iso()
    db.execute(
        "INSERT OR IGNORE INTO rewards "
        "(user_id, gems, streak, best_streak, freezes, last_active, updated_at) "
        "VALUES (?, 0, 0, 0, 0, NULL, ?)",
        (user_id, now),
    )

    backfilled = 0
    completed_rows = db.execute(
        "SELECT unit, lesson FROM progress WHERE user_id = ? AND completed = 1",
        (user_id,),
    ).fetchall()
    for progress_row in completed_rows:
        cur = db.execute(
            "INSERT OR IGNORE INTO rewarded_lessons "
            "(user_id, unit, lesson, awarded_at) VALUES (?, ?, ?, ?)",
            (user_id, progress_row["unit"], progress_row["lesson"], now),
        )
        if cur.rowcount:
            backfilled += GEMS_PER_LESSON

    if backfilled:
        db.execute(
            "UPDATE rewards SET gems = gems + ?, updated_at = ? WHERE user_id = ?",
            (backfilled, now, user_id),
        )
    db.commit()
    return db.execute("SELECT * FROM rewards WHERE user_id = ?", (user_id,)).fetchone()


def rewards_public(db, user_id):
    row = ensure_rewards(db, user_id)
    xp = int(row["xp"] or 0)
    return {
        "gems": row["gems"],
        "xp": xp,
        "level": xp // XP_PER_LEVEL + 1,
        "level_progress": xp % XP_PER_LEVEL,
        "level_target": XP_PER_LEVEL,
        "streak": row["streak"],
        "best_streak": row["best_streak"],
        "freezes": row["freezes"],
        "last_active": row["last_active"],
        "gems_per_lesson": GEMS_PER_LESSON,
        "freeze_price": FREEZE_PRICE,
        "max_freezes": MAX_FREEZES,
        "xp_per_lesson_max": XP_PER_LESSON_MAX,
    }


def lesson_xp(accuracy):
    """XP za lekci roste s přesností, nejvýš XP_PER_LESSON_MAX."""
    accuracy = max(0.0, min(100.0, float(accuracy or 0)))
    return int(XP_PER_LESSON_MAX * accuracy / 100.0 + 0.5)


def ensure_daily(db, user_id, day):
    db.execute(
        "INSERT OR IGNORE INTO daily_quests "
        "(user_id, day, lessons, xp, lessons_claimed, xp_claimed, updated_at) "
        "VALUES (?, ?, 0, 0, 0, 0, ?)",
        (user_id, day.isoformat(), now_iso()),
    )
    return db.execute(
        "SELECT * FROM daily_quests WHERE user_id = ? AND day = ?",
        (user_id, day.isoformat()),
    ).fetchone()


def daily_public(db, user_id, day):
    row = ensure_daily(db, user_id, day)
    lessons_progress = min(int(row["lessons"] or 0), DAILY_QUEST_LESSONS)
    xp_progress = min(int(row["xp"] or 0), DAILY_QUEST_XP)
    return {
        "date": day.isoformat(),
        "quests": [
            {
                "id": "lessons",
                "title": f"Dokonči {DAILY_QUEST_LESSONS} lekce",
                "target": DAILY_QUEST_LESSONS,
                "progress": lessons_progress,
                "reward": DAILY_QUEST_LESSONS_REWARD,
                "claimed": bool(row["lessons_claimed"]),
                "done": lessons_progress >= DAILY_QUEST_LESSONS,
            },
            {
                "id": "xp",
                "title": f"Získej {DAILY_QUEST_XP} XP",
                "target": DAILY_QUEST_XP,
                "progress": xp_progress,
                "reward": DAILY_QUEST_XP_REWARD,
                "claimed": bool(row["xp_claimed"]),
                "done": xp_progress >= DAILY_QUEST_XP,
            },
        ],
    }


def update_streak(db, row, active_date):
    """Posune denní sérii. Vynechané dny spotřebují zmrazení, jinak série začne znovu."""
    user_id = row["user_id"]
    streak = int(row["streak"] or 0)
    best = int(row["best_streak"] or 0)
    freezes = int(row["freezes"] or 0)
    before = streak
    freeze_used = 0

    last_date = None
    if row["last_active"]:
        try:
            last_date = datetime.strptime(row["last_active"][:10], "%Y-%m-%d").date()
        except ValueError:
            last_date = None

    if last_date is None:
        if streak <= 0:
            streak = 1
    else:
        day_diff = (active_date - last_date).days
        if day_diff <= 0:
            # Stejný den (nebo starší datum) sérii nemění.
            return {
                "streak": streak,
                "before": before,
                "change": 0,
                "freeze_used": 0,
                "best": best,
            }
        if day_diff == 1:
            streak = (streak + 1) if streak > 0 else 1
        else:
            missed = day_diff - 1
            if freezes >= missed:
                freezes -= missed
                freeze_used = missed
                streak = (streak + 1) if streak > 0 else 1
            else:
                streak = 1

    best = max(best, streak)
    db.execute(
        "UPDATE rewards SET streak = ?, best_streak = ?, freezes = ?, "
        "last_active = ?, updated_at = ? WHERE user_id = ?",
        (streak, best, freezes, active_date.isoformat(), now_iso(), user_id),
    )
    return {
        "streak": streak,
        "before": before,
        "change": streak - before,
        "freeze_used": freeze_used,
        "best": best,
    }


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


@app.get("/api/rewards")
def get_rewards():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    db = get_db()
    day = parse_active_date(request.args.get("date"))
    rewards = rewards_public(db, user["id"])
    daily = daily_public(db, user["id"], day)
    db.commit()
    return jsonify({"ok": True, "rewards": rewards, "daily": daily})


@app.post("/api/rewards/lesson")
def award_lesson_rewards():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    unit = str(data.get("unit") or "").strip().lower()
    if not unit or len(unit) > MAX_UNIT_LEN or not re.match(r"^[a-z0-9_]+$", unit):
        return error("Neplatná jednotka.")
    try:
        lesson = int(data.get("lesson"))
    except (TypeError, ValueError):
        return error("Neplatná lekce.")
    if lesson < 1 or lesson > MAX_LESSON_INDEX:
        return error("Neplatná lekce.")

    try:
        accuracy = float(data.get("accuracy") or 0)
    except (TypeError, ValueError):
        accuracy = 0.0
    accuracy = max(0.0, min(100.0, accuracy))
    completed = bool(data.get("completed")) and accuracy >= MIN_COMPLETED_ACCURACY
    active_date = parse_active_date(data.get("date"))

    db = get_db()
    ensure_rewards(db, user["id"])
    ensure_daily(db, user["id"], active_date)

    gems_awarded = 0
    first_time = False
    if completed:
        cur = db.execute(
            "INSERT OR IGNORE INTO rewarded_lessons "
            "(user_id, unit, lesson, awarded_at) VALUES (?, ?, ?, ?)",
            (user["id"], unit, lesson, now_iso()),
        )
        if cur.rowcount:
            gems_awarded = GEMS_PER_LESSON
            first_time = True
            db.execute(
                "UPDATE rewards SET gems = gems + ?, updated_at = ? WHERE user_id = ?",
                (gems_awarded, now_iso(), user["id"]),
            )

    xp_awarded = lesson_xp(accuracy)
    now = now_iso()
    db.execute(
        "UPDATE rewards SET xp = xp + ?, updated_at = ? WHERE user_id = ?",
        (xp_awarded, now, user["id"]),
    )
    db.execute(
        "UPDATE daily_quests SET lessons = lessons + ?, xp = xp + ?, updated_at = ? "
        "WHERE user_id = ? AND day = ?",
        (1 if completed else 0, xp_awarded, now, user["id"], active_date.isoformat()),
    )

    row = db.execute("SELECT * FROM rewards WHERE user_id = ?", (user["id"],)).fetchone()
    if completed:
        streak = update_streak(db, row, active_date)
    else:
        streak = {
            "streak": row["streak"],
            "before": row["streak"],
            "change": 0,
            "freeze_used": 0,
            "best": row["best_streak"],
        }
    db.commit()

    return jsonify(
        {
            "ok": True,
            "rewards": rewards_public(db, user["id"]),
            "daily": daily_public(db, user["id"], active_date),
            "reward": {
                "gems": gems_awarded,
                "first_time": first_time,
                "xp": xp_awarded,
                "completed": completed,
                "streak": streak["streak"],
                "streak_before": streak["before"],
                "streak_change": streak["change"],
                "freeze_used": streak["freeze_used"],
                "best_streak": streak["best"],
                "date": active_date.isoformat(),
            },
        }
    )


@app.post("/api/rewards/buy")
def buy_freeze():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    db = get_db()
    row = ensure_rewards(db, user["id"])
    if row["freezes"] >= MAX_FREEZES:
        return error(f"Máš maximální počet zmrazení ({MAX_FREEZES}).")
    if row["gems"] < FREEZE_PRICE:
        return error(f"Na zmrazení nemáš dost drahokamů. Potřebuješ {FREEZE_PRICE}.")

    db.execute(
        "UPDATE rewards SET gems = gems - ?, freezes = freezes + 1, updated_at = ? "
        "WHERE user_id = ?",
        (FREEZE_PRICE, now_iso(), user["id"]),
    )
    db.commit()
    return jsonify({"ok": True, "rewards": rewards_public(db, user["id"])})


@app.post("/api/rewards/quest")
def claim_daily_quest():
    user, auth_error = require_user()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    quest_id = str(data.get("id") or "").strip().lower()
    quest = DAILY_QUEST_CLAIMS.get(quest_id)
    if quest is None:
        return error("Neznámý denní úkol.")

    active_date = parse_active_date(data.get("date"))
    db = get_db()
    ensure_rewards(db, user["id"])
    row = ensure_daily(db, user["id"], active_date)

    progress = int(row[quest["progress"]] or 0)
    if progress < int(quest["target"]):
        return error("Tento úkol ještě není splněný.")
    if row[quest["claimed"]]:
        return jsonify(
            {
                "ok": True,
                "rewards": rewards_public(db, user["id"]),
                "daily": daily_public(db, user["id"], active_date),
                "claimed": False,
            }
        )

    now = now_iso()
    db.execute(
        f"UPDATE daily_quests SET {quest['claimed']} = 1, updated_at = ? "
        "WHERE user_id = ? AND day = ?",
        (now, user["id"], active_date.isoformat()),
    )
    db.execute(
        "UPDATE rewards SET gems = gems + ?, updated_at = ? WHERE user_id = ?",
        (quest["reward"], now, user["id"]),
    )
    db.commit()
    return jsonify(
        {
            "ok": True,
            "rewards": rewards_public(db, user["id"]),
            "daily": daily_public(db, user["id"], active_date),
            "claimed": True,
            "gems": quest["reward"],
        }
    )


if __name__ == "__main__":
    init_db()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
