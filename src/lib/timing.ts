export type SpeedMode = 'fixed' | 'auto'
export type RampCurve = 'linear' | 'ease-in' | 'ease-out'

export type AutoSpeedConfig = {
  startWpm: number
  endWpm: number
  rampSeconds: number
  curve: RampCurve
}

const COMMA_PUNCT = /[,;:]$/
const FULLSTOP_PUNCT = /[.!?]$/

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getAutoWpm(config: AutoSpeedConfig, elapsedMs: number): number {
  const duration = Math.max(config.rampSeconds * 1000, 1)
  const progress = clamp(elapsedMs / duration, 0, 1)
  const curvedProgress = applyCurve(progress, config.curve)
  return config.startWpm + (config.endWpm - config.startWpm) * curvedProgress
}

function applyCurve(progress: number, curve: RampCurve): number {
  if (curve === 'ease-in') {
    return progress * progress
  }

  if (curve === 'ease-out') {
    return 1 - (1 - progress) * (1 - progress)
  }

  return progress
}

export function getActiveWpm(
  mode: SpeedMode,
  fixedWpm: number,
  autoConfig: AutoSpeedConfig,
  elapsedMs: number,
): number {
  if (mode === 'fixed') {
    return fixedWpm
  }

  return getAutoWpm(autoConfig, elapsedMs)
}

export function getTokenDurationMs(token: string, wpm: number): number {
  const base = 60000 / Math.max(wpm, 1)
  let multiplier = 1

  if (token.length >= 9) {
    multiplier += 0.14
  }
  if (COMMA_PUNCT.test(token)) {
    multiplier += 0.4
  }
  if (FULLSTOP_PUNCT.test(token)) {
    multiplier += 0.95
  }

  return clamp(base * multiplier, 45, 2000)
}
