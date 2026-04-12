'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getRandomWord } from '@/data/words';

export interface GameState {
  playersCount: number;
  spiesCount: number;
  timerMinutes: number;
  category: string;
  word: string;
  roles: string[]; // "spy" or "player"
  currentPlayerIndex: number;
  votes: Record<number, number>;
  status: 'setup' | 'playing' | 'voting' | 'results';
}

interface GameContextType {
  state: GameState;
  updateSetup: (updates: Partial<GameState>) => void;
  startGame: () => void;
  nextPlayer: () => boolean; 
  submitVote: (suspectIndex: number) => boolean;
  adminSubmitVote: (eliminatedIndex: number) => void;
  finishVoting: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  playersCount: 5,
  spiesCount: 1,
  timerMinutes: 3,
  category: "places",
  word: "",
  roles: [],
  currentPlayerIndex: 0,
  votes: {},
  status: 'setup',
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);

  const updateSetup = (updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const startGame = () => {
    const word = getRandomWord(state.category);

    let newRoles = Array(state.playersCount).fill("player");
    for (let i = 0; i < state.spiesCount; i++) {
      newRoles[i] = "spy";
    }
    
    // Fisher-Yates shuffle
    for (let i = newRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newRoles[i], newRoles[j]] = [newRoles[j], newRoles[i]];
    }

    setState(prev => ({
      ...prev,
      word,
      roles: newRoles,
      currentPlayerIndex: 0,
      votes: {},
      status: 'playing',
    }));
  };

  const nextPlayer = () => {
    if (state.currentPlayerIndex < state.playersCount - 1) {
      setState(prev => ({ ...prev, currentPlayerIndex: prev.currentPlayerIndex + 1 }));
      return true;
    }
    return false;
  };

  const submitVote = (suspectIndex: number) => {
    let hasNext = true;
    setState(prev => {
      const currentVotes = { ...prev.votes };
      currentVotes[suspectIndex] = (currentVotes[suspectIndex] || 0) + 1;
      
      const newIndex = prev.currentPlayerIndex + 1;
      hasNext = newIndex < prev.playersCount;
      
      return { 
        ...prev, 
        votes: currentVotes,
        currentPlayerIndex: hasNext ? newIndex : prev.currentPlayerIndex
      };
    });
    return hasNext;
  };

  const adminSubmitVote = (eliminatedIndex: number) => {
    setState(prev => ({
      ...prev,
      votes: { [eliminatedIndex]: 1 },
      status: 'results'
    }));
  };

  const finishVoting = () => {
    setState(prev => ({ ...prev, status: 'results' }));
  };

  const resetGame = () => {
    setState(initialState);
  };

  return (
    <GameContext.Provider value={{ state, updateSetup, startGame, nextPlayer, submitVote, adminSubmitVote, finishVoting, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
