# Server pro 10fingerstyping

Backendová část aplikace. Běží na Linuxu, ukládá registrované uživatele a jejich
postup v lekcích do SQLite databáze a nabízí REST API pro registraci,
přihlášení a ukládání pokroku.

## Co server dělá

- Ukládá uživatele do tabulky `users` (soubor `users.db`).
- Hesla **nikdy neukládá v čitelné podobě** – ukládá pouze jejich hash
  (Werkzeug PBKDF2).
- Přihlášení vytvoří dočasný přístupový token (tabulka `sessions`). Token
  se posílá v hlavičce `Authorization: Bearer <token>`.
- Ukládá pokrok z lekcí do tabulky `progress` – pro každého uživatele,
  jednotku (písmeno) a lekci zvlášť.
- Nabízí API pro registraci, přihlášení, odhlášení a práci s pokrokem.

## Databáze

### Tabulka `users`

| sloupec         | typ     | popis                                  |
|-----------------|---------|----------------------------------------|
| `id`            | INTEGER | primární klíč, autoincrement           |
| `username`      | TEXT    | uživatelské jméno, unikátní            |
| `email`         | TEXT    | e-mail, unikátní, malými písmeny       |
| `password_hash` | TEXT    | hash hesla (nikdy čitelné heslo)       |
| `role`          | TEXT    | `user`, `student` nebo `teacher`       |
| `created_at`    | TEXT    | čas vytvoření účtu (UTC, ISO 8601)     |

### Tabulka `sessions`

| sloupec      | typ     | popis                                  |
|--------------|---------|----------------------------------------|
| `token`      | TEXT    | náhodný přístupový token, primární klíč |
| `user_id`    | INTEGER | cizí klíč na `users.id`                |
| `created_at` | TEXT    | čas vytvoření tokenu (UTC, ISO 8601)   |

### Tabulka `progress`

| sloupec        | typ     | popis                                       |
|----------------|---------|---------------------------------------------|
| `id`           | INTEGER | primární klíč, autoincrement                |
| `user_id`      | INTEGER | cizí klíč na `users.id`                     |
| `unit`         | TEXT    | identifikátor jednotky (písmeno, např. `a`) |
| `lesson`       | INTEGER | číslo lekce v jednotce (1–4)                |
| `completed`    | INTEGER | `1` = lekce dokončena, `0` = zatím ne       |
| `best_accuracy`| REAL    | nejlepší přesnost v procentech              |
| `best_wpm`     | REAL    | nejlepší rychlost (slova za minutu)         |
| `attempts`     | INTEGER | počet pokusů o lekci                        |
| `updated_at`   | TEXT    | čas posledního pokusu (UTC, ISO 8601)       |

Pro dvojici `user_id` + `unit` + `lesson` existuje jen jeden řádek; nový
pokus se do něj sloučí (zůstává nejlepší přesnost a rychlost).

Databáze se vytvoří automaticky při prvním spuštění.

## API

### `POST /api/register`

Tělo požadavku (JSON):

```json
{ "username": "jan", "email": "jan@email.cz", "password": "tajneheslo", "role": "user" }
```

Odpověď `201`:

```json
{
  "ok": true,
  "user": { "id": 1, "username": "jan", "email": "jan@email.cz", "role": "user", "created_at": "..." },
  "token": "…"
}
```

### `POST /api/login`

```json
{ "email": "jan@email.cz", "password": "tajneheslo" }
```

Při úspěchu `200` se stejným tvarem `user` a novým `token`, při neúspěchu `401`.

### `POST /api/logout`

Hlavička `Authorization: Bearer <token>`. Zneplatní token. Vrací `{ "ok": true }`.

### `GET /api/progress`

Hlavička `Authorization: Bearer <token>`. Vrací pokrok přihlášeného uživatele:

```json
{
  "ok": true,
  "user": { "id": 1, "username": "jan", "..." : "..." },
  "progress": [
    {
      "unit": "a",
      "lesson": 1,
      "completed": true,
      "best_accuracy": 98.4,
      "best_wpm": 24.2,
      "attempts": 2,
      "updated_at": "2026-10-31T…"
    }
  ]
}
```

### `POST /api/progress`

Hlavička `Authorization: Bearer <token>`. Tělo požadavku:

```json
{ "unit": "a", "lesson": 1, "accuracy": 97.5, "wpm": 22.4, "completed": true }
```

Lekce se označí jako dokončená jen při přesnosti alespoň 90 %. Vrací aktuální
řádek pokroku. Opakovaný pokus nikdy nesníží nejlepší přesnost ani rychlost.

### `GET /api/health`

Vrací `{ "ok": true, "status": "up" }` – hodí se pro monitoring.

## Instalace na Linux

```bash
# 1. Závislosti
sudo apt update
sudo apt install -y python3 python3-venv

# 2. Nasazení kódu (např. do /opt/10fingerstyping)
sudo mkdir -p /opt/10fingerstyping
sudo cp -r . /opt/10fingerstyping/server

# 3. Virtuální prostředí
cd /opt/10fingerstyping
python3 -m venv venv
./venv/bin/pip install -r server/requirements.txt

# 4. Spuštění
cd server
../venv/bin/python app.py
```

## Spuštění jako služba (systemd)

```bash
sudo cp server/10fingerstyping.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now 10fingerstyping
sudo systemctl status 10fingerstyping
```

Služba poslouchá na `127.0.0.1:8000`. Před veřejnost ji postavte za reverzní
proxy (nginx / Caddy) s HTTPS.

## Konfigurace

Nastavuje se přes proměnné prostředí:

| proměnná      | výchozí             | popis                            |
|---------------|---------------------|----------------------------------|
| `DB_PATH`     | `<server>/users.db` | cesta k souboru databáze         |
| `HOST`        | `0.0.0.0`           | adresa, na které server poslouchá |
| `PORT`        | `8000`              | port                             |
| `FLASK_DEBUG` | `0`                 | `1` zapne ladící režim           |

## Napojení frontendu

Frontend používá `api.js`, který načte `window.API_BASE` (nebo výchozí
Cloudflare tunnel URL). Po přihlášení si uloží `token` do `localStorage`
a posílá ho u požadavků na pokrok.

## Bezpečnostní poznámky

- `users.db` nepatří do gitu ani do veřejné složky webu.
- Pro produkci zapněte HTTPS a omezte CORS na vlastní doménu.
- Zvažte rate-limiting přihlášení a expiraci tokenů.
