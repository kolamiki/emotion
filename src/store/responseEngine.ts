import type { AppAction, ResponseOption, PostCommentResponseOption, Message, Comment, Sentiment, Topic, ContextAnalysis, Group, User, MessageThread } from '../types';
import { hasAIPersonality, getAIPersonality, fetchAIResponse, fetchAIPostComment } from '../services/aiChatService';
import { responsesData, usersData, groupsData } from '../mockData';

type Dispatch = React.Dispatch<AppAction>;

const responses = responsesData as {
  chatResponses: {
    id: string;
    participantId: string;
    triggers: string[];
    responses: ResponseOption[];
  }[];
  postCommentResponses: {
    id: string;
    triggers: string[];
    responses: PostCommentResponseOption[];
  }[];
  fallbackResponses: {
    chat: Record<string, ResponseOption[]>;
    postComments: PostCommentResponseOption[];
  };
};

const allUsers = usersData.allUsers;

/* ============================================
   CONTEXT ANALYSIS ENGINE
   ============================================ */

// Emoji sentiment mapping
const emojiSentiments: Record<string, Sentiment> = {
  '😊': 'positive', '😄': 'positive', '🎉': 'positive', '👍': 'positive',
  '🔥': 'positive', '💪': 'positive', '✨': 'positive', '🌟': 'positive',
  '❤️': 'positive', '💕': 'positive', '🥰': 'positive', '🤩': 'positive',
  '👏': 'positive', '🙌': 'positive', '💯': 'positive', '🚀': 'positive',
  '🎯': 'positive', '⭐': 'positive', '🏆': 'positive', '✅': 'positive',
  '😔': 'negative', '😢': 'negative', '😞': 'negative', '💔': 'negative',
  '😡': 'negative', '🤬': 'negative', '😤': 'negative', '😰': 'negative',
  '😩': 'negative', '🥺': 'negative', '😫': 'negative', '👎': 'negative',
  '😂': 'funny', '🤣': 'funny', '😅': 'funny', '😆': 'funny',
  '🤪': 'funny', '😜': 'funny', '🤡': 'funny', '💀': 'funny',
  '🤔': 'question', '❓': 'question', '🧐': 'question',
};

// Keyword → sentiment mapping
const sentimentKeywords: Record<string, Sentiment> = {
  // Positive
  'super': 'positive', 'świetnie': 'positive', 'fajnie': 'positive',
  'piękne': 'positive', 'wspaniale': 'positive', 'brawo': 'positive',
  'genialnie': 'positive', 'rewelacja': 'positive', 'fantastycznie': 'positive',
  'kocham': 'positive', 'uwielbiam': 'positive', 'wow': 'positive',
  'niesamowite': 'positive', 'cudownie': 'positive', 'idealnie': 'positive',
  'udalo': 'positive', 'sukces': 'positive', 'gratulacje': 'positive',
  'dzieki': 'positive', 'dziekuje': 'positive', 'podziekowania': 'positive',
  // Negative
  'problem': 'negative', 'nie dziala': 'negative', 'blad': 'negative',
  'zle': 'negative', 'trudno': 'negative', 'stres': 'negative',
  'zmeczony': 'negative', 'zmeczona': 'negative', 'frustracja': 'negative',
  'nie moge': 'negative', 'nie wiem': 'negative', 'pomoc': 'negative',
  'nie rozumiem': 'negative', 'kiepsko': 'negative', 'tragedia': 'negative',
  'beznadziejne': 'negative', 'slabo': 'negative', 'smutne': 'negative',
  'martwi': 'negative', 'boli': 'negative',
  // Funny
  'haha': 'funny', 'lol': 'funny', 'xd': 'funny', 'smiesz': 'funny',
  'zabawne': 'funny', 'hehe': 'funny', 'rotfl': 'funny',
  // Vulgar
  'kurwa': 'vulgar', 'cholera': 'vulgar', 'ja pierdole': 'vulgar', 'jebac': 'vulgar',
  'chuj': 'vulgar', 'dupa': 'vulgar', 'kurde': 'vulgar', 'no kurde': 'vulgar', 'kurwa mać': 'vulgar',
  'jebany': 'vulgar', 'zjebany': 'vulgar', 'kurwiac': 'vulgar', 'kurwica': 'vulgar', 'spierdalaj': 'vulgar',
  'cipa': 'vulgar', 'jebanie': 'vulgar'
};

// Keyword → topic mapping
const topicKeywords: Record<string, Topic> = {
  // Tech
  'programuj': 'tech', 'kod': 'tech', 'react': 'tech', 'typescript': 'tech',
  'javascript': 'tech', 'bug': 'tech', 'deploy': 'tech', 'developer': 'tech',
  'frontend': 'tech', 'backend': 'tech', 'api': 'tech', 'baza danych': 'tech',
  'python': 'tech', 'node': 'tech', 'git': 'tech', 'docker': 'tech',
  'css': 'tech', 'html': 'tech', 'framework': 'tech', 'biblioteka': 'tech',
  'plugin': 'tech', 'vscode': 'tech', 'kompilator': 'tech', 'debugger': 'tech',
  'algorytm': 'tech', 'serwer': 'tech', 'hosting': 'tech', 'linux': 'tech',
  'open source': 'tech', 'code review': 'tech', 'pull request': 'tech',
  // Sport
  'trening': 'sport', 'bieganie': 'sport', 'sport': 'sport', 'silownia': 'sport',
  'gym': 'sport', 'bieg': 'sport', 'gory': 'sport', 'tatry': 'sport',
  'rower': 'sport', 'plywanie': 'sport', 'mecz': 'sport', 'fitness': 'sport',
  'yoga': 'sport', 'joga': 'sport', 'maratón': 'sport', 'spacer': 'sport',
  // Food
  'jedzenie': 'food', 'restauracja': 'food', 'obiad': 'food', 'kolacja': 'food',
  'jesc': 'food', 'kawa': 'food', 'kawiarnia': 'food', 'gotowanie': 'food',
  'przepis': 'food', 'sniadanie': 'food', 'pizza': 'food', 'sushi': 'food',
  'ciasto': 'food', 'deser': 'food', 'herbata': 'food',
  // Travel
  'podroz': 'travel', 'wakacje': 'travel', 'wyjazd': 'travel', 'miasto': 'travel',
  'lot': 'travel', 'zwiedzanie': 'travel', 'samolot': 'travel', 'plaze': 'travel',
  'hotel': 'travel', 'hostel': 'travel', 'kraj': 'travel', 'zagranica': 'travel',
  // Work
  'projekt': 'work', 'praca': 'work', 'robota': 'work', 'zadanie': 'work',
  'spotkanie': 'work', 'deadline': 'work', 'szef': 'work', 'zespol': 'work',
  'kariera': 'work', 'awans': 'work', 'firma': 'work', 'klient': 'work',
  // Mood
  'jak sie masz': 'mood', 'co slychac': 'mood', 'co tam': 'mood', 'co u ciebie': 'mood',
  'nastroj': 'mood', 'humor': 'mood', 'samopoczucie': 'mood', 'czuje sie': 'mood',
  // Design
  'design': 'design', 'grafika': 'design', 'ui': 'design', 'ux': 'design',
  'figma': 'design', 'kolory': 'design', 'font': 'design', 'typografia': 'design',
  'ikona': 'design', 'logo': 'design', 'mockup': 'design',
  // Music
  'muzyka': 'music', 'piosenka': 'music', 'album': 'music', 'koncert': 'music',
  'gitara': 'music', 'spotify': 'music', 'playlista': 'music',
  // Games
  'gra': 'games', 'gramy': 'games', 'planszowki': 'games', 'gloomhaven': 'games',
  'gry': 'games', 'gaming': 'games', 'steam': 'games',
};

/**
 * Normalize text for keyword matching:
 * - lowercase
 * - strip Polish diacritics
 * - trim
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .trim();
}

/**
 * Analyze the context of a user message: detect sentiment, topics, keywords.
 */
export function analyzeContext(text: string): ContextAnalysis {
  const normalized = normalize(text);

  // Detect sentiment from emojis
  let emojiSentiment: Sentiment | null = null;
  for (const [emoji, sent] of Object.entries(emojiSentiments)) {
    if (text.includes(emoji)) {
      emojiSentiment = sent;
      break;
    }
  }

  // Detect sentiment from keywords
  let keywordSentiment: Sentiment | null = null;
  let sentimentScore = 0;
  for (const [keyword, sent] of Object.entries(sentimentKeywords)) {
    const normalizedKeyword = normalize(keyword);
    if (normalized.includes(normalizedKeyword)) {
      if (normalizedKeyword.length > sentimentScore) {
        sentimentScore = normalizedKeyword.length;
        keywordSentiment = sent;
      }
    }
  }

  // Question mark detection
  const isQuestion = text.includes('?');

  // Final sentiment priority: emoji > keyword > question > neutral
  let sentiment: Sentiment = 'neutral';
  if (emojiSentiment) sentiment = emojiSentiment;
  else if (keywordSentiment) sentiment = keywordSentiment;
  else if (isQuestion) sentiment = 'question';

  // Detect topics
  const topics: Topic[] = [];
  const detectedKeywords: string[] = [];
  for (const [keyword, topic] of Object.entries(topicKeywords)) {
    const normalizedKeyword = normalize(keyword);
    if (normalized.includes(normalizedKeyword)) {
      if (!topics.includes(topic)) {
        topics.push(topic);
      }
      detectedKeywords.push(keyword);
    }
  }

  if (topics.length === 0) topics.push('general');

  return {
    sentiment,
    topics,
    keywords: detectedKeywords,
    hasEmoji: /[\u{1F300}-\u{1FAFF}]/u.test(text) || Object.keys(emojiSentiments).some(e => text.includes(e)),
  };
}

