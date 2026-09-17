import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Copy, Check, Clock, Share2 } from 'lucide-react';
import styles from './ShareModal.module.css';
import type { Post } from '../../types';

export const INSTAGRAM_SHARE_TEXTS: string[] = [
  "Chcesz dowiedzieć się, dokąd zmierza ludzki umysł i co naprawdę kryje się za tajemnicami Nowej Nauki? Odkryj oficjalne kulisy, niepublikowane materiały i badania z pierwszej ręki na profilu Instytutu!",
  "Nie wszystko da się opowiedzieć w jednym poście... Śledź profil Instytutu Nowej Nauki na Instagramie, aby nie przegapić przedpremierowych materiałów i premierowych zapowiedzi komiksu \"Fabryka Twarzy\"!",
  "Prawda o e-Motion i projektach Profesora Prime'a wychodzi na jaw kawałek po kawałku. Dołącz do obserwujących na Instagramie i bądź zawsze na bieżąco z najnowszymi raportami z laboratorium!",
  "Zainteresował Cię ten temat? Wstąp do społeczności Instytutu Nowej Nauki na Instagramie",
  "Wiedza to najpotężniejsze narzędzie przyszłości. Zobacz, nad czym aktualnie pracują badacze Instytutu Nowej Nauki - zaobserwuj nasz profil na Instagramie!",
  "Szukasz odpowiedzi na pytania, których inni boją się zadać? Instytut Nowej Nauki odsłania karty na Instagramie. Obserwuj profil @instytutnowejnauki i bądź częścią przełomu!",
  "Eksperyment trwa dalej! Najnowsze doniesienia, intrygujące grafiki oraz wieści ze świata Nowej Nauki czekają na Ciebie. Kliknij i zaobserwuj oficjalne konto Instytutu na Instagramie!",
  "Niektóre sekrety wymagają specjalnego formatu. Dołącz do obserwowanych profilu Instytutu Nowej Nauki na Instagramie i śledź rozwój wydarzeń, zanim staną się powszechną wiedzą!"
];

const INSTAGRAM_URL = 'https://www.instagram.com/instytutnowejnauki/';
const INSTAGRAM_HANDLE = '@instytutnowejnauki';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, post }) => {
  const [currentText, setCurrentText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const lastIndexRef = useRef<number>(-1);
  const modalRef = useRef<HTMLDivElement>(null);

  const getRandomText = () => {
    let nextIdx: number;
    if (INSTAGRAM_SHARE_TEXTS.length <= 1) {
      nextIdx = 0;
    } else {
      do {
        nextIdx = Math.floor(Math.random() * INSTAGRAM_SHARE_TEXTS.length);
      } while (nextIdx === lastIndexRef.current);
    }
    lastIndexRef.current = nextIdx;
    return INSTAGRAM_SHARE_TEXTS[nextIdx];
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentText(getRandomText());
      setCopied(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(INSTAGRAM_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenInstagram = () => {
    window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        {/* Header Cover Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerGlow} />
          <div className={styles.badgePill}>
            <Clock size={13} className={styles.badgeIcon} />
            <span>Oficjalny profil badawczy</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Zamknij" title="Zamknij">
            <X size={18} />
          </button>
        </div>

        {/* Profile Identity Bar */}
        <div className={styles.identitySection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarRing}>
              <img
                src="/avatars/InstytutNowejNauki_Logo.png"
                alt="Instytut Nowej Nauki"
                className={styles.avatarImg}
              />
              <div className={styles.instaBadge} title="Instagram">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.identityText}>
            <h3 id="share-modal-title" className={styles.title}>Instytut Nowej Nauki</h3>
            <div className={styles.handleRow}>
              <span className={styles.handle}>{INSTAGRAM_HANDLE}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {post && (
            <div className={styles.postSnippet}>
              <Share2 size={14} className={styles.snippetIcon} />
              <span className={styles.snippetText}>
                Udostępniasz wpis użytkownika <strong>{post.author.name}</strong>
              </span>
            </div>
          )}

          <div className={styles.promptCard}>
            <p className={styles.promptText}>
              "{currentText}"
            </p>
          </div>

          <p className={styles.subtext}>
            Dołącz do oficjalnej społeczności na Instagramie, aby zgłębiać badania, obserwować postępy projektu i być na bieżąco z premierami!
          </p>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={handleOpenInstagram}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>Obserwuj na Instagramie</span>
              <ExternalLink size={16} />
            </button>

            <button className={styles.secondaryBtn} onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check size={16} className={styles.copiedIcon} />
                  <span>Skopiowano link!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Kopiuj link do profilu</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.footerLink}>
            <a href="https://www.instagram.com/instytutnowejnauki/" target="_blank" rel="noopener noreferrer">
              instagram.com/instytutnowejnauki/
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
