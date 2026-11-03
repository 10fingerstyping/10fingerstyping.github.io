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
- **Přesnost a rychlost** – po každé lekci uvidíte přehled výsledků včetně
  počtu chyb a času.
- **Denní streak a drahokamy** – za každou dokončenou lekci získáte drahokamy.
  Pravidelným učením roste denní série a v obchodě se za drahokamy kupuje
  zmrazení řady pro dny, kdy si nestihnete zacvičit.
- **XP a denní úkoly** – každá lekce dává XP podle přesnosti a každý den
  čekají dvě výzvy: dokončit 2 lekce a získat 50 XP. Za jejich splnění získáte
  další drahokamy.
- **Úspěchy a odznaky** – za pokrok v lekcích, přesnost, rychlost, sérii i XP
  se odemykají odznaky, které se zobrazují u lekcí i v profilu.
- **Nastavení profilu** – v účtu lze změnit uživatelské jméno, e-mail i heslo.
  Údaje se ukládají na serveru, takže platí na všech zařízeních.
- **Dvě verze** – samostatná verze pro běžné uživatele a verze pro školy, kde
  učitelé zadávají lekce a testy celé třídě a sledují pokrok žáků.

## Stav projektu

Běží statická prezentace s funkčním přepínáním jazyka, motivu a formuláři pro
přihlášení a registraci. Součástí je výuka psaní po jednotlivých písmenech –
každá jednotka má jednu lekci s vysvětlením klávesy a prstu a s dvaceti
cvičeními, která navazují na předchozí písmena. Pokrok, denní série,
drahokamy, XP, denní úkoly, úspěchy a zakoupená zmrazení se ukládají k účtu
uživatele na API serveru. Profil (jméno, e-mail, heslo) se spravuje na
stránce `profil.html`.

## Lekce

- 26 jednotek, každá pro jedno písmeno (od domovské řady dál).
- 46 lekcí celkem, každá má 20 cvičení: první 3 jsou rozcvička s novým
  písmenem, zbytek tvoří skutečná slova z už naučených písmen. Kde taková
  slova ještě neexistují, doplní je procvičovací skupiny.
- První lekce jednotky zobrazí klávesu na klávesnici, příslušný prst a základní
  pravidla.
- Cvičení vždy obsahují i všechna předchozí písmena.
- Přepínatelné rozložení QWERTZ / QWERTY.
- Přesnost, rychlost, počet chyb a dokončení lekce se ukládají na server.
- Za každou lekci dokončenou alespoň na 90 % přesnosti získáte 10 drahokamů.
- Každá lekce dává XP podle přesnosti (až 30 XP za 100 %).
- Denní úkoly: dokončit 2 lekce a získat 50 XP. Odměnou jsou drahokamy.
- Denní série roste za každý den s dokončenou lekcí. Vynechaný den může
  zachránit zmrazení řady, které se kupuje v obchodě za drahokamy.

## Server

Zdrojový kód API serveru je ve složce [`server/`](server/). Běží jako služba
`10fingerstyping`, používá SQLite databázi a nabízí registraci, přihlášení,
odhlášení a ukládání pokroku. Podrobnosti jsou v
[`server/README.md`](server/README.md).

## Vývoj

Frontend je statický, stačí otevřít `index.html` nebo spustit místní server.
Adresa API se nastavuje v `api.js` přes `window.API_BASE`; výchozí hodnota
míří na běžící Cloudflare tunnel.