import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { SITE_CONTACT } from '@/config/site'

const CONTACT_EMAIL = SITE_CONTACT.email?.trim() || 'support.fabuniqo@gmail.com'

const REASON_OPTIONS = [
  'Order Status',
  'Return/Exchange',
  'Product Inquiry',
  'Other',
]

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'),
  phone: z
    .string()
    .min(8, 'Phone number is required')
    .max(20, 'Phone number looks too long'),
  reason: z.string().min(1, 'Please select a reason'),
  message: z.string().min(10, 'Please enter at least 10 characters'),
})

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      formData.append('_subject', `Contact Us — ${data.reason}`)
      formData.append('_template', 'table')
      formData.append('_captcha', 'false')
      formData.append('Name', data.name)
      formData.append('Email', data.email)
      formData.append('Phone', data.phone)
      formData.append('Reason for Contact', data.reason)
      formData.append('Message', data.message)

      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Could not send message')
      }

      setSubmitted(true)
      reset()
    } catch {
      toast.error('Could not send message. Please try again or email us directly.')
    }
  }

  return (
    <div className="container wholesale-page">
      <div className="wholesale-page__intro">
        <p className="heading-sm text-accent">Get in Touch</p>
        <h1 className="display-lg">Contact Us</h1>
        <p className="body-lg text-muted">
          Have a question about your order, a product, or anything else?
          Fill out the form below and we will get back to you.
        </p>
      </div>

      <div className="wholesale-page__layout">
        <aside className="card wholesale-page__side">
          <MessageCircle size={28} aria-hidden="true" />
          <h2 className="display-md" style={{ fontSize: 'var(--text-xl)' }}>We are here to help</h2>
          <p className="body-sm text-muted">
            Our support team typically responds within 24 hours on business days.
          </p>
          <ul className="wholesale-page__points">
            <li>Order tracking and status updates</li>
            <li>Returns and exchange requests</li>
            <li>Product questions and sizing help</li>
          </ul>
        </aside>

        <div className="card wholesale-page__form-card">
          {submitted ? (
            <div className="wholesale-page__success">
              <h2 className="display-md">Message sent</h2>
              <p className="body-lg text-muted">
                Thank you for reaching out. We will get back to you soon.
              </p>
              <Button type="button" variant="secondary" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                <InputGroup
                  label="Your Name"
                  htmlFor="cu-name"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    id="cu-name"
                    placeholder="Your full name"
                    error={errors.name}
                    {...register('name')}
                  />
                </InputGroup>

                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="Email Address"
                    htmlFor="cu-email"
                    required
                    error={errors.email?.message}
                  >
                    <Input
                      id="cu-email"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email}
                      {...register('email')}
                    />
                  </InputGroup>
                  <InputGroup
                    label="Phone Number"
                    htmlFor="cu-phone"
                    required
                    error={errors.phone?.message}
                  >
                    <Input
                      id="cu-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      error={errors.phone}
                      {...register('phone')}
                    />
                  </InputGroup>
                </div>

                <InputGroup
                  label="Reason for Contact"
                  htmlFor="cu-reason"
                  required
                  error={errors.reason?.message}
                >
                  <select
                    id="cu-reason"
                    className={`input ${errors.reason ? 'input--error' : ''}`}
                    {...register('reason')}
                  >
                    <option value="">Select a reason</option>
                    {REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </InputGroup>

                <InputGroup
                  label="Your Message"
                  htmlFor="cu-message"
                  required
                  error={errors.message?.message}
                >
                  <textarea
                    id="cu-message"
                    className={`input ${errors.message ? 'input--error' : ''}`}
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    {...register('message')}
                  />
                </InputGroup>

                <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