/* ============================================
   CONTEXTUAL RESPONSE TEMPLATES
   ============================================ */

// Templates that reference user content - {{keyword}} is replaced with extracted topic keywords
const contextualChatTemplates: Record<string, Record<Sentiment, string[]>> = {
  'u2': { // Anna
    positive: [
      'Tak się cieszę! 😊 To fantastyczna wiadomość!',
      'Uwielbiam to! Twój entuzjazm jest zaraźliwy ✨',
      'Wow, naprawdę super! Opowiedz mi więcej! 🌟',
      'Niesamowite! Tak się cieszę razem z Tobą! 💕',
    ],
    negative: [
      'Ojej, współczuję 🥺 Daj znać jak mogę pomóc!',
      'Hej, głowa do góry! Jutro będzie lepiej, obiecuję 💛',
      'Rozumiem jak się czujesz... Chcesz o tym pogadać? 🫂',
      'To brzmi trudne... Pamiętaj, jestem tu dla Ciebie! ❤️',
    ],
    neutral: [
      'Hmm, ciekawe! Opowiedz mi więcej 😊',
      'O, to interesujące! Muszę się nad tym zastanowić 🤔',
      'Rozumiem! A co dalej planujesz z tym? ✨',
    ],
    funny: [
      'Hahaha, padłam! 😂 Masz świetne poczucie humoru!',
      'Nie mogę! 🤣 Muszę to komuś opowiedzieć!',
      'Haha, uwielbiam Twój humor! Zawsze mnie rozbawisz 😄',
    ],
    question: [
      'Hmm, dobre pytanie! Myślę, że... no właśnie, trzeba to przemyśleć 🤔',
      'O, to ciekawe pytanie! Daj mi chwilę, zastanowię się 💭',
      'Wow, nikt mnie jeszcze o to nie zapytał! Myślę, że mogę pomóc 😊',
    ],
    vulgar: [
      "Możesz trochę grzeczniej?",
      "Nie zapominaj z kim rozmawiasz?",
    ],
  },
  'u3': { // Piotr
    positive: [
      'No, brawo! 💪 Wiedziałem, że dasz radę!',
      'Super stary! To jest to! 🤙',
      'Niezłe! Szacunek! 👊',
    ],
    negative: [
      'Ej, spoko, każdemu się zdarza. Dasz radę! 💪',
      'No weź, nie dramatyzuj. Chodź lepiej na trening, wybijesz to z głowy 🏃‍♂️',
      'Luz, od tego są kumple żeby pomóc. Pisz co trzeba 🤙',
    ],
    neutral: [
      'Spoko, rozumiem 👍',
      'No ok. Co dalej? 🤙',
      'Aha, jasne. A w weekend co robisz? 😎',
    ],
    funny: [
      'Hahaha! Dobra, dobre 😂',
      'Heh, niezłe! 😎',
      'Stary, padłem 🤣💀',
    ],
    question: [
      'Hmm, daj pomyślę... 🤔 A wiesz co, zapytaj może na grupie!',
      'Dobre pytanie! Nie wiem, ale chętnie się dowiem razem z Tobą 🧐',
      'No nie wiem stary, ale sprawdź to w necie! 🤙',
    ],
    vulgar: [
      "Mówiłeś coś?",
      "A niech cie szlag",
    ],
  },
  'u4': { // Kasia
    positive: [
      'Aww, to piękne! 🥰 Inspirujesz mnie!',
      'Wow, uwielbiam! To daje mi masę pomysłów ✨🎨',
      'Super! Muszę Ci coś pokazać, co właśnie robię - pasuje idealnie! 🌟',
    ],
    negative: [
      'Ojej... Chcesz żebym Ci narysowała coś na pocieszenie? 🎨💛',
      'Hej, przytulam wirtualnie! 🤗 Będzie dobrze!',
      'Rozumiem... Czasem kreatywny kryzys pomaga w znalezieniu nowej drogi ✨',
    ],
    neutral: [
      'O, ciekawe! To mi daje pomysł na nowy projekt 🎨',
      'Hmm, fascynujące! Chcesz zobaczyć jak to wyglądałoby wizualnie? ✨',
      'Super! Uwielbiam takie rozmowy 🌟',
    ],
    funny: [
      'Hahaha! 😂 Muszę to narysować!',
      'Padłam! 🤣 Czekaj, robię mema z tego!',
      'Nie mogę! 😂✨ Totalnie mnie rozbawiłeś!',
    ],
    question: [
      'Hmm, to jest super pytanie! Z perspektywy designera... 🤔🎨',
      'O, dobre pytanie! Właśnie o czymś takim myślałam! ✨',
      'Wiesz co, to zależy od kontekstu, ale mogę pomóc to przemyśleć! 🌟',
    ],
    vulgar: [
      "Ogarnij się",
      "Nie jesteś pod trzepakiem wśród kolegów. Zastanów się nim coś palniesz.",
    ],
  },
  'u_marinette': { // Marinette Dupont
    positive: [
      'Dziękuję za wsparcie! Każde dobre słowo dodaje mi teraz sił w poszukiwaniach Natalie 💛',
      'Naprawdę? Dziękuję, że jesteś. Mam nadzieję, że wkrótce wszystko się wyjaśni...',
      'To miłe... cieszę się, że mogę na kogoś liczyć w tym trudnym momencie ✨',
    ],
    negative: [
      'To straszne... tak bardzo się o nią martwię 🥺 Mam nadzieję, że nic złego się nie stało...',
      'Wiem... czuję się jak w jakimś koszmarze. Nie spocznę, dopóki jej nie odnajdę.',
      'Rozumiem... to wszystko jest takie przytłaczające 🫂',
    ],
    neutral: [
      'Rozumiem... Gdybyś tylko cokolwiek usłyszał o Natalie, daj mi proszę od razu znać!',
      'Tak... cały czas myślę o tym wieczorze w kinie. Wszystko wydawało się takie normalne...',
      'Wiem, muszę zachować spokój i krok po kroku sprawdzić wszystkie poszlaki.',
    ],
    funny: [
      'Heh, dzięki za próbę rozładowania atmosfery... choć wciąż ciężko mi myśleć o czymś innym niż Natalie 😅',
      'Doceniam humor, pomaga choć na sekundę zapomnieć o tym całym stresie...',
    ],
    question: [
      'Wyszła do toalety po filmie i już nie wróciła... W kabinie zostały tylko jej rzeczy i telefon 📱',
      'Próbuję rozmawiać ze wszystkimi, którzy byli wtedy w kinie. Każdy szczegół może mieć znaczenie!',
      'Myślę, że musimy przeszukać okolicę kina i sprawdzić nagrania z monitoringu, jeśli to możliwe.',
    ],
    vulgar: [
      'Proszę, nie mów tak... Jestem kłębkiem nerwów przez zniknięcie Natalie.',
      'Naprawdę musisz tak pisać? Przeżywam teraz koszmar...',
    ],
  },
};

// Topic-specific response additions
const topicResponses: Record<Topic, string[]> = {
  tech: [
    'Swoją drogą, pracuję teraz nad czymś podobnym!',
    'Próbowałeś nowych features w najnowszej wersji?',
    'Mam świetny artykuł na ten temat, wyślę Ci link!',
  ],
  sport: [
    'Kiedyś musimy razem potrenować!',
    'Ruch to zdrowie, trzymam kciuki!',
    'Jaki plan na weekend? Może coś aktywnego?',
  ],
  food: [
    'Teraz mi się chce jeść! 😋',
    'Muszę Ci kiedyś pokazać moją ulubioną knajpkę!',
    'Mmm, brzmi pysznie!',
  ],
  travel: [
    'Zazdroszczę! Muszę też gdzieś się wybrać!',
    'Zrobiłeś jakieś zdjęcia? Pokaż!',
    'Jaki był najlepszy moment wyjazdu?',
  ],
  work: [
    'Trzymam kciuki za projekt!',
    'Dasz radę, wierzę w Ciebie!',
    'Jak idzie? Chętnie pomogę!',
  ],
  mood: [
    'A u mnie w miarę dobrze, dzięki za pytanie!',
    'Miło, że pytasz!',
    'Nastrój zależy od pogody, a dziś jest pięknie!',
  ],
  design: [
    'Widziałaś najnowsze trendy? Szał!',
    'Mam pomysł na kolaborację!',
    'Podoba mi się Twoje podejście do designu!',
  ],
  music: [
    'Co ostatnio słuchasz? Szukam inspiracji!',
    'Mam świetną playlistę do polecenia!',
    'Muzyka to najlepszy towarzysz pracy!',
  ],
  games: [
    'Kiedy następna sesja?',
    'Muszę Ci pokazać nową grę!',
    'Granie to najlepszy sposób na relaks!',
  ],
  general: [],
};

