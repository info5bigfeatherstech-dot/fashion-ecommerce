import { useState } from 'react'

export function ProductGallery({ images, name }) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__main">
        <img src={images[activeIndex]} alt={name} />
      </div>
      {images.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`pdp-gallery__thumb ${i === activeIndex ? 'pdp-gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
