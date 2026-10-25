import { useEffect, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'

const SPLASH_SECONDS = 6 // change this number to make it shorter or longer

export default function Splash({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // start loading everything the next pages need, while the video plays
    loadBookings().catch(() => {})
    loadOptions().catch(() => {})
    loadToday().catch(() => {})
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
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  )
}