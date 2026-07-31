import { create } from 'zustand'
import type { BoardRenderer } from '../core/engine/BoardRenderer'

// ─── Store Types ─────────────────────────────────────
interface UIStore {
  // State
  isAnimating: boolean
  isChallengeModalOpen: boolean
  isMenuOpen: boolean
  particlesEnabled: boolean
  boardRenderer: BoardRenderer | null

  // Actions
  setIsAnimating: (value: boolean) => void
  setIsChallengeModalOpen: (value: boolean) => void
  setIsMenuOpen: (value: boolean) => void
  setParticlesEnabled: (value: boolean) => void
  setBoardRenderer: (renderer: BoardRenderer | null) => void
}

// ─── Store ───────────────────────────────────────────
export const useUIStore = create<UIStore>((set) => ({
  isAnimating: false,
  isChallengeModalOpen: false,
  isMenuOpen: false,
  particlesEnabled: true,
  boardRenderer: null,

  setIsAnimating: (value) => set({ isAnimating: value }),
  setIsChallengeModalOpen: (value) => set({ isChallengeModalOpen: value }),
  setIsMenuOpen: (value) => set({ isMenuOpen: value }),
  setParticlesEnabled: (value) => set({ particlesEnabled: value }),
  setBoardRenderer: (renderer) => set({ boardRenderer: renderer }),
}))