// Track last responses per thread to avoid repetition
const lastResponses = new Map<string, string[]>();
const MAX_HISTORY = 5;

function trackResponse(threadId: string, responseText: string) {
  const history = lastResponses.get(threadId) || [];
  history.push(responseText);
  if (history.length > MAX_HISTORY) history.shift();
  lastResponses.set(threadId, history);
}

function wasRecentlyUsed(threadId: string, text: string): boolean {
  const history = lastResponses.get(threadId) || [];
  return history.includes(text);
}

/* ============================================
   PROFANITY STRIKE SYSTEM
   ============================================ */

const PROFANITY_STORAGE_KEY = 'emotion-profanity-strikes';
const PROFANITY_BLOCK_KEY = 'emotion-profanity-blocks';

// Per-participant config: how many vulgar messages before they block you
// Lower = more sensitive character
interface ProfanityConfig {
  maxStrikes: number;
  farewellMessage: string;
  apologyMessage: string;
  cooldownMs: number; // how long they stay blocked (ms)
}

const profanityConfigs: Record<string, ProfanityConfig> = {
  'u2': { // Anna - wrażliwa, blokuje szybko
    maxStrikes: 3,
    farewellMessage: 'Nie... są pewne granice poziomu rozmowy. A ty zniżyłeś się tak bardzo, że szorując po dnie, wykopałeś sobie dół, w którym chyba tylko sam ze sobą będziesz czuł się dobrze. Do widzenia.',
    apologyMessage: 'Hej, sorry za ostatnią wiadomość. Trochę mnie poniosło. Kiepski dzień itp... Mam nadzieję, że mi wybaczysz 🥺',
    cooldownMs: 604_800_000, // tydzień spokoju na odpowiedź
  },
  'u4': { // Kasia - blokuje po 4
    maxStrikes: 4,
    farewellMessage: 'Wiesz co? Nie mam ochoty na taki poziom rozmowy. Nie jestem pod trzepakiem. Odezwij się kiedy dorośniesz.',
    apologyMessage: 'Hej... przepraszam, że się odcięłam. Miałam ciężki tydzień i chyba zareagowałam zbyt ostro. Mam nadzieję, że nie masz żalu 💛',
    cooldownMs: 30_000, // 30s demo (symuluje "kilka dni")
  },
  'u3': { // Piotr - wytrzymały, ale też ma granicę
    maxStrikes: 6,
    farewellMessage: 'Dobra, starczy. Mam wystarczająco własnych problemów, żeby jeszcze słuchać takich rzeczy. Nara.',
    apologyMessage: 'Ej, słuchaj, sorry za tamto. Byłem trochę naburmuszony. Piwo na zgodę? 🍺',
    cooldownMs: 30_000,
  },
};

// Load strikes from localStorage
function loadStrikes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PROFANITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveStrikes(strikes: Record<string, number>) {
  try {
    localStorage.setItem(PROFANITY_STORAGE_KEY, JSON.stringify(strikes));
  } catch { /* ignore */ }
}

// Load blocks from localStorage
interface BlockInfo {
  blockedAt: number; // timestamp
  cooldownMs: number;
  apologyMessage: string;
  apologySent: boolean;
}

