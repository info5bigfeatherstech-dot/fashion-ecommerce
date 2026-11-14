import { useEffect, useRef, useState, useCallback } from 'react'

const FALLBACK_IMAGE = ''
const SWIPE_THRESHOLD = 48

/** Near-square band — keep classic 1:1 product-shot look. */
const SQUARE_MIN = 0.92
const SQUARE_MAX = 1.08
/** Clamp extreme ratios so PDP layout stays usable. */
const PORTRAIT_MIN_RATIO = 0.68 // ~2:3 tall
const LANDSCAPE_MAX_RATIO = 1.45 // ~3:2 wide

const DEFAULT_FRAME = Object.freeze({
  aspect: 1,
  fit: 'cover',
  shape: 'square',
})

/**
 * Adaptive PDP frame from natural image size.
 * Square → 1:1 + cover. Tall/wide → clamped natural ratio + contain (full image, less gap).
 */
function resolveGalleryFrame(naturalWidth, naturalHeight) {
  const w = Number(naturalWidth) || 0
  const h = Number(naturalHeight) || 0
  if (!(w > 0) || !(h > 0)) return DEFAULT_FRAME

  const ratio = w / h

  if (ratio >= SQUARE_MIN && ratio <= SQUARE_MAX) {
    return { aspect: 1, fit: 'cover', shape: 'square' }
  }

  if (ratio < SQUARE_MIN) {
    const aspect = Math.max(PORTRAIT_MIN_RATIO, Math.min(ratio, SQUARE_MIN))
    return { aspect, fit: 'contain', shape: 'portrait' }
  }

  const aspect = Math.min(LANDSCAPE_MAX_RATIO, Math.max(ratio, SQUARE_MAX))
  return { aspect, fit: 'contain', shape: 'landscape' }
}

