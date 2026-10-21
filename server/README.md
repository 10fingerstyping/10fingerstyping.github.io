# Server pro 10fingerstyping

Backendová část aplikace. Běží na Linuxu, ukládá registrované uživatele do
SQLite databáze a nabízí REST API pro registraci a přihlášení.

## Co server dělá

- Ukládá uživatele do tabulky `users` (soubor `users.db`).
- Každý uživatel má vlastní `id`, `username`, `email`, `password_hash`,
  `role` a `created_at`.
- Hesla **nikdy neukládá v čitelné podobě** – ukládá pouze jejich hash
  (Werkzeug PBKDF2).
- Nabízí API pro registraci a přihlášení.

## Databáze

Tabulka `users`:

| sloupec         | typ     | popis                                  |
|-----------------|---------|----------------------------------------|
| `id`            | INTEGER | primární klíč, autoincrement           |
| `username`      | TEXT    | uživatelské jméno, unikátní            |
| `email`         | TEXT    | e-mail, unikátní, malými písmeny       |
| `password_hash` | TEXT    | hash hesla (nikdy čitelné heslo)       |
| `role`          | TEXT    | `user`, `student` nebo `teacher`       |
| `created_at`    | TEXT    | čas vytvoření účtu (UTC, ISO 8601)     |

Databáze se vytvoří automaticky při prvním spuštění.

## API

### `POST /api/register`

Tělo požadavku (JSON):

```json
{ "username": "jan", "email": "jan@email.cz", "password": "tajneheslo", "role": "user" }
```

Odpověď `201`:

```json
{ "ok": true, "user": { "id": 1, "username": "jan", "email": "jan@email.cz", "role": "user", "created_at": "..." } }
```

### `POST /api/login`

```json
{ "email": "jan@email.cz", "password": "tajneheslo" }
```

Při úspěchu `200` se stejným tvarem `user`, při neúspěchu `401`.

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

| proměnná     | výchozí              | popis                          |
|--------------|----------------------|--------------------------------|
| `DB_PATH`    | `<server>/users.db`  | cesta k souboru databáze       |
| `HOST`       | `0.0.0.0`            | adresa, na které server poslouchá |
| `PORT`       | `8000`               | port                           |
| `FLASK_DEBUG`| `0`                  | `1` zapne ladící režim         |

## Nginx (ukázka)

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Napojení frontendu

V `prihlaseni.html` stačí v obsluze odeslání formuláře zavolat:

```javascript
fetch("/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, email, password, role })
});
```

## Bezpečnostní poznámky

- `users.db` nepatří do gitu ani do veřejné složky webu.
- Pro produkci zapněte HTTPS a omezte CORS na vlastní doménu.
- Zvažte rate-limiting přihlášení proti hádání hesel.
