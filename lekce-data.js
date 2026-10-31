/*
 * Obsah lekcí 10fingerstyping.
 *
 * Každá jednotka = jedno písmeno. V jednotce jsou 4 lekce:
 *   1) seznámení s klávesou a prstem + první procvičení,
 *   2) procvičení písmene,
 *   3) slova a slabiky,
 *   4) plynulé psaní delších řádků.
 *
 * Cvičení vždy používají aktuální písmeno a všechna písmena z předchozích
 * jednotek. Text je záměrně bez diakritiky, aby šel psát na běžné klávesnici.
 */
(function () {
  'use strict';

  var LAYOUTS = {
    qwertz: {
      id: 'qwertz',
      name: 'QWERTZ',
      description: 'České rozložení (Z a Y jsou prohozené).',
      rows: [
        ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
        ['y', 'x', 'c', 'v', 'b', 'n', 'm']
      ]
    },
    qwerty: {
      id: 'qwerty',
      name: 'QWERTY',
      description: 'Anglické rozložení (Z a Y na běžných místech).',
      rows: [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm']
      ]
    }
  };

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

  // Rozložení prstů podle sloupce v řadě (stejné pro všechny tři řady).
  var ROW_FINGERS = [
    ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'l-index', 'r-index', 'r-index', 'r-middle', 'r-ring', 'r-pinky'],
    ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'l-index', 'r-index', 'r-index', 'r-middle', 'r-ring', 'r-pinky'],
    ['l-pinky', 'l-ring', 'l-middle', 'l-index', 'l-index', 'r-index', 'r-index']
  ];

  var LETTERS = [
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
    'e', 'i', 't', 'r', 'u', 'o', 'p',
    'n', 'm', 'c', 'v', 'b',
    'z', 'y', 'q', 'w', 'x'
  ];

  var WORDS = [
    'as', 'je', 'no', 'on', 'my', 'ty', 'se', 've', 'ze', 'do', 'na', 'po', 'ku', 'ok', 'me', 'ta', 'to', 'uz', 'rad',
    'pes', 'les', 'sen', 'den', 'kdo', 'kde', 'jde', 'mam', 'tam', 'sem', 'nam', 'dum', 'rada', 'voda', 'ruka', 'kolo',
    'auto', 'most', 'plot', 'nos', 'med', 'maso', 'zub', 'kost', 'list', 'strom', 'kmen', 'mrak', 'vlak', 'jablko',
    'brambor', 'mrkev', 'cibule', 'paprika', 'okurka', 'ryba', 'salat', 'skola', 'urad', 'zivot', 'jmeno', 'mesto',
    'prace', 'hodina', 'minuta', 'tabulka', 'papir', 'pero', 'kniha', 'sesit', 'kresba', 'barva', 'modra', 'zelena',
    'cervena', 'bila', 'cerna', 'zluta', 'seda', 'noha', 'hlava', 'oko', 'ucho', 'vlas', 'krk', 'prst', 'palec',
    'koleno', 'loket', 'rameno', 'zada', 'klavesa', 'klavesnice', 'pocitac', 'obrazovka', 'mys', 'program', 'soubor',
    'adresa', 'server', 'data', 'heslo', 'ucet', 'uzivatel', 'zprava', 'email', 'odkaz', 'stranka', 'web', 'kod',
    'text', 'radek', 'sloupec', 'formular', 'nastaveni', 'zmena', 'ulozeni', 'smazani', 'hledat', 'otevrit', 'zavrit',
    'kopirovat', 'vlozit', 'stisknout', 'kliknout', 'psat', 'cteni', 'psani', 'slovo', 'veta', 'odstavec', 'pismeno',
    'cislo', 'carka', 'tecka', 'mezera', 'enter', 'shift', 'kontrola', 'oprava', 'chyba', 'presnost', 'rychlost',
    'sekunda', 'tyden', 'mesic', 'rok', 'cas', 'hra', 'zabava', 'trenink', 'lekce', 'krok', 'byt', 'kuchyne', 'pokoj',
    'stul', 'zidle', 'lampa', 'klic', 'dvere', 'okno', 'zahrada', 'kvetina', 'trava', 'more', 'reka', 'hora', 'pole',
    'cesta', 'vesnice', 'kraj', 'zeme', 'svet', 'slunce', 'hvezda', 'obloha', 'dest', 'snih', 'vitr', 'teplo', 'zima',
    'jaro', 'leto', 'podzim', 'rano', 'vecer', 'noc', 'mleko', 'chleb', 'cukr', 'sul', 'pepr', 'caj', 'kava', 'box',
    'taxi', 'expert', 'klub', 'klima', 'muz', 'zena', 'dite', 'rodina', 'bratr', 'sestra', 'matka', 'otec', 'syn',
    'dcera', 'babicka', 'dedecek', 'pritel', 'kamarad', 'clovek', 'lide', 'svetlo', 'tma', 'barva', 'zvuk', 'ton',
    'nota', 'zpev', 'tanec', 'sport', 'beh', 'plavani', 'lyze', 'kolo', 'fotbal', 'hokej', 'tenis', 'branka',
    'body', 'vyhra', 'prohra', 'tym', 'hrac', 'trener', 'zapas', 'turnaj', 'medaile', 'pohar', 'stadion', 'arena'
  ];

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

  function repeatLine(ch, groups, groupSize) {
    var parts = [];
    for (var i = 0; i < groups; i++) parts.push(repeat(ch, groupSize));
    return parts.join(' ');
  }

  function pickChar(allowed, current, rnd) {
    if (rnd() < 0.45) return current;
    return allowed[Math.floor(rnd() * allowed.length)];
  }

  function randomGroups(allowed, current, rnd, minLen, maxLen, groupSize) {
    var parts = [];
    var length = 0;
    while (length < minLen || parts.length < 3) {
      var group = '';
      for (var i = 0; i < groupSize; i++) group += pickChar(allowed, current, rnd);
      parts.push(group);
      length += group.length + 1;
      if (length >= maxLen) break;
    }
    return parts.join(' ');
  }

  function alternatingLine(letter, previous, rnd, groups) {
    var other = previous.length ? pick(previous, rnd) : letter;
    var parts = [];
    for (var i = 0; i < groups; i++) parts.push(letter + other + letter);
    return parts.join(' ');
  }

  var wordCache = Object.create(null);

  function wordsFor(allowed) {
    var key = allowed.join('');
    if (!wordCache[key]) {
      wordCache[key] = WORDS.filter(function (word) {
        for (var i = 0; i < word.length; i++) {
          if (allowed.indexOf(word.charAt(i)) === -1) return false;
        }
        return true;
      });
    }
    return wordCache[key];
  }

  function pseudoWord(allowed, preferred, rnd, minLen, maxLen) {
    var length = minLen + Math.floor(rnd() * (maxLen - minLen + 1));
    var out = '';
    for (var i = 0; i < length; i++) {
      out += i === 0 ? preferred : pick(allowed, rnd);
    }
    return out;
  }

  function wordLine(allowed, current, previous, rnd, minLen, maxLen) {
    var words = wordsFor(allowed).slice();
    var parts = [];
    var usedCurrent = false;
    var usedPrevious = previous.length === 0;
    var len = 0;

    if (previous.length) {
      var anchor = pick(previous, rnd);
      parts.push(anchor + current + anchor);
      len += parts[0].length + 1;
      usedCurrent = true;
      usedPrevious = true;
    }

    while (len < minLen && parts.length < 9) {
      var candidates = words.filter(function (w) {
        return w.length <= Math.max(3, maxLen - len) && parts.indexOf(w) === -1;
      });

      if (!candidates.length) {
        candidates = [pseudoWord(allowed, usedCurrent ? pick(allowed, rnd) : current, rnd, 3, 5)];
      }

      var chosen = null;
      if (!usedCurrent) {
        var withCurrent = candidates.filter(function (w) { return w.indexOf(current) !== -1; });
        if (withCurrent.length) chosen = pick(withCurrent, rnd);
      }
      if (!chosen) chosen = pick(candidates, rnd);

      parts.push(chosen);
      len += chosen.length + 1;
      if (chosen.indexOf(current) !== -1) usedCurrent = true;
      for (var i = 0; i < previous.length; i++) {
        if (chosen.indexOf(previous[i]) !== -1) {
          usedPrevious = true;
          break;
        }
      }
    }

    if (!usedCurrent) {
      parts.push(pseudoWord(allowed, current, rnd, 2, 4));
    }
    if (!usedPrevious) {
      parts.unshift(pick(previous, rnd) + current);
    }

    return parts.join(' ');
  }

  function buildLessons(letter, allowed, unitIndex) {
    var previous = allowed.slice(0, -1);
    var rnd = seeded((unitIndex + 1) * 7919 + letter.charCodeAt(0) * 131);

    var lesson1Lines = [
      repeatLine(letter, 7, 1),
      repeatLine(letter, 5, 2),
      previous.length ? alternatingLine(letter, previous, rnd, 5) : repeatLine(letter, 4, 3),
      randomGroups(allowed, letter, rnd, 16, 22, 3)
    ];

    var lesson2Lines = [
      randomGroups(allowed, letter, rnd, 18, 25, 3),
      alternatingLine(letter, previous, rnd, 6),
      randomGroups(allowed, letter, rnd, 22, 30, 4),
      randomGroups(allowed, letter, rnd, 20, 28, 3)
    ];

    var lesson3Lines = [
      wordLine(allowed, letter, previous, rnd, 24, 32),
      wordLine(allowed, letter, previous, rnd, 26, 34),
      wordLine(allowed, letter, previous, rnd, 28, 38),
      wordLine(allowed, letter, previous, rnd, 24, 34)
    ];

    var lesson4Lines = [
      wordLine(allowed, letter, previous, rnd, 32, 44),
      wordLine(allowed, letter, previous, rnd, 36, 48),
      wordLine(allowed, letter, previous, rnd, 34, 46),
      wordLine(allowed, letter, previous, rnd, 38, 50),
      wordLine(allowed, letter, previous, rnd, 34, 48)
    ];

    return [
      {
        index: 0,
        title: 'Seznámení',
        subtitle: 'Ukážeme si klávesu, prst a první stisky.',
        intro: true,
        lines: lesson1Lines
      },
      {
        index: 1,
        title: 'Procvičení',
        subtitle: 'Opakování písmene a navazujících kombinací.',
        intro: false,
        lines: lesson2Lines
      },
      {
        index: 2,
        title: 'Slova',
        subtitle: 'Slova a slabiky složené z naučených písmen.',
        intro: false,
        lines: lesson3Lines
      },
      {
        index: 3,
        title: 'Plynulost',
        subtitle: 'Delší řádky pro plynulé a přesné psaní.',
        intro: false,
        lines: lesson4Lines
      }
    ];
  }

  function keyInfo(ch, layoutId) {
    var layout = LAYOUTS[layoutId] || LAYOUTS.qwertz;
    if (ch === ' ') {
      return { key: ' ', row: 3, col: 0, fingerId: 'thumb', finger: FINGERS.thumb };
    }
    for (var r = 0; r < layout.rows.length; r++) {
      for (var c = 0; c < layout.rows[r].length; c++) {
        if (layout.rows[r][c] === ch) {
          var fingerId = ROW_FINGERS[r][c];
          return { key: ch, row: r, col: c, fingerId: fingerId, finger: FINGERS[fingerId] };
        }
      }
    }
    return null;
  }

  function fingerForLetter(ch, layoutId) {
    var info = keyInfo(ch, layoutId);
    return info ? info.finger : null;
  }

  var UNITS = LETTERS.map(function (letter, index) {
    var allowed = LETTERS.slice(0, index + 1);
    return {
      id: letter,
      letter: letter,
      order: index + 1,
      allowed: allowed,
      lessons: buildLessons(letter, allowed, index)
    };
  });

  window.LekceData = {
    letters: LETTERS,
    units: UNITS,
    layouts: LAYOUTS,
    fingers: FINGERS,
    rowFingers: ROW_FINGERS,
    keyInfo: keyInfo,
    fingerForLetter: fingerForLetter,
    words: WORDS
  };
})();
