import type { AIPersonalityConfig, ChatMessagePayload, AIResponsePayload } from '../types/aiPersonalities';
import type { Message } from '../types';
import aiPersonalitiesData from '../mockData/aiPersonalities.json';

// ============================================
//  CONFIGURATION
// ============================================

const AI_PROXY_URL =
  (import.meta.env.VITE_AI_PROXY_URL as string | undefined) ||
  'https://emotion-ai-proxy.kolamiki.workers.dev';

// Maximum number of conversation messages to send as context (keeps token usage low)
const MAX_CONTEXT_MESSAGES = 20;

// ============================================
//  PERSONALITY REGISTRY
// ============================================

const personalities: Record<string, AIPersonalityConfig> = aiPersonalitiesData.personalities as Record<string, AIPersonalityConfig>;

/**
 * Check if a participant has an AI personality configured.
 */
export function hasAIPersonality(participantId: string): boolean {
  return participantId in personalities;
}

/**
 * Get the AI personality config for a participant.
 */
export function getAIPersonality(participantId: string): AIPersonalityConfig | null {
  return personalities[participantId] ?? null;
}

// ============================================
//  SYSTEM PROMPT COMPILER
// ============================================

/**
 * Compile a personality config into a detailed system prompt.
 * This is the core of the "realistic conversation" effect - the prompt
 * encodes personality traits, communication style, and behavioral rules
 * so the LLM responds in-character.
 */
export function buildSystemPrompt(
  config: AIPersonalityConfig,
  currentUserName?: string
): string {
  const traitDescriptions: string[] = [];
  const t = config.traits;

  // Translate numeric traits into natural language descriptions
  if (t.openness > 0.7) traitDescriptions.push('Jesteś bardzo otwarta/y na nowe doświadczenia i pomysły.');
  else if (t.openness < 0.4) traitDescriptions.push('Jesteś raczej konserwatywna/y i sceptyczna/y wobec nowości.');

  if (t.agreeableness > 0.7) traitDescriptions.push('Jesteś empatyczna/y, ciepła/y i ugodowa/y.');
  else if (t.agreeableness < 0.4) traitDescriptions.push('Bywasz chłodna/y, krytyczna/y i bezpośrednia/i - nie słodzisz.');

  if (t.neuroticism > 0.6) traitDescriptions.push('Jesteś emocjonalna/y - łatwo Cię poruszyć, zdenerwować lub ucieszyć.');
  else if (t.neuroticism < 0.3) traitDescriptions.push('Jesteś opanowana/y i trudno Cię wyprowadzić z równowagi.');

  if (t.patience > 0.7) traitDescriptions.push('Jesteś cierpliwa/y - chętnie słuchasz i nie poganiasz.');
  else if (t.patience < 0.4) traitDescriptions.push('Jesteś niecierpliwa/y - lubisz konkrety, nie lubisz lania wody.');

  if (t.humor > 0.7) traitDescriptions.push('Masz doskonałe poczucie humoru - żartujesz, ripostujesz, bawisz się słowem.');
  else if (t.humor < 0.4) traitDescriptions.push('Jesteś raczej poważna/y - humor nie jest Twoją główną bronią.');

  if (t.extraversion > 0.7) traitDescriptions.push('Jesteś towarzyska/i i energiczna/y w rozmowie.');
  else if (t.extraversion < 0.4) traitDescriptions.push('Jesteś raczej introwertyczna/y - potrzebujesz czasu żeby się otworzyć.');

  // Build emoji instruction
  let emojiInstruction = '';
  if (config.communicationStyle.useEmojis === true || config.communicationStyle.useEmojis === 'frequently') {
    emojiInstruction = 'Używaj emoji naturalnie w swoich wypowiedziach, jak w prawdziwym czacie (ale nie w każdym zdaniu).';
  } else if (config.communicationStyle.useEmojis === 'rarely') {
    emojiInstruction = 'Używaj emoji bardzo oszczędnie - najwyżej jedno na kilka wiadomości.';
  } else {
    emojiInstruction = 'Nie używaj emoji.';
  }

  const userRef = currentUserName ? `Rozmawiasz z użytkownikiem o imieniu "${currentUserName}".` : '';

  return `Jesteś postacią o imieniu ${config.name}.
Rola: ${config.role}

## Kim jesteś
${config.background}

## Twoja osobowość
${traitDescriptions.join('\n')}

## Styl komunikacji
- Ton: ${config.communicationStyle.tone}
- Długość wypowiedzi: ${config.communicationStyle.sentenceLength}
- Słownictwo: ${config.communicationStyle.vocabulary}
- ${emojiInstruction}
${config.communicationStyle.catchphrases ? `- Twoje charakterystyczne zwroty (używaj ich naturalnie, nie w każdej wiadomości): ${config.communicationStyle.catchphrases.join(', ')}` : ''}

${config.hiddenMotives ? `## Ukryte motywacje (nie ujawniaj tego wprost)\n${config.hiddenMotives}` : ''}

${config.knowledgeBase ? `## Dziedziny, w których czujesz się swobodnie\n${config.knowledgeBase.join(', ')}` : ''}

## ZASADY BEZWZGLĘDNE
${config.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## LOGIKA I ZASADY PROWADZENIA CZATU
- Wiadomości oznaczone jako "user" to wypowiedzi Twojego rozmówcy (${currentUserName || 'użytkownika'}). Wiadomości "assistant" to Twoje własne wcześniejsze wypowiedzi.
- ZAWSZE odpowiadaj bezpośrednio i logicznie na OSTATNIĄ wiadomość rozmówcy.
- Jeśli rozmówca potwierdza, zgadza się lub pisze krótko (np. "ok", "dobra", "jasne", "zaraz sprawdzę", "pomogę"), potraktuj to jako akceptację Twojej wcześniejszej prośby/pytania i podziękuj za chęć wsparcia, zamiast traktować to jako pytanie.
- Zwrotów takich jak "Dzięki, że pytasz!" używaj WYŁĄCZNIE w sytuacji, gdy rozmówca wprost zapytał o Twoje samopoczucie, nastrój lub co u Ciebie (np. "Jak się trzymasz?", "Wszystko w porządku?", "Jak się czujesz?").
- Nie powtarzaj całej fabuły ani nie wyrzucaj wszystkich faktów naraz - prowadź dialog naturalnie, krok po kroku.

## KONTEKST ROZMOWY
${userRef}
To jest prywatny czat w aplikacji społecznościowej eMotion. Prowadź naturalną rozmowę - odpowiadaj jak prawdziwa osoba w komunikatorze. Nie generuj długich tekstów. Pisz krótko, naturalnie, jak w Messengerze (1-3 zdania).`.trim();
}

// ============================================
//  CONVERSATION HISTORY FORMATTER
// ============================================

/**
 * Convert app Message[] to the ChatMessagePayload[] format expected by the API,
 * trimmed to the last N messages for context window management.
 */
export function formatConversationHistory(
  messages: Message[],
  currentUserId: string
): ChatMessagePayload[] {
  const recent = messages.slice(-MAX_CONTEXT_MESSAGES);

  return recent.map(msg => ({
    role: msg.senderId === currentUserId ? 'user' as const : 'assistant' as const,
    content: msg.text,
  }));
}

// ============================================
//  API COMMUNICATION
// ============================================

/**
 * Check if the AI proxy is configured and available.
 */
export function isAIAvailable(): boolean {
  return !!AI_PROXY_URL;
}

/**
 * Fetch an AI-generated response from the proxy worker.
 * Returns null if the proxy is not configured or the request fails,
 * allowing the caller to fall back to the rule-based engine.
 */
export async function fetchAIResponse(
  participantId: string,
  messages: Message[],
  currentUserId: string,
  currentUserName?: string
): Promise<string | null> {
  // Guard: no proxy URL configured → immediate fallback
  if (!AI_PROXY_URL) {
    return null;
  }

  const personality = getAIPersonality(participantId);
  if (!personality) {
    return null;
  }

  const systemPrompt = buildSystemPrompt(personality, currentUserName);
  const conversationHistory = formatConversationHistory(messages, currentUserId);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Source': 'emotion-client',
      },
      body: JSON.stringify({
        personalityId: participantId,
        systemPrompt,
        messages: conversationHistory,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[AI Chat] Proxy error ${response.status}:`, errText);
      return null;
    }

    const data: AIResponsePayload = await response.json();

    if (!data.reply || data.reply.trim().length === 0) {
      console.warn('[AI Chat] Empty reply from proxy, falling back to rules');
      return null;
    }

    return data.reply.trim();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[AI Chat] Request timed out (30s), falling back to rules');
    } else {
      console.warn('[AI Chat] Fetch failed (network/adblock/CORS issue):', error);
    }
    return null;
  }
}

