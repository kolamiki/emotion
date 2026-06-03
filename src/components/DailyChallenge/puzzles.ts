export type PuzzleType =
  | 'sudoku'
  | 'crossword'
  | 'wordsearch'
  | 'rebus'
  | 'quiz'
  | 'memory'
  | 'architect';

export interface ArchitectPuzzle {
  id: number;
  size: number;
  houses: [number, number][];
  rowClues: number[];
  colClues: number[];
  solution: [number, number][];
}

export interface RebusPuzzle {
  id: number;
  category: 'Przysłowia' | 'Tytuły filmów' | 'Bohaterowie komiksowi' | 'Kraje świata';
  emojis: string[];
  answer: string;
  hint: string;
}

export interface PuzzleCollection {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  type: PuzzleType;
  title: string;
  description: string;
  items: any[];
}

export const dailyPuzzles: Record<number, PuzzleCollection> = {
  0: {
    dayOfWeek: 0,
    type: 'crossword',
    title: 'Niedzielna Krzyżówka',
    description: 'Rozwiąż hasła i odgadnij główne słowo!',
    items: [
      {
        id: 1,
        size: { rows: 15, cols: 15 },
        words: [
          { id: 1, number: 1, clue: 'Wyświetla obraz z komputera', answer: 'EKRAN', row: 2, col: 4, direction: 'horizontal' },
          { id: 2, number: 2, clue: 'Służy do wpisywania tekstu', answer: 'KLAWIATURA', row: 2, col: 5, direction: 'vertical' },
          { id: 3, number: 3, clue: 'Gryzoń na biurku', answer: 'MYSZKA', row: 4, col: 0, direction: 'horizontal' },
          { id: 4, number: 4, clue: 'Bezprzewodowy internet', answer: 'WIFI', row: 5, col: 5, direction: 'horizontal' },
          { id: 5, number: 5, clue: 'System operacyjny z pingwinem', answer: 'LINUX', row: 6, col: 4, direction: 'horizontal' }
        ]
      }
    ]
  },
  1: {
    dayOfWeek: 1,
    type: 'sudoku',
    title: 'Poniedziałkowe Sudoku',
    description: 'Wypełnij planszę 9x9 cyframi od 1 do 9.',
    items: [
      {
        id: 1,
        grid: [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ]
      },
      {
        id: 2,
        grid: [
          [0, 0, 0, 2, 6, 0, 7, 0, 1],
          [6, 8, 0, 0, 7, 0, 0, 9, 0],
          [1, 9, 0, 0, 0, 4, 5, 0, 0],
          [8, 2, 0, 1, 0, 0, 0, 4, 0],
          [0, 0, 4, 6, 0, 2, 9, 0, 0],
          [0, 5, 0, 0, 0, 3, 0, 2, 8],
          [0, 0, 9, 3, 0, 0, 0, 7, 4],
          [0, 4, 0, 0, 5, 0, 0, 3, 6],
          [7, 0, 3, 0, 1, 8, 0, 0, 0]
        ]
      }
    ]
  },
  2: {
    dayOfWeek: 2,
    type: 'wordsearch',
    title: 'Wtorkowa Wykreślanka',
    description: 'Znajdź wszystkie ukryte słowa w gąszczu liter.',
    items: [
      { id: 1, words: ['REACT', 'TYPESCRIPT', 'CSS'] },
      { id: 2, words: ['FRONTEND', 'BACKEND', 'API'] }
    ]
  },
  3: {
    dayOfWeek: 3,
    type: 'rebus',
    title: 'Środowy Rebus',
    description: 'Odgadnij 5 rebusów jak najszybciej. Podpowiedź dodaje 20s kary, pominięcie 90s.',
    items: [
      // === PRZYSŁOWIA ===
      { id: 101, category: 'Przysłowia', emojis: ['⏰', '💸'], answer: 'Czas to pieniądz', hint: 'Gdy każda minuta jest cenna.' },
      { id: 102, category: 'Przysłowia', emojis: ['🍎', '❌', '➡️', '🌳'], answer: 'Niedaleko pada jabłko od jabłoni', hint: 'Dzieci są podobne do rodziców.' },
      { id: 103, category: 'Przysłowia', emojis: ['🌧️', '🏠', '☀️', '🏠'], answer: 'Wszędzie dobrze ale w domu najlepiej', hint: 'Powrót jest zawsze najprzyjemniejszy.' },
      { id: 104, category: 'Przysłowia', emojis: ['🐎', '🎁', '🦷', '❌', '👁️'], answer: 'Darowanemu koniowi w zęby się nie zagląda', hint: 'Nie krytykuje się otrzymanych prezentów.' },
      { id: 105, category: 'Przysłowia', emojis: ['🏃‍♂️', '💨', '🐢', '🏆'], answer: 'Spiesz się powoli', hint: 'Dokładność jest ważniejsza niż pośpiech.' },
      { id: 106, category: 'Przysłowia', emojis: ['🐈', '🐭', '💃'], answer: 'Gdy kota nie ma myszy harcują', hint: 'Brak nadzoru prowadzi do rozluźnienia dyscypliny.' },
      { id: 107, category: 'Przysłowia', emojis: ['🔥', '💨', '❌', '🔥'], answer: 'Nie ma dymu bez ognia', hint: 'Zawsze jest jakaś przyczyna plotek lub zdarzeń.' },
      { id: 108, category: 'Przysłowia', emojis: ['👁️', '❤️', '👁️', '❌', '❤️'], answer: 'Czego oczy nie widzą tego sercu nie żal', hint: 'Brak wiedzy chroni przed zmartwieniem.' },
      { id: 109, category: 'Przysłowia', emojis: ['🐦', '✋', '🐦', '🐦', '🌲'], answer: 'Lepszy wróbel w garści niż gołąb na dachu', hint: 'Pewne, małe zyski są lepsze niż niepewne obietnice.' },
      { id: 110, category: 'Przysłowia', emojis: ['😴', '🛏️', '☀️', '🛌'], answer: 'Kto rano wstaje temu Pan Bóg daje', hint: 'Wczesne wstawanie przynosi korzyści.' },

      // === TYTUŁY FILMÓW ===
      { id: 201, category: 'Tytuły filmów', emojis: ['👽', '🚲', '🌕'], answer: 'ET', hint: 'Klasyk o kosmicie z 1982.' },
      { id: 202, category: 'Tytuły filmów', emojis: ['🚢', '🧊', '💔'], answer: 'Titanic', hint: 'Słynny statek i góra lodowa.' },
      { id: 203, category: 'Tytuły filmów', emojis: ['🦖', '🏞️', '🚙'], answer: 'Park Jurajski', hint: 'Dinozaury przywrócone do życia.' },
      { id: 204, category: 'Tytuły filmów', emojis: ['🦁', '👑', '🌅'], answer: 'Król Lew', hint: 'Animacja Disneya o Simbie.' },
      { id: 205, category: 'Tytuły filmów', emojis: ['🧙‍♂️', '💍', '🌋'], answer: 'Władca Pierścieni', hint: 'Podróż z jedynym pierścieniem do Mordoru.' },
      { id: 206, category: 'Tytuły filmów', emojis: ['🦇', '👨', '🃏'], answer: 'Mroczny Rycerz', hint: 'Bruce Wayne walczy z Jokerem.' },
      { id: 207, category: 'Tytuły filmów', emojis: ['💊', '🔴', '🔵', '🕶️'], answer: 'Matrix', hint: 'Wybór między prawdą a iluzją.' },
      { id: 208, category: 'Tytuły filmów', emojis: ['🚗', '⏳', '⚡'], answer: 'Powrót do przyszłości', hint: 'Podróż w czasie DeLoreaniem.' },
      { id: 209, category: 'Tytuły filmów', emojis: ['⭐', '⚔️', '🌌'], answer: 'Gwiezdne Wojny', hint: 'Walka jasnej i ciemnej strony Mocy.' },
      { id: 210, category: 'Tytuły filmów', emojis: ['🐼', '🥋', '🍜'], answer: 'Kung Fu Panda', hint: 'Otyły niedźwiedź zostaje mistrzem sztuk walki.' },

      // === BOHATEROWIE KOMIKSOWI ===
      { id: 301, category: 'Bohaterowie komiksowi', emojis: ['🦇', '👨'], answer: 'Batman', hint: 'Rycerz z Gotham.' },
      { id: 302, category: 'Bohaterowie komiksowi', emojis: ['🕷️', '👨', '🕸️'], answer: 'Spiderman', hint: 'Ugryziony przez pajęczaka.' },
      { id: 303, category: 'Bohaterowie komiksowi', emojis: ['⚡', '🏃‍♂️', '🔴'], answer: 'Flash', hint: 'Najszybszy człowiek na Ziemi.' },
      { id: 304, category: 'Bohaterowie komiksowi', emojis: ['🛡️', '⭐', '🇺🇸'], answer: 'Kapitan Ameryka', hint: 'Pierwszy mściciel z tarczą ze vibranium.' },
      { id: 305, category: 'Bohaterowie komiksowi', emojis: ['🤖', '👨', '💰'], answer: 'Iron Man', hint: 'Geniusz, miliarder, filantrop w zbroi.' },
      { id: 306, category: 'Bohaterowie komiksowi', emojis: ['🔨', '⚡', '🧔'], answer: 'Thor', hint: 'Bóg Piorunów z Asgardu.' },
      { id: 307, category: 'Bohaterowie komiksowi', emojis: ['🟢', '😡', '💪'], answer: 'Hulk', hint: 'Zły - zielony i bardzo silny.' },
      { id: 308, category: 'Bohaterowie komiksowi', emojis: ['🐱', '👩', '💎'], answer: 'Kobieta Kot', hint: 'Złodziejka z Gotham, Selina.' },
      { id: 309, category: 'Bohaterowie komiksowi', emojis: ['🏹', '🦅', '🎯'], answer: 'Hawkeye', hint: 'Najlepszy łucznik Avengers.' },
      { id: 310, category: 'Bohaterowie komiksowi', emojis: ['👽', '🦸‍♂️', '☀️', 'S'], answer: 'Superman', hint: 'Człowiek ze stali z planety Krypton.' },

      // === KRAJE ŚWIATA ===
      { id: 401, category: 'Kraje świata', emojis: ['🗼', '🥐', '🍷'], answer: 'Francja', hint: 'Kraj nad Sekwaną.' },
      { id: 402, category: 'Kraje świata', emojis: ['🍝', '🍕', '🏛️'], answer: 'Włochy', hint: 'Państwo w kształcie buta.' },
      { id: 403, category: 'Kraje świata', emojis: ['🗽', '🦅', '🍔'], answer: 'USA', hint: 'Stany zjednoczone...' },
      { id: 404, category: 'Kraje świata', emojis: ['🍣', '🌸', '🗼', '🔴'], answer: 'Japonia', hint: 'Kraj Kwitnącej Wiśni.' },
      { id: 405, category: 'Kraje świata', emojis: ['🦘', '🐨', '🏖️'], answer: 'Australia', hint: 'Kraj i kontynent jednocześnie.' },
      { id: 406, category: 'Kraje świata', emojis: ['🍁', '🏒', '🥞'], answer: 'Kanada', hint: 'Kraj syropu klonowego.' },
      { id: 407, category: 'Kraje świata', emojis: ['🌮', '🌵', '🎉'], answer: 'Meksyk', hint: 'Sąsiad USA na południu.' },
      { id: 408, category: 'Kraje świata', emojis: ['🐪', '🏜️', '🔺'], answer: 'Egipt', hint: 'Kraj piramid i faraonów.' },
      { id: 409, category: 'Kraje świata', emojis: ['🍺', '🥨', '🏰'], answer: 'Niemcy', hint: 'Nasz zachodni sąsiad.' },
      { id: 410, category: 'Kraje świata', emojis: ['🥟', '🦅', '⚪', '🔴'], answer: 'Polska', hint: 'Kraj nad Wisłą.' }
    ] as RebusPuzzle[]
  },
  4: {
    dayOfWeek: 4,
    type: 'quiz',
    title: 'Czwartkowy Quiz',
    description: 'Sprawdź swoją wiedzę w naszym quizie.',
    items: [
      { id: 1, questions: [] },
      { id: 2, questions: [] }
    ]
  },
  5: {
    dayOfWeek: 5,
    type: 'memory',
    title: 'Piątkowe Memory',
    description: 'Znajdź wszystkie pary w jak najkrótszym czasie.',
    items: [
      { id: 1, cards: [] },
      { id: 2, cards: [] }
    ]
  },
  6: {
    dayOfWeek: 6,
    type: 'architect',
    title: 'Sobotnia Zagadka — Architekt',
    description: 'Umieść zbiorniki z gazem przy każdym domku! Zbiorniki nie mogą się stykać.',
    items: [
      {
        id: 1,
        size: 7,
        // Houses positions [row, col] (0-indexed)
        houses: [
          [0, 1], [0, 5],
          [1, 3],
          [2, 0], [2, 6],
          [3, 2], [3, 4],
          [4, 6],
          [5, 1], [5, 3],
          [6, 5]
        ],
        // Number of tanks in each row
        rowClues: [2, 1, 1, 2, 1, 2, 2],
        // Number of tanks in each column
        colClues: [1, 2, 1, 2, 1, 2, 2],
        // Solution tank positions [row, col]
        solution: [
          [0, 0], [0, 6],
          [1, 4],
          [2, 1],
          [3, 3], [3, 5],
          [4, 5],
          [5, 0], [5, 2],
          [6, 4], [6, 6]
        ]
      },
      {
        id: 2,
        size: 8,
        houses: [
          [0, 0], [0, 3], [0, 7],
          [1, 5],
          [2, 1], [2, 3],
          [3, 6],
          [4, 0], [4, 4],
          [5, 2], [5, 7],
          [6, 0], [6, 5],
          [7, 3], [7, 7]
        ],
        rowClues: [2, 2, 2, 1, 2, 1, 2, 3],
        colClues: [2, 1, 2, 2, 1, 2, 2, 3],
        solution: [
          [0, 1], [0, 4],
          [1, 6], [1, 0],
          [2, 2], [2, 4],
          [3, 7],
          [4, 1], [4, 5],
          [5, 3],
          [6, 1], [6, 6],
          [7, 2], [7, 6], [7, 4]
        ]
      }
    ] as ArchitectPuzzle[]
  }
};
