# Beatmap Visualizer

A React + Vite web app that visualizes music with reactive particles, waveforms, and beat-synced effects.

## Features

- **Audio upload** — drag & drop or browse for an MP3
- **Default track** — bundled `public/default.mp3` (replace with your own file, same path)
- **Default button** — restores the bundled track after uploading your own
- **Waveform** — real-time canvas waveform driven by the Web Audio API
- **Reactive visuals** — particles and backgrounds react to bass, mids, and highs
- **BPM detection** — estimated tempo from the audio file
- **Themes** — Neon Pulse, Sunset Drive, Aurora, Synthwave

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Replace the default MP3

Drop your file at `public/default.mp3` (overwrite the existing demo track). The app loads it on first visit.

## Stack

- React 19 + Vite
- Web Audio API (`AnalyserNode`, `MediaElementAudioSourceNode`)
- Canvas 2D (particles + waveform)
