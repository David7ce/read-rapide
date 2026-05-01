import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { dictionary, type Lang } from './i18n'
import { tokenizeText } from './lib/tokenize'
import {
  getActiveWpm,
  getTokenDurationMs,
  type AutoSpeedConfig,
  type RampCurve,
  type SpeedMode,
} from './lib/timing'

type ReaderPrefs = {
  lang: Lang
  theme?: Theme
  followSystemTheme?: boolean
  mode: SpeedMode
  fixedWpm: number
  autoConfig: AutoSpeedConfig
  orpEnabled: boolean
}

type Theme = 'light' | 'dark'

const PREFS_KEY = 'read-rapide:prefs'
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}

function splitOrp(word: string): { pre: string; pivot: string; post: string } {
  if (!word) {
    return { pre: '', pivot: '', post: '' }
  }

  const pivotIndex = Math.max(0, Math.min(word.length - 1, Math.floor((word.length - 1) * 0.35)))

  return {
    pre: word.slice(0, pivotIndex),
    pivot: word.charAt(pivotIndex),
    post: word.slice(pivotIndex + 1),
  }
}

function App() {
  const [lang, setLang] = useState<Lang>('es')
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme())
  const [followSystemTheme, setFollowSystemTheme] = useState(true)
  const [text, setText] = useState(
    'La lectura por pulsos presenta cada palabra en el centro, reduciendo el movimiento de los ojos y permitiendo acelerar el ritmo de comprension.',
  )
  const [mode, setMode] = useState<SpeedMode>('auto')
  const [fixedWpm, setFixedWpm] = useState(350)
  const [autoConfig, setAutoConfig] = useState<AutoSpeedConfig>({
    startWpm: 250,
    endWpm: 700,
    rampSeconds: 60,
    curve: 'linear',
  })
  const [orpEnabled, setOrpEnabled] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReaderOpen, setIsReaderOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0)
  const [currentWpm, setCurrentWpm] = useState(0)
  const [pulseId, setPulseId] = useState(0)

  const tokens = useMemo(() => tokenizeText(text), [text])
  const playbackStartRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const t = dictionary[lang]

  const activeWord = tokens[index]?.raw ?? ''
  const orp = splitOrp(activeWord)
  const progress = tokens.length ? ((index + 1) / tokens.length) * 100 : 0

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFS_KEY)
      if (!stored) {
        return
      }

      const parsed = JSON.parse(stored) as Partial<ReaderPrefs>

      if (parsed.lang === 'es' || parsed.lang === 'en') {
        setLang(parsed.lang)
      }
      if (typeof parsed.followSystemTheme === 'boolean') {
        setFollowSystemTheme(parsed.followSystemTheme)
      }
      if (parsed.theme === 'light' || parsed.theme === 'dark') {
        if (parsed.followSystemTheme === false) {
          setTheme(parsed.theme)
        } else {
          setTheme(getSystemTheme())
        }
      }
      if (parsed.mode === 'fixed' || parsed.mode === 'auto') {
        setMode(parsed.mode)
      }
      if (typeof parsed.fixedWpm === 'number') {
        setFixedWpm(parsed.fixedWpm)
      }
      if (parsed.autoConfig) {
        setAutoConfig((prev) => ({
          startWpm: parsed.autoConfig?.startWpm ?? prev.startWpm,
          endWpm: parsed.autoConfig?.endWpm ?? prev.endWpm,
          rampSeconds: parsed.autoConfig?.rampSeconds ?? prev.rampSeconds,
          curve: parsed.autoConfig?.curve ?? prev.curve,
        }))
      }
      if (typeof parsed.orpEnabled === 'boolean') {
        setOrpEnabled(parsed.orpEnabled)
      }
    } catch {
      // Ignore invalid stored preferences.
    }
  }, [])

  useEffect(() => {
    if (!followSystemTheme) {
      return
    }

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
    setTheme(mediaQuery.matches ? 'dark' : 'light')

    const onThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', onThemeChange)
    return () => mediaQuery.removeEventListener('change', onThemeChange)
  }, [followSystemTheme])

  useEffect(() => {
    const prefs: ReaderPrefs = {
      lang,
      theme,
      followSystemTheme,
      mode,
      fixedWpm,
      autoConfig,
      orpEnabled,
    }

    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // Ignore write errors (private mode or storage restrictions).
    }
  }, [autoConfig, fixedWpm, followSystemTheme, lang, mode, orpEnabled, theme])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const reset = () => {
    clearTimer()
    setIsPlaying(false)
    setIndex(0)
    setElapsedBeforePause(0)
    setCurrentWpm(0)
    playbackStartRef.current = null
  }

  useEffect(() => {
    if (tokens.length === 0) {
      reset()
    } else if (index >= tokens.length) {
      setIndex(tokens.length - 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        target?.isContentEditable

      if (event.code === 'Space' && !isTypingTarget) {
        event.preventDefault()
        setIsPlaying((prev) => !prev)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    clearTimer()

    if (!isPlaying || tokens.length === 0) {
      return
    }

    if (index >= tokens.length - 1) {
      setIsPlaying(false)
      return
    }

    const now = performance.now()
    if (playbackStartRef.current === null) {
      playbackStartRef.current = now - elapsedBeforePause
    }

    const elapsedMs = now - playbackStartRef.current
    const wpm = getActiveWpm(mode, fixedWpm, autoConfig, elapsedMs)
    setCurrentWpm(Math.round(wpm))

    const waitMs = getTokenDurationMs(tokens[index].raw, wpm)
    timerRef.current = window.setTimeout(() => {
      const tickNow = performance.now()
      if (playbackStartRef.current !== null) {
        setElapsedBeforePause(tickNow - playbackStartRef.current)
      }
      setIndex((prev) => prev + 1)
      setPulseId((prev) => prev + 1)
    }, waitMs)

    return clearTimer
  }, [autoConfig, elapsedBeforePause, fixedWpm, index, isPlaying, mode, tokens])

  useEffect(() => {
    if (!isPlaying && playbackStartRef.current !== null) {
      setElapsedBeforePause(performance.now() - playbackStartRef.current)
      playbackStartRef.current = null
    }
  }, [isPlaying])

  useEffect(() => {
    setIndex(0)
    setElapsedBeforePause(0)
    playbackStartRef.current = null
    if (!isPlaying) {
      setCurrentWpm(0)
    }
  }, [text])

  const handleTxtUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const fileText = typeof reader.result === 'string' ? reader.result : ''
      setText(fileText)
      setIsPlaying(false)
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const renderActiveWord = () => {
    if (!activeWord) {
      return t.emptyState
    }

    if (!orpEnabled) {
      return activeWord
    }

    return (
      <>
        <span>{orp.pre}</span>
        <span className="orp-pivot">{orp.pivot}</span>
        <span>{orp.post}</span>
      </>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">

        <div className="header-selectors" aria-label="Header selectors">
          <h1>{t.appTitle}</h1>
          <div className="segmented" role="group" aria-label={t.languageLabel}>
            <button
              type="button"
              className={`segment-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
              aria-pressed={lang === 'es'}
              title="Espanol"
            >
              🇪🇸 ES
            </button>
            <button
              type="button"
              className={`segment-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              title="English"
            >
              🇺🇸 EN
            </button>
          </div>

          <div className="segmented" role="group" aria-label={t.themeLabel}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => {
                setFollowSystemTheme(false)
                setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
              }}
              aria-label={t.themeLabel}
              title={`${t.themeLabel} (${followSystemTheme ? 'Auto' : 'Manual'})`}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <p className="hero-subtitle">{t.appSubtitle}</p>
        <p className="brief-description">{t.briefDescription}</p>
      </header>

      <section className="panel input-panel">
        <div className="input-panel-top">
          <label htmlFor="reader-input">{t.inputLabel}</label>
          <div className="control-inline upload-inline input-upload-inline">
            <label htmlFor="txt-upload" className="mini-btn ghost">{t.uploadTxt}</label>
            <input
              id="txt-upload"
              type="file"
              accept=".txt,text/plain"
              onChange={handleTxtUpload}
            />
          </div>
        </div>
        <textarea
          id="reader-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.inputPlaceholder}
          rows={6}
        />
      </section>

      <section className="panel controls-panel" aria-label={t.controlsLabel}>
        <div className="controls-line">
          {mode === 'fixed' ? (
            <div className="control-inline slider-inline">
              <label htmlFor="fixed-wpm">{t.fixedWpm}</label>
              <input
                id="fixed-wpm"
                type="range"
                min={100}
                max={1000}
                value={fixedWpm}
                onChange={(event) => setFixedWpm(Number(event.target.value))}
              />
              <span className="slider-value">{fixedWpm}</span>
            </div>
          ) : (
            <>
              <div className="control-inline slider-inline">
                <label htmlFor="start-wpm">{t.startWpm}</label>
                <input
                  id="start-wpm"
                  type="range"
                  min={100}
                  max={900}
                  value={autoConfig.startWpm}
                  onChange={(event) =>
                    setAutoConfig((prev) => ({ ...prev, startWpm: Number(event.target.value) }))
                  }
                />
                <span className="slider-value">{autoConfig.startWpm}</span>
              </div>

              <div className="control-inline slider-inline">
                <label htmlFor="end-wpm">{t.endWpm}</label>
                <input
                  id="end-wpm"
                  type="range"
                  min={100}
                  max={1200}
                  value={autoConfig.endWpm}
                  onChange={(event) =>
                    setAutoConfig((prev) => ({ ...prev, endWpm: Number(event.target.value) }))
                  }
                />
                <span className="slider-value">{autoConfig.endWpm}</span>
              </div>

              <div className="control-inline slider-inline">
                <label htmlFor="ramp-seconds">{t.rampSeconds}</label>
                <input
                  id="ramp-seconds"
                  type="range"
                  min={10}
                  max={180}
                  value={autoConfig.rampSeconds}
                  onChange={(event) =>
                    setAutoConfig((prev) => ({ ...prev, rampSeconds: Number(event.target.value) }))
                  }
                />
                <span className="slider-value">{autoConfig.rampSeconds}</span>
              </div>

              <div className="control-inline checkbox-inline">
                <label htmlFor="orp-toggle">{t.orpLabel}</label>
                <input
                  id="orp-toggle"
                  type="checkbox"
                  checked={orpEnabled}
                  onChange={(event) => setOrpEnabled(event.target.checked)}
                />
              </div>

              <div className="control-inline">
                <label htmlFor="mode-select">{t.modeLabel}</label>
                <select
                  id="mode-select"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as SpeedMode)}
                >
                  <option value="fixed">{t.fixedMode}</option>
                  <option value="auto">{t.autoMode}</option>
                </select>
              </div>

              <div className="control-inline">
                <label htmlFor="curve-select">{t.curveLabel}</label>
                <select
                  id="curve-select"
                  value={autoConfig.curve}
                  onChange={(event) =>
                    setAutoConfig((prev) => ({
                      ...prev,
                      curve: event.target.value as RampCurve,
                    }))
                  }
                >
                  <option value="linear">{t.curveLinear}</option>
                  <option value="ease-in">{t.curveEaseIn}</option>
                  <option value="ease-out">{t.curveEaseOut}</option>
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel viewer-panel" aria-live="polite">
        <div className="pulse-frame">
          <span key={pulseId} className="pulse-word">{renderActiveWord()}</span>
        </div>

        <div className="metrics">
          <p>
            {t.word}: <strong>{tokens.length ? index + 1 : 0}</strong> {t.of}{' '}
            <strong>{tokens.length}</strong>
          </p>
          <p>
            {t.currentWpm}: <strong>{currentWpm}</strong>
          </p>
          <p>
            {t.progress}: <strong>{Math.round(progress)}%</strong>
          </p>
        </div>

        <div className="player-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={tokens.length === 0}
            aria-label={isPlaying ? t.pause : t.play}
            title={isPlaying ? t.pause : t.play}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            type="button"
            className="icon-btn secondary"
            onClick={reset}
            aria-label={t.reset}
            title={t.reset}
          >
            ↺
          </button>

          <button
            type="button"
            className="mini-btn"
            onClick={() => setIsReaderOpen(true)}
            disabled={tokens.length === 0}
            title={t.openReaderWindow}
          >
            ⛶ {t.openReaderWindow}
          </button>
        </div>
        <p className="helper-text">{t.helper}</p>
      </section>

      {isReaderOpen && (
        <div className="reader-overlay" onClick={() => setIsReaderOpen(false)}>
          <section className="reader-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="icon-btn close-overlay"
              onClick={() => setIsReaderOpen(false)}
              aria-label={t.closeReaderWindow}
              title={t.closeReaderWindow}
            >
              ✕
            </button>

            <div className="reader-word-wrap">
              <span key={`modal-${pulseId}`} className="reader-word">
                {renderActiveWord()}
              </span>
            </div>

            <div className="reader-stats">
              <span>{Math.round(progress)}%</span>
              <span>{currentWpm} WPM</span>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
