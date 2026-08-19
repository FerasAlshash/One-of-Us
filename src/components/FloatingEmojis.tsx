'use client';
import { useMemo } from 'react';

const CATEGORY_EMOJIS: Record<string, string[]> = {
  places: ['🏙️', '🏢', '🏥', '🏠', '🏝️', '🏕️', '🏟️', '🏫', '🏦', '🏰', '🗺️'],
  food: ['🍽️', '🍔', '🍕', '🍎', '🍩', '☕', '🍗', '🥪', '🍝', '🍟', '🍇'],
  jobs: ['💼', '👨‍⚕️', '👮', '🧑‍🏫', '👩‍🚀', '🧑‍🚒', '👨‍🔧', '🕵️', '👩‍⚖️', '👷'],
  celebrities: ['⭐', '🎭', '🎬', '🎤', '📸', '🎸', '🌟', '🎥', '🎟️', '😎', '🎵'],
  default: ['❓', '🧐', '👀', '🕵️', '🔎', '❔', '🤔']
};

interface FloatingEmojisProps {
  categoryId?: string;
}

export default function FloatingEmojis({ categoryId = 'default' }: FloatingEmojisProps) {
  const items = useMemo(() => {
    const emojis = CATEGORY_EMOJIS[categoryId] || CATEGORY_EMOJIS.default;
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: ((i * 7 + 11) % 85) + 5,
      delay: -(i * 2.5),
      duration: 22 + (i % 6) * 3,
      size: 1.2 + (i % 4) * 0.3,
    }));
  }, [categoryId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-25">
      {items.map(item => (
        <div
          key={item.id}
          className="absolute -bottom-20 animate-floatUp"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}rem`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
