import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { FEATURE_FLAGS } from '@/config/site'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export function NewsletterSection() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600))
    reset()
  }

  return (
    <section className="section container">
      <div className="newsletter">
        <div>
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
        <Reveal delay={0.14}>
          <form className="newsletter__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <InputGroup label="Email address" htmlFor="newsletter-email" error={errors.email?.message}>
              <div className="input-row">
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email}
                  {...register('email')}
                />
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Joining...' : 'Subscribe'}
                </Button>
              </div>
            </InputGroup>
          </form>
        </Reveal>
      </div>
    </section>
  )
}
