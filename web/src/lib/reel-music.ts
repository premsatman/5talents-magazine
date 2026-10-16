/**
 * Background music for the floating reel.
 *
 * Generated in the browser with the Web Audio API rather than played from a
 * file. That makes it original work with nothing to license or credit, costs
 * zero bytes until the reader asks for sound, and lets the transitions (a
 * whoosh when the story changes, a chime on the wordmark card) sit exactly on
 * the beat of the animation.
 *
 * A gentle loop at 92 BPM in D major: Dmaj9 - Bm9 - Gmaj9 - A6sus, two bars
 * each. Saw pad through a slow low-pass sweep, sine bass, a triangle pluck
 * arpeggio into a dotted-eighth delay, a soft kick on 1 and 3, a quiet shaker.
 *
 * Browsers refuse to start audio before a user gesture, so nothing here runs
 * until start() is called from a click. Client-only: import from a 'use client'
 * component and never call at module scope.
 */

export type ReelMusic = {
  readonly on: boolean
  start(): void
  stop(): void
  pause(): void
  resume(): void
  whoosh(): void
  chime(): void
}

const BPM = 92
const S16 = 60 / BPM / 4
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 62, 64],
  [43, 50, 54, 57, 62],
  [45, 52, 57, 59, 64],
]
const ARP = [0, 2, 4, 3, 1, 3, 4, 2]
const VOLUME = 0.55

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export function createReelMusic(): ReelMusic {
  let ctx: AudioContext | null = null
  let master: GainNode
  let delay: DelayNode
  let noiseBuf: AudioBuffer | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let on = false
  let nextT = 0
  let step = 0

  function init() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)

    delay = ctx.createDelay(1)
    delay.delayTime.value = S16 * 3
    const fb = ctx.createGain()
    fb.gain.value = 0.32
    const dlp = ctx.createBiquadFilter()
    dlp.type = 'lowpass'
    dlp.frequency.value = 2400
    delay.connect(dlp).connect(fb).connect(delay)
    dlp.connect(master)
  }

  function env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + a)
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
  }

  function noise(c: AudioContext) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const s = c.createBufferSource()
    s.buffer = noiseBuf
    return s
  }

  function pad(c: AudioContext, notes: number[], t: number, dur: number) {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 0.6
    lp.frequency.setValueAtTime(700, t)
    lp.frequency.linearRampToValueAtTime(1300, t + dur / 2)
    lp.frequency.linearRampToValueAtTime(700, t + dur)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.06, t + 0.9)
    g.gain.setValueAtTime(0.06, t + dur - 0.6)
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4)
    lp.connect(g).connect(master)
    for (const n of notes.slice(0, 4)) {
      for (const det of [-6, 6]) {
        const o = c.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = mtof(n)
        o.detune.value = det
        o.connect(lp)
        o.start(t)
        o.stop(t + dur + 0.5)
      }
    }
    const b = c.createOscillator()
    const bg = c.createGain()
    b.type = 'sine'
    b.frequency.value = mtof(notes[0] - 12)
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(0.16, t + 0.08)
    bg.gain.setValueAtTime(0.16, t + dur - 0.3)
    bg.gain.linearRampToValueAtTime(0.0001, t + dur)
    b.connect(bg).connect(master)
    b.start(t)
    b.stop(t + dur + 0.1)
  }

  function pluck(c: AudioContext, n: number, t: number, v: number) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.value = mtof(n)
    env(g, t, 0.005, v, 0.32)
    o.connect(g)
    g.connect(master)
    g.connect(delay)
    o.start(t)
    o.stop(t + 0.4)
  }

  function kick(c: AudioContext, t: number) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18)
    env(g, t, 0.004, 0.35, 0.28)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 0.35)
  }

  function shaker(c: AudioContext, t: number, v: number) {
    const s = noise(c)
    const hp = c.createBiquadFilter()
    const g = c.createGain()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    env(g, t, 0.003, v, 0.05)
    s.connect(hp).connect(g).connect(master)
    s.start(t)
    s.stop(t + 0.08)
  }

  function tick() {
    const c = ctx
    if (!c) return
    while (nextT < c.currentTime + 0.15) {
      const bar = Math.floor(step / 16)
      const chord = CHORDS[Math.floor(bar / 2) % 4]
      const s = step % 16
      if (s === 0 && bar % 2 === 0) pad(c, chord, nextT, S16 * 32)
      if (s % 2 === 0) pluck(c, chord[ARP[(s / 2) % 8]] + 12, nextT, s % 4 === 0 ? 0.07 : 0.045)
      if (s === 0 || s === 8) kick(c, nextT)
      if (s % 4 === 2) shaker(c, nextT, 0.05)
      if (s % 4 === 3) shaker(c, nextT, 0.02)
      nextT += S16
      step++
    }
  }

  function ramp(to: number, secs: number) {
    if (!ctx) return
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(to, now + secs)
  }

  return {
    get on() {
      return on
    },
    start() {
      if (!ctx) init()
      if (!ctx) return
      void ctx.resume()
      on = true
      nextT = ctx.currentTime + 0.08
      step = 0
      ramp(VOLUME, 1.2)
      clearInterval(timer)
      timer = setInterval(tick, 25)
      tick()
    },
    stop() {
      if (!ctx) return
      on = false
      clearInterval(timer)
      ramp(0, 0.4)
    },
    pause() {
      if (ctx && on) void ctx.suspend()
    },
    resume() {
      if (ctx && on) void ctx.resume()
    },
    whoosh() {
      const c = ctx
      if (!c || !on) return
      const t = c.currentTime
      const s = noise(c)
      const bp = c.createBiquadFilter()
      const g = c.createGain()
      bp.type = 'bandpass'
      bp.Q.value = 1.2
      bp.frequency.setValueAtTime(400, t)
      bp.frequency.exponentialRampToValueAtTime(3500, t + 0.45)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.2)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
      s.connect(bp).connect(g).connect(master)
      s.start(t)
      s.stop(t + 0.6)
    },
    chime() {
      const c = ctx
      if (!c || !on) return
      const t = c.currentTime
      for (const [n, dt] of [[86, 0], [93, 0.09]] as const) {
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = 'sine'
        o.frequency.value = mtof(n)
        env(g, t + dt, 0.005, 0.07, 1.1)
        o.connect(g)
        g.connect(master)
        g.connect(delay)
        o.start(t + dt)
        o.stop(t + dt + 1.3)
      }
    },
  }
}
