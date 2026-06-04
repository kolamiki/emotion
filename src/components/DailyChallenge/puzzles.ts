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
      { id: 1, words: ['PRIMECO', 'PROFESOR', 'PRZYSZŁOŚĆ', 'DŁUGOPIS', 'CZAS', 'NAUKA',] },
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
      { id: 108, category: 'Przysłowia', emojis: ['🏹', '🏹', '🎯'], answer: 'Do trzech razu sztuka', hint: 'Próbuj, próbuj, a za kolejnym razem się uda.' },
      { id: 109, category: 'Przysłowia', emojis: ['🐦', '✋', '🦅', '🏠'], answer: 'Lepszy wróbel w garści niż gołąb na dachu', hint: 'Pewne, małe zyski są lepsze niż niepewne obietnice.' },
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
      { id: 311, category: 'Bohaterowie komiksowi', emojis: ['🥼', '🕶️', '🐶',], answer: 'Doc Behrmann', hint: 'Niemiecki naukowiec, lubiący psy.' },

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
    description: 'Odpowiedz na 10 pytań jak najszybciej! Błędna odpowiedź +30s, podpowiedź 50/50 +15s.',
    items: [
      {
        id: 1,
        questions: [
          // === NAUKA ===
          { id: 101, category: 'Nauka', question: 'Jaki pierwiastek chemiczny ma symbol "Au"?', options: ['Srebro', 'Złoto', 'Aluminium', 'Argon'], correctIndex: 1, explanation: 'Au pochodzi od łacińskiego "aurum", oznaczającego złoto.' },
          { id: 102, category: 'Nauka', question: 'Ile kości ma dorosły człowiek?', options: ['186', '206', '226', '256'], correctIndex: 1, explanation: 'Dorosły człowiek posiada 206 kości. Noworodki mają ich około 270, ale niektóre zrastają się z wiekiem.' },
          { id: 103, category: 'Nauka', question: 'Która planeta Układu Słonecznego jest największa?', options: ['Saturn', 'Neptun', 'Jowisz', 'Uran'], correctIndex: 2, explanation: 'Jowisz jest największą planetą — mieści się w nim ponad 1300 Ziem.' },
          { id: 104, category: 'Nauka', question: 'Co mierzy skala Richtera?', options: ['Siłę wiatru', 'Siłę trzęsień ziemi', 'Temperaturę', 'Ciśnienie atmosferyczne'], correctIndex: 1, explanation: 'Skala Richtera mierzy magnitudę (energię) trzęsień ziemi.' },
          { id: 105, category: 'Nauka', question: 'Jaki gaz stanowi największą część atmosfery Ziemi?', options: ['Tlen', 'Azot', 'Dwutlenek węgla', 'Argon'], correctIndex: 1, explanation: 'Azot stanowi około 78% atmosfery Ziemi.' },

          // === HISTORIA ===
          { id: 201, category: 'Historia', question: 'W którym roku Kolumb dotarł do Ameryki?', options: ['1482', '1492', '1502', '1512'], correctIndex: 1, explanation: 'Krzysztof Kolumb dopłynął do Ameryki 12 października 1492 roku.' },
          { id: 202, category: 'Historia', question: 'Kto był pierwszym człowiekiem na Księżycu?', options: ['Buzz Aldrin', 'Jurij Gagarin', 'Neil Armstrong', 'John Glenn'], correctIndex: 2, explanation: 'Neil Armstrong postawił stopę na Księżycu 20 lipca 1969 roku w ramach misji Apollo 11.' },
          { id: 203, category: 'Historia', question: 'W którym roku odbyła się Bitwa pod Grunwaldem?', options: ['1385', '1410', '1444', '1466'], correctIndex: 1, explanation: 'Bitwa pod Grunwaldem miała miejsce 15 lipca 1410 roku — jedno z najważniejszych starć w historii Polski.' },
          { id: 204, category: 'Historia', question: 'Który faraon kazał zbudować Wielką Piramidę w Gizie?', options: ['Tutanchamon', 'Ramzes II', 'Cheops', 'Amenhotep III'], correctIndex: 2, explanation: 'Wielka Piramida w Gizie została zbudowana ok. 2560 r. p.n.e. dla faraona Cheopsa (Chufu).' },
          { id: 205, category: 'Historia', question: 'Jak nazywał się ostatni król Polski?', options: ['Jan III Sobieski', 'Stanisław August Poniatowski', 'Zygmunt III Waza', 'August III Sas'], correctIndex: 1, explanation: 'Stanisław August Poniatowski (1732–1798) był ostatnim królem Rzeczypospolitej.' },

          // === GEOGRAFIA ===
          { id: 301, category: 'Geografia', question: 'Jaka jest stolica Australii?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2, explanation: 'Stolicą Australii jest Canberra, nie Sydney — wiele osób myli te dwa miasta.' },
          { id: 302, category: 'Geografia', question: 'Jaka jest najdłuższa rzeka świata?', options: ['Amazonka', 'Nil', 'Jangcy', 'Missisipi'], correctIndex: 1, explanation: 'Nil ma długość ok. 6 650 km. Choć Amazonka bywa uznawana za najdłuższą — zależy od metodologii pomiaru.' },
          { id: 303, category: 'Geografia', question: 'W ilu strefach czasowych leży Rosja?', options: ['7', '9', '11', '13'], correctIndex: 2, explanation: 'Rosja rozciąga się na 11 stref czasowych — od Kaliningradu po Kamczatkę.' },
          { id: 304, category: 'Geografia', question: 'Który ocean jest najmniejszy?', options: ['Indyjski', 'Atlantycki', 'Arktyczny', 'Południowy'], correctIndex: 2, explanation: 'Ocean Arktyczny (Lodowaty Północny) ma powierzchnię ok. 14 mln km² — to najmniejszy z pięciu oceanów.' },
          { id: 305, category: 'Geografia', question: 'Jak nazywa się najwyższy szczyt Afryki?', options: ['Mont Blanc', 'Kilimandżaro', 'Elbrus', 'Aconcagua'], correctIndex: 1, explanation: 'Kilimandżaro (5 895 m n.p.m.) to najwyższy szczyt kontynentu afrykańskiego, położony w Tanzanii.' },

          // === KULTURA ===
          { id: 401, category: 'Kultura', question: 'Kto namalował "Gwiaździstą noc"?', options: ['Claude Monet', 'Pablo Picasso', 'Vincent van Gogh', 'Salvador Dalí'], correctIndex: 2, explanation: 'Vincent van Gogh namalował "Gwiaździstą noc" w 1889 roku podczas pobytu w szpitalu psychiatrycznym.' },
          { id: 402, category: 'Kultura', question: 'Ile symfonii skomponował Beethoven?', options: ['5', '7', '9', '12'], correctIndex: 2, explanation: 'Ludwig van Beethoven skomponował 9 symfonii. Ostatnia, IX, zawiera słynną "Odę do radości".' },
          { id: 403, category: 'Kultura', question: 'Kto napisał "Zbrodnię i karę"?', options: ['Lew Tołstoj', 'Fiodor Dostojewski', 'Anton Czechow', 'Mikołaj Gogol'], correctIndex: 1, explanation: 'Fiodor Dostojewski opublikował "Zbrodnię i karę" w 1866 roku.' },
          { id: 404, category: 'Kultura', question: 'W którym mieście znajduje się Sagrada Familia?', options: ['Madryt', 'Lizbona', 'Barcelona', 'Rzym'], correctIndex: 2, explanation: 'Sagrada Familia to bazylika w Barcelonii zaprojektowana przez Antoniego Gaudíego, budowana od 1882 roku.' },
          { id: 405, category: 'Kultura', question: 'Który film jako pierwszy w historii zdobył Oscara za najlepszy film?', options: ['Skrzydła', 'Metropolis', 'Śpiewak jazzbandu', 'Wschód słońca'], correctIndex: 0, explanation: '"Skrzydła" (1927) — niemy film wojenny — zdobyły pierwszego Oscara za najlepszy film w 1929 roku.' },

          // === TECHNOLOGIA ===
          { id: 501, category: 'Technologia', question: 'W którym roku powstał pierwszy iPhone?', options: ['2005', '2007', '2009', '2010'], correctIndex: 1, explanation: 'Pierwszy iPhone został zaprezentowany przez Steve\'a Jobsa 9 stycznia 2007 roku.' },
          { id: 502, category: 'Technologia', question: 'Kto jest twórcą Linuxa?', options: ['Bill Gates', 'Steve Wozniak', 'Linus Torvalds', 'Dennis Ritchie'], correctIndex: 2, explanation: 'Linus Torvalds stworzył jądro Linux w 1991 roku, będąc studentem w Finlandii.' },
          { id: 503, category: 'Technologia', question: 'Co oznacza skrót HTML?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Multi Language'], correctIndex: 0, explanation: 'HTML to HyperText Markup Language — język znaczników do tworzenia stron internetowych.' },
          { id: 504, category: 'Technologia', question: 'Która firma stworzyła język programowania Java?', options: ['Microsoft', 'Sun Microsystems', 'IBM', 'Apple'], correctIndex: 1, explanation: 'Java została stworzona przez Jamesa Goslinga w Sun Microsystems i wydana w 1995 roku.' },
          { id: 505, category: 'Technologia', question: 'Ile bitów ma jeden bajt?', options: ['4', '8', '16', '32'], correctIndex: 1, explanation: 'Jeden bajt składa się z 8 bitów. To podstawowa jednostka informacji w informatyce.' }
        ] as QuizQuestion[]
      }
    ] as QuizPuzzle[]
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
    title: 'Sobotnia Zagadka — Bombowa Szkoła',
    description: 'Rajciu! Jakiś nicpoń podłożył bomby w pobliskich szkołach i grozi ich wysadzeniem. Na szczęście zdobyłeś plany rozmieszczenia ładunków, dzięki czemu wiesz ile bomb jest w każdym rzędzie oraz kolumnie. Wskaż miejsca bomb i przekaż je saperom. Pamiętaj, że terrorysta działał zgodnie z zasadami BHP i ułożył ładunki tak, aby nie mogły się stykać.',
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