function GalleryImage({ src, alt, style, onNaturalSize }) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={style}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        const el = e.currentTarget
        onNaturalSize?.(el.naturalWidth, el.naturalHeight)
      }}
      onError={() => {
        if (FALLBACK_IMAGE && currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

export function ProductGallery({ images = [], name }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [frame, setFrame] = useState(DEFAULT_FRAME)
  const [isZooming, setIsZooming] = useState(false)
  const [lensState, setLensState] = useState({
    lensX: 0,
    lensY: 0,
    lensWidth: 0,
    lensHeight: 0,
    mainWidth: 0,
    mainHeight: 0,
  })
  const mainRef = useRef(null)
  const touchStartX = useRef(null)
  const pauseRef = useRef(false)
  const thumbRefs = useRef([])
  const frameCacheRef = useRef(new Map())

  const photos = images.filter(Boolean)
  const photoKey = photos.join('|')
  const safeIndex = Math.min(activeIndex, photos.length - 1)
  const active = photos[safeIndex]

  const ZOOM_SCALE = 2.5

  useEffect(() => {
    setActiveIndex(0)
    setIsZooming(false)
    frameCacheRef.current.clear()
    setFrame(DEFAULT_FRAME)
  }, [photoKey])

  useEffect(() => {
    if (!active) {
      setFrame(DEFAULT_FRAME)
      return
    }
    const cached = frameCacheRef.current.get(active)
    if (cached) setFrame(cached)
  }, [active])

  const handleNaturalSize = useCallback(
    (naturalWidth, naturalHeight) => {
      if (!active) return
      const next = resolveGalleryFrame(naturalWidth, naturalHeight)
      frameCacheRef.current.set(active, next)
      setFrame((prev) => {
        if (
          prev.aspect === next.aspect
          && prev.fit === next.fit
          && prev.shape === next.shape
        ) {
          return prev
        }
        return next
      })
    },
    [active]
  )

  const goTo = (index) => {
    if (photos.length <= 1) return
    if (index < 0) {
      setActiveIndex(photos.length - 1)
      return
    }
    if (index >= photos.length) {
      setActiveIndex(0)
      return
    }
    setActiveIndex(index)
  }

  const galleryRef = useRef(null)
  const thumbsContainerRef = useRef(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    const target = galleryRef.current
    if (!target || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
      },
      { threshold: 0.05 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (photos.length <= 1) return undefined

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return undefined

    const interval = setInterval(() => {
      if (!isVisibleRef.current || pauseRef.current || isZooming) return
      setActiveIndex((prev) => (prev + 1) % photos.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [photos.length, isZooming])

  useEffect(() => {
    const container = thumbsContainerRef.current
    const el = thumbRefs.current[safeIndex]
    if (!container || !el) return

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    if (elRect.top < containerRect.top) {
      container.scrollTop += elRect.top - containerRect.top
    } else if (elRect.bottom > containerRect.bottom) {
      container.scrollTop += elRect.bottom - containerRect.bottom
    }

    if (elRect.left < containerRect.left) {
      container.scrollLeft += elRect.left - containerRect.left
    } else if (elRect.right > containerRect.right) {
      container.scrollLeft += elRect.right - containerRect.right
    }
  }, [safeIndex])

  useEffect(() => {
    setIsZooming(false)
  }, [frame.aspect, frame.fit])

  const handleMouseMove = useCallback(
    (e) => {
      if (!mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomWidth = Math.max(rect.width + 70, 420)
      const zoomHeight = Math.max(
        280,
        Math.min(zoomWidth * (rect.height / Math.max(rect.width, 1)), 640)
      )

      const lensWidth = zoomWidth / ZOOM_SCALE
      const lensHeight = zoomHeight / ZOOM_SCALE

      const lensX = Math.max(0, Math.min(rect.width - lensWidth, mouseX - lensWidth / 2))
      const lensY = Math.max(0, Math.min(rect.height - lensHeight, mouseY - lensHeight / 2))

      setLensState({
        lensX,
        lensY,
        lensWidth,
        lensHeight,
        mainWidth: rect.width,
        mainHeight: rect.height,
        zoomWidth,
        zoomHeight,
      })
      setIsZooming(true)
    },
    [ZOOM_SCALE]
  )

  const handleMouseEnter = useCallback(
    (e) => {
      pauseRef.current = true
      handleMouseMove(e)
    },
    [handleMouseMove]
  )

  const handleMouseLeave = useCallback(() => {
    pauseRef.current = false
    setIsZooming(false)
  }, [])

  const onTouchStart = (event) => {
    pauseRef.current = true
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (event) => {
    pauseRef.current = false
    if (touchStartX.current == null || photos.length < 2) return
    const delta = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current)
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    goTo(safeIndex + (delta > 0 ? 1 : -1))
  }

  const aspectValue = Number.isFinite(frame.aspect) && frame.aspect > 0 ? frame.aspect : 1
  const mainStyle = {
    '--pdp-gallery-aspect': String(aspectValue),
    aspectRatio: String(aspectValue),
  }

  return (
    <div
      ref={galleryRef}
      className={`pdp-gallery pdp-gallery--${frame.shape || 'square'}`}
      data-fit={frame.fit || 'cover'}
      onMouseEnter={() => {
        pauseRef.current = true
      }}
      onMouseLeave={() => {
        pauseRef.current = false
        setIsZooming(false)
      }}
    >
      {photos.length > 1 && (
        <div ref={thumbsContainerRef} className="pdp-gallery__thumbs" role="tablist" aria-label="Product images">
          {photos.map((img, i) => (
            <button
              key={`${img}-${i}`}
              ref={(el) => (thumbRefs.current[i] = el)}
              type="button"
              className={`pdp-gallery__thumb ${i === safeIndex ? 'pdp-gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-selected={i === safeIndex}
            >
              <GalleryImage src={img} alt="" />
            </button>
          ))}
        </div>
      )}

      <div
        ref={mainRef}
        className="pdp-gallery__main"
        style={mainStyle}
        onMouseMove={photos.length ? handleMouseMove : undefined}
        onMouseEnter={photos.length ? handleMouseEnter : undefined}
        onMouseLeave={photos.length ? handleMouseLeave : undefined}
        onTouchStart={photos.length ? onTouchStart : undefined}
        onTouchEnd={photos.length ? onTouchEnd : undefined}
      >
        {active ? (
          <GalleryImage
            key={active}
            src={active}
            alt={name}
            onNaturalSize={handleNaturalSize}
          />
        ) : (
          <div className="pdp-gallery__empty" aria-hidden="true" />
        )}

        {isZooming && lensState.mainWidth > 0 && (
          <div
            className="pdp-gallery__lens-box"
            style={{
              left: `${lensState.lensX}px`,
              top: `${lensState.lensY}px`,
              width: `${lensState.lensWidth}px`,
              height: `${lensState.lensHeight}px`,
            }}
          />
        )}
      </div>

      {isZooming && lensState.mainWidth > 0 && (
        <div
          className="pdp-gallery__zoom-window"
          aria-hidden="true"
          style={{
            width: `${lensState.zoomWidth || lensState.mainWidth}px`,
            height: `${lensState.zoomHeight || lensState.mainHeight || lensState.mainWidth}px`,
          }}
        >
          <img
            src={active}
            alt=""
            className="pdp-gallery__zoom-img"
            style={{
              width: `${lensState.mainWidth * ZOOM_SCALE}px`,
              height: `${lensState.mainHeight * ZOOM_SCALE}px`,
              objectFit: frame.fit === 'contain' ? 'contain' : 'cover',
              transform: `translate(${-lensState.lensX * ZOOM_SCALE}px, ${-lensState.lensY * ZOOM_SCALE}px)`,
            }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (FALLBACK_IMAGE && e.currentTarget.src !== FALLBACK_IMAGE) {
                e.currentTarget.src = FALLBACK_IMAGE
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
