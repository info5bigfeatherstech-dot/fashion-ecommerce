import { useEffect, useState } from 'react'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=1600&q=80'

function GalleryImage({ src, alt }) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

export function ProductGallery({ images = [], name }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const photos = images.length ? images : [FALLBACK_IMAGE]
  const photoKey = photos.join('|')
  const safeIndex = Math.min(activeIndex, photos.length - 1)
  const active = photos[safeIndex]

  useEffect(() => {
    setActiveIndex(0)
  }, [photoKey])

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

      <div className="pdp-gallery__main">
        <GalleryImage key={active} src={active} alt={name} />
      </div>
    </div>
  )
}
