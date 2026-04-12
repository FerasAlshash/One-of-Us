'use client';
import { useEffect, useState } from 'react';

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
  const [items, setItems] = useState<Array<{ id: number; emoji: string; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    // Fallback to default if category is not explicitly mapped
    const emojis = CATEGORY_EMOJIS[categoryId] || CATEGORY_EMOJIS.default;
    
    // Generate 20 floating emojis
    const generated = Array.from({ length: 20 }).map((_, i) => {
      // Half the emojis start with a negative delay to appear immediately on screen
      const delay = i < 10 ? -(Math.random() * 40) : Math.random() * 10;
      return {
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 90 + 5, // random X percent (5% to 95%)
        delay: delay, 
        duration: 20 + Math.random() * 20, // 20s to 40s speed
        size: 1.2 + Math.random() * 1.5 // 1.2rem to 2.7rem size variation
      };
    });
    
    setItems(generated);
  }, [categoryId]);

  // If no items generated yet (SSR safety)
  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
      {items.map(item => (
        <div
          key={item.id}
          className="absolute -bottom-20 animate-floatUp"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}rem`,
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