function loadBlocks(): Record<string, BlockInfo> {
  try {
    const raw = localStorage.getItem(PROFANITY_BLOCK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveBlocks(blocks: Record<string, BlockInfo>) {
  try {
    localStorage.setItem(PROFANITY_BLOCK_KEY, JSON.stringify(blocks));
  } catch { /* ignore */ }
}

/**
 * Check if a participant is currently blocked due to profanity.
 * Returns true if blocked (still in cooldown).
 */
function isParticipantBlocked(participantId: string): boolean {
  const blocks = loadBlocks();
  const block = blocks[participantId];
  if (!block) return false;
  const elapsed = Date.now() - block.blockedAt;
  return elapsed < block.cooldownMs;
}

/**
 * Register a vulgar message strike. Returns 'blocked' if this strike triggers a block,
 * 'already_blocked' if they're already blocked, or 'warned' otherwise.
 */
function registerVulgarStrike(participantId: string): 'warned' | 'blocked' | 'already_blocked' {
  if (isParticipantBlocked(participantId)) return 'already_blocked';

  const config = profanityConfigs[participantId];
  if (!config) return 'warned'; // no config = no blocking, just warn

  const strikes = loadStrikes();
  const key = participantId;
  strikes[key] = (strikes[key] || 0) + 1;
  saveStrikes(strikes);

  if (strikes[key] >= config.maxStrikes) {
    // Block the participant
    const blocks = loadBlocks();
    blocks[participantId] = {
      blockedAt: Date.now(),
      cooldownMs: config.cooldownMs,
      apologyMessage: config.apologyMessage,
      apologySent: false,
    };
    saveBlocks(blocks);

    // Reset strikes for next cycle
    strikes[key] = 0;
    saveStrikes(strikes);

    return 'blocked';
  }

  return 'warned';
}

/**
 * Check if a participant's cooldown has expired and send an apology if needed.
 * Called at the beginning of scheduleChatResponse.
 */
function checkAndSendApology(
  dispatch: Dispatch,
  threadId: string,
  participantId: string
): boolean {
  const blocks = loadBlocks();
  const block = blocks[participantId];
  if (!block) return false;

  const elapsed = Date.now() - block.blockedAt;

  if (elapsed >= block.cooldownMs && !block.apologySent) {
    // Cooldown expired - send apology
    block.apologySent = true;
    saveBlocks(blocks);

    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

        const apologyMsg: Message = {
          id: `apology-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          senderId: participantId,
          text: block.apologyMessage,
          timestamp: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: apologyMsg });

        // Clean up the block record entirely
        const updatedBlocks = loadBlocks();
        delete updatedBlocks[participantId];
        saveBlocks(updatedBlocks);
      }, 2000);
    }, 1500);

    return true; // apology is being sent, proceed normally after
  }

  // Still in cooldown
  if (elapsed < block.cooldownMs) {
    return true; // still blocked
  }

  return false;
}

/**
 * Score how well a set of triggers matches the input text.
 * Returns 0 if no match, higher = better match.
 */
function scoreTriggers(text: string, triggers: string[]): number {
  const normalizedText = normalize(text);
  let score = 0;
  for (const trigger of triggers) {
    const normalizedTrigger = normalize(trigger);
    if (normalizedText.includes(normalizedTrigger)) {
      score += normalizedTrigger.length;
    }
  }
  return score;
}

/**
 * Find the best chat response for a given message text and participant,
 * now enhanced with context analysis.
 */
export function matchChatResponse(
  text: string,
  participantId: string,
  threadId?: string
): ResponseOption | null {
  const context = analyzeContext(text);

  // 1. First try rule-based matching (original trigger system)
  let bestScore = 0;
  let bestResponses: ResponseOption[] = [];

  for (const rule of responses.chatResponses) {
    if (rule.participantId !== participantId && rule.participantId !== '*') continue;

    const score = scoreTriggers(text, rule.triggers);
    if (score > bestScore) {
      bestScore = score;
      bestResponses = rule.responses;
    }
  }

  if (bestScore > 0 && bestResponses.length > 0) {
    // Filter out recently used responses
    const filtered = threadId
      ? bestResponses.filter(r => !wasRecentlyUsed(threadId, r.text))
      : bestResponses;
    const pool = filtered.length > 0 ? filtered : bestResponses;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 2. Fall back to context-based response templates
  const templates = contextualChatTemplates[participantId];
  if (templates) {
    const sentimentResponses = templates[context.sentiment];
    if (sentimentResponses && sentimentResponses.length > 0) {
      // Filter out recently used
      const filtered = threadId
        ? sentimentResponses.filter(r => !wasRecentlyUsed(threadId, r))
        : sentimentResponses;
      const pool = filtered.length > 0 ? filtered : sentimentResponses;
      let responseText = pool[Math.floor(Math.random() * pool.length)];

      // Optionally append a topic-specific addition
      if (context.topics[0] !== 'general' && Math.random() > 0.5) {
        const additions = topicResponses[context.topics[0]];
        if (additions && additions.length > 0) {
          responseText += ' ' + additions[Math.floor(Math.random() * additions.length)];
        }
      }

      return {
        text: responseText,
        delayBeforeTyping: 1000 + Math.random() * 2000,
        typingDuration: 1500 + Math.random() * 2000,
        sentiment: context.sentiment,
        topic: context.topics[0],
      };
    }
  }

  return null;
}

/**
 * Get a fallback response for a specific participant.
 */
function getFallbackChatResponse(participantId: string): ResponseOption {
  const participantFallbacks = responses.fallbackResponses.chat[participantId];
  const genericFallbacks = responses.fallbackResponses.chat['*'];

  const pool = participantFallbacks ?? genericFallbacks;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Find the best post comment response for user-generated content.
 * Now with context-aware matching.
 */
export function matchPostCommentResponse(
  text: string,
  currentUserId: string
): PostCommentResponseOption | null {
  const context = analyzeContext(text);

  let bestScore = 0;
  let bestResponses: PostCommentResponseOption[] = [];

  for (const rule of responses.postCommentResponses) {
    const score = scoreTriggers(text, rule.triggers);
    if (score > bestScore) {
      bestScore = score;
      bestResponses = rule.responses.filter(r => r.authorId !== currentUserId);
    }
  }

  if (bestScore > 0 && bestResponses.length > 0) {
    return bestResponses[Math.floor(Math.random() * bestResponses.length)];
  }

  // Context-based fallback for post comments
  if (context.sentiment !== 'neutral' || context.topics[0] !== 'general') {
    const contextualComments = generateContextualPostComment(context, currentUserId);
    if (contextualComments) return contextualComments;
  }

  return null;
}

/**
 * Generate a contextual post comment based on analysis.
 */
function generateContextualPostComment(
  context: ContextAnalysis,
  currentUserId: string
): PostCommentResponseOption | null {
  const nonCurrentUsers = allUsers.filter(u => u.id !== currentUserId && u.id !== 'u1');
  if (nonCurrentUsers.length === 0) return null;

  const commenter = nonCurrentUsers[Math.floor(Math.random() * nonCurrentUsers.length)];

  const sentimentComments: Record<Sentiment, string[]> = {
    positive: [
      'Świetnie! Trzymam kciuki za dalsze sukcesy! 🎉',
      'To wspaniale! Gratulacje! 👏',
      'Super wiadomość! Cieszę się razem z Tobą! 🌟',
      'Wow, brawo! To naprawdę coś! 💪',
    ],
    negative: [
      'Trzymaj się! Jutro będzie lepiej 💛',
      'Współczuję... Daj znać jakby co, chętnie pomogę!',
      'Głowa do góry! Wszyscy przez to przechodzimy 🤗',
    ],
    neutral: [
      'Ciekawy post! 👍',
      'Dzięki za podzielenie się! 😊',
      'Interesujące, muszę się nad tym zastanowić 🤔',
    ],
    funny: [
      'Hahaha, dobre! 😂',
      'Nie mogę, padłem! 🤣',
      'Muszę to zapamiętać, genialne! 😆',
    ],
    question: [
      'Dobre pytanie! Też chciałbym znać odpowiedź 🤔',
      'Hmm, ciężki temat! Ktoś wie? 🧐',
      'Też się nad tym zastanawiam! 💭',
    ],
    vulgar: [
      'Ekhm... nie wiem czy to odpowiedni język...',
      'Proszę, trochę kultury...',
    ],
  };

  const pool = sentimentComments[context.sentiment];
  if (!pool || pool.length === 0) return null;

  return {
    authorId: commenter.id,
    text: pool[Math.floor(Math.random() * pool.length)],
    delayBeforeTyping: 4000 + Math.random() * 6000,
    typingDuration: 1500 + Math.random() * 2000,
    sentiment: context.sentiment,
    topic: context.topics[0],
  };
}

/**
 * Get a fallback post comment response.
 */
function getFallbackPostCommentResponse(currentUserId: string): PostCommentResponseOption {
  const pool = responses.fallbackResponses.postComments.filter(
    r => r.authorId !== currentUserId
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get user info by id.
 */
function getUserById(userId: string) {
  return allUsers.find(u => u.id === userId);
}

const SESSION_GAP_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extract messages belonging to the current active session.
 * A new session starts if there was a gap of >= 24 hours between messages.
 */
function getCurrentSessionMessages(messages: Message[]): Message[] {
  if (!messages || messages.length === 0) return [];

  let sessionStartIndex = 0;
  for (let i = 1; i < messages.length; i++) {
    const prevTime = new Date(messages[i - 1].timestamp).getTime();
    const currTime = new Date(messages[i].timestamp).getTime();
    if (!isNaN(prevTime) && !isNaN(currTime) && (currTime - prevTime) >= SESSION_GAP_MS) {
      sessionStartIndex = i;
    }
  }

  return messages.slice(sessionStartIndex);
}

/**
 * Schedule a simulated chat response after the user sends a message.
 * Handles: context analysis → delay → typing indicator → response message
 */
export function scheduleChatResponse(
  dispatch: Dispatch,
  threadId: string,
  participantId: string,
  userText: string,
  _pendingFriends?: Set<string>,
  currentUserName?: string,
  threadMessages?: Message[],
  currentUserId?: string,
  _pendingGroupJoins?: Set<string>
): void {
  // If the participant is offline, they do not respond to messages (except active group admins)
  const participant = getUserById(participantId);
  if (participant && participant.isOnline === false && participantId !== 'u8' && participantId !== 'u_kornel') {
    return;
  }

  // Check if the participant's cooldown has expired - send apology if so
  checkAndSendApology(dispatch, threadId, participantId);

  // If participant is currently blocked, don't respond at all
  if (isParticipantBlocked(participantId)) {
    return; // silently ignore - they're "not talking to you"
  }

  // Handle Marinette Dupont (u_marinette) quest progression
  if (participantId === 'u_marinette') {
    // Check if player is specifically discussing Natalie's anti-Prime manifest / STOP Szarlatanom findings (Quest Stage 5)
    const mentionsNatalieAntiPrime =
      /\b(szarlatan|szarlatanom|szarlatanami|prime|primeco|manifest)\b/i.test(userText) ||
      (/\b(odkry[łl]em|znalaz[łl]em|widzia[łl]em|przeczyta[łl]em)\b/i.test(userText) &&
       /\b(post|wpis|artyku[łl]|manifest|krytyk\w*)\b/i.test(userText) &&
       !/\b(postaram|pomog\w*)\b/i.test(userText));

    const alreadySentMatyldaClue = Boolean(
      threadMessages?.some(m => m.senderId === 'u_marinette' && (m.text.includes('Matyld') || m.text.includes('Iggermann')))
    );

    if (mentionsNatalieAntiPrime) {
      if (alreadySentMatyldaClue) {
        // If already told about Matylda, just send a short reminder
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
          setTimeout(() => {
            dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
            const responseMsg: Message = {
              id: `resp-marinette-remind-${Date.now()}`,
              senderId: participantId,
              text: 'Pamiętaj, spróbuj odezwać się do Matyldy Iggermann! Skoro chodziła z Tobą do szkoły i ma kontakt z PrimeCo, może nam pomóc dotrzeć do prawdy.',
              timestamp: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
          }, 1600);
        }, 800);
        return;
      }

      const messagesToSend = [
        { text: 'O mój Boże... Wiedziałam, że Natalie miała ostry charakter, ale nie sądziłam, że uderzyła w samego Profesora Prime\'a publicznie w tej grupie! 😱', typingDelay: 600, typingDuration: 1800 },
        { text: 'Myślisz, że to mogła być zemsta? Że ktoś powiązany z PrimeCo postanowił ją uciszyć?', typingDelay: 900, typingDuration: 1400 },
        { text: 'Profesor Prime na pewno wiedziałby, co się z nią stało... Szkoda, że kontakt z nim dla zwykłych ludzi jest absolutnie niemożliwy.', typingDelay: 1000, typingDuration: 1600 },
        { text: 'Ale czekaj... Ty i Matylda Iggermann chodziliście do tej samej szkoły, na pewno kojarzycie się z korytarza!', typingDelay: 1100, typingDuration: 1500 },
        { text: 'Podobno pracuje w PrimeCo, albo robi tam doktorat. Już nie pamiętam... ', typingDelay: 1000, typingDuration: 1700 },
        { text: 'Spróbujesz z nią pogadać? Pomoc Profesora w tej sprawie będzie bezcenna.', typingDelay: 1000, typingDuration: 1700 },
      ];

      let cumulativeTime = 0;
      messagesToSend.forEach((item, index) => {
        cumulativeTime += item.typingDelay;
        const startTypingTime = cumulativeTime;
        cumulativeTime += item.typingDuration;
        const sendMsgTime = cumulativeTime;

        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        }, startTypingTime);

        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `resp-marinette-clue-${index + 1}-${Date.now()}`,
            senderId: participantId,
            text: item.text,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
        }, sendMsgTime);
      });

      return;
    }

    // If the player is responding to the initial disappearance notification (Stage 1)
    const isEarlyHelpOffer =
      /\b(pomog\w*|postaram\w*|sprawdz\w*|jasne|pewnie|dobrze|trzymaj\w*|przykro|wsp\xF3\u0142czuj\w*|szukam)\b/i.test(userText) ||
      (threadMessages && threadMessages.filter(m => m.senderId === currentUserId).length <= 1);

    if (isEarlyHelpOffer && !alreadySentMatyldaClue) {
      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `resp-marinette-support-${Date.now()}`,
            senderId: participantId,
            text: 'Dziękuję za chęć pomocy! 💛 Sprawdź proszę grupę „Szukam osoby - pomoc” i zerknij na mój apel ze szczegółami. Każda poszlaka może być na wagę złota!',
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
        }, 1800);
      }, 800);

      return;
    }
  }

  // Handle Matylda Iggermann (u_matylda) confrontation & persuasion scenario
  if (participantId === 'u_matylda') {
    const textLower = userText.toLowerCase();
    const isExplanation = textLower.includes('natalie') ||
      textLower.includes('chalamet') ||
      textLower.includes('kino') ||
      textLower.includes('toalet') ||
      textLower.includes('ubrani') ||
      textLower.includes('pomoc') ||
      textLower.includes('szuk') ||
      textLower.includes('znikn') ||
      textLower.includes('przepraszam') ||
      textLower.includes('musia') ||
      textLower.includes('grupa');

    if (isExplanation) {
      const messagesToSend = [
        { text: 'Czekaj... Natalie Chalamet? Ta dziewczyna, która zniknęła w kinie Le Grand Rex.', typingDelay: 600, typingDuration: 1800 },
        { text: 'Pff...', typingDelay: 500, typingDuration: 1000 },
        { text: 'Dobra. Jeśli zrobiłeś to tylko po to, żeby pomóc przyjaciółce, to cofam to, co powiedziałam.', typingDelay: 900, typingDuration: 1600 },
        { text: 'Profesor Prime zajmował się kiedyś sprawami zniknięć. Co prawda ograniczał się wtedy tylko do psów, ale...', typingDelay: 1000, typingDuration: 1800 },
        { text: 'Sorry... to chyba było nie na miejscu.', typingDelay: 1000, typingDuration: 1800 },
        { text: 'Sorry...', typingDelay: 1000, typingDuration: 1800 },
        { text: 'Przekażę mu Twój profil i dodam Cię do listy bezpiecznych połączeń. Powinien się z tobą skontaktować. A jak nie będzie dawać znaku, to ', typingDelay: 900, typingDuration: 1500 },
      ];

      let cumulativeTime = 0;
      messagesToSend.forEach((item, index) => {
        cumulativeTime += item.typingDelay;
        const startTypingTime = cumulativeTime;
        cumulativeTime += item.typingDuration;
        const sendMsgTime = cumulativeTime;

        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        }, startTypingTime);

        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `resp-matylda-${index + 1}-${Date.now()}`,
            senderId: participantId,
            text: item.text,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });

          // On last message: unlock permissions and notify
          if (index === messagesToSend.length - 1) {
            dispatch({ type: 'ACCEPT_FRIEND', userId: 'u_matylda' });
            dispatch({ type: 'UNLOCK_PRIME_CHAT' });
            dispatch({ type: 'ACTIVATE_MATYLDA_LIKES' });

            // Ensure thread with Profesor Prime exists
            const primeUser = allUsers.find(u => u.id === 'u14');
            if (primeUser) {
              dispatch({
                type: 'CREATE_THREAD',
                thread: {
                  threadId: 't_u14',
                  participant: {
                    id: 'u14',
                    name: primeUser.name,
                    avatarUrl: primeUser.avatarUrl,
                    isOnline: true
                  },
                  messages: []
                }
              });
            }

            dispatch({
              type: 'ADD_NOTIFICATION',
              notification: {
                id: `n-matylda-acc-${Date.now()}`,
                type: 'friend',
                message: 'Matylda Iggermann zaakceptowała Twoje zaproszenie i autoryzowała kontakt z Profesorem Prime\'em.',
                timestamp: new Date().toISOString(),
                isRead: false,
                link: { type: 'chat', threadId: 't_u14' }
              }
            });
          }
        }, sendMsgTime);
      });

      return;
    } else {
      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `resp-matylda-${Date.now()}`,
            senderId: participantId,
            text: 'Nadal nie widzę żadnego sensownego wyjaśnienia. Dlaczego szkalowałeś Profesora na tablicy? Jeśli to jakiś głupi żart, to kończymy rozmowę.',
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
        }, 2000);
      }, 1000);

      return;
    }
  }

  // Handle Damian Wilk (u_damian) assistance
  if (participantId === 'u_damian') {
    const textLower = userText.toLowerCase();
    let responseText = '';

    if (textLower.includes('poziom') || textLower.includes('level') || textLower.includes('ban') || textLower.includes('wyzwan')) {
      responseText = 'Pamiętaj: musisz wbić 5. poziom w Dziennych Wyzwaniach (zakładka Wyzwanie dnia). Wtedy z automatu odpalam skrypt odwoławczy i zdejmuję bana! 👊';
    } else {
      responseText = 'Trzymaj się tam! Jak tylko wbijesz 5. poziom, ogarniamy sprawę z blokadą. Sprawdź też posty w grupie STOP Szarlatanom, jak będziesz miał okazję.';
    }

    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
        const responseMsg: Message = {
          id: `resp-damian-${Date.now()}`,
          senderId: participantId,
          text: responseText,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
      }, 1500);
    }, 800);

    return;
  }

  // Handle Profesor Prime (u14) final audience & reveal
  if (participantId === 'u14') {
    const textLower = userText.toLowerCase();
    let responseText = '';

    const isAskingAboutNatalie = textLower.includes('natalie') ||
      textLower.includes('chalamet') ||
      textLower.includes('znikn') ||
      textLower.includes('toalet') ||
      textLower.includes('kino');

    if (isAskingAboutNatalie || threadMessages && threadMessages.length > 0) {
      responseText = 'Natalie... cóż. To jedna z wielu zagadek, z którymi ostatnio musiałem się zmierzyć. Odpowiedź na pytanie "co sie stało z Natalie?" jest o wiele bardziej skomplikowana niż myślisz. Zamiast odpowiadać Ci na czacie, powiem Ci, że ta historia została udokumentowana na kartach komiksu "Fabryka Twarzy". Premiera pierwszej, darmowej części odbędzie się na Międzynarodowym Festiwalu Komiksu i Gier w Łodzi w 2026 roku. A jeżeli chcesz poznać więcej szczegółów na temat Nowej Nauki zapraszamy do zaobserwowania naszego profilu na Instagramie. \n\nhttps://www.instytutnowejnauki.pl \n\nPozdrawiam, \n Profesor Prime';
    } else {
      responseText = 'Matylda rzadko kogoś rekomenduje. Skoro tu jesteś, to znaczy, że szukasz Natalie Chalamet.';
    }

    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
        const responseMsg: Message = {
          id: `resp-prime-${Date.now()}`,
          senderId: participantId,
          text: responseText,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
      }, 2500);
    }, 1200);

    return;
  }

  // Handle Ola Kamińska (u8) group join request for "Szukam osoby - pomoc" (g_szukam)
  if (participantId === 'u8') {
    const textLower = userText.toLowerCase();
    const isSensible = textLower.length >= 2 && !textLower.includes('spierdalaj') && !textLower.includes('chuj');

    if (isSensible) {
      const acceptText = 'Rozumiem, dziękuję za odpowiedź i chęć pomocy. Zaakceptowałam Twoją prośbę - witamy w grupie "Szukam osoby - pomoc"! Pamiętaj o zachowaniu powagi i szacunku w postach.';

      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `resp-ola-${Date.now()}`,
            senderId: participantId,
            text: acceptText,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
          dispatch({ type: 'APPROVE_GROUP_JOIN', groupId: 'g_szukam' });
          dispatch({
            type: 'ADD_NOTIFICATION',
            notification: {
              id: `n-approve-szukam-${Date.now()}`,
              type: 'group',
              message: 'Ola Kamińska zaakceptowała Twoją prośbę o dołączenie do grupy "Szukam osoby - pomoc".',
              timestamp: new Date().toISOString(),
              isRead: false,
              link: { type: 'group', groupId: 'g_szukam' }
            }
          });
        }, 1800);
      }, 800);

      return;
    }
  }

  // Analyze if this message is vulgar
  const context = analyzeContext(userText);
  if (context.sentiment === 'vulgar') {
    const strikeResult = registerVulgarStrike(participantId);

    if (strikeResult === 'already_blocked') {
      return; // still blocked, no response
    }

    if (strikeResult === 'blocked') {
      // Send the farewell message
      const config = profanityConfigs[participantId];
      if (config) {
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

          setTimeout(() => {
            dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

            const farewellMsg: Message = {
              id: `farewell-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              senderId: participantId,
              text: config.farewellMessage,
              timestamp: new Date().toISOString(),
            };

            dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: farewellMsg });

            // Schedule the apology check for when cooldown expires
            setTimeout(() => {
              checkAndSendApology(dispatch, threadId, participantId);
            }, config.cooldownMs + 1000);
          }, 3000); // longer typing for dramatic effect
        }, 2000);
      }
      return;
    }

    // strikeResult === 'warned' - they respond with a vulgar-sentiment response (already handled by templates)
  }

  // === AI-POWERED RESPONSE PATH ===
  // If the participant has an AI personality and we have message history,
  // try to get a response from the AI proxy first.
  if (hasAIPersonality(participantId) && threadMessages && currentUserId) {
    const personality = getAIPersonality(participantId);
    const sessionMessages = getCurrentSessionMessages(threadMessages);
    const sessionUserCount = sessionMessages.filter(m => m.senderId === currentUserId).length;
    const limit = personality?.messageLimit ?? 30;

    // Limit reached: send in-character farewell message
    if (sessionUserCount === limit) {
      const farewell = personality?.farewellMessage || 'Sorki, muszę już lecieć! Pogadamy później 👋';
      setTimeout(() => {
        dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          const responseMsg: Message = {
            id: `farewell-${Date.now()}`,
            senderId: participantId,
            text: farewell,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
        }, 1800);
      }, 1000);
      return;
    }

    // Limit exceeded within 24h: character does not respond (remains silent/offline)
    if (sessionUserCount > limit) {
      return;
    }

    // Show typing indicator immediately (simulates "thinking")
    const aiTypingDelay = 800 + Math.random() * 1200;
    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: true });
    }, aiTypingDelay);

    // Fire the async AI request
    fetchAIResponse(participantId, threadMessages, currentUserId, currentUserName)
      .then(aiReply => {
        if (aiReply) {
          // AI responded successfully - use it
          const aiTypingDuration = 1000 + Math.min(aiReply.length * 30, 3000);
          setTimeout(() => {
            dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

            const responseMsg: Message = {
              id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              senderId: participantId,
              text: aiReply,
              timestamp: new Date().toISOString(),
            };

            dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
          }, aiTypingDuration);
        } else {
          // AI failed or unavailable - fall back to rule-based engine
          fallbackToRuleEngine(dispatch, threadId, participantId, userText);
        }
      })
      .catch(() => {
        // Network/runtime error - fall back silently
        fallbackToRuleEngine(dispatch, threadId, participantId, userText);
      });

    return;
  }

  // === RULE-BASED RESPONSE PATH (original) ===
  executeRuleBasedResponse(dispatch, threadId, participantId, userText);
}

