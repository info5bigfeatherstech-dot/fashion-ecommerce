import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Heart, Share2, Volume2, VolumeX, X } from 'lucide-react'

function bindModalVideo(el, { muted, playing }) {
  if (!el) return
  el.muted = muted
  el.defaultMuted = muted
  el.volume = muted ? 0 : 1
  el.playsInline = true
  if (playing) {
    const play = () => {
      el.play().catch(() => {})
    }
    if (el.readyState >= 2) play()
    else el.addEventListener('loadeddata', play, { once: true })
  } else {
    el.pause()
  }
}

export function TrendingVideoReelModal({ videos, index, onIndexChange, onClose }) {
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(() => videos.map(() => false))
  const [likeCounts, setLikeCounts] = useState(() => videos.map((_, i) => 4 + ((i * 3) % 9)))
  const [progress, setProgress] = useState(0)
  const activeRef = useRef(null)
  const touchStartX = useRef(null)

  const count = videos.length
  const active = videos[index]
  const prev = videos[(index - 1 + count) % count]
  const next = videos[(index + 1) % count]

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + count) % count)
    setProgress(0)
  }, [count, index, onIndexChange])

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % count)
    setProgress(0)
  }, [count, index, onIndexChange])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  useEffect(() => {
    setProgress(0)
    const el = activeRef.current
    if (!el) return undefined

    const onTime = () => {
      if (!el.duration || !Number.isFinite(el.duration)) return
      setProgress((el.currentTime / el.duration) * 100)
    }
    el.addEventListener('timeupdate', onTime)
    return () => el.removeEventListener('timeupdate', onTime)
  }, [index])

  useEffect(() => {
    const el = activeRef.current
    if (!el) return
    el.muted = muted
    el.defaultMuted = muted
    el.volume = muted ? 0 : 1
    if (!muted) el.play().catch(() => {})
  }, [muted, index])

  const toggleLike = () => {
    setLiked((prevLiked) => {
      const wasLiked = prevLiked[index]
      setLikeCounts((prevCounts) => {
        const nextCounts = [...prevCounts]
        nextCounts[index] = Math.max(0, prevCounts[index] + (wasLiked ? -1 : 1))
        return nextCounts
      })
      const nextLiked = [...prevLiked]
      nextLiked[index] = !wasLiked
      return nextLiked
    })
  }

  const handleShare = async () => {
    const shareData = {
      title: active?.title || active?.label || 'Trending look',
      text: active?.title || active?.label || 'Trending jewellery',
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      /* user cancelled */
      return
    }
    try {
      await navigator.clipboard.writeText(shareData.url)
    } catch {
      /* ignore */
    }
  }

  const onTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event) => {
    if (touchStartX.current == null) return
    const dx = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 48) return
    if (dx > 0) goPrev()
    else goNext()
  }

  if (!active || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="trending-reel"
      role="dialog"
      aria-modal="true"
      aria-label={active.title || active.label || 'Trending video'}
      onClick={onClose}
    >
      <button
        type="button"
        className="trending-reel__close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={28} strokeWidth={2} />
      </button>

      <div
        className="trending-reel__stage"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="trending-reel__peek trending-reel__peek--prev"
          onClick={goPrev}
          aria-label="Previous video"
        >
          <video
            key={`peek-prev-${prev.id}`}
            className="trending-reel__peek-video"
            src={prev.src}
            muted
            loop
            playsInline
            preload="metadata"
            ref={(el) => bindModalVideo(el, { muted: true, playing: true })}
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        <div className="trending-reel__active">
          <div className="trending-reel__progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <video
            key={active.id}
            ref={(el) => {
              activeRef.current = el
              bindModalVideo(el, { muted, playing: true })
            }}
            className="trending-reel__video"
            src={active.src}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            aria-label={active.label}
          />

          <div className="trending-reel__top">
            <p className="trending-reel__title">{active.title || 'Trending Jewellery'}</p>
            <button
              type="button"
              className="trending-reel__mute"
              onClick={() => setMuted((value) => !value)}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <div className="trending-reel__actions">
            <button
              type="button"
              className={`trending-reel__action${liked[index] ? ' is-liked' : ''}`}
              onClick={toggleLike}
              aria-pressed={liked[index]}
              aria-label="Like"
            >
              <Heart size={26} fill={liked[index] ? 'currentColor' : 'none'} />
              <span>{likeCounts[index]}</span>
            </button>
            <button
              type="button"
              className="trending-reel__action"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 size={24} />
              <span>Share</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className="trending-reel__peek trending-reel__peek--next"
          onClick={goNext}
          aria-label="Next video"
        >
          <video
            key={`peek-next-${next.id}`}
            className="trending-reel__peek-video"
            src={next.src}
            muted
            loop
            playsInline
            preload="metadata"
            ref={(el) => bindModalVideo(el, { muted: true, playing: true })}
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="trending-reel__nav trending-reel__nav--prev"
          onClick={goPrev}
          aria-label="Previous"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="trending-reel__nav trending-reel__nav--next"
          onClick={goNext}
          aria-label="Next"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>,
    document.body
  )
}
