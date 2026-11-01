"""Převod staršího pokroku na model „jeden tábor = jedna lekce“.

Starší verze ukládala pokrok podle jednotlivých písmen (unit = "a") a v rámci
každého písmene čtyři lekce. Nová verze má 46 táborů a každý tábor je jedna
lekce, takže se pokrok ukládá jako unit = číslo tábora a lesson = 1.

Skript:
  * převede písmenné jednotky na čísla táborů podle osnovy,
  * sloučí lekce 1–4 jednoho tábora do jedné (completed = OR,
    best_accuracy/best_wpm = maximum, attempts = součet),
  * řádky, které neumí převést, ponechá beze změny.

Před zásahem vytvoří záložní kopii databáze. Je bezpečné skript spustit
opakovaně – podruhé už není co slučovat.

Použití:
    python migrate_progress.py [--db cesta/k/users.db] [--no-backup]
"""

import argparse
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB = BASE_DIR / "users.db"

# Písmeno, kterým začínala stará jednotka -> číslo tábora v nové osnově.
LETTER_TO_CAMP = {
    "a": 15,
    "b": 19,
    "c": 17,
    "d": 8,
    "e": 9,
    "f": 1,
    "g": 36,
    "h": 16,
    "i": 11,
    "j": 1,
    "k": 10,
    "l": 13,
    "m": 20,
    "n": 4,
    "o": 14,
    "p": 23,
    "q": 43,
    "r": 3,
    "s": 12,
    "t": 6,
    "u": 2,
    "v": 5,
    "w": 41,
    "x": 39,
    "y": 24,
    "z": 7,
}


def target_unit(unit):
    """Vrátí číslo tábora pro starý i nový identifikátor jednotky."""
    value = str(unit or "").strip().lower()
    if value in LETTER_TO_CAMP:
        return str(LETTER_TO_CAMP[value])
    if value.isdigit():
        return value
    return None


def backup_db(db_path):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    backup_path = db_path.with_name(db_path.name + ".bak-" + stamp)
    shutil.copy2(db_path, backup_path)
    return backup_path


def migrate(db_path, make_backup=True):
    db_path = Path(db_path)
    if not db_path.exists():
        raise SystemExit(f"Databáze {db_path} neexistuje.")

    if make_backup:
        backup_path = backup_db(db_path)
        print(f"Záloha: {backup_path}")

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute(
            "SELECT id, user_id, unit, lesson, completed, best_accuracy, "
            "best_wpm, attempts, updated_at FROM progress"
        ).fetchall()

        migrated = [row for row in rows if target_unit(row["unit"]) is not None]
        if not migrated:
            print("Nic k převodu – databáze už používá nový model.")
            return 0

        merged = {}
        for row in migrated:
            unit = target_unit(row["unit"])
            key = (row["user_id"], unit)
            current = merged.get(key)
            if current is None:
                merged[key] = {
                    "user_id": row["user_id"],
                    "unit": unit,
                    "completed": int(bool(row["completed"])),
                    "best_accuracy": float(row["best_accuracy"] or 0),
                    "best_wpm": float(row["best_wpm"] or 0),
                    "attempts": int(row["attempts"] or 0),
                    "updated_at": row["updated_at"],
                }
            else:
                current["completed"] = max(current["completed"], int(bool(row["completed"])))
                current["best_accuracy"] = max(current["best_accuracy"], float(row["best_accuracy"] or 0))
                current["best_wpm"] = max(current["best_wpm"], float(row["best_wpm"] or 0))
                current["attempts"] += int(row["attempts"] or 0)
                if row["updated_at"] and row["updated_at"] > (current["updated_at"] or ""):
                    current["updated_at"] = row["updated_at"]

        ids = [row["id"] for row in migrated]
        db.execute("BEGIN")
        db.executemany("DELETE FROM progress WHERE id = ?", [(row_id,) for row_id in ids])
        db.executemany(
            """
            INSERT INTO progress
                (user_id, unit, lesson, completed, best_accuracy, best_wpm, attempts, updated_at)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, unit, lesson) DO UPDATE SET
                completed     = CASE WHEN excluded.completed = 1 THEN 1 ELSE progress.completed END,
                best_accuracy = MAX(progress.best_accuracy, excluded.best_accuracy),
                best_wpm      = MAX(progress.best_wpm, excluded.best_wpm),
                attempts      = progress.attempts + excluded.attempts,
                updated_at    = MAX(progress.updated_at, excluded.updated_at)
            """,
            [
                (
                    item["user_id"],
                    item["unit"],
                    item["completed"],
                    item["best_accuracy"],
                    item["best_wpm"],
                    item["attempts"],
                    item["updated_at"],
                )
                for item in merged.values()
            ],
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"Převedeno {len(migrated)} řádků do {len(merged)} řádků (jeden tábor = jedna lekce).")
    return len(migrated)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=str(DEFAULT_DB), help="cesta k SQLite databázi")
    parser.add_argument("--no-backup", action="store_true", help="nevytvářet záložní kopii")
    args = parser.parse_args()
    migrate(args.db, make_backup=not args.no_backup)


if __name__ == "__main__":
    main()
