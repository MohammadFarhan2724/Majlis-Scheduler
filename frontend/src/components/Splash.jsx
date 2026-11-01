import { useEffect, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import introSound from '../assets/intro-sound.m4a'

const SPLASH_SECONDS = 6 // change this number to make it shorter or longer

// Touches that browsers accept as "the person used the app", which unlocks sound
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']

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

  // Sound: play right away if the browser allows it. If not, start it on the
  // first touch anywhere on the screen.
  useEffect(() => {
    const audio = new Audio(introSound)
    audio.volume = 1
    audio.preload = 'auto'
    let started = false

    function stopListening() {
      UNLOCK_EVENTS.forEach((name) => window.removeEventListener(name, tryPlay))
    }

    function tryPlay() {
      if (started) return
      audio
        .play()
        .then(() => {
          started = true
          stopListening()
        })
        .catch(() => {})
    }

    tryPlay()
    UNLOCK_EVENTS.forEach((name) =>
      window.addEventListener(name, tryPlay, { passive: true }),
    )

    return () => {
      stopListening()
      audio.pause()
    }
  }, [])

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