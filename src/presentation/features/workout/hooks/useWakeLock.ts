import { useEffect, useRef } from 'react'

export function useWakeLock(active: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    async function acquire(): Promise<void> {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // WakeLock not available or denied
      }
    }

    async function release(): Promise<void> {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }

    if (active) {
      void acquire()
    } else {
      void release()
    }

    const handleVisibilityChange = (): void => {
      if (active && document.visibilityState === 'visible') {
        void acquire()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void release()
    }
  }, [active])
}
