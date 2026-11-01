import { useEffect, useRef, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import introSound from '../assets/intro-sound.m4a'

const SPLASH_SECONDS = 6 // length of the intro, counted from the tap
const SOUND_FADE_IN = 1.2 // seconds for the sound to rise
const SOUND_FADE_OUT = 1.5 // seconds for the sound to fall, ends with the intro

export default function Splash({ onDone }) {
  const [entered, setEntered] = useState(false)
  const [fading, setFading] = useState(false)
  const audioRef = useRef(null)
  const startRef = useRef(0)

  // start loading everything the next pages need, while the person sees
  // the "Tap to enter" screen
  useEffect(() => {
    loadBookings().catch(() => {})
    loadOptions().catch(() => {})
    loadToday().catch(() => {})
  }, [])

  // get the sound ready (silent until the tap)
  useEffect(() => {
    const audio = new Audio(introSound)
    audio.preload = 'auto'
    audio.volume = 0
    audioRef.current = audio
    return () => {
      audio.pause()
    }
  }, [])

  // the tap: this is what unlocks the sound
  function enter() {
    if (entered) return
    startRef.current = performance.now()
    setEntered(true)
    const audio = audioRef.current
    if (audio) audio.play().catch(() => {})
  }

  // after the tap: run the intro timers and the sound fades
  useEffect(() => {
    if (!entered) return
    const start = startRef.current
    const fade = setTimeout(() => setFading(true), (SPLASH_SECONDS - 0.5) * 1000)
    const done = setTimeout(onDone, SPLASH_SECONDS * 1000)
    const ticker = setInterval(() => {
      const audio = audioRef.current
      if (!audio) return
      const elapsed = performance.now() - start
      const fadeIn = Math.min(1, elapsed / (SOUND_FADE_IN * 1000))
      const timeLeft = SPLASH_SECONDS * 1000 - elapsed
      const fadeOut = Math.min(1, Math.max(0, timeLeft / (SOUND_FADE_OUT * 1000)))
      const level = Math.min(fadeIn, fadeOut)
      audio.volume = level * level // squared, so the fade sounds even to the ear
    }, 40)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
      clearInterval(ticker)
    }
  }, [entered, onDone])

  if (!entered) {
    return (
      <button type="button" className="splash-gate" onClick={enter}>
        <img
          className="splash-gate-icon"
          src="/icon-192.png"
          alt=""
          width="120"
          height="120"
        />
        <span className="splash-gate-title">Majlis Scheduler</span>
        <span className="splash-gate-tap">Tap to enter</span>
        <span className="splash-gate-tap" lang="hi">
          प्रवेश के लिए टैप करें
        </span>
        <span className="splash-gate-tap" lang="ur" dir="rtl">
          داخل ہونے کے لیے ٹیپ کریں
        </span>
      </button>
    )
  }

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