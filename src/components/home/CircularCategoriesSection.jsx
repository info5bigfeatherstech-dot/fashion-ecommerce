import { Link } from 'react-router-dom'
import { HOME_CIRCLE_CATEGORIES } from '@/config/site'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { ReflectiveCard } from '@/components/ui/ReflectiveCard'

export function CircularCategoriesSection() {
  return (
    <section className="circle-categories" aria-labelledby="circle-categories-heading">
      <div className="container circle-categories__inner">
        <div className="section-header circle-categories__header">
          <div>
            <Reveal>
              <p className="circle-categories__eyebrow">
                <span className="circle-categories__eyebrow-rule" aria-hidden="true" />
                Explore
              </p>
            </Reveal>
            <ScrollRevealText as="h2" id="circle-categories-heading" className="display-md">
              Shop by <span className="heading-accent heading-accent--gold">Category</span>
            </ScrollRevealText>
            <Reveal delay={0.08}>
              <p className="section-subheader circle-categories__subheader">
                From everyday essentials to statement gifting — find your perfect piece.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <Link to="/shop/women" className="section-header__link">
              View all
            </Link>
          </Reveal>
        </div>

        <div className="circle-categories__track" role="list">
          {HOME_CIRCLE_CATEGORIES.map((category, index) => (
            <Reveal key={category.label} delay={index * 0.04} className="circle-categories__item-wrap">
              <Link
                to={category.href}
                className="circle-categories__item"
                role="listitem"
                aria-label={category.label}
              >
                <ReflectiveCard
                  as="div"
                  className="circle-categories__ring-card"
                  maxTilt={10}
                  glareOpacity={0.45}
                >
                  <span className="circle-categories__ring">
                    <span className="circle-categories__ring-inner">
                      <img src={category.image} alt="" loading="lazy" />
                      <span className="circle-categories__shine" aria-hidden="true" />
                    </span>
                  </span>
                </ReflectiveCard>
                <span className="circle-categories__label">{category.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
