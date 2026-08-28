import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { AppState } from '../types';
import type { QuestStage, QuestState } from '../types/quest';
import type { QuestToastItem } from '../components/Toast/ToastContainer';
import { useDailyChallengeState } from './useDailyChallengeState';

export function useQuestSystem(state: AppState) {
  const { levelInfo } = useDailyChallengeState();
  const [toasts, setToasts] = useState<QuestToastItem[]>([]);
  const seenCompletedSubtasksRef = useRef<Set<string>>(new Set());
  const seenCompletedStagesRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  const questState: QuestState = useMemo(() => {
    const marinetteThread = state.messages.find(t => t.participant.id === 'u_marinette');
    const damianThread = state.messages.find(t => t.participant.id === 'u_damian');
    const primeThread = state.messages.find(t => t.participant.id === 'u14');

    // Activation condition: player received first message from Marinette or interacted
    const isActivated = Boolean(marinetteThread && marinetteThread.messages.length > 0);

    // Stage 1 subtasks
    const s1_sub1 = Boolean(marinetteThread && marinetteThread.messages.some(m => m.senderId === state.currentUser.id));
    const s1_sub2 = Boolean(s1_sub1 && state.groups.find(g => g.id === 'g_szukam')?.isMember);
    const s1_sub3 = Boolean(s1_sub2 && state.likedPosts['gp_missing_1']);
    const s1_completed = Boolean(s1_sub1 && s1_sub2 && s1_sub3);

    // Stage 2 subtasks
    const s2_sub1 = Boolean(s1_completed && marinetteThread?.messages.some(m => m.text.includes('Widziałam te okropne') || m.text.includes('recenzje')));
    const s2_sub2 = Boolean(s2_sub1);
    const s2_completed = Boolean(s1_completed && s2_sub1 && s2_sub2);

    // Stage 3 subtasks
    const hasAntiPrimePost = Boolean(state.posts.some(
      p => p.author.id === state.currentUser.id &&
        (p.content.toLowerCase().includes('prime') || p.content.toLowerCase().includes('szarlatan') || p.content.toLowerCase().includes('la hire'))
    ));
    const s3_sub1 = Boolean(s2_completed && (state.pendingGroupJoins.has('g_anty_prime') || state.groups.find(g => g.id === 'g_anty_prime')?.isMember));
    const s3_sub2 = Boolean(s3_sub1 && (hasAntiPrimePost || state.groups.find(g => g.id === 'g_anty_prime')?.isMember || state.isBanned));
    const s3_sub3 = Boolean(s3_sub2 && (state.groups.find(g => g.id === 'g_anty_prime')?.isMember || state.isBanned || state.messages.some(t => t.participant.id === 'u_kornel')));
    const s3_completed = Boolean(s2_completed && s3_sub1 && s3_sub2 && s3_sub3);

    // Stage 4 subtasks
    const s4_sub1 = Boolean(s3_completed && damianThread && damianThread.messages.length > 0);
    const s4_sub2 = Boolean(s4_sub1 && levelInfo.level >= 5);
    const s4_sub3 = Boolean(s4_sub2 && !state.isBanned && damianThread?.messages.some(m => m.text.includes('zdjęty') || m.text.includes('odwoławczy') || m.text.includes('pełen dostęp')));
    const s4_completed = Boolean(s3_completed && s4_sub1 && s4_sub2 && s4_sub3);

    // Stage 5 subtasks
    const s5_sub1 = Boolean(s4_completed && !state.isBanned);
    const s5_sub2 = Boolean(s5_sub1 && (
      marinetteThread?.messages.some(m => m.text.includes('Matyld') || m.text.includes('liceum') || m.text.includes('klasy')) ||
      state.pendingFriends.has('u_matylda') ||
      state.friends.has('u_matylda')
    ));
    const s5_completed = Boolean(s4_completed && s5_sub1 && s5_sub2);

    // Stage 6 subtasks
    const s6_sub1 = Boolean(s5_completed && (state.pendingFriends.has('u_matylda') || state.friends.has('u_matylda')));
    const s6_sub2 = Boolean(s6_sub1 && (state.friends.has('u_matylda') || state.primeChatUnlocked || primeThread));
    const s6_sub3 = Boolean(s6_sub2 && (state.primeChatUnlocked || primeThread));
    const s6_completed = Boolean(s5_completed && s6_sub1 && s6_sub2 && s6_sub3);

    // Stage 7 subtasks
    const s7_sub1 = Boolean(s6_completed && primeThread && primeThread.messages.some(m => m.senderId === state.currentUser.id));
    const s7_sub2 = Boolean(s7_sub1 && primeThread?.messages.some(m => m.text.includes('Fabryka Twarzy') || m.text.includes('@instytutnowejnauki') || m.text.includes('2026')));
    const s7_completed = Boolean(s6_completed && s7_sub1 && s7_sub2);

    const stages: QuestStage[] = [
      {
        id: 'stage_1',
        stageNumber: 1,
        title: 'Zniknięcie w Grand Rex',
        subtitle: 'Tajemniczy telefon i pusta kabina',
        description: 'Twoja znajoma Marinette szuka zaginionej przyjaciółki, Natalie Chalamet, która zniknęła podczas seansu w kinie.',
        rewardText: 'Dostęp do grupy poszukiwawczej i pierwsze poszlaki',
        icon: 'AlertTriangle',
        isCompleted: s1_completed,
        isActive: isActivated && !s1_completed,
        isLocked: !isActivated,
        subtasks: [
          {
            id: 'st_1_1',
            title: 'Odpowiedz Marinette na czacie',
            description: 'Nawiąż kontakt z Marinette i zadeklaruj pomoc w poszukiwaniach.',
            hint: 'Otwórz okno wiadomości z Marinette Dupont.',
            isCompleted: s1_sub1,
          },
          {
            id: 'st_1_2',
            title: 'Dołącz do grupy „Szukam osoby - pomoc”',
            description: 'Wyślij prośbę o dołączenie do grupy poszukiwawczej i uzyskaj akceptację Oli Kamińskiej.',
            hint: 'Znajdź grupę w menu i odpowiedz Oli na pytania weryfikacyjne.',
            isCompleted: s1_sub2,
          },
          {
            id: 'st_1_3',
            title: 'Polub apel Marinette o zaginionej Natalie',
            description: 'Wyraź wsparcie pod głównym postem poszukiwawczym w grupie.',
            hint: 'Kliknij „Lubię to” pod wpisem Marinette w grupie poszukiwawczej.',
            isCompleted: s1_sub3,
          },
        ],
      },
      {
        id: 'stage_2',
        stageNumber: 2,
        title: 'Trop Kinowej Krytyczki',
        subtitle: 'Kontrowersyjne recenzje i teoria porwania',
        description: 'Komentarze sugerują, że bezkompromisowe wpisy Natalie w grupie filmowej mogły przysporzyć jej niebezpiecznych wrogów.',
        rewardText: 'Wskazówka prowadząca do podziemnego ruchu oporu',
        icon: 'Clapperboard',
        isCompleted: s2_completed,
        isActive: s1_completed && !s2_completed,
        isLocked: !s1_completed,
        subtasks: [
          {
            id: 'st_2_1',
            title: 'Odwiedź grupę „Filmowe polecajki”',
            description: 'Przejrzyj posty i odszukaj recenzję Natalie o seansie w Le Grand Rex.',
            hint: 'Przejdź do grupy Filmowe polecajki w lewym panelu.',
            isCompleted: s2_sub1,
          },
          {
            id: 'st_2_2',
            title: 'Zbadaj komentarze grupy „STOP Szarlatanom”',
            description: 'Sprawdź, kto kontaktował się z Natalie pod jej wpisem uderzającym w PrimeCo.',
            hint: 'Zwróć uwagę na komentarz Kornela Zagórskiego pod recenzją Natalie.',
            isCompleted: s2_sub2,
          },
        ],
      },
      {
        id: 'stage_3',
        stageNumber: 3,
        title: 'W Paszczy Lwa',
        subtitle: 'Infiltracja grupy anty-PrimeCo',
        description: 'Aby dowiedzieć się, co łączyło Natalie z oporem, musisz wkupić się w łaski Kornela Zagórskiego.',
        rewardText: 'Przyjęcie do grupy oporu i corporate backlash',
        icon: 'ShieldAlert',
        isCompleted: s3_completed,
        isActive: s2_completed && !s3_completed,
        isLocked: !s2_completed,
        subtasks: [
          {
            id: 'st_3_1',
            title: 'Poproś o dołączenie do „STOP Szarlatanom”',
            description: 'Zgłoś chęć wstąpienia do zamkniętej grupy oporu.',
            hint: 'Odszukaj grupę STOP Szarlatanom i poproś o dołączenie.',
            isCompleted: s3_sub1,
          },
          {
            id: 'st_3_2',
            title: 'Opublikuj post demaskujący PrimeCo',
            description: 'Napisz na swojej tablicy post krytykujący Profesora Prime\'a, by udowodnić lojalność.',
            hint: 'Dodaj wpis na feedzie zawierający słowa o PrimeCo / szarlatanach.',
            isCompleted: s3_sub2,
          },
          {
            id: 'st_3_3',
            title: 'Uzyskaj akceptację Kornela Zagórskiego',
            description: 'Poczekaj na weryfikację i dołącz do społeczności oporu.',
            hint: 'Kornel zaakceptuje Twoje zgłoszenie po opublikowaniu postu.',
            isCompleted: s3_sub3,
          },
        ],
      },
      {
        id: 'stage_4',
        stageNumber: 4,
        title: 'Korporacyjna Blokada',
        subtitle: 'ToS § 12.3 i luka prawna w wyzwaniach',
        description: 'Twoje konto zostało zablokowane za szkalowanie PrimeCo. Damian Wilk zna sposób na obejście bana.',
        rewardText: 'Odwieszenie konta i powrót do serwisu',
        icon: 'Ban',
        isCompleted: s4_completed,
        isActive: s3_completed && !s4_completed,
        isLocked: !s3_completed,
        subtasks: [
          {
            id: 'st_4_1',
            title: 'Odbierz wiadomość od Damiana Wilka',
            description: 'Dowiedz się o procedurze przyspieszonego odwołania z punktu 8.4 regulaminu.',
            hint: 'Damian napisze na czacie krótko po zablokowaniu konta.',
            isCompleted: s4_sub1,
          },
          {
            id: 'st_4_2',
            title: 'Zdobądź Poziom 5 w Dziennych Wyzwaniach',
            description: 'Rozwiązuj codzienne zagadki i zbierz 750 XP w zakładce Daily Challenge.',
            hint: 'Kliknij „Wyzwanie dnia” w menu bocznym i zdobywaj poziomy.',
            isCompleted: s4_sub2,
          },
          {
            id: 'st_4_3',
            title: 'Zdejmij blokadę konta',
            description: 'Damian uruchomi skrypt odwoławczy i przywróci pełne uprawnienia konta.',
            hint: 'Po osiągnięciu 5. poziomu ban zniknie automatycznie.',
            isCompleted: s4_sub3,
          },
        ],
      },
      {
        id: 'stage_5',
        stageNumber: 5,
        title: 'Głos Przeciwko Prorokowi',
        subtitle: 'Stary manifest Natalie i ślad Matyldy',
        description: 'W odblokowanej grupie odkrywasz archiwalny wpis Natalie. Marinette kojarzy nazwisko osoby bliskiej Profesorowi.',
        rewardText: 'Namiar na Matyldę Iggermann (licealną znajomą)',
        icon: 'FileText',
        isCompleted: s5_completed,
        isActive: s4_completed && !s5_completed,
        isLocked: !s4_completed,
        subtasks: [
          {
            id: 'st_5_1',
            title: 'Odszukaj wpis Natalie w „STOP Szarlatanom”',
            description: 'Przeczytaj jej wypowiedź o bezradności świata wobec rzekomych wizji przyszłości.',
            hint: 'Wejdź do grupy STOP Szarlatanom po odblokowaniu konta.',
            isCompleted: s5_sub1,
          },
          {
            id: 'st_5_2',
            title: 'Porozmawiaj z Marinette o Matyldzie',
            description: 'Przekaż Marinette informację o manifeście i dowiedz się o jej koleżance z mat-fizu.',
            hint: 'Napisz do Marinette o znalezisku w grupie.',
            isCompleted: s5_sub2,
          },
        ],
      },
      {
        id: 'stage_6',
        stageNumber: 6,
        title: 'Klucz do Profesora',
        subtitle: 'Konfrontacja z doktorantką Sorbony',
        description: 'Matylda Iggermann to jedyna osoba mająca bezpośredni kontakt z Profesorem Prime\'em. Musisz zyskać jej zaufanie.',
        rewardText: 'Autoryzacja bezpiecznego kanału z Profesorem Prime',
        icon: 'Key',
        isCompleted: s6_completed,
        isActive: s5_completed && !s6_completed,
        isLocked: !s5_completed,
        subtasks: [
          {
            id: 'st_6_1',
            title: 'Wyślij zaproszenie do Matyldy Iggermann',
            description: 'Odszukaj profil Matyldy i dodaj ją do znajomych.',
            hint: 'Znajdź Matyldę w wyszukiwarce lub grupie Mat-Fiz LO.',
            isCompleted: s6_sub1,
          },
          {
            id: 'st_6_2',
            title: 'Wytłumacz swoje intencje na czacie',
            description: 'Wyjaśnij oburzonej Matyldzie, że anty-korporacyjny post był tylko przykrywką.',
            hint: 'Napisz na czacie, że szukasz Natalie, która zniknęła w kinie.',
            isCompleted: s6_sub2,
          },
          {
            id: 'st_6_3',
            title: 'Uzyskaj autoryzację do Profesora Prime',
            description: 'Matylda zaakceptuje znajomość i połączy Cię z Nicolasem de La Hire.',
            hint: 'Poczekaj na zakończenie rozmowy z Matyldą.',
            isCompleted: s6_sub3,
          },
        ],
      },
      {
        id: 'stage_7',
        stageNumber: 7,
        title: 'Prawda o Nowej Nauce',
        subtitle: 'Audiencja u Profesora & Fabryka Twarzy',
        description: 'Ostateczna rozmowa z CEO PrimeCo. Prawda o naturze tożsamości i losie Natalie Chalamet.',
        rewardText: 'Finałowe odkrycie i ujawnienie komiksu Fabryka Twarzy',
        icon: 'Sparkles',
        isCompleted: s7_completed,
        isActive: s6_completed && !s7_completed,
        isLocked: !s6_completed,
        subtasks: [
          {
            id: 'st_7_1',
            title: 'Skontaktuj się z Profesorem Prime',
            description: 'Napisz do Nicolasa de La Hire na odblokowanym, bezpiecznym kanale.',
            hint: 'Otwórz czat z Nicolasem de La Hire (Profesor Prime).',
            isCompleted: s7_sub1,
          },
          {
            id: 'st_7_2',
            title: 'Poznaj prawdę o Fabryce Twarzy',
            description: 'Wysłuchaj wyjaśnień Profesora o tożsamości jako masce i zapowiedzi powieści graficznej.',
            hint: 'Dokończ dialog finałowy z Profesorem Prime.',
            isCompleted: s7_sub2,
          },
        ],
      },
    ];

    let completedSubtasks = 0;
    let totalSubtasks = 0;
    let currentStage = 1;

    stages.forEach(st => {
      st.subtasks.forEach(sub => {
        totalSubtasks++;
        if (sub.isCompleted) completedSubtasks++;
      });
      if (st.isCompleted && currentStage <= st.stageNumber && st.stageNumber < 7) {
        currentStage = st.stageNumber + 1;
      }
    });

    const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    const activeStage = stages.find(s => s.isActive);
    const activeStageTotal = activeStage ? activeStage.subtasks.length : 0;
    const activeStageCompleted = activeStage ? activeStage.subtasks.filter(s => s.isCompleted).length : 0;
    const activeStagePercent = activeStageTotal > 0
      ? Math.round((activeStageCompleted / activeStageTotal) * 100)
      : (isActivated ? 100 : 0);

    return {
      isActivated,
      currentStageNumber: currentStage,
      stages,
      completedSubtaskCount: completedSubtasks,
      totalSubtaskCount: totalSubtasks,
      progressPercent,
      activeStagePercent,
      activeStageCompletedSubtasks: activeStageCompleted,
      activeStageTotalSubtasks: activeStageTotal,
    };
  }, [state, levelInfo.level]);

  // Handle toast notifications for newly completed tasks & stages
  useEffect(() => {
    if (!questState.isActivated) return;

    // First mount initialization to avoid blasting toasts on reload
    if (!hasInitializedRef.current) {
      questState.stages.forEach(st => {
        if (st.isCompleted) seenCompletedStagesRef.current.add(st.id);
        st.subtasks.forEach(sub => {
          if (sub.isCompleted) seenCompletedSubtasksRef.current.add(sub.id);
        });
      });
      hasInitializedRef.current = true;
      return;
    }

    const newToasts: QuestToastItem[] = [];

    questState.stages.forEach(st => {
      st.subtasks.forEach(sub => {
        if (sub.isCompleted && !seenCompletedSubtasksRef.current.has(sub.id)) {
          seenCompletedSubtasksRef.current.add(sub.id);
          newToasts.push({
            id: `toast-sub-${sub.id}-${Date.now()}`,
            type: 'subtask_completed',
            category: `Etap ${st.stageNumber}: Cel Zrealizowany`,
            title: sub.title,
            description: sub.description,
          });
        }
      });

      if (st.isCompleted && !seenCompletedStagesRef.current.has(st.id)) {
        seenCompletedStagesRef.current.add(st.id);
        newToasts.push({
          id: `toast-stage-${st.id}-${Date.now()}`,
          type: 'stage_completed',
          category: 'Ukończono Rozdział Fabularny! 🏆',
          title: `Rozdział ${st.stageNumber}: ${st.title}`,
          description: st.rewardText,
        });
      }
    });

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts]);
    }
  }, [questState]);

  // Auto-dismiss toasts after 4.5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 4500);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    questState,
    toasts,
    dismissToast,
  };
}