/**
 * Fall back to the rule-based response engine.
 * Used when AI is unavailable or returns an error.
 */
function fallbackToRuleEngine(
  dispatch: Dispatch,
  threadId: string,
  participantId: string,
  userText: string
): void {
  // Clear any lingering typing indicator from the AI attempt
  dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
  executeRuleBasedResponse(dispatch, threadId, participantId, userText);
}

/**
 * Execute the original rule-based response logic.
 */
function executeRuleBasedResponse(
  dispatch: Dispatch,
  threadId: string,
  participantId: string,
  userText: string
): void {
  const matched = matchChatResponse(userText, participantId, threadId);
  const responseOption = matched ?? getFallbackChatResponse(participantId);

  // Track response to avoid repetition
  trackResponse(threadId, responseOption.text);

  // Phase 1: delay before typing starts
  setTimeout(() => {
    dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

    // Phase 2: typing duration, then send message
    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

      const responseMsg: Message = {
        id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: participantId,
        text: responseOption.text,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
    }, responseOption.typingDuration);
  }, responseOption.delayBeforeTyping);
}

/**
 * Schedule multiple simulated comments (2-5) and auto-likes on a new feed post.
 */
export function schedulePostCommentResponse(
  dispatch: Dispatch,
  postId: string,
  postContent: string,
  currentUserId: string,
  currentUserName?: string,
  pendingGroupJoins?: Set<string>
): void {
  // 0. Check for Kornel anti-prime group task
  if (pendingGroupJoins?.has('g_anty_prime')) {
    const norm = normalize(postContent);
    const isAntiPrime = norm.includes('prime') ||
      norm.includes('profesor') ||
      norm.includes('szarlatan') ||
      norm.includes('oszust') ||
      norm.includes('klam') ||
      norm.includes('bzdur') ||
      norm.includes('inwigilac') ||
      norm.includes('primeco') ||
      norm.includes('kup') ||
      norm.includes('kurw') ||
      norm.includes('chu') ||
      norm.includes('sciem');

    if (isAntiPrime) {
      setTimeout(() => {
        // Kornel likes the post
        dispatch({ type: 'INCREMENT_POST_LIKES', postId });
        dispatch({
          type: 'ADD_NOTIFICATION',
          notification: {
            id: `notif-kornel-like-${Date.now()}`,
            message: `Kornel Zagórski polubił Twój post.`,
            isRead: false,
            timestamp: new Date().toISOString(),
            type: 'like',
            link: { type: 'post', postId }
          }
        });

        // Kornel adds a comment
        const kornel = allUsers.find(u => u.id === 'u_kornel') || {
          id: 'u_kornel',
          name: 'Kornel Zagórski',
          avatarUrl: 'https://i.pravatar.cc/150?u=kornel_zagorski'
        };

        const kornelComment: Comment = {
          id: `c-kornel-${Date.now()}`,
          author: {
            id: kornel.id,
            name: kornel.name,
            avatarUrl: kornel.avatarUrl
          },
          text: 'O to chodzi! Precz z manipulacjami PrimeCo i bajkami o widzeniu przyszłości! 🔥',
          timestamp: new Date().toISOString()
        };
        dispatch({ type: 'ADD_COMMENT', postId, comment: kornelComment });

        // Kornel sends direct message in chat and approves group
        const kornelThreadId = 't_u_kornel';
        const kornelMsg: Message = {
          id: `kornel-appr-${Date.now()}`,
          senderId: 'u_kornel',
          text: 'Widziałem Twój post na wallu. Dobra robota! Wreszcie ktoś, kto nie boi się pisać prawdy. Zaakceptowałem Cię w grupie STOP Szarlatanom. Witaj na pokładzie!',
          timestamp: new Date().toISOString()
        };

        dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId: kornelThreadId, message: kornelMsg });
        dispatch({ type: 'APPROVE_GROUP_JOIN', groupId: 'g_anty_prime' });
        dispatch({
          type: 'ADD_NOTIFICATION',
          notification: {
            id: `notif-kornel-group-${Date.now()}`,
            message: 'Kornel Zagórski zaakceptował Twoją prośbę o dołączenie do grupy "STOP Szarlatanom: Prawda o Nowej Nauce i PrimeCo".',
            isRead: false,
            timestamp: new Date().toISOString(),
            type: 'group',
            link: { type: 'group', groupId: 'g_anty_prime' }
          }
        });

        // 3.5s later: Corporate ban strikes the user
        setTimeout(() => {
          dispatch({
            type: 'SET_BANNED',
            isBanned: true,
            reason: '§ 12.3 Regulaminu: Atak na dobre imię PrimeCo i naruszenie standardów społeczności eMotion'
          });

          dispatch({
            type: 'ADD_NOTIFICATION',
            notification: {
              id: `notif-ban-${Date.now()}`,
              message: '⚠️ Twoje konto zostało zawieszone przez moderację eMotion (§ 12.3: Atak na PrimeCo). Funkcje publikowania i przeglądania grup zostały zablokowane.',
              isRead: false,
              timestamp: new Date().toISOString(),
              type: 'system',
            }
          });

          // 20s later: Damian Wilk writes offering bypass via Daily Challenge Level 5
          setTimeout(() => {
            const damianUser = allUsers.find(u => u.id === 'u_damian') || {
              id: 'u_damian',
              name: 'Damian Wilk',
              avatarUrl: 'https://i.pravatar.cc/150?u=damian_wilk'
            };

            const damianThreadId = 't_u_damian';
            dispatch({
              type: 'CREATE_THREAD',
              thread: {
                threadId: damianThreadId,
                participant: {
                  id: 'u_damian',
                  name: damianUser.name,
                  avatarUrl: damianUser.avatarUrl,
                  isOnline: true
                },
                messages: []
              }
            });

            const messagesToSend = [
              { text: 'siema', typingDelay: 600, typingDuration: 700 },
              { text: 'widzę, że ktoś dostał kagańca od adminów Gastona', typingDelay: 900, typingDuration: 1400 },
              { text: 'xd', typingDelay: 500, typingDuration: 500 },
              { text: 'klasyk. powiesz słowo prawdy i od razu leci ban', typingDelay: 600, typingDuration: 1000 },
              { text: 'ale chill, jest na to sposób', typingDelay: 1100, typingDuration: 2000 },
              { text: 'czytałeś kiedyś regulaminy? setki stron, które akceptujesz wchodząc na serwisy, potrafią skrywać prawdziwe perełki.', typingDelay: 1300, typingDuration: 2600 },
              { text: 'pamietasz jak wyszło, że subsrybencji pewnego stramingu nie mogą ubiegać o odszkodowanie w przypadku wypadku w parku rozrywki? ', typingDelay: 1300, typingDuration: 2600 },
              { text: 'xd ', typingDelay: 500, typingDuration: 500 },
              { text: 'nie inaczej jest w eMotion. kiedyś przycisnęło mnie na kiblu i przestudiowałem ten regulamin i... mam nadzieję, że siedzisz, bo to co za chwilę przeczytasz, to jakiś absurd xd ', typingDelay: 1300, typingDuration: 2600 },
              { text: 'według punktu 8.4 regulaminu, użytkownicy z Poziomem 5 w Dziennych Wyzwaniach mają prawo do przyspieszonej weryfikacji i automatycznego odwieszenia konta. czaisz? ', typingDelay: 1300, typingDuration: 2600 },
              { text: 'wbij 5. poziom w zakładce Daily Challenge i puszczę skrypt, ktory zdejmie mi bana. nie pytaj jak dziala ', typingDelay: 1300, typingDuration: 2600 },
              { text: 'powodzenia', typingDelay: 1300, typingDuration: 2600 },
            ];

            let cumulativeTime = 0;
            messagesToSend.forEach((item, index) => {
              cumulativeTime += item.typingDelay;
              const startTypingTime = cumulativeTime;
              cumulativeTime += item.typingDuration;
              const sendMsgTime = cumulativeTime;

              setTimeout(() => {
                dispatch({ type: 'SET_TYPING', threadId: damianThreadId, isTyping: true });
              }, startTypingTime);

              setTimeout(() => {
                dispatch({ type: 'SET_TYPING', threadId: damianThreadId, isTyping: false });
                const damianMsg: Message = {
                  id: `damian-ban-help-${index + 1}-${Date.now()}`,
                  senderId: 'u_damian',
                  text: item.text,
                  timestamp: new Date().toISOString()
                };
                dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId: damianThreadId, message: damianMsg });

                if (index === 0) {
                  dispatch({
                    type: 'ADD_NOTIFICATION',
                    notification: {
                      id: `n-damian-${Date.now()}`,
                      type: 'chat',
                      message: 'Damian Wilk wysłał Ci wiadomość na czacie.',
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      link: { type: 'chat', threadId: damianThreadId }
                    }
                  });
                }
              }, sendMsgTime);
            });
          }, 20000);
        }, 3500);
      }, 8000 + Math.random() * 4000);
    }
  }

  // 1. Schedule simulated likes from fictional users (3 to 7 likes)
  scheduleSimulatedLikes(dispatch, postId, false, undefined, postContent);

  // 2. Select 2 to 5 distinct commenters
  const candidateUsers = selectDiverseCommenters(currentUserId, undefined, postContent);
  const count = Math.min(candidateUsers.length, Math.floor(Math.random() * 3) + 2); // 2 to 4 (or 5)

  const baseDelays = [3000, 8500, 17000, 28000, 42000];

  for (let i = 0; i < count; i++) {
    const author = candidateUsers[i];
    const delay = baseDelays[i] + Math.floor(Math.random() * 2500);

    if (hasAIPersonality(author.id)) {
      fetchAIPostComment(author.id, postContent, currentUserName)
        .then(aiComment => {
          const fallbackMatched = matchPostCommentResponse(postContent, currentUserId) ?? getFallbackPostCommentResponse(currentUserId);
          const textToUse = aiComment || (fallbackMatched ? fallbackMatched.text : 'Super post! 👍');

          setTimeout(() => {
            const comment: Comment = {
              id: `ai-c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              author: {
                id: author.id,
                name: author.name,
                avatarUrl: author.avatarUrl,
              },
              text: textToUse,
              timestamp: new Date().toISOString(),
            };

            dispatch({ type: 'ADD_COMMENT', postId, comment });

            dispatch({
              type: 'ADD_NOTIFICATION',
              notification: {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                message: `${author.name} skomentował(a) Twój post.`,
                isRead: false,
                timestamp: new Date().toISOString(),
                type: 'comment',
                link: { type: 'post', postId },
              },
            });
          }, delay);
        })
        .catch(() => {
          executeRuleBasedPostComment(dispatch, postId, author, 'Bardzo ciekawe! 👍', delay);
        });
    } else {
      const fallbackMatched = matchPostCommentResponse(postContent, currentUserId) ?? getFallbackPostCommentResponse(currentUserId);
      const textToUse = fallbackMatched ? fallbackMatched.text : 'Dzięki za podzielenie się! 🔥';
      executeRuleBasedPostComment(dispatch, postId, author, textToUse, delay);
    }
  }
}

/**
 * Schedule multiple simulated comments (2-5) and auto-likes on a group post.
 */
export function scheduleGroupPostCommentResponse(
  dispatch: Dispatch,
  groupId: string,
  postId: string,
  postContent: string,
  currentUserId: string,
  currentUserName?: string
): void {
  // 1. Resolve group details for full contextual awareness
  const currentGroup = (groupsData as any[]).find(g => g.id === groupId);
  const groupInfo = currentGroup ? { name: currentGroup.name, description: currentGroup.description } : undefined;

  // 2. Schedule simulated likes from group members (2 to 6 likes)
  scheduleSimulatedLikes(dispatch, postId, true, groupId, postContent);

  // 3. Select 2 to 5 distinct commenters for this specific group
  const candidateUsers = selectDiverseCommenters(currentUserId, groupId, postContent);
  const count = Math.min(candidateUsers.length, Math.floor(Math.random() * 3) + 2); // 2 to 4 (or 5)

  const baseDelays = [3000, 8500, 17000, 28000, 42000];

  for (let i = 0; i < count; i++) {
    const author = candidateUsers[i];
    const delay = baseDelays[i] + Math.floor(Math.random() * 2500);

    if (hasAIPersonality(author.id)) {
      fetchAIPostComment(author.id, postContent, currentUserName, groupInfo)
        .then(aiComment => {
          const fallbackMatched = matchPostCommentResponse(postContent, currentUserId) ?? getFallbackPostCommentResponse(currentUserId);
          const textToUse = aiComment || (fallbackMatched ? fallbackMatched.text : 'Ciekawy punkt widzenia!');

          setTimeout(() => {
            const comment: Comment = {
              id: `ai-gc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              author: {
                id: author.id,
                name: author.name,
                avatarUrl: author.avatarUrl,
              },
              text: textToUse,
              timestamp: new Date().toISOString(),
            };

            dispatch({ type: 'ADD_GROUP_COMMENT', groupId, postId, comment });
          }, delay);
        })
        .catch(() => {
          setTimeout(() => {
            const comment: Comment = {
              id: `auto-gc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              author: {
                id: author.id,
                name: author.name,
                avatarUrl: author.avatarUrl,
              },
              text: 'Zgadzam się z przedmówcą! 👍',
              timestamp: new Date().toISOString(),
            };

            dispatch({ type: 'ADD_GROUP_COMMENT', groupId, postId, comment });
          }, delay);
        });
    } else {
      const fallbackMatched = matchPostCommentResponse(postContent, currentUserId) ?? getFallbackPostCommentResponse(currentUserId);
      const textToUse = fallbackMatched ? fallbackMatched.text : 'Świetny wątek w tej grupie!';
      setTimeout(() => {
        const comment: Comment = {
          id: `auto-gc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          author: {
            id: author.id,
            name: author.name,
            avatarUrl: author.avatarUrl,
          },
          text: textToUse,
          timestamp: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_GROUP_COMMENT', groupId, postId, comment });
      }, delay);
    }
  }
}

/**
 * Helper to select unique, varied commenters for a post or group post across all groups.
 */
function selectDiverseCommenters(
  currentUserId: string,
  groupId?: string,
  postContent?: string
): any[] {
  const eligible = allUsers.filter(u => u.id !== currentUserId && u.isOnline !== false);

  // Analyze post content context
  const norm = normalize(postContent || '');
  const isAntiPrimeOrHostile =
    norm.includes('prime') ||
    norm.includes('profesor') ||
    norm.includes('szarlatan') ||
    norm.includes('oszust') ||
    norm.includes('jebac') ||
    norm.includes('chuj') ||
    norm.includes('kurw') ||
    norm.includes('zlodziej') ||
    norm.includes('sciem') ||
    norm.includes('klam') ||
    norm.includes('bzdur') ||
    norm.includes('inwigilac') ||
    norm.includes('nowa nauka') ||
    norm.includes('stop szarlatan');

  // Preferred list prioritizing AI personalities
  let aiUsers = eligible.filter(u => hasAIPersonality(u.id));
  let otherUsers = eligible.filter(u => !hasAIPersonality(u.id));

  // If the post is hostile / anti-Prime / aggressive:
  // Exclude sensitive and peace-loving characters from commenting (Marinette, Anna, Kasia, Ola)
  if (isAntiPrimeOrHostile || groupId === 'g_anty_prime') {
    const sensitiveUserIds = new Set(['u_marinette', 'u2', 'u4', 'u8']);
    aiUsers = aiUsers.filter(u => !sensitiveUserIds.has(u.id));
    otherUsers = otherUsers.filter(u => !sensitiveUserIds.has(u.id));

    // Exclude Profesor Prime (u14) from commenting favorably on anti-prime posts
    aiUsers = aiUsers.filter(u => u.id !== 'u14');

    // Prioritize members of the resistance / anti-Prime activists
    aiUsers.sort((a, b) => {
      const antiOrder = ['u_kornel', 'u_weronika', 'u_damian', 'u_gaston', 'u3'];
      const idxA = antiOrder.indexOf(a.id);
      const idxB = antiOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  } else if (groupId === 'g1') {
    // Filmowe polecajki: Marinette, Gaston, Kasia, Piotr
    aiUsers.sort((a, b) => (a.id === 'u_marinette' ? -1 : b.id === 'u_marinette' ? 1 : 0));
  } else if (groupId === 'g2') {
    // Szukam pracy: Piotr, Anna, Kasia, Gaston
    aiUsers.sort((a, b) => (a.id === 'u3' ? -1 : b.id === 'u3' ? 1 : 0));
  } else if (groupId === 'g3') {
    // Kupię, sprzedam, zamienię: Kasia, Anna, Piotr
    aiUsers.sort((a, b) => (a.id === 'u4' ? -1 : b.id === 'u4' ? 1 : 0));
  } else if (groupId === 'g4') {
    // Mat-Fiz LO: Anna, Kasia, Piotr, Jan
    aiUsers.sort((a, b) => (a.id === 'u2' ? -1 : b.id === 'u2' ? 1 : 0));
  } else if (groupId === 'g5') {
    // Techno newsy: Gaston, Matylda, Kasia, Piotr
    aiUsers.sort((a, b) => (a.id === 'u_gaston' ? -1 : b.id === 'u_gaston' ? 1 : 0));
  }

  // Shuffle the arrays slightly for organic variety
  const shuffledAI = [...aiUsers].sort(() => Math.random() - 0.3);
  const shuffledOther = [...otherUsers].sort(() => Math.random() - 0.5);

  const combined = [...shuffledAI, ...shuffledOther];

  // Return unique users
  return Array.from(new Set(combined));
}

/**
 * Schedule automated likes by fictional users over time.
 */
function scheduleSimulatedLikes(
  dispatch: Dispatch,
  postId: string,
  isGroup: boolean,
  groupId?: string,
  postContent?: string
): void {
  let likerCandidates = allUsers.filter(u => u.id !== 'u1');

  if (postContent) {
    const norm = normalize(postContent);
    const isAntiPrimeOrHostile =
      norm.includes('prime') ||
      norm.includes('profesor') ||
      norm.includes('szarlatan') ||
      norm.includes('oszust') ||
      norm.includes('jebac') ||
      norm.includes('chuj') ||
      norm.includes('kurw') ||
      norm.includes('zlodziej') ||
      norm.includes('sciem') ||
      norm.includes('klam') ||
      norm.includes('bzdur') ||
      norm.includes('inwigilac') ||
      norm.includes('nowa nauka') ||
      norm.includes('stop szarlatan');

    if (isAntiPrimeOrHostile || groupId === 'g_anty_prime') {
      // Sensitive users (Marinette, Anna, Kasia, Ola) and Profesor Prime shouldn't like anti-Prime/aggressive posts
      const excludedLikerIds = new Set(['u_marinette', 'u2', 'u4', 'u8', 'u14']);
      likerCandidates = likerCandidates.filter(u => !excludedLikerIds.has(u.id));
    }
  }

  const shuffled = [...likerCandidates].sort(() => Math.random() - 0.5);
  const likeCount = Math.floor(Math.random() * 4) + 3; // 3 to 6 likes

  const likeDelays = [2000, 5000, 11000, 18000, 27000, 39000, 52000];

  for (let i = 0; i < likeCount && i < shuffled.length; i++) {
    const liker = shuffled[i];
    const delay = likeDelays[i] + Math.floor(Math.random() * 2000);

    setTimeout(() => {
      if (isGroup && groupId) {
        dispatch({ type: 'INCREMENT_GROUP_POST_LIKES', groupId, postId });
      } else {
        dispatch({ type: 'INCREMENT_POST_LIKES', postId });

        // Add like notification for the first 2 likes
        if (i < 2) {
          dispatch({
            type: 'ADD_NOTIFICATION',
            notification: {
              id: `notif-like-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              message: `${liker.name} polubił(a) Twój post.`,
              isRead: false,
              timestamp: new Date().toISOString(),
              type: 'like',
              link: { type: 'post', postId },
            },
          });
        }
      }
    }, delay);
  }
}

function executeRuleBasedPostComment(
  dispatch: Dispatch,
  postId: string,
  author: any,
  text: string,
  delay: number
): void {
  setTimeout(() => {
    const comment: Comment = {
      id: `auto-c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
      },
      text,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COMMENT', postId, comment });

    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        message: `${author.name} skomentował(a) Twój post.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        type: 'comment',
        link: { type: 'post', postId },
      },
    });
  }, delay);
}

/**
 * Generate a contextual response text based on user's post content.
 * Used by the scenario engine for dynamic scenario steps.
 */
export function generateContextualResponse(userContent: string, responderId: string): string {
  const context = analyzeContext(userContent);

  // Try context templates for the responder
  const templates = contextualChatTemplates[responderId];
  if (templates) {
    const pool = templates[context.sentiment];
    if (pool && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // Generic contextual responses
  const generic: Record<Sentiment, string[]> = {
    positive: ['Super! 🎉', 'Świetna wiadomość! 👍', 'Cieszę się! 🌟'],
    negative: ['Trzymaj się! 💛', 'Głowa do góry! 🤗', 'Dasz radę! 💪'],
    neutral: ['Ciekawe! 🤔', 'Rozumiem 👍', 'Ok, brzmi dobrze!'],
    funny: ['Haha, dobre! 😂', 'Niezłe! 😄', 'Padłem! 🤣'],
    question: ['Hmm, dobre pytanie! 🤔', 'Muszę to przemyśleć...', 'Ciekawy problem! 🧐'],
    vulgar: ['Proszę, trochę kultury...', 'Hmm, nie wiem co na to powiedzieć...'],
  };

  const pool = generic[context.sentiment];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Schedule admin verification response after a user requests to join a restricted group.
 */
export function scheduleGroupJoinAdminResponse(
  dispatch: Dispatch,
  group: Group,
  currentUser: User,
  messages: MessageThread[]
): void {
  const adminId = group.adminId;
  if (!adminId) return;

  const admin = allUsers.find(u => u.id === adminId) || group.members.find(m => m.id === adminId);
  if (!admin) return;

  // Ensure thread exists
  const existingThread = messages.find(m => m.participant.id === admin.id);
  const threadId = existingThread?.threadId || `t_${admin.id}`;
  if (!existingThread) {
    dispatch({
      type: 'CREATE_THREAD',
      thread: {
        threadId,
        participant: {
          id: admin.id,
          name: admin.name,
          avatarUrl: admin.avatarUrl,
          isOnline: true
        },
        messages: []
      }
    });
  }

  // Admin responds after 10-25 seconds
  const delay = 12000 + Math.random() * 8000;
  setTimeout(() => {
    dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

      let adminText = '';
      const userName = currentUser?.name || '';
      const greeting = userName ? `Cześć ${userName}!` : 'Cześć!';

      if (group.id === 'g_szukam') {
        adminText = `${greeting} Widzę Twoją prośbę o dołączenie do grupy "${group.name}". Zanim Cię zaakceptuję, napisz proszę w kilku słowach: dlaczego chcesz dołączyć i w jaki sposób możesz pomóc w poszukiwaniach?`;
      } else if (group.id === 'g_anty_prime') {
        adminText = `Widzę Twoją prośbę o dołączenie do "${group.name}". Nie przyjmujemy każdego z ulicy - PrimeCo ma wszędzie swoich szpiegów. Jeśli chcesz być jednym z nas, musisz udowodnić swoją lojalność. Napisz post szkalujący Profesora Prime'a na swoim wallu (tablicy głównej). Dopiero wtedy Cię zaakceptuję.`;
      } else {
        adminText = `${greeting} Widzę Twoją prośbę o dołączenie do grupy "${group.name}". Napisz proszę krótko, co Cię do nas sprowadza?`;
      }

      const msg: Message = {
        id: `admin-req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: admin.id,
        text: adminText,
        timestamp: new Date().toISOString()
      };

      dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: msg });

      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: `n-join-req-${Date.now()}`,
          type: 'group',
          message: `${admin.name} napisał(a) do Ciebie w sprawie prośby o dołączenie do grupy "${group.name}".`,
          timestamp: new Date().toISOString(),
          isRead: false,
          link: { type: 'chat', threadId }
        }
      });
    }, 2500);
  }, delay);
}
