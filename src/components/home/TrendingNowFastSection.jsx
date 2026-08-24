import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import video1 from '@/assets/167569-837244635_medium.mp4'
import video2 from '@/assets/347325.mp4'
import video3 from '@/assets/371392.mp4'
import video4 from '@/assets/371392 (1).mp4'

const TRENDING_VIDEOS = [
  { id: 'trending-1', src: video1, label: 'Trending jewellery look 1' },
  { id: 'trending-2', src: video2, label: 'Trending jewellery look 2' },
  { id: 'trending-3', src: video3, label: 'Trending jewellery look 3' },
  { id: 'trending-4', src: video4, label: 'Trending jewellery look 4' },
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
  return (
    <section className="section container container--wide trending-now-section">
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
          {TRENDING_VIDEOS.map((clip) => (
            <div key={clip.id} className="trending-now-videos__item" role="listitem">
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
                aria-label={clip.label}
              />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
