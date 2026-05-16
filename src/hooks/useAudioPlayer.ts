import { useCallback, useEffect, useRef, useState } from 'react'
import { detectBpmFromUrl } from '../lib/bpmDetector'

export const DEFAULT_TRACK = `${import.meta.env.BASE_URL}default.mp3`
const DEFAULT_NAME = 'Default track'

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error(audio.error?.message ?? 'Failed to load audio'))
    }
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('loadeddata', onReady)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('loadeddata', onReady)
    audio.addEventListener('error', onError)
  })
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isDefaultTrack, setIsDefaultTrack] = useState(true)
  const [trackName, setTrackName] = useState(DEFAULT_NAME)
  const [trackUrl, setTrackUrl] = useState(DEFAULT_TRACK)
  const [bpm, setBpm] = useState<number | null>(null)
  const [bpmLoading, setBpmLoading] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeBpm = useCallback(async (url: string) => {
    setBpmLoading(true)
    try {
      const detected = await detectBpmFromUrl(url)
      setBpm(detected)
    } catch {
      setBpm(120)
    } finally {
      setBpmLoading(false)
    }
  }, [])

  const loadUrl = useCallback(
    async (url: string, name: string, isDefault: boolean) => {
      const audio = audioRef.current
      const ctx = contextRef.current
      if (!audio || !ctx) return

      const wasPlaying = !audio.paused
      audio.pause()
      setIsPlaying(false)
      setError(null)

      if (isDefault && blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }

      audio.src = url
      audio.load()

      setTrackUrl(url)
      setTrackName(name)
      setIsDefaultTrack(isDefault)
      setIsReady(false)
      setBpm(null)

      try {
        await waitForAudioReady(audio)
        setIsReady(true)
        void analyzeBpm(url)

        if (wasPlaying) {
          if (ctx.state === 'suspended') await ctx.resume()
          await audio.play()
          setIsPlaying(true)
        }
      } catch (err) {
        setIsReady(false)
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load audio. Try refreshing the page.',
        )
      }
    },
    [analyzeBpm],
  )

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.includes('audio') && !file.name.toLowerCase().endsWith('.mp3')) {
        setError('Please upload an MP3 file.')
        return
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      await loadUrl(url, file.name, false)
    },
    [loadUrl],
  )

  const restoreDefault = useCallback(async () => {
    await loadUrl(DEFAULT_TRACK, DEFAULT_NAME, true)
  }, [loadUrl])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    const ctx = contextRef.current
    if (!audio || !isReady || !ctx) return

    try {
      if (audio.paused) {
        if (ctx.state === 'suspended') await ctx.resume()
        await audio.play()
        setIsPlaying(true)
        setError(null)
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    } catch (err) {
      setIsPlaying(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Playback blocked. Click Play again after interacting with the page.',
      )
    }
  }, [isReady])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const ctx = new AudioContext()
    contextRef.current = ctx

    const source = ctx.createMediaElementSource(audio)
    sourceRef.current = source

    const analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 2048
    analyserNode.smoothingTimeConstant = 0.88
    analyserRef.current = analyserNode

    source.connect(analyserNode)
    analyserNode.connect(ctx.destination)
    setAnalyser(analyserNode)

    let cancelled = false

    const boot = async () => {
      audio.src = DEFAULT_TRACK
      audio.load()
      try {
        await waitForAudioReady(audio)
        if (cancelled) return
        setIsReady(true)
        setError(null)
        void analyzeBpm(DEFAULT_TRACK)
      } catch (err) {
        if (cancelled) return
        setIsReady(false)
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load audio. Try refreshing the page.',
        )
      }
    }

    void boot()

    return () => {
      cancelled = true
      audio.pause()
      audio.src = ''
      source.disconnect()
      analyserNode.disconnect()
      void ctx.close()
      contextRef.current = null
      sourceRef.current = null
      analyserRef.current = null
      audioRef.current = null
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      setAnalyser(null)
    }
  }, [analyzeBpm])

  return {
    analyser,
    isPlaying,
    isReady,
    isDefaultTrack,
    trackName,
    trackUrl,
    bpm,
    bpmLoading,
    error,
    loadFile,
    restoreDefault,
    togglePlay,
  }
}
