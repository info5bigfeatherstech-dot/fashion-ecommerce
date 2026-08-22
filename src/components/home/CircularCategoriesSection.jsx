import { Link } from 'react-router-dom'
import { HOME_CIRCLE_CATEGORIES } from '@/config/site'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { ReflectiveCard } from '@/components/ui/ReflectiveCard'

export function CircularCategoriesSection() {
  return (
    <section className="circle-categories" aria-labelledby="circle-categories-heading">
      <div className="container circle-categories__inner">
        <div className="circle-categories__header">
          <ScrollRevealText as="h2" id="circle-categories-heading" className="circle-categories__title">
            Categories
          </ScrollRevealText>
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
