import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { TrendingVideoReelModal } from '@/components/home/TrendingVideoReelModal'

const CLOUDINARY_TRENDING_VIDEO =
  'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787745696/web_1.mp4'

const TRENDING_VIDEOS = [
  { id: 'trending-1', src: CLOUDINARY_TRENDING_VIDEO, title: 'Kundan Jewellery', label: 'Trending jewellery look 1' },
  {
    id: 'trending-2',
    src: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787746151/web_2.mp4',
    title: 'Everyday Gold',
    label: 'Trending jewellery look 2',
  },
  { id: 'trending-3', src: CLOUDINARY_TRENDING_VIDEO, title: 'Bridal Edit', label: 'Trending jewellery look 3' },
  { id: 'trending-4', src: CLOUDINARY_TRENDING_VIDEO, title: 'Statement Drops', label: 'Trending jewellery look 4' },
]

function bindSilentLoop(el) {
  if (!el) return
  el.muted = true
  el.defaultMuted = true
  el.volume = 0
  el.setAttribute('muted', '')
  el.playsInline = true
  const play = () => {
    el.play().catch(() => {})
  }
  if (el.readyState >= 2) play()
  else el.addEventListener('loadeddata', play, { once: true })
}

export function TrendingNowFastSection() {
  const [activeIndex, setActiveIndex] = useState(null)

  return (
    <section className="section container trending-now-section">
      <div className="section-header">
        <div>
          <Reveal x={-14} y={0}>
            <span className="trending-now-badge">
              <TrendingUp size={14} aria-hidden="true" />
              Trending Jewellery
            </span>
          </Reveal>
          <ScrollRevealText as="h2" className="display-md">
            Moving Fast — Shop Before They’re Gone
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Pieces climbing in popularity right now. Grab the looks everyone’s adding to cart.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/shop?sort=rating" className="section-header__link">View All</Link>
        </Reveal>
      </div>
      <Reveal delay={0.1}>
        <div className="trending-now-videos" role="list">
          {TRENDING_VIDEOS.map((clip, index) => (
            <div key={clip.id} className="trending-now-videos__item" role="listitem">
              <button
                type="button"
                className="trending-now-videos__open"
                onClick={() => setActiveIndex(index)}
                aria-label={`Open ${clip.title || clip.label}`}
              >
                <video
                  ref={bindSilentLoop}
                  className="trending-now-videos__video"
                  src={clip.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}
        </div>
      </Reveal>

      {activeIndex != null ? (
        <TrendingVideoReelModal
          videos={TRENDING_VIDEOS}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </section>
  )
}
