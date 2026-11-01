import { useEffect, useRef, useState } from 'react'
import { loadBookings, loadOptions, loadToday } from '../prefetch'
import introVideo from '../assets/intro.mp4'
import introSound from '../assets/intro-sound.m4a'

const SPLASH_SECONDS = 6 // change this number to make it shorter or longer
const SOUND_KEY = 'majlis-sound' // remembers if the person turned sound off

function savedChoice() {
  try {
    return localStorage.getItem(SOUND_KEY)
  } catch {
    return null
  }
}

function saveChoice(value) {
  try {
    localStorage.setItem(SOUND_KEY, value)
  } catch {
    // storage can be blocked, the sound still works
  }
}

export default function Splash({ onDone }) {
  const [fading, setFading] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef(null)

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

  // Sound: try to play. If the browser blocks it, stay silent and let the
  // person tap the speaker button. If they turned sound off before, respect it.
  useEffect(() => {
    const audio = new Audio(introSound)
    audio.preload = 'auto'
    audioRef.current = audio
    if (savedChoice() !== 'off') {
      audio
        .play()
        .then(() => setSoundOn(true))
        .catch(() => setSoundOn(false))
    }
    return () => {
      audio.pause()
    }
  }, [])

  function toggleSound() {
    const audio = audioRef.current
    if (!audio) return
    if (soundOn) {
      audio.pause()
      setSoundOn(false)
      saveChoice('off')
    } else {
      audio
        .play()
        .then(() => {
          setSoundOn(true)
          saveChoice('on')
        })
        .catch(() => {})
    }
  }

  return (
    <div className={fading ? 'splash fade' : 'splash'}>
      <video
        className="splash-video"
        src={introVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <button
        type="button"
        className="splash-sound"
        onClick={toggleSound}
        aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
      >
        {soundOn ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
          </svg>
        )}
      </button>
    </div>
  )
}