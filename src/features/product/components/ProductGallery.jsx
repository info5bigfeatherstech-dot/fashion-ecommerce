import { useEffect, useRef, useState, useCallback } from 'react'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=1600&q=80'

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
        if (currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

export function ProductGallery({ images = [], name }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState({ isZooming: false, x: 50, y: 50, mouseX: 0, mouseY: 0 })
  const mainRef = useRef(null)
  const touchStartX = useRef(null)

  const photos = images.length ? images : [FALLBACK_IMAGE]
  const photoKey = photos.join('|')
  const safeIndex = Math.min(activeIndex, photos.length - 1)
  const active = photos[safeIndex]

  useEffect(() => {
    setActiveIndex(0)
    setZoom({ isZooming: false, x: 50, y: 50, mouseX: 0, mouseY: 0 })
  }, [photoKey])

  const goTo = (index) => {
    setActiveIndex(Math.max(0, Math.min(photos.length - 1, index)))
  }

  const handleMouseMove = useCallback((e) => {
    if (!mainRef.current) return
    const rect = mainRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    setZoom({
      isZooming: true,
      mouseX,
      mouseY,
      width: rect.width,
      height: rect.height,
    })
  }, [])

  const handleMouseEnter = useCallback(
    (e) => {
      handleMouseMove(e)
    },
    [handleMouseMove]
  )

  const handleMouseLeave = useCallback(() => {
    setZoom((prev) => ({ ...prev, isZooming: false }))
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

  const ZOOM_SCALE = 2.5
  const LENS_RADIUS = 80 // Half of 160px lens diameter

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
        className={`pdp-gallery__main ${zoom.isZooming ? 'pdp-gallery__main--zoomed' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <GalleryImage key={active} src={active} alt={name} />

        {zoom.isZooming && zoom.width > 0 && (
          <div
            className="pdp-gallery__lens"
            style={{
              left: `${zoom.mouseX}px`,
              top: `${zoom.mouseY}px`,
            }}
          >
            <GalleryImage
              src={active}
              alt=""
              className="pdp-gallery__lens-img"
              style={{
                width: `${zoom.width * ZOOM_SCALE}px`,
                height: `${zoom.height * ZOOM_SCALE}px`,
                transform: `translate(${-zoom.mouseX * ZOOM_SCALE + LENS_RADIUS}px, ${-zoom.mouseY * ZOOM_SCALE + LENS_RADIUS}px)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
