import { useCallback, useEffect, useRef, useState } from 'react'

export function useTransientToast(durationMs = 2200) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const show = useCallback((nextMessage: string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setMessage(nextMessage)
    timerRef.current = window.setTimeout(() => {
      setMessage(null)
      timerRef.current = null
    }, durationMs)
  }, [durationMs])

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  return { message, show }
}
