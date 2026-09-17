import React, { useState } from 'react';
import { Check } from 'lucide-react';
import styles from './WelcomeScreen.module.css';
import { getAssetUrl } from '../../utils/assetUrl';

const AVATARS = [
  getAssetUrl('/avatars/main_selection/male_1.jpeg'),
  getAssetUrl('/avatars/main_selection/male_2.png'),
  getAssetUrl('/avatars/main_selection/female_1.jpg'),
  getAssetUrl('/avatars/main_selection/female_2.jpeg'),
];

interface WelcomeScreenProps {
  onComplete: (data: { name: string; firstName: string; lastName: string; avatarUrl: string; bio: string; location: string; joinDate: string }) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [showLegalDetails, setShowLegalDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    if (!cleanFirst || !cleanLast || !consentAccepted) return;

    onComplete({
      name: `${cleanFirst} ${cleanLast}`,
      firstName: cleanFirst,
      lastName: cleanLast,
      avatarUrl: selectedAvatar,
      bio: bio.trim(),
      location: 'Polska',
      joinDate: 'marzec 2025',
    });
  };

  return (
    <div className={styles.welcomeOverlay}>
      <form className={styles.welcomeCard} onSubmit={handleSubmit}>
        <div className={styles.logoArea}>
          <img src={getAssetUrl('/logo.png')} alt="eMotion" className={styles.logoIcon} />
          <h1 className={styles.title}>Witaj w eMotion!</h1>
          <p className={styles.subtitle}>
            Dawno się nie widzieliśmy, prawda? Przypomnisz nam, jak się nazywasz? Oraz jak wyglądasz?
          </p>
        </div>

        <div className={styles.nameRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Imię</label>
            <input
              className={styles.input}
              type="text"
              placeholder="np. Anna"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nazwisko</label>
            <input
              className={styles.input}
              type="text"
              placeholder="np. Laurent"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Wybierz swój awatar</label>
          <div className={styles.avatarGrid}>
            {AVATARS.map(avatar => {
              const isSelected = selectedAvatar === avatar;
              return (
                <div
                  key={avatar}
                  className={`${styles.avatarOption} ${isSelected ? styles.avatarSelected : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.avatarImgWrap}>
                    <img src={avatar} alt="Avatar option" />
                  </div>
                  {isSelected && (
                    <div className={styles.selectedBadge}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Napisz coś o sobie</label>
          <textarea
            className={styles.textarea}
            placeholder="Czym się interesujesz? Co lubisz robić?"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        </div>

        {/* Legal Consent & Disclaimer */}
        <div className={styles.legalConsentArea}>
          <label className={styles.consentRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={consentAccepted}
              onChange={e => setConsentAccepted(e.target.checked)}
            />
            <span className={styles.consentText}>
              Potwierdzam, że rozumiem fikcyjno-artystyczny charakter projektu eMotion. Wyrażam zgodę na lokalne zapisywanie danych sesji.
            </span>
          </label>
          <button
            type="button"
            className={styles.legalToggleBtn}
            onClick={() => setShowLegalDetails(!showLegalDetails)}
          >
            {showLegalDetails ? 'Ukryj notę prawną ▲' : 'Więcej informacji prawnych ▼'}
          </button>
          {showLegalDetails && (
            <div className={styles.legalDetails}>
              • <strong>Fikcja artystyczna:</strong> Platforma, użytkownicy i wątki narracyjne są dziełem wyobraźni stworzonym przez wielokulturowy zespół. Wszelkie podobieństwo do prawdziwych osób czy firm jest przypadkowe.<br />
              • <strong>Art. 50 AI Act:</strong> Rozmówcy i profile w aplikacji są wirtualnymi personami, a nie żywymi ludźmi.<br />
              • <strong>Prywatność (RODO):</strong> Wpisane dane nie trafiają do zewnętrznej bazy kont - są przechowywane w pamięci Twojej przeglądarki. Treści czatu są przetwarzane wyłącznie na czas generowania odpowiedzi.
            </div>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!firstName.trim() || !lastName.trim() || !consentAccepted}
        >
          Rozpocznij
        </button>
      </form>
    </div>
  );
};
