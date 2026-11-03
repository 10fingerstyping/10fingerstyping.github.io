/*
 * Obsah lekcí 10fingerstyping.
 *
 * Kurikulum odpovídá táborům 1–46. Každý tábor = jedna lekce. Lekce obsahuje
 * seznámení s klávesou a prstem, procvičení, slova i plynulost v jednom celku.
 *
 * Cvičení vždy používají novou klávesu a všechny klávesy z předchozích táborů.
 * Text vychází z české klávesnice QWERTZ/QWERTY včetně diakritiky.
 */
(function () {
  'use strict';

  var FINGERS = {
    'l-pinky': { id: 'l-pinky', hand: 'left', name: 'levý malíček', short: 'LM', color: '#d9534f' },
    'l-ring': { id: 'l-ring', hand: 'left', name: 'levý prsteníček', short: 'LP', color: '#e08b3e' },
    'l-middle': { id: 'l-middle', hand: 'left', name: 'levý prostředníček', short: 'LPr', color: '#c9a227' },
    'l-index': { id: 'l-index', hand: 'left', name: 'levý ukazováček', short: 'LU', color: '#5b9e45' },
    'r-index': { id: 'r-index', hand: 'right', name: 'pravý ukazováček', short: 'PU', color: '#2f8f83' },
    'r-middle': { id: 'r-middle', hand: 'right', name: 'pravý prostředníček', short: 'PPr', color: '#3f78b5' },
    'r-ring': { id: 'r-ring', hand: 'right', name: 'pravý prsteníček', short: 'PP', color: '#7766b8' },
    'r-pinky': { id: 'r-pinky', hand: 'right', name: 'pravý malíček', short: 'PM', color: '#b65a94' },
    thumb: { id: 'thumb', hand: 'both', name: 'palec', short: 'P', color: '#8a8378' }
  };

  var CHAR_NAMES = {
    ' ': 'mezerník',
    ',': 'čárka',
    '.': 'tečka',
    '´': 'délka (čárka nad písmenem)',
    '1': 'číslovka 1',
    '-': 'pomlčka / mínus',
    '=': 'rovnítko',
    '(': 'levá závorka',
    ')': 'pravá závorka',
    '?': 'otazník',
    '"': 'uvozovky',
    '§': 'paragraf'
  };

  var DIACRITIC_NAMES = {
    'á': 'á', 'í': 'í', 'ě': 'ě', 'é': 'é', 'ř': 'ř', 'ý': 'ý',
    'č': 'č', 'ů': 'ů', 'š': 'š', 'ž': 'ž', 'ú': 'ú'
  };

  // Vychozí česká klávesnice. U písmen je malé písmeno primární, Shift = velké.
  function mk(u, s, fingerId, extra) {
    var key = {
      id: extra && extra.id ? extra.id : u,
      u: u,
      s: s,
      fingerId: fingerId
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) key[k] = extra[k];
      }
    }
    return key;
  }

  var TOP_KEYS = [
    mk(';', '`', 'l-pinky'),
    mk('+', '1', 'l-pinky'),
    mk('ě', '2', 'l-ring'),
    mk('š', '3', 'l-middle'),
    mk('č', '4', 'l-index'),
    mk('ř', '5', 'l-index'),
    mk('ž', '6', 'r-index'),
    mk('ý', '7', 'r-index'),
    mk('á', '8', 'r-middle'),
    mk('í', '9', 'r-ring'),
    mk('é', '0', 'r-pinky'),
    mk('=', '%', 'r-pinky'),
    mk('´', 'ˇ', 'r-pinky', { dead: true, shiftU: true })
  ];

  var HOME_KEYS = [
    mk('a', 'A', 'l-pinky'),
    mk('s', 'S', 'l-ring'),
    mk('d', 'D', 'l-middle'),
    mk('f', 'F', 'l-index'),
    mk('g', 'G', 'l-index'),
    mk('h', 'H', 'r-index'),
    mk('j', 'J', 'r-index'),
    mk('k', 'K', 'r-middle'),
    mk('l', 'L', 'r-ring'),
    mk('ů', '"', 'r-pinky'),
    mk('§', '!', 'r-pinky')
  ];

  function row1Keys(third) {
    return [
      mk('q', 'Q', 'l-pinky'),
      mk('w', 'W', 'l-ring'),
      mk('e', 'E', 'l-middle'),
      mk('r', 'R', 'l-index'),
      mk('t', 'T', 'l-index'),
      mk(third, third.toUpperCase(), 'r-index'),
      mk('u', 'U', 'r-index'),
      mk('i', 'I', 'r-middle'),
      mk('o', 'O', 'r-ring'),
      mk('p', 'P', 'r-pinky'),
      mk('ú', '/', 'r-pinky'),
      mk(')', '(', 'r-pinky')
    ];
  }

  function bottomKeys(first) {
    return [
      mk(first, first.toUpperCase(), 'l-pinky'),
      mk('x', 'X', 'l-ring'),
      mk('c', 'C', 'l-middle'),
      mk('v', 'V', 'l-index'),
      mk('b', 'B', 'l-index'),
      mk('n', 'N', 'r-index'),
      mk('m', 'M', 'r-index'),
      mk(',', '?', 'r-middle'),
      mk('.', ':', 'r-ring'),
      mk('-', '_', 'r-pinky')
    ];
  }

  function specialKey(id, label, fingerId, width, u) {
    return {
      id: id,
      label: label,
      fingerId: fingerId,
      width: width,
      u: typeof u === 'string' ? u : null,
      special: true
    };
  }

  var SPECIAL_KEYS = {
    lshift: specialKey('lshift', 'Shift', 'l-pinky', 2.2),
    rshift: specialKey('rshift', 'Shift', 'r-pinky', 2.2),
    space: specialKey('space', 'mezerník', 'thumb', 5.0, ' '),
    enter: specialKey('enter', 'Enter', 'r-pinky', 2.2, '\n'),
    backspace: specialKey('backspace', 'Backspace', 'r-pinky', 2.6)
  };

  var LAYOUTS = {
    qwertz: {
      id: 'qwertz',
      name: 'QWERTZ',
      description: 'České rozložení – Z je v horní řadě, Y v dolní.',
      rows: [
        TOP_KEYS,
        row1Keys('z'),
        HOME_KEYS,
        bottomKeys('y')
      ],
      controls: ['lshift', 'space', 'rshift', 'backspace', 'enter']
    },
    qwerty: {
      id: 'qwerty',
      name: 'QWERTY',
      description: 'České rozložení QWERTY – Y je v horní řadě, Z v dolní.',
      rows: [
        TOP_KEYS,
        row1Keys('y'),
        HOME_KEYS,
        bottomKeys('z')
      ],
      controls: ['lshift', 'space', 'rshift', 'backspace', 'enter']
    }
  };

  var ROW_NAMES = [
    'horní řadě s čísly a diakritikou',
    'horní písmenné řadě',
    'prostřední (domovské) řadě',
    'dolní řadě'
  ];

  var BASIC_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
  var CZECH_LETTERS = 'áíěéřýčůšžú';

  function isBasicLetter(ch) {
    return ch.length === 1 && BASIC_LETTERS.indexOf(ch) !== -1;
  }

  function isLetter(ch) {
    return ch.length === 1 && (BASIC_LETTERS.indexOf(ch) !== -1 || CZECH_LETTERS.indexOf(ch) !== -1);
  }

  function layoutFor(layoutId) {
    return LAYOUTS[layoutId] || LAYOUTS.qwertz;
  }

  function findKey(ch, layoutId) {
    if (ch === ' ') {
      return { key: SPECIAL_KEYS.space, shift: false, special: true, row: -1 };
    }
    if (ch === '\n') {
      return { key: SPECIAL_KEYS.enter, shift: false, special: true, row: -1 };
    }
    var layout = layoutFor(layoutId);
    var lower = ch.toLowerCase();
    var upper = ch !== lower;

    for (var r = 0; r < layout.rows.length; r++) {
      for (var c = 0; c < layout.rows[r].length; c++) {
        var key = layout.rows[r][c];
        if (key.u === ch) return { key: key, shift: false, special: false, row: r };
        if (key.s === ch) return { key: key, shift: true, special: false, row: r };
        if (upper && isBasicLetter(key.u) && key.u === lower) {
          return { key: key, shift: true, special: false, row: r };
        }
      }
    }
    return null;
  }

  function specialInfo(id) {
    var key = SPECIAL_KEYS[id];
    if (!key) return null;
    return { key: key, shift: false, special: true, row: -1 };
  }

  function describeChar(ch, layoutId) {
    var hit = findKey(ch, layoutId);
    if (!hit) return null;
    var finger = FINGERS[hit.key.fingerId];
    var shiftFinger = null;
    if (hit.shift) {
      shiftFinger = finger.hand === 'left' ? FINGERS['r-pinky'] : FINGERS['l-pinky'];
    }
    var shiftKeyId = null;
    if (hit.shift) shiftKeyId = finger.hand === 'left' ? 'rshift' : 'lshift';
    return {
      ch: ch,
      key: hit.key,
      id: hit.key.id,
      shift: hit.shift,
      shiftKeyId: shiftKeyId,
      shiftFinger: shiftFinger,
      finger: finger,
      row: hit.row,
      rowName: hit.row >= 0 ? ROW_NAMES[hit.row] : 'spodní část klávesnice'
    };
  }

  function describeSpecial(id) {
    if (id === 'shift') {
      return {
        id: 'shift',
        key: null,
        shift: false,
        finger: null,
        shiftFinger: null,
        rowName: 'spodní část klávesnice',
        label: 'Shift'
      };
    }
    var hit = specialInfo(id);
    if (!hit) return null;
    var finger = FINGERS[hit.key.fingerId];
    return {
      ch: hit.key.u,
      id: id,
      key: hit.key,
      shift: false,
      finger: finger,
      shiftFinger: null,
      rowName: 'spodní část klávesnice',
      label: hit.key.label
    };
  }

  function keyLabel(key) {
    if (key.special) return key.label;
    return key.u;
  }

  function keyShiftLabel(key) {
    if (key.special) return '';
    if (!key.s) return '';
    if (isBasicLetter(key.u) && key.s === key.u.toUpperCase()) return '';
    return key.s;
  }

  // Zásobník českých slov. Cvičení používají jen slova složená z dosud
  // naučených písmen, takže se seznam postupně otevírá.
  var WORDS = [
    'já', 'ty', 'on', 'ona', 'ono', 'my', 'vy', 'se', 'si', 'je', 'ne', 'ano', 'tak', 'tam', 'sem', 'tu',
    'tady', 'kde', 'kdo', 'kdy', 'jak', 'co', 'proč', 'protože', 'ale', 'nebo', 'už', 'ještě', 'jen', 'jenom',
    'vždy', 'nikdy', 'teď', 'potom', 'dnes', 'zítra', 'včera', 'ráno', 'večer', 'noc', 'den', 'týden', 'měsíc',
    'rok', 'hodina', 'minuta', 'sekunda', 'čas', 'práce', 'škola', 'úkol', 'lekce', 'cvičení', 'psaní', 'čtení',
    'slovo', 'věta', 'text', 'řádek', 'stránka', 'kniha', 'pero', 'papír', 'sešit', 'tabule', 'počítač',
    'klávesnice', 'klávesa', 'myš', 'program', 'soubor', 'data', 'heslo', 'účet', 'uživatel', 'zpráva', 'email',
    'odkaz', 'web', 'kód', 'formulář', 'nastavení', 'změna', 'uložení', 'smazání', 'hledat', 'otevřít', 'zavřít',
    'kopírovat', 'vložit', 'stisknout', 'kliknout', 'psát', 'číst', 'odstavec', 'písmeno', 'číslo', 'čárka',
    'tečka', 'mezera', 'kontrola', 'oprava', 'chyba', 'přesnost', 'rychlost', 'hra', 'zábava', 'trénink', 'krok',
    'byt', 'kuchyň', 'pokoj', 'stůl', 'židle', 'lampa', 'klíč', 'dveře', 'okno', 'zahrada', 'květina', 'tráva',
    'moře', 'řeka', 'hora', 'pole', 'cesta', 'vesnice', 'kraj', 'země', 'svět', 'slunce', 'hvězda', 'obloha',
    'déšť', 'sníh', 'vítr', 'teplo', 'zima', 'jaro', 'léto', 'podzim', 'mléko', 'chléb', 'cukr', 'sůl', 'pepř',
    'čaj', 'káva', 'maso', 'ryba', 'jablko', 'brambor', 'mrkev', 'cibule', 'paprika', 'okurka', 'salát', 'ovoce',
    'zelenina', 'muž', 'žena', 'dítě', 'rodina', 'bratr', 'sestra', 'matka', 'otec', 'syn', 'dcera', 'babička',
    'dědeček', 'přítel', 'kamarád', 'člověk', 'lidé', 'kluk', 'holka', 'pán', 'paní', 'slečna', 'jméno',
    'příjmení', 'adresa', 'telefon', 'město', 'praha', 'brno', 'pes', 'kočka', 'kůň', 'kráva', 'prase', 'ovce',
    'kohout', 'slepice', 'pták', 'myš', 'žába', 'had', 'liška', 'medvěd', 'zajíc', 'veverka', 'motýl', 'včela',
    'moucha', 'komár', 'pavouk', 'strom', 'les', 'květ', 'list', 'houba', 'kámen', 'písek', 'půda', 'voda',
    'vzduch', 'oheň', 'led', 'mráz', 'bouře', 'duha', 'mrak', 'nebe'
  ];

  WORDS.push(
    'malý', 'velký', 'dobrý', 'špatný', 'nový', 'starý', 'mladý', 'dlouhý', 'krátký', 'rychlý', 'pomalý',
    'silný', 'slabý', 'teplý', 'studený', 'jasný', 'tmavý', 'bílý', 'černý', 'červený', 'modrý', 'zelený',
    'žlutý', 'šedý', 'hnědý', 'veselý', 'smutný', 'krásný', 'ošklivý', 'chytrý', 'hloupý', 'zdravý',
    'nemocný', 'živý', 'mrtvý', 'tichý', 'hlasitý', 'lehký', 'těžký', 'plný', 'prázdný', 'čistý', 'špinavý',
    'být', 'mít', 'jít', 'jet', 'dělat', 'pracovat', 'učit', 'mluvit', 'říkat', 'vidět', 'slyšet', 'cítit',
    'myslet', 'vědět', 'znát', 'chtít', 'moct', 'muset', 'umět', 'začít', 'skončit', 'otevřít', 'zavřít',
    'jíst', 'pít', 'spát', 'vstát', 'sedět', 'stát', 'běžet', 'chodit', 'nést', 'dát', 'vzít', 'koupit',
    'prodat', 'platit', 'hrát', 'zpívat', 'tančit', 'smát', 'plakat', 'milovat', 'pomáhat', 'hledat', 'najít',
    'ztratit', 'čekat', 'vrátit', 'zůstat', 'přijít', 'odejít', 'uvařit', 'uklidit', 'nakreslit', 'malovat',
    'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle', 'leden', 'únor', 'březen', 'duben',
    'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec', 'jedna', 'dva', 'tři',
    'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět', 'deset', 'fuj', 'ves', 'les', 'lis', 'lusk', 'kolo', 'oko',
    'olej', 'voda', 'noha', 'hala', 'hokej', 'had', 'hadr', 'hodina', 'cesta', 'cena', 'cukr', 'cibule',
    'máma', 'mama', 'baba', 'brambor', 'kde', 'jede', 'ji', 'ni', 'ti', 'vi', 'data', 'auto', 'rada',
    'ruka', 'kava', 'káva', 'táta', 'pára', 'váza', 'kámen', 'zpráva', 'míč', 'sít', 'pít', 'bít', 'mít',
    'žít', 'tvář', 'řeka', 'příroda', 'říjen', 'sýr', 'výr', 'dým', 'být', 'mýt', 'čaj', 'čelo', 'oči',
    'číst', 'černý', 'dům', 'stůl', 'sůl', 'vůně', 'důl', 'šum', 'šel', 'šít', 'švestka', 'šála', 'žena',
    'žák', 'žlutý', 'žurnál', 'úřad', 'úkol', 'únava', 'úterý', 'guma', 'golf', 'gymnázium', 'taxi', 'box',
    'expert', 'max', 'mix', 'web', 'wifi', 'software', 'show', 'quiz', 'email', 'internet', 'server', 'projekt',
    'fotbal', 'hokej', 'tenis', 'branka', 'medaile', 'pohár', 'stadion', 'arena', 'sport', 'lyže', 'plavání'
  );

  function seeded(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function pick(arr, rnd) {
    return arr[Math.floor(rnd() * arr.length)];
  }

  function repeat(ch, count) {
    var out = '';
    for (var i = 0; i < count; i++) out += ch;
    return out;
  }

  function spaced(ch, count) {
    var parts = [];
    for (var i = 0; i < count; i++) parts.push(ch);
    return parts.join(' ');
  }

  var wordCache = Object.create(null);

  function wordsFor(allowedLower) {
    var cacheKey = allowedLower.join('');
    if (wordCache[cacheKey]) return wordCache[cacheKey];
    var pool = WORDS.filter(function (word) {
      var lower = word.toLowerCase();
      if (lower.length < 2) return false;
      for (var i = 0; i < lower.length; i++) {
        if (allowedLower.indexOf(lower.charAt(i)) === -1) return false;
      }
      return true;
    });
    wordCache[cacheKey] = pool;
    return pool;
  }

  function pseudoWord(letters, preferred, rnd, minLen, maxLen) {
    if (!letters.length) return preferred || '';
    var length = minLen + Math.floor(rnd() * (maxLen - minLen + 1));
    var out = preferred && letters.indexOf(preferred) !== -1 ? preferred : pick(letters, rnd);
    for (var i = 1; i < length; i++) out += pick(letters, rnd);
    return out;
  }

  function randomGroups(letters, focus, rnd, minLen, maxLen, groupSize) {
    var parts = [];
    var length = 0;
    var guard = 0;
    while ((length < minLen || parts.length < 3) && guard++ < 40) {
      var group = '';
      group += pick(focus, rnd);
      for (var i = 1; i < groupSize; i++) group += pick(letters, rnd);
      parts.push(group);
      length += group.length + 1;
      if (length >= maxLen) break;
    }
    return parts.join(' ');
  }

  function alternatingLine(focus, previous, rnd, groups) {
    var parts = [];
    for (var i = 0; i < groups; i++) {
      var other = previous.length ? pick(previous, rnd) : pick(focus, rnd);
      parts.push(pick(focus, rnd) + other + pick(focus, rnd));
    }
    return parts.join(' ');
  }

  function capitalizeWord(word) {
    if (!word.length) return word;
    var first = word.charAt(0);
    return isBasicLetter(first) ? first.toUpperCase() + word.slice(1) : word;
  }

  function pseudoTokens(ctx, rnd, minLen, maxLen) {
    var tokens = [];
    var length = 0;
    var focusUsed = !ctx.focusLetter;
    var guard = 0;

    while ((length < minLen || tokens.length < 3) && tokens.length < 14 && guard++ < 80) {
      var word = pseudoWord(ctx.letters, focusUsed ? pick(ctx.letters, rnd) : ctx.focusLetter, rnd, 3, 5);
      if (tokens.indexOf(word) !== -1 && ctx.letters.length > 3) continue;
      tokens.push(word);
      length += word.length + 1;
      if (ctx.focusLetter && word.indexOf(ctx.focusLetter) !== -1) focusUsed = true;
      if (length >= maxLen) break;
    }

    if (!focusUsed && ctx.focusLetter && ctx.letters.length) {
      tokens.push(pseudoWord(ctx.letters, ctx.focusLetter, rnd, 3, 5));
    }
    return tokens;
  }

  function buildWordTokens(ctx, rnd, minLen, maxLen) {
    var pool = ctx.words;
    if (!pool.length) return pseudoTokens(ctx, rnd, minLen, maxLen);

    var tokens = [];
    var length = 0;
    var focusUsed = !ctx.focusLetter;
    var last = '';
    var guard = 0;

    while ((length < minLen || tokens.length < 3) && tokens.length < 14 && guard++ < 120) {
      var candidates = pool.filter(function (w) { return w !== last; });
      if (!candidates.length) candidates = pool;

      if (!focusUsed && ctx.focusLetter) {
        var withFocus = candidates.filter(function (w) {
          return w.indexOf(ctx.focusLetter) !== -1;
        });
        if (withFocus.length) candidates = withFocus;
      }

      var room = Math.max(4, maxLen - length);
      var fits = candidates.filter(function (w) { return w.length + 1 <= room; });
      var word;
      if (fits.length) {
        word = pick(fits, rnd);
      } else if (length < minLen) {
        word = candidates.slice().sort(function (a, b) { return a.length - b.length; })[0];
      } else {
        break;
      }
      if (!word) break;

      // V prvních lekcích je reálných slov málo. Střídáme je proto
      // s procvičovacími skupinami, aby řádky nebyly pořád stejné.
      if (pool.length < 4 && tokens.length && rnd() < 0.45) {
        var filler = pseudoWord(ctx.letters, focusUsed ? pick(ctx.letters, rnd) : ctx.focusLetter, rnd, 3, 5);
        if (filler && tokens.indexOf(filler) === -1) {
          tokens.push(filler);
          length += filler.length + 1;
          if (ctx.focusLetter && filler.indexOf(ctx.focusLetter) !== -1) focusUsed = true;
          if (length >= maxLen) break;
          continue;
        }
      }

      tokens.push(word);
      length += word.length + 1;
      last = word;
      if (ctx.focusLetter && word.indexOf(ctx.focusLetter) !== -1) focusUsed = true;
      if (length >= maxLen) break;
    }

    if (!focusUsed && ctx.focusLetter) {
      var extra = pool.filter(function (w) {
        return w.indexOf(ctx.focusLetter) !== -1 && tokens.indexOf(w) === -1;
      });
      if (extra.length) tokens.push(pick(extra, rnd));
    }
    return tokens;
  }

  function joinTokens(ctx, tokens, rnd, sentence) {
    var parts = tokens.slice();
    if (ctx.comma && parts.length > 2 && rnd() < 0.55) {
      var index = 1 + Math.floor(rnd() * (parts.length - 2));
      parts[index] = parts[index] + ',';
    }
    var text = parts.join(' ');
    if (sentence) {
      text = capitalizeWord(text);
      if (ctx.period) text += '.';
    } else if (ctx.caps && rnd() < 0.4) {
      var words = text.split(' ');
      for (var i = 0; i < words.length; i++) {
        if (rnd() < 0.3) words[i] = capitalizeWord(words[i]);
      }
      text = words.join(' ');
    }
    if (ctx.newline) text += '\n';
    return text;
  }

  function sentenceLine(ctx, rnd, minLen, maxLen) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    var sentences = [];
    var chunk = [];
    var chunkLen = 0;
    var sentenceCtx = {
      letters: ctx.letters,
      words: ctx.words,
      focusLetter: ctx.focusLetter,
      caps: ctx.caps,
      period: ctx.period,
      comma: ctx.comma,
      newline: false
    };

    for (var i = 0; i < tokens.length; i++) {
      chunk.push(tokens[i]);
      chunkLen += tokens[i].length + 1;
      var close = chunk.length >= 3 && (chunkLen >= 18 || rnd() < 0.28);
      if (close || i === tokens.length - 1) {
        sentences.push(joinTokens(sentenceCtx, chunk, rnd, true));
        chunk = [];
        chunkLen = 0;
      }
    }
    if (!sentences.length) sentences.push(joinTokens(sentenceCtx, [pseudoWord(ctx.letters, ctx.focusLetter, rnd, 3, 5)], rnd, true));

    var line = sentences.join(' ');
    if (ctx.newline) line += '\n';
    return line;
  }

  function beforePeriodWordLine(ctx, rnd, minLen, maxLen) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    return joinTokens(ctx, tokens, rnd, false);
  }



  function nl(ctx, text) {
    return ctx.newline ? text + '\n' : text;
  }

  function pickVowels(letters) {
    var vowels = [];
    ['a', 'e', 'i', 'o', 'u', 'y', 'á', 'é', 'í', 'ý', 'ě'].forEach(function (ch) {
      if (letters.indexOf(ch) !== -1) vowels.push(ch);
    });
    return vowels;
  }

  function symbolWordLine(ctx, rnd, minLen, maxLen, symbol) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    var insertAt = 1 + Math.floor(rnd() * Math.max(1, tokens.length - 1));
    tokens.splice(insertAt, 0, symbol);
    if (rnd() < 0.5) tokens.push(symbol);
    return nl(ctx, tokens.join(' '));
  }

  function commaWordLine(ctx, rnd, minLen, maxLen) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    return nl(ctx, tokens.join(', '));
  }

  function lettersJoined(letters, count, separator) {
    return letters.slice(0, count).join(separator);
  }

  function deadKeyWordLine(ctx, rnd, vowels, minLen, maxLen) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    var pair = '´' + pick(vowels, rnd);
    var insertAt = 1 + Math.floor(rnd() * Math.max(1, tokens.length - 1));
    tokens.splice(insertAt, 0, pair);
    if (rnd() < 0.5) tokens.push('´' + pick(vowels, rnd));
    return nl(ctx, tokens.join(' '));
  }

  function drillLetterLines(ctx, rnd) {
    var focus = ctx.focus;
    var previous = ctx.previousLetters;
    var f0 = focus[0];
    var f1 = focus[1] || null;
    var lines = [];

    if (f1) {
      lines.push(nl(ctx, spaced(f0, 9)));
      lines.push(nl(ctx, spaced(f1, 9)));
      lines.push(nl(ctx, repeat(f0, 2) + ' ' + repeat(f1, 2) + ' ' + repeat(f0, 2) + ' ' + repeat(f1, 2)));
      lines.push(nl(ctx, randomGroups(ctx.letters, focus, rnd, 18, 24, 3)));
    } else {
      lines.push(nl(ctx, spaced(f0, 9)));
      lines.push(nl(ctx, repeat(f0, 2) + ' ' + repeat(f0, 2) + ' ' + repeat(f0, 2) + ' ' + repeat(f0, 2)));
      lines.push(nl(ctx, alternatingLine(focus, previous, rnd, 6)));
      lines.push(nl(ctx, randomGroups(ctx.letters, focus, rnd, 18, 24, 3)));
    }
    return lines;
  }

  function practiceLetterLines(ctx, rnd) {
    var focus = ctx.focus;
    var previous = ctx.previousLetters;
    return [
      nl(ctx, randomGroups(ctx.letters, focus, rnd, 20, 28, 3)),
      nl(ctx, alternatingLine(focus, previous, rnd, 7)),
      nl(ctx, randomGroups(ctx.letters, focus, rnd, 24, 32, 4)),
      nl(ctx, alternatingLine(focus, previous, rnd, 6))
    ];
  }

  function letterWordLines(ctx, rnd, count, minLen, maxLen) {
    var lines = [];
    for (var i = 0; i < count; i++) {
      var lineCtx = {
        letters: ctx.letters,
        words: ctx.words,
        focus: ctx.focus,
        focusLetter: ctx.focus.length ? pick(ctx.focus, rnd) : null,
        caps: ctx.caps,
        period: ctx.period,
        comma: ctx.comma,
        newline: ctx.newline
      };
      lines.push(ctx.period
        ? sentenceLine(lineCtx, rnd, minLen, maxLen)
        : beforePeriodWordLine(lineCtx, rnd, minLen, maxLen));
    }
    return lines;
  }

  function ensureCaps(line) {
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (isLetter(ch.toLowerCase())) {
        return line.slice(0, i) + ch.toUpperCase() + line.slice(i + 1);
      }
    }
    return line;
  }

  function wordLineForKind(ctx, rnd, kind, index) {
    var minLen = 16 + Math.floor(index * 0.9);
    var maxLen = minLen + 10;
    var main = kind === 'symbols' && ctx.focusSymbols.length ? ctx.focusSymbols[0] : null;

    if (kind === 'symbols') {
      if (main === ',') return commaWordLine(ctx, rnd, minLen, maxLen);
      if (main === '.') return sentenceLine(ctx, rnd, minLen, maxLen);
      if (main === '´') return deadKeyWordLine(ctx, rnd, pickVowels(ctx.letters), minLen, maxLen);
      if (main === '?') {
        return index % 2 ? questionLine(ctx, rnd, minLen, maxLen) : quotedLine(ctx, rnd, minLen, maxLen);
      }
      if (main === '"') return quotedLine(ctx, rnd, minLen, maxLen);
      return symbolWordLine(ctx, rnd, minLen, maxLen, main || '(');
    }

    var line = letterWordLines(ctx, rnd, 1, minLen, maxLen)[0];
    if (kind === 'shift') line = ensureCaps(line);
    return line;
  }

  function wordExerciseLines(ctx, rnd, kind, count) {
    var lines = [];
    var guard = 0;

    while (lines.length < count && guard++ < count * 40) {
      var line = wordLineForKind(ctx, rnd, kind, lines.length);
      if (line && lines.indexOf(line) === -1) lines.push(line);
    }

    // Pojistka pro první lekce, kde z naučených písmen ještě žádná
    // skutečná slova nejdou poskládat.
    guard = 0;
    while (lines.length < count && guard++ < count * 40 && kind !== 'symbols') {
      var fallback = nl(ctx, randomGroups(ctx.letters, ctx.focus.length ? ctx.focus : ctx.letters, rnd, 18, 28, 3));
      if (kind === 'shift') fallback = ensureCaps(fallback);
      if (lines.indexOf(fallback) === -1) lines.push(fallback);
    }
    return lines;
  }

  function forceCaps(line) {
    for (var i = 0; i < line.length; i++) {
      if (isBasicLetter(line.charAt(i))) {
        return line.slice(0, i) + line.charAt(i).toUpperCase() + line.slice(i + 1);
      }
    }
    return line;
  }

  function buildShiftLines(ctx, rnd) {
    var base = ctx.letters.filter(isBasicLetter);
    var upper = base.map(function (ch) { return ch.toUpperCase(); });
    var firstUpper = upper.slice(0, 8).join(' ');
    var firstLower = base.slice(0, 8).join(' ');
    var intro = [
      nl(ctx, firstUpper),
      nl(ctx, upper[0] + ' ' + base[0] + ' ' + upper[1] + ' ' + base[1] + ' ' + upper[2] + ' ' + base[2]),
      nl(ctx, randomGroups(base, base, rnd, 16, 22, 3)),
      nl(ctx, firstUpper + ' ' + firstUpper)
    ];
    var practice = [
      nl(ctx, upper.slice(0, 6).join(' ') + ' ' + base.slice(0, 6).join(' ')),
      nl(ctx, alternatingLine(base, base, rnd, 7)),
      nl(ctx, randomGroups(base, base, rnd, 20, 28, 3)),
      nl(ctx, upper.slice(2, 10).join(' '))
    ];
    var words = letterWordLines(ctx, rnd, 4, 22, 32).map(forceCaps);
    var fluency = letterWordLines(ctx, rnd, 5, 30, 44).map(forceCaps);
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function genericSymbolLines(ctx, rnd, symbol) {
    var letters = ctx.letters;
    var intro = [
      nl(ctx, spaced(symbol, 9)),
      nl(ctx, letters.slice(0, 5).map(function (ch) { return ch + symbol + ch; }).join(' ')),
      nl(ctx, symbol + letters.slice(0, 6).join(symbol) + symbol),
      symbolWordLine(ctx, rnd, 18, 26, symbol)
    ];
    var practice = [
      nl(ctx, letters.slice(0, 7).join(symbol)),
      symbolWordLine(ctx, rnd, 20, 30, symbol),
      symbolWordLine(ctx, rnd, 24, 34, symbol),
      nl(ctx, letters.slice(0, 5).map(function (ch) { return symbol + ch; }).join(' ') + ' ' +
        letters.slice(0, 5).map(function (ch) { return ch + symbol; }).join(' '))
    ];
    var words = [
      symbolWordLine(ctx, rnd, 24, 34, symbol),
      symbolWordLine(ctx, rnd, 26, 36, symbol),
      symbolWordLine(ctx, rnd, 28, 38, symbol),
      symbolWordLine(ctx, rnd, 26, 36, symbol)
    ];
    var fluency = [
      symbolWordLine(ctx, rnd, 32, 44, symbol),
      symbolWordLine(ctx, rnd, 36, 48, symbol),
      symbolWordLine(ctx, rnd, 34, 46, symbol),
      symbolWordLine(ctx, rnd, 38, 50, symbol),
      symbolWordLine(ctx, rnd, 34, 48, symbol)
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function buildCommaLines(ctx, rnd) {
    var letters = ctx.letters;
    var intro = [
      nl(ctx, spaced(',', 8)),
      nl(ctx, lettersJoined(letters, 8, ', ')),
      nl(ctx, commaWordLine(ctx, rnd, 18, 26)),
      nl(ctx, lettersJoined(letters, 7, ', ') + ', ' + lettersJoined(letters.slice(7), 3, ', '))
    ];
    var practice = [
      nl(ctx, randomGroups(letters, letters, rnd, 16, 24, 2).split(' ').join(', ')),
      nl(ctx, alternatingLine(letters, letters, rnd, 6).split(' ').join(', ')),
      nl(ctx, commaWordLine(ctx, rnd, 24, 32)),
      nl(ctx, commaWordLine(ctx, rnd, 26, 36))
    ];
    var words = [
      commaWordLine(ctx, rnd, 24, 34),
      commaWordLine(ctx, rnd, 26, 38),
      commaWordLine(ctx, rnd, 28, 40),
      commaWordLine(ctx, rnd, 26, 36)
    ];
    var fluency = [
      commaWordLine(ctx, rnd, 32, 44),
      commaWordLine(ctx, rnd, 36, 48),
      commaWordLine(ctx, rnd, 34, 46),
      commaWordLine(ctx, rnd, 38, 50),
      commaWordLine(ctx, rnd, 34, 48)
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function buildPeriodLines(ctx, rnd) {
    var letters = ctx.letters;
    var intro = [
      nl(ctx, lettersJoined(letters, 8, '. ') + '.'),
      sentenceLine(ctx, rnd, 16, 24),
      sentenceLine(ctx, rnd, 18, 26),
      sentenceLine(ctx, rnd, 20, 28)
    ];
    var practice = [
      sentenceLine(ctx, rnd, 20, 30),
      sentenceLine(ctx, rnd, 24, 34),
      sentenceLine(ctx, rnd, 22, 32),
      sentenceLine(ctx, rnd, 26, 36)
    ];
    var words = [
      sentenceLine(ctx, rnd, 26, 36),
      sentenceLine(ctx, rnd, 28, 40),
      sentenceLine(ctx, rnd, 30, 42),
      sentenceLine(ctx, rnd, 28, 40)
    ];
    var fluency = [
      sentenceLine(ctx, rnd, 34, 48),
      sentenceLine(ctx, rnd, 38, 52),
      sentenceLine(ctx, rnd, 36, 50),
      sentenceLine(ctx, rnd, 40, 54),
      sentenceLine(ctx, rnd, 36, 50)
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function buildDeadKeyLines(ctx, rnd) {
    var vowels = pickVowels(ctx.letters);
    var pairs = vowels.slice(0, 6).map(function (v) { return '´' + v; });
    var intro = [
      nl(ctx, spaced('´', 8)),
      nl(ctx, pairs.join(' ')),
      nl(ctx, pairs.slice(0, 3).join(' ') + ' ' + pairs.slice(0, 3).join(' ')),
      deadKeyWordLine(ctx, rnd, vowels, 18, 26)
    ];
    var practice = [
      nl(ctx, pairs.join(' ') + ' ' + pairs.join(' ')),
      nl(ctx, vowels.slice().reverse().map(function (v) { return '´' + v; }).join(' ')),
      deadKeyWordLine(ctx, rnd, vowels, 20, 30),
      nl(ctx, pairs.join(' ') + ' ' + pairs.join(' '))
    ];
    var words = [
      deadKeyWordLine(ctx, rnd, vowels, 24, 34),
      deadKeyWordLine(ctx, rnd, vowels, 26, 36),
      deadKeyWordLine(ctx, rnd, vowels, 28, 38),
      deadKeyWordLine(ctx, rnd, vowels, 26, 36)
    ];
    var fluency = [
      deadKeyWordLine(ctx, rnd, vowels, 32, 44),
      deadKeyWordLine(ctx, rnd, vowels, 36, 48),
      deadKeyWordLine(ctx, rnd, vowels, 34, 46),
      deadKeyWordLine(ctx, rnd, vowels, 38, 50),
      deadKeyWordLine(ctx, rnd, vowels, 34, 48)
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function buildParenLines(ctx, rnd) {
    var letters = ctx.letters;
    var intro = [
      nl(ctx, spaced('(', 8) + ' ' + spaced(')', 8)),
      nl(ctx, '(' + letters.slice(0, 5).join(' ') + ')'),
      nl(ctx, '( ' + letters.slice(0, 5).join(' ') + ' ) (' + letters.slice(0, 4).join(' ') + ')'),
      symbolWordLine(ctx, rnd, 18, 26, '(')
    ];
    var practice = [
      nl(ctx, '(' + letters.slice(0, 6).join(' ') + ') (' + letters.slice(0, 6).join(' ') + ')'),
      symbolWordLine(ctx, rnd, 20, 30, '('),
      symbolWordLine(ctx, rnd, 24, 34, '('),
      nl(ctx, '(' + letters.slice(0, 4).join(' ') + ')')
    ];
    var words = [
      symbolWordLine(ctx, rnd, 24, 34, '('),
      symbolWordLine(ctx, rnd, 26, 36, '('),
      symbolWordLine(ctx, rnd, 28, 38, '('),
      symbolWordLine(ctx, rnd, 26, 36, '(')
    ];
    var fluency = [
      symbolWordLine(ctx, rnd, 32, 44, '('),
      symbolWordLine(ctx, rnd, 36, 48, '('),
      symbolWordLine(ctx, rnd, 34, 46, '('),
      symbolWordLine(ctx, rnd, 38, 50, '('),
      symbolWordLine(ctx, rnd, 34, 48, '(')
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function quotedLine(ctx, rnd, minLen, maxLen) {
    var tokens = buildWordTokens(ctx, rnd, minLen, maxLen);
    if (tokens.length) tokens[0] = capitalizeWord(tokens[0]);
    return nl(ctx, '"' + tokens.join(' ') + '"');
  }

  function questionLine(ctx, rnd, minLen, maxLen) {
    return sentenceLine(ctx, rnd, minLen, maxLen).replace(/\./g, '?');
  }

  function buildQuestionLines(ctx, rnd) {
    var intro = [
      nl(ctx, spaced('?', 8) + ' ' + spaced('"', 8)),
      nl(ctx, 'Kdo? Co? Kde? Jak?'),
      quotedLine(ctx, rnd, 8, 16),
      questionLine(ctx, rnd, 16, 24)
    ];
    var practice = [
      nl(ctx, 'Kdo? Co? Kdy? Jak? Proč?'),
      quotedLine(ctx, rnd, 14, 22),
      questionLine(ctx, rnd, 18, 26),
      questionLine(ctx, rnd, 20, 28)
    ];
    var words = [
      questionLine(ctx, rnd, 24, 34),
      quotedLine(ctx, rnd, 20, 28),
      questionLine(ctx, rnd, 26, 36),
      quotedLine(ctx, rnd, 22, 30)
    ];
    var fluency = [
      questionLine(ctx, rnd, 32, 44),
      quotedLine(ctx, rnd, 28, 38),
      questionLine(ctx, rnd, 34, 46),
      quotedLine(ctx, rnd, 30, 40),
      questionLine(ctx, rnd, 32, 44)
    ];
    return { intro: intro, practice: practice, words: words, fluency: fluency };
  }

  function buildSymbolLines(ctx, rnd, symbols) {
    var main = symbols[0];
    if (main === ',') return buildCommaLines(ctx, rnd);
    if (main === '.') return buildPeriodLines(ctx, rnd);
    if (main === '´') return buildDeadKeyLines(ctx, rnd);
    if (main === '(') return buildParenLines(ctx, rnd);
    if (main === '?') return buildQuestionLines(ctx, rnd);
    return genericSymbolLines(ctx, rnd, main);
  }

  var EXERCISES_PER_LESSON = 20;
  var DRILL_COUNT = 3;

  function lessonLines(bundle, ctx, rnd, kind) {
    var lines = [];

    function take(list, count) {
      if (!list) return;
      for (var i = 0; i < list.length && i < count; i++) {
        if (list[i] && lines.indexOf(list[i]) === -1) lines.push(list[i]);
      }
    }

    // První tři cvičení jsou vždy rozcvička s novým písmenem nebo znakem.
    take(bundle.intro, DRILL_COUNT);
    if (lines.length < DRILL_COUNT) take(bundle.practice, DRILL_COUNT - lines.length);

    // Zbytek lekce tvoří skutečná slova z dosud naučených písmen.
    // Jen v prvních lekcích, kde taková slova ještě neexistují, se
    // doplní procvičovací skupiny.
    var wordLines = wordExerciseLines(ctx, rnd, kind, EXERCISES_PER_LESSON - lines.length + 4);
    for (var w = 0; w < wordLines.length && lines.length < EXERCISES_PER_LESSON; w++) {
      if (lines.indexOf(wordLines[w]) === -1) lines.push(wordLines[w]);
    }

    if (lines.length < EXERCISES_PER_LESSON) {
      var fallback = bundle.intro && bundle.intro.length
        ? bundle.intro[0]
        : (bundle.practice && bundle.practice[0]) || '';
      if (fallback && lines.indexOf(fallback) === -1) lines.push(fallback);
    }
    return lines.slice(0, EXERCISES_PER_LESSON);
  }

  function lessonTitle(ctx) {
    if (ctx.kind === 'shift') return 'Velká písmena';
    if (ctx.kind === 'symbols') return 'Nový znak';
    return 'Nácvik klávesy';
  }

  function lessonSubtitle(ctx) {
    if (ctx.kind === 'shift') return 'Velká písmena píšeme Shiftem. Drží ho malíček opačné ruky, než kterou mačkáme písmeno.';
    if (ctx.kind === 'symbols') return 'Nový znak procvičíš ve slovech i v samostatných řádcích.';
    return 'Nová klávesa a procvičení se všemi písmeny z předchozích táborů.';
  }

  function buildLessons(ctx) {
    var rnd = seeded((ctx.order + 1) * 7919 + ctx.order * 131);
    var bundle;
    if (ctx.kind === 'shift') {
      bundle = buildShiftLines(ctx, rnd);
    } else if (ctx.kind === 'symbols') {
      bundle = buildSymbolLines(ctx, rnd, ctx.focusSymbols);
    } else {
      bundle = {
        intro: drillLetterLines(ctx, rnd),
        practice: practiceLetterLines(ctx, rnd),
        words: letterWordLines(ctx, rnd, 4, 24, 34),
        fluency: letterWordLines(ctx, rnd, 5, 30, 46)
      };
    }

    // Jeden tábor = jedna lekce. Lekce obsahuje seznámení s klávesou,
    // procvičení, slova i plynulost v jednom souvislém celku.
    return [
      {
        index: 0,
        title: lessonTitle(ctx),
        subtitle: lessonSubtitle(ctx),
        lines: lessonLines(bundle, ctx, rnd, ctx.kind)
      }
    ];
  }

  var UNIT_DEFS = [
    { letters: ['j', 'f'], controls: ['space'], note: "Písmeno 'j', klávesa [mezera] a písmeno 'f'" },
    { letters: ['u'], note: "Písmeno 'u'" },
    { letters: ['r'], note: "Písmeno 'r'" },
    { letters: ['n'], note: "Písmeno 'n'" },
    { letters: ['v'], note: "Písmeno 'v'" },
    { letters: ['t'], note: "Písmeno 't'" },
    { letters: ['z'], note: "Písmeno 'z'" },
    { letters: ['d'], note: "Písmeno 'd'" },
    { letters: ['e'], note: "Písmeno 'e'" },
    { letters: ['k'], note: "Písmeno 'k'" },
    { letters: ['i'], note: "Písmeno 'i'" },
    { letters: ['s'], controls: ['backspace'], note: "Písmeno 's' a klávesa Backspace" },
    { letters: ['l'], note: "Písmeno 'l'" },
    { letters: ['o'], note: "Písmeno 'o'" },
    { letters: ['a'], note: "Písmeno 'a'" },
    { letters: ['h'], note: "Písmeno 'h'" },
    { letters: ['c'], note: "Písmeno 'c'" },
    { kind: 'symbols', symbols: [','], note: 'Znak , [čárka]' },
    { letters: ['b'], note: "Písmeno 'b'" },
    { letters: ['m'], note: "Písmeno 'm'" },
    { kind: 'shift', controls: ['shift'], note: 'Klávesa levý Shift a klávesa pravý Shift' },
    { kind: 'symbols', symbols: ['.'], note: 'Znak . [tečka]' },
    { letters: ['p'], note: "Písmeno 'p'" },
    { letters: ['y'], note: "Písmeno 'y'" },
    { letters: ['á'], note: "Písmeno 'á'" },
    { letters: ['í'], note: "Písmeno 'í'" },
    { letters: ['ě'], note: "Písmeno 'ě'" },
    { letters: ['é'], note: "Písmeno 'é'" },
    { letters: ['ř'], note: "Písmeno 'ř'" },
    { letters: ['ý'], note: "Písmeno 'ý'" },
    { letters: ['č'], note: "Písmeno 'č'" },
    { letters: ['ů'], controls: ['enter'], note: "Písmeno 'ů' a klávesa Enter" },
    { letters: ['š'], note: "Písmeno 'š'" },
    { letters: ['ž'], note: "Písmeno 'ž'" },
    { letters: ['ú'], note: "Písmeno 'ú'" },
    { letters: ['g'], note: "Písmeno 'g'" },
    { kind: 'symbols', symbols: ['´'], note: 'Znak ´ [délka]' },
    { kind: 'symbols', symbols: ['1'], note: 'Číslovka 1' },
    { letters: ['x'], note: "Písmeno 'x'" },
    { kind: 'symbols', symbols: ['-'], note: 'Znak - [pomlčka, mínus]' },
    { letters: ['w'], note: "Písmeno 'w'" },
    { kind: 'symbols', symbols: ['='], note: 'Znak = [rovnítko]' },
    { letters: ['q'], note: "Písmeno 'q'" },
    { kind: 'symbols', symbols: ['(', ')'], note: 'Klávesa ( [levá závorka]' },
    { kind: 'symbols', symbols: ['?', '"'], note: 'Znak ? [otazník] a klávesa " [uvozovky]' },
    { kind: 'symbols', symbols: ['§'], note: 'Znak § [paragraf]' }
  ];

  function pushUnique(target, items) {
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (target.indexOf(items[i]) === -1) target.push(items[i]);
    }
  }

  var units = [];
  var allowedLetters = [];
  var allowedSymbols = [' '];
  var caps = false;
  var comma = false;
  var period = false;
  var newline = false;

  UNIT_DEFS.forEach(function (def, index) {
    var number = index + 1;
    var focusLetters = def.letters || [];
    var focusSymbols = def.symbols || [];

    pushUnique(allowedLetters, focusLetters);
    pushUnique(allowedSymbols, focusSymbols);

    if (def.controls && def.controls.indexOf('enter') !== -1) newline = true;
    if (def.kind === 'shift') caps = true;
    if (focusSymbols.indexOf(',') !== -1) comma = true;
    if (focusSymbols.indexOf('.') !== -1) period = true;

    var previousLetters = allowedLetters.filter(function (ch) {
      return focusLetters.indexOf(ch) === -1;
    });

    var ctx = {
      order: number - 1,
      kind: def.kind || 'letters',
      letters: allowedLetters.slice(),
      previousLetters: previousLetters,
      allowedLower: allowedLetters.slice(),
      words: wordsFor(allowedLetters.slice()),
      focus: focusLetters.slice(),
      focusSymbols: focusSymbols.slice(),
      focusLetter: focusLetters.length ? focusLetters[0] : null,
      caps: caps,
      comma: comma,
      period: period,
      newline: newline
    };

    var allowedChars = allowedLetters.concat(allowedSymbols);
    if (caps) {
      allowedLetters.forEach(function (ch) {
        if (isBasicLetter(ch)) allowedChars.push(ch.toUpperCase());
      });
    }
    if (newline) allowedChars.push('\n');

    var label;
    if (ctx.kind === 'shift') label = 'Shift';
    else if (ctx.kind === 'symbols') label = focusSymbols.join(' ');
    else label = focusLetters.join(' ');

    units.push({
      id: String(number),
      number: number,
      order: number,
      kind: ctx.kind,
      label: label,
      glyph: label,
      title: def.note,
      note: def.note,
      newLetters: focusLetters.slice(),
      newSymbols: focusSymbols.slice(),
      newChars: focusLetters.concat(focusSymbols),
      controls: def.controls || [],
      caps: caps,
      comma: comma,
      period: period,
      newline: newline,
      allowedLetters: allowedLetters.slice(),
      allowedSymbols: allowedSymbols.slice(),
      allowedChars: allowedChars,
      previousLetters: previousLetters,
      lessons: buildLessons(ctx)
    });
  });

  function charName(ch) {
    if (ch === '\n') return 'Enter';
    if (ch === ' ') return 'mezerník';
    if (CHAR_NAMES[ch]) return CHAR_NAMES[ch];
    if (ch.length === 1 && isLetter(ch)) return 'písmeno ' + ch;
    return ch;
  }

  function keyInfo(ch, layoutId) {
    return describeChar(ch, layoutId);
  }

  function fingerForLetter(ch, layoutId) {
    var info = describeChar(ch, layoutId);
    return info ? info.finger : null;
  }

  var API = {
    layouts: LAYOUTS,
    fingers: FINGERS,
    units: units,
    lessons: units,
    specialKeys: SPECIAL_KEYS,
    totalUnits: units.length,
    totalLessons: units.length,
    describeChar: describeChar,
    describeSpecial: describeSpecial,
    keyInfo: keyInfo,
    fingerForLetter: fingerForLetter,
    findKey: findKey,
    keyLabel: keyLabel,
    keyShiftLabel: keyShiftLabel,
    charName: charName,
    isLetter: isLetter,
    isBasicLetter: isBasicLetter
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.LekceData = API;
})();
