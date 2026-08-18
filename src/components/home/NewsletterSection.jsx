import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
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
          <h2 className="display-md" style={{ marginBottom: 'var(--space-1)' }}>Stay in the Jewelry Circle</h2>
          <p className="body-lg text-muted">
            Get first access to new jewelry drops, festive edits, styling ideas, and member-only offers.
          </p>
          {FEATURE_FLAGS.enableAppDownload && (
            <p className="body-sm" style={{ marginTop: 'var(--space-2)' }}>
              Follow VERAÒ for jewelry launches, gifting ideas, and exclusive app-only rewards.
            </p>
          )}
        </div>
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
      </div>
    </section>
  )
}
