# 10fingerstyping

Webová aplikace pro výuku psaní všemi deseti prsty. Je určená jak pro běžné
uživatele, kteří si chtějí zlepšit rychlost a přesnost psaní, tak pro školy,
které ji mohou využívat při výuce.

## Co aplikace nabízí

- **Klasické učení** – lekce krok za krokem od základního postavení prstů až po
  psaní celých textů. Každá lekce navazuje na tu předchozí.
- **Učení hrou** – hry a procvičování pro ty, které tabulky a dril nebaví.
- **Přepínatelné rozvržení klávesnice** – podpora QWERTZ i QWERTY podle zvyku
  nebo požadavků školy.
- **Dva jazyky** – procvičování v češtině i angličtině.
- **Dvě verze** – samostatná verze pro běžné uživatele a verze pro školy, kde
  učitelé zadávají lekce a testy celé třídě a sledují pokrok žáků.

## Stav projektu

Běží statická prezentace s funkčním přepínáním jazyka, motivu a formuláři pro
přihlášení a registraci. Součástí je výuka psaní po jednotlivých písmenech –
každá jednotka má úvodní lekci s vysvětlením klávesy a prstu a další
procvičování, která navazují na předchozí písmena. Pokrok se ukládá k účtu
uživatele na API serveru.

## Lekce

- 26 jednotek, každá pro jedno písmeno (od domovské řady dál).
- 4 lekce v každé jednotce: seznámení, procvičení, slova, plynulost.
- První lekce jednotky zobrazí klávesu na klávesnici, příslušný prst a základní
  pravidla.
- Cvičení vždy obsahují i všechna předchozí písmena.
- Přepínatelné rozložení QWERTZ / QWERTY.
- Přesnost, rychlost, počet chyb a dokončení lekce se ukládají na server.

## Server

Zdrojový kód API serveru je ve složce [`server/`](server/). Běží jako služba
`10fingerstyping`, používá SQLite databázi a nabízí registraci, přihlášení,
odhlášení a ukládání pokroku. Podrobnosti jsou v
[`server/README.md`](server/README.md).

## Vývoj

Frontend je statický, stačí otevřít `index.html` nebo spustit místní server.
Adresa API se nastavuje v `api.js` přes `window.API_BASE`; výchozí hodnota
míří na běžící Cloudflare tunnel.