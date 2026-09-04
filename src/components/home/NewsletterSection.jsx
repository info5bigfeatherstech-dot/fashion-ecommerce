import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { FEATURE_FLAGS } from '@/config/site'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export function NewsletterSection() {
  const [isSuccess, setIsSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600))
    setIsSuccess(true)
    reset()
  }

  return (
    <section className="section container">
      <div className="newsletter">
        <div className="newsletter__content">
          <ScrollRevealText
            as="h2"
            className="display-md"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            Stay in the <span className="heading-accent heading-accent--gold">Loop</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="body-lg text-muted">
              Get first access to new jewelry drops, festive edits, styling ideas, and exclusive offers.
            </p>
            {FEATURE_FLAGS.enableAppDownload && (
              <p className="body-sm" style={{ marginTop: 'var(--space-2)' }}>
                Follow FABUNIQO for jewelry launches, gifting ideas, and app-only updates.
              </p>
            )}
            <p className="section-footnote">
              Join the list and never miss a drop, deal, or styling edit.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.14} className="newsletter__form-wrap">
          {isSuccess ? (
            <div className="newsletter__success" role="status">
              <CheckCircle2 size={24} className="text-gold" aria-hidden="true" />
              <div>
                <p className="newsletter__success-title">You're on the VIP list!</p>
                <p className="body-sm text-muted">
                  Thank you for subscribing. We'll send our latest drops and exclusive treats directly to your inbox.
                </p>
              </div>
            </div>
          ) : (
            <form className="newsletter__form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label htmlFor="newsletter-email" className="newsletter__label">
                Email address
              </label>
              <div className="newsletter__field-group">
                <div className="newsletter__input-wrap">
                  <Mail size={18} className="newsletter__input-icon" aria-hidden="true" />
                  <input
                    id="newsletter-email"
                    type="email"
                    className={`newsletter__input ${errors.email ? 'newsletter__input--error' : ''}`}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    aria-label="Email address"
                    {...register('email')}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="newsletter__btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Subscribe'}
                </Button>
              </div>
              {errors.email?.message && (
                <span className="input-error newsletter__error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
