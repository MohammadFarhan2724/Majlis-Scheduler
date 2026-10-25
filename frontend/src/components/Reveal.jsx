import { useEffect, useRef, useState } from 'react'

// fades its content in and slides it up when it comes into view
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (shown) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      className={shown ? 'reveal shown' : 'reveal'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}