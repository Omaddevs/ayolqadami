import { useEffect, useState } from 'react'

// Saytning desktop chegarasi (global.css dagi @media (min-width: 1024px) bilan bir xil)
export const DESKTOP = '(min-width: 1024px)'

// Ekran kengligi o'zgarganda (oyna kattalashtirilsa, telefon buriladi) qayta chiziladi
export function useDesktop() {
  const [on, setOn] = useState(() => window.matchMedia(DESKTOP).matches)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const fn = () => setOn(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return on
}