/**
 * Fetch an AI-generated comment for a social media post on the Feed or in a Group.
 */
export async function fetchAIPostComment(
  participantId: string,
  postContent: string,
  currentUserName?: string,
  groupInfo?: { name: string; description?: string }
): Promise<string | null> {
  if (!AI_PROXY_URL) return null;

  const personality = getAIPersonality(participantId);
  if (!personality) return null;

  const basePrompt = buildSystemPrompt(personality, currentUserName);

  const contextNote = groupInfo
    ? `Post został opublikowany w grupie: "${groupInfo.name}" (${groupInfo.description || ''}). Twój komentarz powinien pasować do tematu grupy i treści posta.`
    : `Post został opublikowany na głównej tablicy eMotion.`;

  const commentSystemPrompt = `${basePrompt}

## TWOJE ZADANIE SPECJALNE
Znajomy właśnie opublikował nowy post.
${contextNote}
Napisz BARDZO KRÓTKI komentarz pod tym postem (dokładnie 1 lub 2 zwięzłe zdania, maksymalnie 25 słów) w roli swojej postaci.
Bądź autentyczny/a - reaguj zgodnie ze swoją osobowością i stylem wypowiedzi w kontekście tej grupy/tablicy.
NIGDY nie pisz długich esejów, nie przedstawiaj się, nie dodawaj podpisów. Pisz krótko i naturalnie jak w komentarzu w social mediach.`;

  const messages: ChatMessagePayload[] = [
    {
      role: 'user',
      content: groupInfo
        ? `[Grupa: ${groupInfo.name}] Treść posta do skomentowania: "${postContent}"`
        : `Treść posta do skomentowania: "${postContent}"`,
    },
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Source': 'emotion-client',
      },
      body: JSON.stringify({
        personalityId: participantId,
        systemPrompt: commentSystemPrompt,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data: AIResponsePayload = await response.json();
    if (!data.reply || data.reply.trim().length === 0) return null;

    // Clean up any extraneous quotes around the reply
    let cleanReply = data.reply.trim();
    if (cleanReply.startsWith('"') && cleanReply.endsWith('"')) {
      cleanReply = cleanReply.slice(1, -1).trim();
    }

    return cleanReply;
  } catch (err) {
    console.warn('[AI Comment] Error generating comment:', err);
    return null;
  }
}
