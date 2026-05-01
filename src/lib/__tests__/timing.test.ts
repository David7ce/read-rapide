import { describe, expect, it } from 'vitest'
import { clamp, getActiveWpm, getAutoWpm, getTokenDurationMs } from '../timing'

describe('timing utilities', () => {
  it('clamps values to bounds', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it('computes auto wpm ramp', () => {
    const cfg = { startWpm: 200, endWpm: 800, rampSeconds: 60, curve: 'linear' as const }
    expect(getAutoWpm(cfg, 0)).toBe(200)
    expect(Math.round(getAutoWpm(cfg, 30000))).toBe(500)
    expect(getAutoWpm(cfg, 60000)).toBe(800)
    expect(getAutoWpm(cfg, 120000)).toBe(800)
  })

  it('applies ease curves', () => {
    const linear = { startWpm: 200, endWpm: 800, rampSeconds: 60, curve: 'linear' as const }
    const easeIn = { ...linear, curve: 'ease-in' as const }
    const easeOut = { ...linear, curve: 'ease-out' as const }

    const linearMid = getAutoWpm(linear, 30000)
    const easeInMid = getAutoWpm(easeIn, 30000)
    const easeOutMid = getAutoWpm(easeOut, 30000)

    expect(easeInMid).toBeLessThan(linearMid)
    expect(easeOutMid).toBeGreaterThan(linearMid)
  })

  it('returns mode-aware active wpm', () => {
    const cfg = { startWpm: 200, endWpm: 800, rampSeconds: 60, curve: 'linear' as const }
    expect(getActiveWpm('fixed', 350, cfg, 10000)).toBe(350)
    expect(Math.round(getActiveWpm('auto', 350, cfg, 30000))).toBe(500)
  })

  it('extends duration for punctuation and long words', () => {
    const base = getTokenDurationMs('hola', 300)
    const comma = getTokenDurationMs('hola,', 300)
    const fullstop = getTokenDurationMs('hola.', 300)
    const longWord = getTokenDurationMs('electroencefalograma', 300)

    expect(comma).toBeGreaterThan(base)
    expect(fullstop).toBeGreaterThan(comma)
    expect(longWord).toBeGreaterThan(base)
  })
})
