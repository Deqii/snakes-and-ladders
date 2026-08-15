import { useEffect, useRef } from 'react'
import diceSpriteUrl from '../../assets/dice/dice-sprite.svg'

// Sprite sheet is a 600x100 strip: 6 faces, each a 100x100 square,
// laid out left-to-right for face 1 through face 6.
const FACE_SIZE = 100
let cachedSpriteImage: HTMLImageElement | null = null
let spriteLoadPromise: Promise<HTMLImageElement> | null = null

function loadSprite(): Promise<HTMLImageElement> {
  if (cachedSpriteImage) return Promise.resolve(cachedSpriteImage)
  if (spriteLoadPromise) return spriteLoadPromise

  spriteLoadPromise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      cachedSpriteImage = img
      resolve(img)
    }
    img.onerror = reject
    img.src = diceSpriteUrl
  })
  return spriteLoadPromise
}

interface DiceFaceProps {
  face: 1 | 2 | 3 | 4 | 5 | 6
  size?: number
  className?: string
}

export function DiceFace({ face, size = 96, className }: DiceFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio ?? 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    let cancelled = false
    loadSprite()
      .then((img) => {
        if (cancelled) return
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(img, (face - 1) * FACE_SIZE, 0, FACE_SIZE, FACE_SIZE, 0, 0, size, size)
      })
      .catch(() => {
        // Sprite failed to load; canvas stays blank rather than crashing.
      })

    return () => {
      cancelled = true
    }
  }, [face, size])

  return <canvas ref={canvasRef} className={className} aria-label={`Dice showing ${face}`} />
}
