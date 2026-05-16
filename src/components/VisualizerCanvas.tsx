import { useEffect, useRef } from 'react'
import type { Theme } from '../lib/themes'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  phase: number
}

interface Props {
  analyser: AnalyserNode | null
  theme: Theme
  isPlaying: boolean
  bpm: number | null
}

const PARTICLE_COUNT = 220

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function createParticles(w: number, h: number, theme: Theme): Particle[] {
  const cx = w / 2
  const cy = h / 2
  const spread = Math.min(w, h) * 0.38

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const radius = spread * (0.35 + Math.random() * 0.65)
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2.5 + 0.5,
      hue: lerp(theme.particleHue[0], theme.particleHue[1], Math.random()),
      phase: (i / PARTICLE_COUNT) * Math.PI * 2,
    }
  })
}

export function VisualizerCanvas({ analyser, theme, isPlaying, bpm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const beatRef = useRef(0)
  const smoothRef = useRef({ bass: 0, mid: 0, high: 0 })
  const rafRef = useRef(0)

  const smoothAudio = (target: { bass: number; mid: number; high: number }, bass: number, mid: number, high: number, playing: boolean) => {
    const rate = playing ? 0.08 : 0.04
    target.bass = lerp(target.bass, bass, rate)
    target.mid = lerp(target.mid, mid, rate)
    target.high = lerp(target.high, high, rate)
    return target
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const freqData = new Uint8Array(analyser?.frequencyBinCount ?? 1024)
    const timeData = new Uint8Array(analyser?.fftSize ?? 2048)

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = createParticles(w, h, theme)
    }

    resize()
    window.addEventListener('resize', resize)

    let start = performance.now()

    const draw = (now: number) => {
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      const t = (now - start) / 1000

      let bass = 0
      let mid = 0
      let high = 0

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData)
        analyser.getByteTimeDomainData(timeData)

        const bassEnd = Math.floor(freqData.length * 0.08)
        const midEnd = Math.floor(freqData.length * 0.35)
        for (let i = 0; i < freqData.length; i++) {
          const v = freqData[i]! / 255
          if (i < bassEnd) bass += v
          else if (i < midEnd) mid += v
          else high += v
        }
        bass /= bassEnd || 1
        mid /= (midEnd - bassEnd) || 1
        high /= (freqData.length - midEnd) || 1
      } else {
        bass = 0.15 + Math.sin(t * 1.2) * 0.08
        mid = 0.12 + Math.sin(t * 0.7) * 0.06
        high = 0.1
      }

      const smooth = smoothAudio(smoothRef.current, bass, mid, high, isPlaying)
      const sBass = smooth.bass
      const sMid = smooth.mid
      const sHigh = smooth.high

      const energy = sBass * 0.5 + sMid * 0.35 + sHigh * 0.15
      const beatInterval = bpm ? 60 / bpm : 0.5
      const beatPhase = isPlaying && bpm ? (t % beatInterval) / beatInterval : (t * 0.5) % 1
      const onBeat = beatPhase < 0.1 || (isPlaying && sBass > 0.55)
      if (onBeat) beatRef.current = Math.min(1, beatRef.current + 0.35)
      beatRef.current *= 0.92

      const pulse = beatRef.current * 0.35 + energy * 0.4

      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, theme.bg[0])
      grad.addColorStop(0.5, theme.bg[1])
      grad.addColorStop(1, theme.bg[2])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      if (theme.grid) {
        ctx.save()
        ctx.strokeStyle = `rgba(244, 114, 182, ${0.08 + pulse * 0.12})`
        ctx.lineWidth = 1
        const horizon = h * 0.62
        for (let i = -20; i <= 20; i++) {
          ctx.beginPath()
          ctx.moveTo(w / 2 + i * 28, horizon)
          ctx.lineTo(w / 2 + i * 120, h)
          ctx.stroke()
        }
        for (let j = 0; j < 12; j++) {
          const y = horizon + (j * j) * 2.2
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
        }
        ctx.restore()
      }

      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55)
      glow.addColorStop(0, `hsla(${theme.particleHue[0]}, 80%, 60%, ${0.12 + pulse * 0.25})`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      const particles = particlesRef.current
      const cx = w / 2
      const cy = h / 2
      const orbitRadius = Math.min(w, h) * 0.34
      const margin = 28
      const bottomLimit = h - 130

      for (const p of particles) {
        const dx = p.x - cx
        const dy = p.y - cy
        const dist = Math.hypot(dx, dy) || 1
        const nx = dx / dist
        const ny = dy / dist
        const tx = -ny
        const ty = nx

        const swirlSpeed =
          (isPlaying ? 0.35 + sMid * 0.9 + beatRef.current * 0.5 : 0.25) *
          (0.85 + Math.sin(t * 1.4 + p.phase) * 0.15)
        const swirlDir = p.phase % (Math.PI * 2) < Math.PI ? 1 : -1

        p.vx += tx * swirlSpeed * swirlDir
        p.vy += ty * swirlSpeed * swirlDir

        const orbitPull = (orbitRadius - dist) * 0.0018
        p.vx += nx * orbitPull
        p.vy += ny * orbitPull

        if (onBeat) {
          p.vx += nx * sBass * 0.12
          p.vy += ny * sBass * 0.12
        }

        p.vx += (Math.random() - 0.5) * sHigh * 0.08
        p.vy += (Math.random() - 0.5) * sHigh * 0.08

        p.vx *= 0.985
        p.vy *= 0.985

        const maxSpeed = isPlaying ? 2.2 + energy * 0.8 : 1.4
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < margin) {
          p.x = margin
          p.vx = Math.abs(p.vx) * 0.5
        } else if (p.x > w - margin) {
          p.x = w - margin
          p.vx = -Math.abs(p.vx) * 0.5
        }
        if (p.y < margin) {
          p.y = margin
          p.vy = Math.abs(p.vy) * 0.5
        } else if (p.y > bottomLimit) {
          p.y = bottomLimit
          p.vy = -Math.abs(p.vy) * 0.5
        }

        p.hue = lerp(p.hue, lerp(theme.particleHue[0], theme.particleHue[1], sMid), 0.04)

        ctx.beginPath()
        ctx.fillStyle = `hsla(${p.hue}, 85%, ${50 + sHigh * 25}%, ${0.35 + energy * 0.45})`
        ctx.arc(p.x, p.y, p.size * (1 + pulse * 1.2), 0, Math.PI * 2)
        ctx.fill()
      }

      const waveH = 110
      const waveY = h - waveH - 24
      ctx.save()
      ctx.beginPath()
      const slice = Math.floor(timeData.length / w)
      for (let x = 0; x < w; x++) {
        const idx = x * slice
        const v = (timeData[idx]! - 128) / 128
        const y = waveY + waveH / 2 + v * waveH * 0.45 * (1 + bass * 0.8)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      const waveGrad = ctx.createLinearGradient(0, waveY, 0, waveY + waveH)
      waveGrad.addColorStop(0, theme.waveform[0])
      waveGrad.addColorStop(1, theme.waveform[1])
      ctx.strokeStyle = waveGrad
      ctx.lineWidth = 2 + pulse * 3
      ctx.shadowColor = theme.accent
      ctx.shadowBlur = 12 + pulse * 24
      ctx.stroke()

      ctx.globalAlpha = 0.25 + energy * 0.35
      ctx.lineWidth = 1
      for (let mirror = 1; mirror >= 0; mirror--) {
        ctx.beginPath()
        for (let x = 0; x < w; x++) {
          const idx = x * slice
          const v = (timeData[idx]! - 128) / 128
          const sign = mirror === 0 ? 1 : -1
          const y = waveY + waveH / 2 + sign * v * waveH * 0.3 * (1 + mid * 0.5)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [analyser, theme, isPlaying, bpm])

  return <canvas ref={canvasRef} className="visualizer-canvas" aria-hidden />
}
