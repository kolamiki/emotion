import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Users,
  MessageCircle,
  Bell,
  Smile,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
} from 'lucide-react';
import styles from './TutorialOverlay.module.css';

export interface TourStep {
  id: string;
  targetId: string | ((isMobile: boolean, isTablet: boolean) => string);
  title: string;
  description: string;
  icon: React.ReactNode;
  placement: 'bottom' | 'top' | 'left' | 'right' | 'center';
  requiresMobileSidebar?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome_intro',
    targetId: '',
    title: 'Witaj ponownie w serwisie eMotion!',
    description:
      'Od Twojej ostatniej wizyty wprowadziliśmy kilka istotnych zmian w wyglądzie i działaniu naszej platformy. Przygotowaliśmy krótki przewodnik, który pomoże Ci poznać nowości i najważniejsze moduły serwisu.',
    icon: <Smile size={20} />,
    placement: 'center',
    requiresMobileSidebar: false,
  },
  {
    id: 'feed',
    targetId: 'tour-feed',
    title: 'Główny Feed i Posty',
    description:
      'W centralnej części serwisu widzisz najnowsze wpisy społeczności eMotion. Możesz reagować na posty różnorodnymi emocjami, komentować oraz tworzyć własne wpisy za pomocą panelu publikacji.',
    icon: <Newspaper size={20} />,
    placement: 'bottom',
    requiresMobileSidebar: false,
  },
  {
    id: 'groups',
    targetId: 'tour-groups',
    title: 'Grupy i Społeczności',
    description:
      'W lewym panelu znajdziesz grupy tematyczne (np. Filmowe polecajki czy dobrze znane Kupię/Sprzedam). Przeglądaj archiwalne posty, proś o dołączenie i przypinaj ulubione grupy do szybkiego menu.',
    icon: <Users size={20} />,
    placement: 'right',
    requiresMobileSidebar: true,
  },
  {
    id: 'friends',
    targetId: (_isMobile, isTablet) => (isTablet ? 'btn-messages' : 'tour-friends'),
    title: 'Komunikator i Znajomi',
    description:
      'Śledź listę swoich kontaktów oraz użytkowników online. Kliknij na profil dowolnego znajomego, aby otworzyć okno bezpośredniego czatu i prowadzić rozmowy w czasie rzeczywistym.',
    icon: <MessageCircle size={20} />,
    placement: 'left',
    requiresMobileSidebar: false,
  },
  {
    id: 'topbar',
    targetId: 'tour-topbar',
    title: 'Wyszukiwarka i Powiadomienia',
    description:
      'W górnym pasku szybko wyszukasz znajomych i grupy, sprawdzisz najświeższe powiadomienia o reakcjach i odpowiedziach oraz zyskasz szybki dostęp do profilu.',
    icon: <Bell size={20} />,
    placement: 'bottom',
    requiresMobileSidebar: false,
  },
  {
    id: 'daily_challenge',
    targetId: 'tour-daily-challenge',
    title: 'Wyzwania Dnia i Zadania Fabularne',
    description:
      'Rozwiązuj codzienne łamigłówki, zdobywaj punkty doświadczenia (XP) i podnoś poziom konta. Miej oczy szeroko otwarte – w eMotion każda wiadomość i wpis mogą kryć intrygujące poszlaki!',
    icon: <Compass size={20} />,
    placement: 'right',
    requiresMobileSidebar: true,
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  onStepChange?: (stepIndex: number, step: TourStep) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  onComplete,
  onStepChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Notify parent component on step change (e.g. for opening/closing mobile drawer)
  useEffect(() => {
    if (isOpen && currentStep) {
      onStepChange?.(currentStepIndex, currentStep);
    }
  }, [isOpen, currentStepIndex, currentStep, onStepChange]);

  // Update spotlight rect based on target element
  const updateSpotlightPosition = useCallback(() => {
    if (!currentStep || currentStep.placement === 'center') {
      setSpotlightRect(null);
      return;
    }

    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1100;

    const targetId =
      typeof currentStep.targetId === 'function'
        ? currentStep.targetId(isMobile, isTablet)
        : currentStep.targetId;

    if (!targetId) {
      setSpotlightRect(null);
      return;
    }

    const element = document.getElementById(targetId);
    if (!element) {
      setSpotlightRect(null);
      return;
    }

    // Scroll element smoothly into view if out of viewport
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = element.getBoundingClientRect();
    const padding = 8;

    const top = Math.max(0, rect.top - padding);
    const left = Math.max(0, rect.left - padding);
    const width = Math.min(window.innerWidth - left, rect.width + padding * 2);
    const height = Math.min(window.innerHeight - top, rect.height + padding * 2);

    if (width > 0 && height > 0) {
      setSpotlightRect({ top, left, width, height });
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep]);

  // Recalculate on step change, resize, scroll, and throughout drawer slide animations
  useEffect(() => {
    if (!isOpen) return;

    updateSpotlightPosition();

    const handleResize = () => updateSpotlightPosition();
    const handleScroll = () => updateSpotlightPosition();
    const handleTransitionEnd = () => updateSpotlightPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('transitionend', handleTransitionEnd, true);

    // Continuous tracking during CSS drawer animation (0-600ms)
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 600; // Track across entire 300ms drawer transition + buffer

    const trackMovingElement = (now: number) => {
      updateSpotlightPosition();
      if (now - startTime < duration) {
        animationFrameId = requestAnimationFrame(trackMovingElement);
      }
    };
    animationFrameId = requestAnimationFrame(trackMovingElement);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('transitionend', handleTransitionEnd, true);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, currentStepIndex, updateSpotlightPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Compute card style based on placement & spotlight position
  const getCardStyle = (): React.CSSProperties => {
    const cardWidth = Math.min(460, window.innerWidth - 32);
    const cardHeightEst = 260;
    const margin = 16;

    // Mobile layout
    if (window.innerWidth <= 768) {
      if (!spotlightRect || currentStep.placement === 'center') {
        return {
          top: '50%',
          left: '16px',
          right: '16px',
          transform: 'translateY(-50%)',
          width: 'auto',
        };
      }
      if (spotlightRect.top > window.innerHeight / 2) {
        // Element is at bottom -> dock card at top
        return {
          top: '72px',
          bottom: 'auto',
          left: '16px',
          right: '16px',
          width: 'auto',
        };
      } else {
        // Element is at top -> dock card at bottom
        return {
          bottom: '16px',
          top: 'auto',
          left: '16px',
          right: '16px',
          width: 'auto',
        };
      }
    }

    // Centered layout (Welcome Intro step)
    if (!spotlightRect || currentStep.placement === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${cardWidth}px`,
      };
    }

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'bottom': {
        top = spotlightRect.top + spotlightRect.height + margin;
        left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2;
        break;
      }
      case 'right': {
        top = spotlightRect.top + 20;
        left = spotlightRect.left + spotlightRect.width + margin;
        break;
      }
      case 'left': {
        top = spotlightRect.top + 20;
        left = spotlightRect.left - cardWidth - margin;
        break;
      }
      case 'top': {
        top = spotlightRect.top - cardHeightEst - margin;
        left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2;
        break;
      }
      default: {
        top = spotlightRect.top + 20;
        left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2;
      }
    }

    // Clamp inside viewport
    left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, left));
    top = Math.max(margin, Math.min(window.innerHeight - cardHeightEst - margin, top));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  };

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const nextButtonText = isLastStep
    ? 'Rozpocznij przygodę'
    : currentStepIndex === 0
      ? 'Rozpocznij przewodnik'
      : 'Dalej';

  return (
    <div className={styles.tourRoot} aria-modal="true" role="dialog">
      {/* Click blocker backdrop (no blur, clean dim) */}
      <div className={styles.backdropBlocker} onClick={e => e.stopPropagation()} />

      {/* Spotlight cutout highlight box */}
      {spotlightRect && (
        <div
          className={styles.spotlightHighlight}
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div className={styles.tourCard} style={getCardStyle()}>
        {/* Header */}
        <div className={styles.tourHeader}>
          <div className={styles.tourHeaderLeft}>
            <div className={styles.stepBadge}>
              <Compass size={13} className={styles.stepBadgeIcon} />
              <span>Samouczek eMotion</span>
            </div>
            <span className={styles.stepNumberText}>
              {currentStepIndex + 1} z {TOUR_STEPS.length}
            </span>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onComplete}
            title="Pomiń samouczek"
            aria-label="Zamknij samouczek"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.tourBody}>
          <div className={styles.titleRow}>
            <div className={styles.iconCircle}>{currentStep.icon}</div>
            <h3 className={styles.stepTitle}>{currentStep.title}</h3>
          </div>
          <p className={styles.stepDesc}>{currentStep.description}</p>
        </div>

        {/* Footer with Controls */}
        <div className={styles.tourFooter}>
          {/* Progress dots & Skip button */}
          <div className={styles.footerMetaRow}>
            <div className={styles.dotsRow}>
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  className={`${styles.dot} ${idx === currentStepIndex ? styles.dotActive : ''}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  title={step.title}
                  aria-label={`Przejdź do kroku ${idx + 1}`}
                />
              ))}
            </div>

            {!isLastStep && (
              <button className={styles.skipBtn} onClick={onComplete}>
                Pomiń
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className={styles.actionsRow}>
            {currentStepIndex > 0 && (
              <button className={styles.prevBtn} onClick={handlePrev} title="Poprzedni krok">
                <ChevronLeft size={16} />
                <span>Wstecz</span>
              </button>
            )}

            <button className={styles.nextBtn} onClick={handleNext} autoFocus>
              <span>{nextButtonText}</span>
              {isLastStep ? <Rocket size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
