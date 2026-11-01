import { useEffect, useRef, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import introSound from '../assets/intro-sound.m4a'

const SPLASH_SECONDS = 6
const SOUND_FADE_IN = 1.2
const SOUND_FADE_OUT = 1.5

export default function Splash({ onDone }) {
  const [fading, setFading] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    loadBookings().catch(() => {})
    loadOptions().catch(() => {})
    loadToday().catch(() => {})
  }, [])

  useEffect(() => {
    const introStart = performance.now()
    let soundStart = null
    const audio = new Audio(introSound)
    audio.preload = 'auto'
    audio.volume = 0

    const events = ['pointerdown', 'touchstart', 'keydown', 'click']

    function removeListeners() {
      events.forEach((e) => window.removeEventListener(e, startSound))
    }

    function startSound() {
      if (soundStart !== null) return
      audio
        .play()
        .then(() => {
          soundStart = performance.now()
          removeListeners()
        })
        .catch(() => {})
    }

    // try automatically; if blocked, the first touch starts it
    startSound()
    events.forEach((e) => window.addEventListener(e, startSound))

    const fade = setTimeout(() => setFading(true), (SPLASH_SECONDS - 0.5) * 1000)
    const done = setTimeout(() => doneRef.current && doneRef.current(), SPLASH_SECONDS * 1000)

    const ticker = setInterval(() => {
      if (soundStart === null) return
      const now = performance.now()
      const fadeIn = Math.min(1, (now - soundStart) / (SOUND_FADE_IN * 1000))
      const timeLeft = SPLASH_SECONDS * 1000 - (now - introStart)
      const fadeOut = Math.min(1, Math.max(0, timeLeft / (SOUND_FADE_OUT * 1000)))
      const level = Math.min(fadeIn, fadeOut)
      audio.volume = level * level
    }, 40)

    return () => {
      clearTimeout(fade)
      clearTimeout(done)
      clearInterval(ticker)
      removeListeners()
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