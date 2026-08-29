import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import CustomizedGiftBox from '@/assets/Customized Gift Box.png'

export default function Gifting() {
  return (
    <div className="gifting-page">
      <style dangerouslySetInnerHTML={{
        __html: `
        .gifting-hero-wrapper {
          padding: 2rem 0;
        }
        .gifting-hero {
          position: relative;
          min-height: clamp(12rem, 28vh, 16.5rem);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #fff;
          overflow: hidden;
          border-radius: var(--radius-lg, 1rem);
        }
        .gifting-hero__bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: -1;
        }
        .gifting-hero__bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gifting-hero__bg::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
        }
        .gifting-hero__content {
          max-width: 800px;
          padding: 1.5rem;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .gifting-hero__title {
          font-family: var(--font-display, serif);
          font-size: clamp(1.65rem, 3.2vw, 2.45rem);
          font-weight: 400;
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
          line-height: 1.1;
        }
        .gifting-hero__subtitle {
          font-family: var(--font-ui, sans-serif);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          margin-bottom: 1rem;
          opacity: 0.9;
          font-weight: 400;
        }
        .gifting-hero__cta {
          display: inline-block;
          background: #fff;
          color: #000;
          padding: 0.75rem 1.5rem;
          border-radius: 99px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: transform 0.2s, background 0.2s;
        }
        .gifting-hero__cta:hover {
          transform: translateY(-2px);
          background: #f0f0f0;
        }
        
        .gifting-categories {
          padding: 6rem 2rem;
          background: #fafafa;
        }
        .gifting-section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 300;
          margin-bottom: 3rem;
        }
        .gifting-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .gifting-card {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          border-radius: 12px;
          display: block;
        }
        .gifting-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .gifting-card:hover img {
          transform: scale(1.05);
        }
        .gifting-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
        }
        .gifting-card__content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem;
          z-index: 1;
          color: #fff;
        }
        .gifting-card__title {
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }
        .gifting-card__link {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .gifting-curated {
          padding: 6rem 2rem;
          background: #fff;
          text-align: center;
        }
        .gifting-curated-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .gifting-curated p {
          font-size: 1.25rem;
          line-height: 1.8;
          color: #555;
          margin-bottom: 2rem;
        }
      `}} />

      <div className="gifting-hero-wrapper">
        <section className="gifting-hero container">
          <div className="gifting-hero__bg">
            <img src={CustomizedGiftBox} alt="Gifting" />
          </div>
          <motion.div
            className="gifting-hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="gifting-hero__title">The Art of Gifting</h1>
            <p className="gifting-hero__subtitle">Discover curated collections of timeless jewelry. Perfect for every occasion, ready to make their moment unforgettable.</p>
            <Link to="/shop/gifting" className="gifting-hero__cta">Shop the Gift Guide</Link>
          </motion.div>
        </section>
      </div>

      <section className="gifting-categories">
        <h2 className="gifting-section-title">Shop by Price</h2>
        <div className="gifting-grid">
          {[
            { title: 'Gifts Under ₹999', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', link: '/shop/gifting?price_max=999' },
            { title: 'Gifts Under ₹1999', img: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80', link: '/shop/gifting?price_max=1999' },
            { title: 'Premium Gifts', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80', link: '/shop/gifting?price_min=2000' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Link to={item.link} className="gifting-card">
                <img src={item.img} alt={item.title} loading="lazy" />
                <div className="gifting-card__content">
                  <h3 className="gifting-card__title">{item.title}</h3>
                  <span className="gifting-card__link">Shop Now &rarr;</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="gifting-curated">
        <div className="gifting-curated-container">
          <h2 className="gifting-section-title">Curated With Love</h2>
          <p>
            Whether it's an anniversary, a birthday, or just because, our jewelry pieces are crafted to convey your deepest affections. Each gift comes in our signature premium packaging, ready to put a smile on their face.
          </p>
          <Link to="/shop/women" className="gifting-hero__cta" style={{ background: '#000', color: '#fff' }}>Explore All Collections</Link>
        </div>
      </section>
    </div>
  )
}
