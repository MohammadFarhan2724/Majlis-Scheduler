import { useEffect, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import introSound from '../assets/intro-sound.m4a'

const SPLASH_SECONDS = 6 // change this number to make it shorter or longer
const SOUND_FADE_IN = 1.2 // seconds for the sound to rise
const SOUND_FADE_OUT = 1.5 // seconds for the sound to fall, ends with the intro

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

  // Sound: play right away if the browser allows it, otherwise on the first
  // touch anywhere. The volume rises at the start and falls at the end.
  useEffect(() => {
    const audio = new Audio(introSound)
    audio.preload = 'auto'
    audio.volume = 0
    const splashStart = performance.now()
    let soundStart = null
    let started = false

    function updateVolume() {
      if (soundStart === null) return
      const now = performance.now()
      const fadeIn = Math.min(1, (now - soundStart) / (SOUND_FADE_IN * 1000))
      const timeLeft = SPLASH_SECONDS * 1000 - (now - splashStart)
      const fadeOut = Math.min(1, Math.max(0, timeLeft / (SOUND_FADE_OUT * 1000)))
      const level = Math.min(fadeIn, fadeOut)
      audio.volume = level * level // squared, so the fade sounds even to the ear
    }
    const ticker = setInterval(updateVolume, 40)

    function stopListening() {
      UNLOCK_EVENTS.forEach((name) => window.removeEventListener(name, tryPlay))
    }

    function tryPlay() {
      if (started) return
      audio
        .play()
        .then(() => {
          started = true
          soundStart = performance.now()
          stopListening()
        })
        .catch(() => {})
    }

    tryPlay()
    UNLOCK_EVENTS.forEach((name) =>
      window.addEventListener(name, tryPlay, { passive: true }),
    )

    return () => {
      clearInterval(ticker)
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