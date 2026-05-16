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

## GitHub Pages

Live site: **https://rstra9564.github.io/BeatmapVisualizer/**

### One-time GitHub setup (required)

A blank white page + `main.tsx` 404 means Pages is serving **source code**, not the **built** app.

1. Push to `main` and wait for the **Deploy to GitHub Pages** workflow to finish (green check on the **Actions** tab).
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to **`gh-pages`** and folder **`/ (root)`** — **not** `main`.
5. Save, wait 1–2 minutes, hard-refresh the live URL (Ctrl+Shift+R).

The workflow builds `dist` and pushes only those files to the `gh-pages` branch.

### Test production paths locally

```bash
npm run preview:gh
```

Then open the URL shown (paths include `/BeatmapVisualizer/`).
