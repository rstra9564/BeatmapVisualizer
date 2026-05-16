const MIN_BPM = 60
const MAX_BPM = 200

function getPeaks(data: Float32Array, sampleRate: number): number[] {
  const partSize = Math.floor(sampleRate / 2)
  const parts = Math.floor(data.length / partSize)
  const peaks: number[] = []

  for (let i = 0; i < parts; i++) {
    const start = i * partSize
    const end = start + partSize
    let max = 0
    for (let j = start; j < end; j++) {
      const v = Math.abs(data[j] ?? 0)
      if (v > max) max = v
    }
    peaks.push(max)
  }

  const threshold = peaks.reduce((a, b) => a + b, 0) / peaks.length
  const result: number[] = []
  for (let i = 0; i < peaks.length; i++) {
    if (peaks[i]! > threshold) result.push(i)
  }
  return result
}

function intervalConfidence(intervals: number[], interval: number): number {
  let matches = 0
  for (const other of intervals) {
    if (Math.abs(other - interval) <= 1) matches++
  }
  return matches / intervals.length
}

function getTempo(peaks: number[]): number {
  if (peaks.length < 4) return 120

  const intervals: number[] = []
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i]! - peaks[i - 1]!)
  }

  const partDuration = 0.5
  let bestInterval = intervals[0] ?? 1
  let bestScore = 0

  for (const interval of intervals) {
    const score = intervalConfidence(intervals, interval)
    if (score > bestScore) {
      bestScore = score
      bestInterval = interval
    }
  }

  let bpm = Math.round(60 / (bestInterval * partDuration))
  while (bpm < MIN_BPM) bpm *= 2
  while (bpm > MAX_BPM) bpm /= 2

  return Math.max(MIN_BPM, Math.min(MAX_BPM, bpm))
}

export async function detectBpm(audioBuffer: AudioBuffer): Promise<number> {
  const channel = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const peaks = getPeaks(channel, sampleRate)
  return getTempo(peaks)
}

export async function detectBpmFromUrl(url: string): Promise<number> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    return await detectBpm(buffer)
  } finally {
    await ctx.close()
  }
}
