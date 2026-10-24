import { useEffect, useState } from 'react'
import { loadBookings } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import posterImage from '../assets/background.jpg'

const SPLASH_SECONDS = 6 // change this number to make it shorter or longer

export default function Splash({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    loadBookings().catch(() => {}) // start loading the home list right now
    const fade = setTimeout(() => setFading(true), (SPLASH_SECONDS - 0.5) * 1000)
    const done = setTimeout(onDone, SPLASH_SECONDS * 1000)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className={fading ? 'splash fade' : 'splash'} aria-hidden="true">
      <video
        className="splash-video"
        src={introVideo}
        poster={posterImage}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  )
}