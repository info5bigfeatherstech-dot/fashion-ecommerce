import { useState } from 'react'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=1600&q=80'

function GalleryImage({ src, alt }) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      src={failed ? FALLBACK_IMAGE : src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export function ProductGallery({ images = [], name }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const photos = images.length ? images : [FALLBACK_IMAGE]
  const active = photos[activeIndex] || photos[0]

  return (
    <div className="pdp-gallery">
      {photos.length > 1 && (
        <div className="pdp-gallery__thumbs" role="tablist" aria-label="Product images">
          {photos.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              className={`pdp-gallery__thumb ${i === activeIndex ? 'pdp-gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-selected={i === activeIndex}
            >
              <GalleryImage src={img} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="pdp-gallery__main">
        <GalleryImage src={active} alt={name} />
      </div>
    </div>
  )
}
