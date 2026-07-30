import { create } from 'zustand'

// ─── Store Types ─────────────────────────────────────
interface UIStore {
  // State
  isAnimating: boolean
  isChallengeModalOpen: boolean
  isMenuOpen: boolean
  particlesEnabled: boolean

  // Actions
  setIsAnimating: (value: boolean) => void
  setIsChallengeModalOpen: (value: boolean) => void
  setIsMenuOpen: (value: boolean) => void
  setParticlesEnabled: (value: boolean) => void
}

// ─── Store ───────────────────────────────────────────
export const useUIStore = create<UIStore>((set) => ({
  isAnimating: false,
  isChallengeModalOpen: false,
  isMenuOpen: false,
  particlesEnabled: true,

  setIsAnimating: (value) => set({ isAnimating: value }),
  setIsChallengeModalOpen: (value) => set({ isChallengeModalOpen: value }),
  setIsMenuOpen: (value) => set({ isMenuOpen: value }),
  setParticlesEnabled: (value) => set({ particlesEnabled: value }),
}))
