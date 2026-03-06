import { useState, useEffect, useRef, useCallback } from 'react'

function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

function playBeep(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // AudioContext not available
  }
}

export interface RestTimerState {
  secondsLeft: number
  totalSeconds: number
  isRunning: boolean
  progress: number
  start: (seconds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  add: (seconds: number) => void
  subtract: (seconds: number) => void
}

export function useRestTimer(): RestTimerState {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isRunning) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          vibrate([200, 100, 200])
          playBeep()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning, clearTimer])

  const start = useCallback((seconds: number): void => {
    clearTimer()
    setTotalSeconds(seconds)
    setSecondsLeft(seconds)
    setIsRunning(true)
  }, [clearTimer])

  const pause = useCallback((): void => setIsRunning(false), [])
  const resume = useCallback((): void => setIsRunning(true), [])

  const stop = useCallback((): void => {
    clearTimer()
    setIsRunning(false)
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [clearTimer])

  const add = useCallback((seconds: number): void => {
    setSecondsLeft(prev => prev + seconds)
    setTotalSeconds(prev => prev + seconds)
  }, [])

  const subtract = useCallback((seconds: number): void => {
    setSecondsLeft(prev => Math.max(0, prev - seconds))
    setTotalSeconds(prev => Math.max(0, prev - seconds))
  }, [])

  return {
    secondsLeft,
    totalSeconds,
    isRunning,
    progress: totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0,
    start,
    pause,
    resume,
    stop,
    add,
    subtract,
  }
}
