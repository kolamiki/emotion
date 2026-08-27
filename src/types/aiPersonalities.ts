export interface PersonalityTraits {
  openness: number;         // 0.0 - 1.0 (ciekawość, otwartość na nowe idee)
  conscientiousness: number;// 0.0 - 1.0 (skrupulatność, zdyscyplinowanie)
  extraversion: number;     // 0.0 - 1.0 (ekstrawertyzm vs introwertyzm)
  agreeableness: number;    // 0.0 - 1.0 (ugodowość, empatia vs chłód/krytycyzm)
  neuroticism: number;      // 0.0 - 1.0 (emocjonalność, skłonność do stresu/irytacji)
  patience: number;         // 0.0 - 1.0 (cierpliwość w rozmowie)
  humor: number;            // 0.0 - 1.0 (poczucie humoru, skłonność do żartów/sarkazmu)
}

export interface CommunicationStyle {
  tone: string;             // np. "bezpośredni, profesjonalny, lekko chłodny"
  sentenceLength: string;   // np. "krótkie, zwięzłe zdania" | "rozbudowane, barwne opisy"
  vocabulary: string;       // np. "język potoczny, młodzieżowy" | "specjalistyczny, naukowy"
  useEmojis: boolean | 'rarely' | 'frequently';
  catchphrases?: string[];  // charakterystyczne powiedzonka
}

export interface AIPersonalityConfig {
  id: string;               // userId pasujące do allUsers (np. "u2", "u14", "u_matylda")
  name: string;
  role: string;
  bio: string;
  traits: PersonalityTraits;
  communicationStyle: CommunicationStyle;
  background: string;       // Kim jest postać, czym się zajmuje, co przeżyła
  hiddenMotives?: string;   // Cele postaci w rozmowie (np. ukrywanie tajemnicy, badanie rozmówcy)
  knowledgeBase?: string[]; // Dziedziny wiedzy, w których czuje się swobodnie
  rules: string[];          // Ścisłe zasady zachowania w rozmowie
  messageLimit?: number;    // Limit wiadomości od usera przed pożegnaniem (20-50)
  farewellMessage?: string; // Pożegnanie w charakterze postaci po osiągnięciu limitu
  offlineMessage?: string;  // Auto-odpowiedź po osiągnięciu limitu (status offline)
}

export interface AIPersonalitiesData {
  personalities: Record<string, AIPersonalityConfig>;
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestPayload {
  personalityId: string;
  systemPrompt: string;
  messages: ChatMessagePayload[];
}

export interface AIResponsePayload {
  reply: string;
  model?: string;
  usage?: {
    totalTokens?: number;
  };
}
