import React, { useState } from 'react';
import { Check } from 'lucide-react';
import styles from './WelcomeScreen.module.css';
import { getAssetUrl } from '../../utils/assetUrl';

const AVATARS = [
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=68',
];

interface WelcomeScreenProps {
  onComplete: (data: { name: string; avatarUrl: string; bio: string; location: string; joinDate: string }) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onComplete({
      name: name.trim(),
      avatarUrl: selectedAvatar,
      bio: bio.trim(),
      location: 'Polska',
      joinDate: 'sierpień 2024',
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

        <div className={styles.formGroup}>
          <label className={styles.label}>Twoje imię i nazwisko</label>
          <input
            className={styles.input}
            type="text"
            placeholder="np. Jan Kowalski"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
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
                  <img src={avatar} alt="Avatar option" />
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

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={!name.trim()}
        >
          Rozpocznij
        </button>
      </form>
    </div>
  );
};
