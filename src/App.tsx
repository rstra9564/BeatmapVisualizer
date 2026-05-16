import { useCallback, useState } from 'react'
import { VisualizerCanvas } from './components/VisualizerCanvas'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { DEFAULT_THEME, THEMES, type Theme } from './lib/themes'
import './App.css'

function App() {
  const {
    analyser,
    isPlaying,
    isReady,
    isDefaultTrack,
    trackName,
    bpm,
    bpmLoading,
    error,
    loadFile,
    restoreDefault,
    togglePlay,
  } = useAudioPlayer()

  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) void loadFile(file)
    },
    [loadFile],
  )

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void loadFile(file)
      e.target.value = ''
    },
    [loadFile],
  )

  return (
    <div className="app">
      <VisualizerCanvas
        analyser={analyser}
        theme={theme}
        isPlaying={isPlaying}
        bpm={bpm}
      />

      <header className="hud">
        <div className="brand">
          <h1>Beatmap Visualizer</h1>
          <p>Drop an MP3, pick a theme, hit play.</p>
        </div>

        {error && (
          <p className="audio-error" role="alert">
            {error}
          </p>
        )}

        <div
          className={`dropzone${dragOver ? ' dropzone--active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            id="file-input"
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            onChange={onFileInput}
            hidden
          />
          <label htmlFor="file-input" className="dropzone__label">
            <span className="dropzone__icon" aria-hidden>
              ♫
            </span>
            <span className="dropzone__title">Drag & drop your MP3 here</span>
            <span className="dropzone__hint">or click to browse</span>
          </label>
          <p className="track-name" title={trackName}>
            {trackName}
            {isDefaultTrack ? ' · bundled default' : ' · your upload'}
          </p>
        </div>

        <div className="meta">
          <div className="bpm">
            <span className="bpm__label">BPM</span>
            <span className="bpm__value">
              {bpmLoading ? '…' : bpm ?? '—'}
            </span>
          </div>

          <div className="themes" role="group" aria-label="Visual theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-btn${theme.id === t.id ? ' theme-btn--active' : ''}`}
                onClick={() => setTheme(t)}
                style={{ '--accent': t.accent } as React.CSSProperties}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="controls">
          {!isDefaultTrack && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void restoreDefault()}
            >
              Default
            </button>
          )}

          <button
            type="button"
            className={`btn btn--play${isPlaying ? ' btn--playing' : ''}`}
            onClick={() => void togglePlay()}
            disabled={!isReady}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="btn__icon" aria-hidden>
              {isPlaying ? '❚❚' : '▶'}
            </span>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </header>
    </div>
  )
}

export default App
