import { useEffect, useRef, useState, useCallback } from 'react'

const FALLBACK_IMAGE = ''

const SWIPE_THRESHOLD = 48

function GalleryImage({ src, alt, style }) {
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
      onError={() => {
        if (FALLBACK_IMAGE && currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

export function ProductGallery({ images = [], name }) {
  const [activeIndex, setActiveIndex] = useState(0)
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

  const photos = images.length ? images : [FALLBACK_IMAGE]
  const photoKey = photos.join('|')
  const safeIndex = Math.min(activeIndex, photos.length - 1)
  const active = photos[safeIndex]

  const ZOOM_SCALE = 2.5

  useEffect(() => {
    setActiveIndex(0)
    setIsZooming(false)
  }, [photoKey])

  const goTo = (index) => {
    setActiveIndex(Math.max(0, Math.min(photos.length - 1, index)))
  }

  const handleMouseMove = useCallback(
    (e) => {
      if (!mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // The right zoom preview window (slightly larger than the original main photo: 570px)
      const zoomSize = Math.max(rect.width + 70, 570)

      // Square lens box matching square zoom scale
      const lensWidth = zoomSize / ZOOM_SCALE
      const lensHeight = zoomSize / ZOOM_SCALE

      // Clamp lens position inside main image
      const lensX = Math.max(0, Math.min(rect.width - lensWidth, mouseX - lensWidth / 2))
      const lensY = Math.max(0, Math.min(rect.height - lensHeight, mouseY - lensHeight / 2))

      setLensState({
        lensX,
        lensY,
        lensWidth,
        lensHeight,
        mainWidth: rect.width,
        mainHeight: rect.height,
        zoomSize,
      })
      setIsZooming(true)
    },
    [ZOOM_SCALE]
  )

  const handleMouseEnter = useCallback(
    (e) => {
      handleMouseMove(e)
    },
    [handleMouseMove]
  )

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false)
  }, [])

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (event) => {
    if (touchStartX.current == null || photos.length < 2) return
    const delta = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current)
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    goTo(safeIndex + (delta > 0 ? 1 : -1))
  }

  return (
    <div className="pdp-gallery">
      {photos.length > 1 && (
        <div className="pdp-gallery__thumbs" role="tablist" aria-label="Product images">
          {photos.map((img, i) => (
            <button
              key={`${img}-${i}`}
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
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <GalleryImage key={active} src={active} alt={name} />

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
            width: `${lensState.zoomSize || lensState.mainWidth}px`,
            height: `${lensState.zoomSize || lensState.mainWidth}px`,
          }}
        >
          <img
            src={active}
            alt=""
            className="pdp-gallery__zoom-img"
            style={{
              width: `${lensState.mainWidth * ZOOM_SCALE}px`,
              height: `${lensState.mainHeight * ZOOM_SCALE}px`,
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


