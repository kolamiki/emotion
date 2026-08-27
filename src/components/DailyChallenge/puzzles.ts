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

export interface QuizQuestion {
  id: number;
  category: 'Nauka' | 'Historia' | 'Geografia' | 'Kultura' | 'Technologia';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizPuzzle {
  id: number;
  questions: QuizQuestion[];
}

export interface SudokuPuzzle {
  id: number;
  grid: number[][];
  solution?: number[][];
}

export interface WordsearchPuzzle {
  id: number;
  theme: string;
  grid: string[][];
  words: string[];
}

export interface MemoryPair {
  id: string;
  icon: string;
  name: string;
}

export interface MemoryPuzzle {
  id: number;
  theme: string;
  pairs: MemoryPair[];
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
    description: 'Rozwiąż hasła i odgadnij wszystkie słowa z dziedziny technologii i Internetu!',
    items: [
      {
        id: 1,
        size: { rows: 11, cols: 11 },
        words: [
          { id: 1, number: 1, clue: 'Służy do wpisywania tekstu na komputerze', answer: 'KLAWIATURA', row: 1, col: 5, direction: 'vertical' },
          { id: 2, number: 2, clue: 'Wyświetla obraz z komputera lub telefonu', answer: 'EKRAN', row: 1, col: 4, direction: 'horizontal' },
          { id: 3, number: 3, clue: 'Gryzoń pod ręką gracza lub pracownika biura', answer: 'MYSZKA', row: 3, col: 0, direction: 'horizontal' },
          { id: 4, number: 4, clue: 'Bezprzewodowa sieć lokalna', answer: 'WIFI', row: 4, col: 5, direction: 'horizontal' },
          { id: 5, number: 5, clue: 'System operacyjny, którego maskotką jest pingwin Tux', answer: 'LINUX', row: 5, col: 4, direction: 'horizontal' },
          { id: 6, number: 6, clue: 'Potoczne określenie aplikacji na smartfona', answer: 'APKA', row: 6, col: 5, direction: 'horizontal' },
          { id: 7, number: 7, clue: 'Płaski komputer z ekranem dotykowym', answer: 'TABLET', row: 7, col: 5, direction: 'horizontal' },
          { id: 8, number: 8, clue: 'Uniwersalny port do podłączania akcesoriów', answer: 'USB', row: 8, col: 5, direction: 'horizontal' },
          { id: 9, number: 9, clue: 'Szybka pamięć operacyjna komputera', answer: 'RAM', row: 9, col: 5, direction: 'horizontal' },
          { id: 10, number: 10, clue: 'Sygnał dźwiękowy lub pliki muzyczne', answer: 'AUDIO', row: 10, col: 5, direction: 'horizontal' }
        ]
      },
      {
        id: 2,
        size: { rows: 11, cols: 12 },
        words: [
          { id: 1, number: 1, clue: 'Osoba pisząca kod źródłowy aplikacji', answer: 'PROGRAMISTA', row: 0, col: 4, direction: 'vertical' },
          { id: 2, number: 2, clue: 'Język programowania nazwany na cześć grupy Monty Pythona', answer: 'PYTHON', row: 0, col: 4, direction: 'horizontal' },
          { id: 3, number: 3, clue: 'Urządzenie sieciowe rozdzielające ruch internetowy w domu', answer: 'ROUTER', row: 1, col: 4, direction: 'horizontal' },
          { id: 4, number: 4, clue: 'Obrazy i ilustracje renderowane przez komputer', answer: 'GRAFIKA', row: 3, col: 4, direction: 'horizontal' },
          { id: 5, number: 5, clue: 'Wizerunek lub ikona reprezentująca użytkownika w profilu', answer: 'AVATAR', row: 5, col: 4, direction: 'horizontal' },
          { id: 6, number: 6, clue: 'Globalna sieć komputerowa łącząca cały świat', answer: 'INTERNET', row: 7, col: 4, direction: 'horizontal' },
          { id: 7, number: 7, clue: 'Komputer udostępniający usługi i strony w sieci', answer: 'SERWER', row: 8, col: 4, direction: 'horizontal' }
        ]
      }
    ]
  },
  1: {
    dayOfWeek: 1,
    type: 'sudoku',
    title: 'Poniedziałkowe Sudoku',
    description: 'Wypełnij planszę 9x9 cyframi od 1 do 9 tak, aby nie powtarzały się w wierszu, kolumnie ani bloku 3x3.',
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
        ],
        solution: [
          [5, 3, 4, 6, 7, 8, 9, 1, 2],
          [6, 7, 2, 1, 9, 5, 3, 4, 8],
          [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3],
          [4, 2, 6, 8, 5, 3, 7, 9, 1],
          [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4],
          [2, 8, 7, 4, 1, 9, 6, 3, 5],
          [3, 4, 5, 2, 8, 6, 1, 7, 9]
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
        ],
        solution: [
          [4, 3, 5, 2, 6, 9, 7, 8, 1],
          [6, 8, 2, 5, 7, 1, 4, 9, 3],
          [1, 9, 7, 8, 3, 4, 5, 6, 2],
          [8, 2, 6, 1, 9, 5, 3, 4, 7],
          [3, 7, 4, 6, 8, 2, 9, 1, 5],
          [9, 5, 1, 7, 4, 3, 6, 2, 8],
          [5, 1, 9, 3, 2, 6, 8, 7, 4],
          [2, 4, 8, 9, 5, 7, 1, 3, 6],
          [7, 6, 3, 4, 1, 8, 2, 5, 9]
        ]
      }
    ] as SudokuPuzzle[]
  },
  2: {
    dayOfWeek: 2,
    type: 'wordsearch',
    title: 'Wtorkowa Wykreślanka',
    description: 'Znajdź wszystkie ukryte słowa w gąszczu liter. Słowa mogą biec poziomo, pionowo oraz po skosie (w obu kierunkach)!',
    items: [
      {
        id: 1,
        theme: 'Czas & Podróże w Przyszłość',
        words: ['PRZYSZLOSC', 'ZEGAR', 'MINUTA', 'SEKUNDA', 'CHWILA', 'EPOKA', 'JUTRO', 'CZAS', 'PORTAL', 'WEKTOR'],
        grid: [
          ['P', 'R', 'Z', 'Y', 'S', 'Z', 'L', 'O', 'S', 'C'],
          ['Z', 'S', 'E', 'A', 'M', 'E', 'O', 'E', 'U', 'N'],
          ['E', 'K', 'E', 'P', 'I', 'L', 'A', 'P', 'W', 'P'],
          ['G', 'O', 'D', 'K', 'N', 'A', 'P', 'O', 'E', 'O'],
          ['A', 'J', 'A', 'T', 'U', 'S', 'Z', 'K', 'K', 'R'],
          ['R', 'K', 'U', 'K', 'T', 'N', 'L', 'A', 'T', 'T'],
          ['W', 'I', 'E', 'T', 'A', 'R', 'D', 'Z', 'O', 'A'],
          ['E', 'R', 'A', 'K', 'R', 'Z', 'L', 'A', 'R', 'L'],
          ['M', 'A', 'J', 'A', 'K', 'O', 'C', 'Z', 'A', 'S'],
          ['C', 'H', 'W', 'I', 'L', 'A', 'P', 'O', 'K', 'I']
        ]
      },
      {
        id: 2,
        theme: 'Społeczność eMotion',
        words: ['EMOTION', 'PROFIL', 'AVATAR', 'CZAT', 'LAJK', 'POST', 'GRUPA', 'MEMY', 'FOTO'],
        grid: [
          ['E', 'M', 'O', 'T', 'I', 'O', 'N', 'S', 'P', 'K'],
          ['B', 'A', 'S', 'K', 'O', 'N', 'T', 'O', 'J', 'P'],
          ['C', 'I', 'V', 'L', 'I', 'N', 'K', 'A', 'P', 'R'],
          ['Z', 'O', 'K', 'A', 'D', 'O', 'L', 'A', 'J', 'O'],
          ['A', 'K', 'T', 'Y', 'T', 'O', 'P', 'I', 'P', 'F'],
          ['T', 'A', 'B', 'U', 'L', 'A', 'R', 'E', 'O', 'I'],
          ['S', 'M', 'I', 'L', 'E', 'K', 'R', 'O', 'S', 'L'],
          ['I', 'K', 'E', 'G', 'R', 'U', 'P', 'A', 'T', 'K'],
          ['E', 'C', 'H', 'M', 'A', 'I', 'L', 'G', 'R', 'A'],
          ['C', 'Z', 'A', 'S', 'Y', 'F', 'O', 'T', 'O', 'S']
        ]
      },
      {
        id: 3,
        theme: 'Kosmos & Astronomia',
        words: ['MARS', 'RAKIETA', 'GWIAZDA', 'ORBITA', 'KOMETA', 'LUNA', 'SOLAR', 'NEBULA', 'PLUTON'],
        grid: [
          ['M', 'A', 'R', 'S', 'T', 'E', 'L', 'O', 'P', 'R'],
          ['K', 'O', 'G', 'W', 'I', 'A', 'Z', 'D', 'A', 'A'],
          ['O', 'S', 'M', 'O', 'S', 'U', 'N', 'I', 'N', 'K'],
          ['B', 'R', 'A', 'N', 'E', 'T', 'A', 'P', 'E', 'I'],
          ['L', 'A', 'B', 'K', 'S', 'T', 'R', 'O', 'B', 'E'],
          ['U', 'Z', 'O', 'I', 'E', 'O', 'K', 'O', 'U', 'T'],
          ['N', 'O', 'W', 'M', 'T', 'A', 'L', 'S', 'L', 'A'],
          ['A', 'K', 'O', 'S', 'M', 'A', 'Z', 'A', 'A', 'R'],
          ['S', 'K', 'P', 'L', 'U', 'T', 'O', 'N', 'R', 'Y'],
          ['E', 'K', 'R', 'A', 'N', 'G', 'W', 'I', 'A', 'S']
        ]
      },
      {
        id: 4,
        theme: 'Retro Gry & Komputery',
        words: ['PIXEL', 'ARCADE', 'QUEST', 'MARIO', 'KONSOLA', 'JOYSTICK', 'BOSSY', 'TETRIS'],
        grid: [
          ['G', 'P', 'I', 'X', 'E', 'L', 'S', 'T', 'A', 'R'],
          ['A', 'J', 'O', 'Y', 'K', 'O', 'M', 'P', 'U', 'T'],
          ['R', 'K', 'O', 'L', 'O', 'Q', 'U', 'E', 'S', 'T'],
          ['C', 'I', 'P', 'Y', 'N', 'Y', 'L', 'O', 'G', 'M'],
          ['A', 'L', 'E', 'V', 'S', 'S', 'T', 'A', 'P', 'A'],
          ['D', 'O', 'T', 'S', 'O', 'T', 'T', 'E', 'C', 'R'],
          ['E', 'K', 'O', 'R', 'L', 'A', 'I', 'T', 'E', 'I'],
          ['G', 'B', 'O', 'S', 'A', 'K', 'A', 'C', 'L', 'O'],
          ['T', 'E', 'T', 'R', 'I', 'S', 'L', 'A', 'K', 'A'],
          ['S', 'Z', 'P', 'I', 'E', 'L', 'G', 'R', 'Y', 'P']
        ]
      }
    ] as WordsearchPuzzle[]
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
      { id: 108, category: 'Przysłowia', emojis: ['🏹', '🏹', '🎯'], answer: 'Do trzech razy sztuka', hint: 'Próbuj, próbuj, a za kolejnym razem się uda.' },
      { id: 109, category: 'Przysłowia', emojis: ['🐦', '✋', '🦅', '🏠'], answer: 'Lepszy wróbel w garści niż gołąb na dachu', hint: 'Pewne, małe zyski są lepsze niż niepewne obietnice.' },
      { id: 110, category: 'Przysłowia', emojis: ['😴', '🛏️', '☀️', '🛌'], answer: 'Kto rano wstaje temu Pan Bóg daje', hint: 'Wczesne wstawanie przynosi korzyści.' },

      // === TYTUŁY FILMÓW ===
      { id: 201, category: 'Tytuły filmów', emojis: ['🦁', '👑'], answer: 'Król Lew', hint: 'Klasyk Disneya o Simbie.' },
      { id: 202, category: 'Tytuły filmów', emojis: ['🚢', '🧊', '💔'], answer: 'Titanic', hint: 'Katastrofa wielkiego liniowca.' },
      { id: 203, category: 'Tytuły filmów', emojis: ['💍', '🧙‍♂️', '🌋'], answer: 'Władca Pierścieni', hint: 'Wyprawa do Mordoru.' },
      { id: 204, category: 'Tytuły filmów', emojis: ['👻', '🔫', '🚫'], answer: 'Pogromcy Duchów', hint: 'Kogo zawołasz? Ghostbusters!' },
      { id: 205, category: 'Tytuły filmów', emojis: ['🦖', '🏝️', '🚙'], answer: 'Park Jurajski', hint: 'Dinozaury na wyspie Nublar.' },
      { id: 206, category: 'Tytuły filmów', emojis: ['🕷️', '🧑', '🕸️'], answer: 'Spider-Man', hint: 'Człowiek Pająk ratuje Nowy Jork.' },
      { id: 207, category: 'Tytuły filmów', emojis: ['🍫', '🏭', '🎩'], answer: 'Charlie i fabryka czekolady', hint: 'Willy Wonka i złoty bilet.' },
      { id: 208, category: 'Tytuły filmów', emojis: ['🏴‍☠️', '⚔️', '🦜'], answer: 'Piraci z Karaibów', hint: 'Kapitan Jack Sparrow.' },
      { id: 209, category: 'Tytuły filmów', emojis: ['🦇', '🦸‍♂️', '🌃'], answer: 'Mroczny Rycerz', hint: 'Batman kontra Joker w Gotham.' },
      { id: 210, category: 'Tytuły filmów', emojis: ['👽', '🚲', '🌕'], answer: 'E.T.', hint: 'Kosmita chce zadzwonić do domu.' },

      // === BOHATEROWIE KOMIKSOWI ===
      { id: 301, category: 'Bohaterowie komiksowi', emojis: ['⚡', '🔨', '🌩️'], answer: 'Thor', hint: 'Nordycki bóg piorunów z Avengers.' },
      { id: 302, category: 'Bohaterowie komiksowi', emojis: ['🛡️', '⭐', '🇺🇸'], answer: 'Kapitan Ameryka', hint: 'Pierwszy Avenger z tarczą z vibranium.' },
      { id: 303, category: 'Bohaterowie komiksowi', emojis: ['🤖', '❤️', '🚀'], answer: 'Iron Man', hint: 'Tony Stark w pancerzu.' },
      { id: 304, category: 'Bohaterowie komiksowi', emojis: ['😡', '🟢', '💥'], answer: 'Hulk', hint: 'Naukowiec Bruce Banner, gdy się zdenerwuje.' },
      { id: 305, category: 'Bohaterowie komiksowi', emojis: ['🏹', '🎯', '👁️'], answer: 'Hawkeye', hint: 'Mistrz łuku i strzał z Avengers.' },
      { id: 306, category: 'Bohaterowie komiksowi', emojis: ['🐱', '🦹‍♀️', '💎'], answer: 'Kobieta Kot', hint: 'Zwinna złodziejka z Gotham.' },
      { id: 307, category: 'Bohaterowie komiksowi', emojis: ['🏃‍♂️', '⚡', '🔴'], answer: 'Flash', hint: 'Najszybszy człowiek na Ziemi.' },
      { id: 308, category: 'Bohaterowie komiksowi', emojis: ['🔱', '🌊', '🐟'], answer: 'Aquaman', hint: 'Król Atlantydy.' },
      { id: 309, category: 'Bohaterowie komiksowi', emojis: ['🃏', '🤡', '🃏'], answer: 'Joker', hint: 'Książę Zbrodni i wróg Batmana.' },
      { id: 310, category: 'Bohaterowie komiksowi', emojis: ['🦝', '🔫', '🚀'], answer: 'Rocket Raccoon', hint: 'Kosmiczny szop ze Strażników Galaktyki.' },

      // === KRAJE ŚWIATA ===
      { id: 401, category: 'Kraje świata', emojis: ['🍕', '👢', '🏛️'], answer: 'Włochy', hint: 'Kraj w kształcie buta, stolica Rzym.' },
      { id: 402, category: 'Kraje świata', emojis: ['🗼', '🥖', '🥐'], answer: 'Francja', hint: 'Kraj z Wieżą Eiffla i stolicą w Paryżu.' },
      { id: 403, category: 'Kraje świata', emojis: ['🍣', '🗾', '🗻'], answer: 'Japonia', hint: 'Kraj Kwitnącej Wiśni z górą Fudżi.' },
      { id: 404, category: 'Kraje świata', emojis: ['🦘', '🐨', '🏄‍♂️'], answer: 'Australia', hint: 'Kraj i kontynent z kangurami.' },
      { id: 405, category: 'Kraje świata', emojis: ['🍁', '🏒', '🐻'], answer: 'Kanada', hint: 'Kraj z liściem klonowym na fladze.' },
      { id: 406, category: 'Kraje świata', emojis: ['🌮', '🌵', '🎉'], answer: 'Meksyk', hint: 'Kraj sombrero, tacos i mariachi.' },
      { id: 407, category: 'Kraje świata', emojis: ['⚽', '💃', '🌴'], answer: 'Brazylia', hint: 'Kraj samby, karnawału i Amazonii.' },
      { id: 408, category: 'Kraje świata', emojis: ['🫖', '👑', '🌧️'], answer: 'Wielka Brytania', hint: 'Kraj z Big Benem i rodziną królewską.' },
      { id: 409, category: 'Kraje świata', emojis: ['🪆', '❄️', '🐻'], answer: 'Rosja', hint: 'Kraj matrioszek i Syberii.' },
      { id: 410, category: 'Kraje świata', emojis: ['🥟', '🦅', '🏰'], answer: 'Polska', hint: 'Nasz kraj nad Wisłą!' }
    ] as RebusPuzzle[]
  },
  4: {
    dayOfWeek: 4,
    type: 'quiz',
    title: 'Czwartkowy Quiz Wiedzy',
    description: 'Odpowiedz poprawnie na 10 pytań z różnych dziedzin. Błędna odpowiedź dodaje +30s kary! Możesz użyć koła ratunkowego 50/50 (+15s).',
    items: [
      {
        id: 1,
        questions: [
          // === NAUKA ===
          { id: 101, category: 'Nauka', question: 'Jaki pierwiastek chemiczny ma symbol "Au"?', options: ['Srebro', 'Złoto', 'Aluminium', 'Argon'], correctIndex: 1, explanation: 'Symbol "Au" pochodzi od łacińskiego słowa "aurum", oznaczającego złoto.' },
          { id: 102, category: 'Nauka', question: 'Ile kości ma dorosły człowiek?', options: ['186', '206', '256', '300'], correctIndex: 1, explanation: 'Dorosły człowiek ma 206 kości. Noworodek ma ich około 270, lecz część zrasta się z wiekiem.' },
          { id: 103, category: 'Nauka', question: 'Jaka jest największa planeta w Układzie Słonecznym?', options: ['Saturn', 'Neptun', 'Jowisz', 'Uran'], correctIndex: 2, explanation: 'Jowisz jest największą planetą Układu Słonecznego — jego masa jest ponad 2,5 razy większa niż masa wszystkich pozostałych planet razem wziętych.' },
          { id: 104, category: 'Nauka', question: 'Jaka jest przybliżona prędkość światła w próżni?', options: ['300 000 km/s', '150 000 km/s', '1 000 000 km/s', '30 000 km/s'], correctIndex: 0, explanation: 'Prędkość światła w próżni wynosi dokładnie 299 792 458 m/s, czyli w zaokrągleniu 300 000 km/s.' },

          // === HISTORIA ===
          { id: 201, category: 'Historia', question: 'W którym roku Kolumb dopłynął do Ameryki?', options: ['1492', '1498', '1502', '1488'], correctIndex: 0, explanation: 'Krzysztof Kolumb dotarł do wyspy San Salvador na Bahamach 12 października 1492 roku.' },
          { id: 202, category: 'Historia', question: 'W którym roku odbyła się bitwa pod Grunwaldem?', options: ['1385', '1410', '1444', '1525'], correctIndex: 1, explanation: 'Bitwa pod Grunwaldem miała miejsce 15 lipca 1410 roku pomiędzy wojskami polsko-litewskimi a Zakonem Krzyżackim.' },
          { id: 203, category: 'Historia', question: 'W którym roku uchwalono w Polsce Konstytucję 3 Maja?', options: ['1772', '1791', '1794', '1795'], correctIndex: 1, explanation: 'Konstytucja 3 Maja została uchwalona w 1791 roku jako pierwsza w Europie i druga na świecie nowoczesna konstytucja.' },

          // === GEOGRAFIA ===
          { id: 301, category: 'Geografia', question: 'Która rzeka jest najdłuższa na świecie?', options: ['Nil', 'Amazonka', 'Jangcy', 'Missisipi'], correctIndex: 1, explanation: 'Według najnowszych badań satelitarnych Amazonka (ok. 6992 km) jest najdłuższą rzeką świata, wyprzedzając Nil (ok. 6853 km).' },
          { id: 302, category: 'Geografia', question: 'Który kraj ma najwięcej stref czasowych?', options: ['USA', 'Chiny', 'Rosja', 'Australia'], correctIndex: 2, explanation: 'Rosja obejmuje aż 11 stref czasowych rozciągających się od Kaliningradu po Kamczatkę.' },
          { id: 303, category: 'Geografia', question: 'Jaki jest najmniejszy niepodległy kraj na świecie?', options: ['Monako', 'San Marino', 'Watykan', 'Liechtenstein'], correctIndex: 2, explanation: 'Watykan zajmuje powierzchnię zaledwie 0,44 km² i jest najmniejszym państwem świata.' },

          // === KULTURA ===
          { id: 401, category: 'Kultura', question: 'Kto namalował "Gwiaździstą noc"?', options: ['Claude Monet', 'Pablo Picasso', 'Vincent van Gogh', 'Salvador Dalí'], correctIndex: 2, explanation: 'Vincent van Gogh namalował "Gwiaździstą noc" w 1889 roku podczas pobytu w szpitalu psychiatrycznym.' },
          { id: 402, category: 'Kultura', question: 'Ile symfonii skomponował Beethoven?', options: ['5', '7', '9', '12'], correctIndex: 2, explanation: 'Ludwig van Beethoven skomponował 9 symfonii. Ostatnia, IX, zawiera słynną "Odę do radości".' },
          { id: 403, category: 'Kultura', question: 'Kto napisał "Zbrodnię i karę"?', options: ['Lew Tołstoj', 'Fiodor Dostojewski', 'Anton Czechow', 'Mikołaj Gogol'], correctIndex: 1, explanation: 'Fiodor Dostojewski opublikował "Zbrodnię i karę" w 1866 roku.' },
          { id: 404, category: 'Kultura', question: 'W którym mieście znajduje się Sagrada Familia?', options: ['Madryt', 'Lizbona', 'Barcelona', 'Rzym'], correctIndex: 2, explanation: 'Sagrada Familia to bazylika w Barcelonie zaprojektowana przez Antoniego Gaudíego, budowana od 1882 roku.' },

          // === TECHNOLOGIA ===
          { id: 501, category: 'Technologia', question: 'W którym roku powstał pierwszy iPhone?', options: ['2005', '2007', '2009', '2010'], correctIndex: 1, explanation: 'Pierwszy iPhone został zaprezentowany przez Steve\'a Jobsa 9 stycznia 2007 roku.' },
          { id: 502, category: 'Technologia', question: 'Kto jest twórcą Linuxa?', options: ['Bill Gates', 'Steve Wozniak', 'Linus Torvalds', 'Dennis Ritchie'], correctIndex: 2, explanation: 'Linus Torvalds stworzył jądro Linux w 1991 roku, będąc studentem w Finlandii.' },
          { id: 503, category: 'Technologia', question: 'Co oznacza skrót HTML?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Multi Language'], correctIndex: 0, explanation: 'HTML to HyperText Markup Language — język znaczników do tworzenia stron internetowych.' },
          { id: 504, category: 'Technologia', question: 'Ile bitów ma jeden bajt?', options: ['4', '8', '16', '32'], correctIndex: 1, explanation: 'Jeden bajt składa się z 8 bitów. To podstawowa jednostka informacji w informatyce.' }
        ] as QuizQuestion[]
      }
    ] as QuizPuzzle[]
  },
  5: {
    dayOfWeek: 5,
    type: 'memory',
    title: 'Piątkowe Memory',
    description: 'Odszukaj wszystkie pasujące pary kart w jak najmniejszej liczbie ruchów!',
    items: [
      {
        id: 1,
        theme: 'Czas & Technologia',
        pairs: [
          { id: 'p1', icon: '🚀', name: 'Rakieta' },
          { id: 'p2', icon: '💡', name: 'Pomysł' },
          { id: 'p3', icon: '🎨', name: 'Design' },
          { id: 'p4', icon: '💻', name: 'Kod' },
          { id: 'p5', icon: '⏳', name: 'Czas' },
          { id: 'p6', icon: '⚡', name: 'Energia' },
          { id: 'p7', icon: '🔒', name: 'Bezpieczeństwo' },
          { id: 'p8', icon: '💎', name: 'Kryształ' }
        ]
      },
      {
        id: 2,
        theme: 'Cyfrowy Świat',
        pairs: [
          { id: 'm1', icon: '📱', name: 'Smartfon' },
          { id: 'm2', icon: '💬', name: 'Wiadomość' },
          { id: 'm3', icon: '🎮', name: 'Gry' },
          { id: 'm4', icon: '🎧', name: 'Muzyka' },
          { id: 'm5', icon: '📷', name: 'Aparat' },
          { id: 'm6', icon: '☕', name: 'Kawa' },
          { id: 'm7', icon: '🔥', name: 'Trendy' },
          { id: 'm8', icon: '🏆', name: 'Puchar' }
        ]
      }
    ] as MemoryPuzzle[]
  },
  6: {
    dayOfWeek: 6,
    type: 'architect',
    title: 'Sobotnia Zagadka — Bombowa Szkoła',
    description: 'Rajciu! Jakiś nicpoń podłożył bomby w pobliskich szkołach i grozi ich wysadzeniem. Na szczęście zdobyłeś plany rozmieszczenia ładunków, dzięki czemu wiesz ile bomb jest w każdym rzędzie oraz kolumnie. Wskaż miejsca bomb i przekaż je saperom. Pamiętaj, że terrorysta działał zgodnie z zasadami BHP i ułożył ładunki tak, aby nie mogły się stykać.',
    items: [
      {
        id: 1,
        size: 7,
        houses: [
          [0, 1], [0, 5],
          [1, 3],
          [2, 0], [2, 6],
          [3, 2], [3, 4],
          [4, 6],
          [5, 1], [5, 3],
          [6, 5]
        ],
        rowClues: [2, 1, 1, 2, 1, 2, 2],
        colClues: [1, 2, 1, 2, 1, 2, 2],
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
