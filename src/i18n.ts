export type Lang = 'es' | 'en'

type Dict = {
  appTitle: string
  appSubtitle: string
  briefDescription: string
  inputLabel: string
  inputPlaceholder: string
  controlsLabel: string
  languageLabel: string
  modeLabel: string
  themeLabel: string
  themeLight: string
  themeDark: string
  fixedMode: string
  autoMode: string
  curveLabel: string
  curveLinear: string
  curveEaseIn: string
  curveEaseOut: string
  fixedWpm: string
  startWpm: string
  endWpm: string
  rampSeconds: string
  play: string
  pause: string
  reset: string
  uploadTxt: string
  orpLabel: string
  word: string
  of: string
  progress: string
  currentWpm: string
  emptyState: string
  openReaderWindow: string
  closeReaderWindow: string
  helper: string
}

export const dictionary: Record<Lang, Dict> = {
  es: {
    appTitle: 'Lectura en Pulsos',
    appSubtitle: 'RSVP para leer palabra por palabra a alta velocidad.',
    briefDescription: 'Pega texto, ajusta velocidad y lee sin distracciones con ventana emergente.',
    inputLabel: 'Texto',
    inputPlaceholder:
      'Pega aqui tu texto. Ejemplo: La lectura rapida funciona mejor cuando el ritmo sube de forma progresiva y con pausas cortas.',
    controlsLabel: 'Controles',
    languageLabel: 'Idioma',
    modeLabel: 'Modo de velocidad',
    themeLabel: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    fixedMode: 'Fija',
    autoMode: 'Auto aceleracion',
    curveLabel: 'Curva de aceleracion',
    curveLinear: 'Lineal',
    curveEaseIn: 'Suave al inicio',
    curveEaseOut: 'Suave al final',
    fixedWpm: 'WPM fija',
    startWpm: 'WPM inicio',
    endWpm: 'WPM final',
    rampSeconds: 'Duracion rampa (s)',
    play: 'Reproducir',
    pause: 'Pausar',
    reset: 'Reiniciar',
    uploadTxt: 'Cargar .txt',
    orpLabel: 'Resaltar ORP',
    word: 'Palabra',
    of: 'de',
    progress: 'Progreso',
    currentWpm: 'WPM actual',
    emptyState: 'Pega texto para empezar la animacion.',
    openReaderWindow: 'Abrir ventana de lectura',
    closeReaderWindow: 'Cerrar ventana de lectura',
    helper: 'Atajo: barra espaciadora para play/pausa.',
  },
  en: {
    appTitle: 'Pulse Reader',
    appSubtitle: 'RSVP playback to read one word at a time at high speed.',
    briefDescription: 'Paste text, tune speed, and read without distractions in a popup window.',
    inputLabel: 'Text',
    inputPlaceholder:
      'Paste your text here. Example: Speed reading feels smoother when the rhythm ramps up progressively with small punctuation pauses.',
    controlsLabel: 'Controls',
    languageLabel: 'Language',
    modeLabel: 'Speed mode',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    fixedMode: 'Fixed',
    autoMode: 'Auto ramp',
    curveLabel: 'Acceleration curve',
    curveLinear: 'Linear',
    curveEaseIn: 'Ease in',
    curveEaseOut: 'Ease out',
    fixedWpm: 'Fixed WPM',
    startWpm: 'Start WPM',
    endWpm: 'End WPM',
    rampSeconds: 'Ramp duration (s)',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    uploadTxt: 'Upload .txt',
    orpLabel: 'Highlight ORP',
    word: 'Word',
    of: 'of',
    progress: 'Progress',
    currentWpm: 'Current WPM',
    emptyState: 'Paste text to start the pulse animation.',
    openReaderWindow: 'Open reading window',
    closeReaderWindow: 'Close reading window',
    helper: 'Shortcut: space bar for play/pause.',
  },
}
