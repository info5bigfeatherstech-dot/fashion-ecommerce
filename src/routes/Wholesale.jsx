import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'

const wholesaleSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  shopName: z.string().min(2, 'Shop name is required'),
  phone: z
    .string()
    .min(8, 'Phone / WhatsApp is required')
    .max(20, 'Phone number looks too long'),
  city: z.string().min(2, 'City is required'),
  gst: z.string().optional(),
  categories: z.string().min(2, 'Tell us what you want to buy'),
  quantity: z.string().min(1, 'Approximate quantity is required'),
  message: z.string().optional(),
})

export default function Wholesale() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(wholesaleSchema),
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500))
    setSubmitted(true)
    reset()
  }

  return (
    <div className="container wholesale-page">
      <div className="wholesale-page__intro">
        <p className="heading-sm text-accent">B2B Inquiry</p>
        <h1 className="display-lg">Wholesale</h1>
        <p className="body-lg text-muted">
          Buy artificial jewelry in bulk for your shop, boutique, or online store.
          Share a few details and we will get back to you with rates and MOQ.
        </p>
      </div>

      <div className="wholesale-page__layout">
        <aside className="card wholesale-page__side">
          <Warehouse size={28} aria-hidden="true" />
          <h2 className="display-md" style={{ fontSize: 'var(--text-xl)' }}>For retailers and resellers</h2>
          <p className="body-sm text-muted">
            Earrings, necklaces, rings, bangles, and matching sets — priced for bulk orders.
          </p>
          <ul className="wholesale-page__points">
            <li>Minimum order discussed after inquiry</li>
            <li>GST invoice available</li>
            <li>Dispatch by courier or transport</li>
          </ul>
        </aside>

        <div className="card wholesale-page__form-card">
          {submitted ? (
            <div className="wholesale-page__success">
              <h2 className="display-md">Inquiry received</h2>
              <p className="body-lg text-muted">
                Thank you. We will contact you on WhatsApp or phone with wholesale rates.
              </p>
              <Button type="button" variant="secondary" onClick={() => setSubmitted(false)}>
                Send another inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                <div className="form-grid form-grid--2">
                  <InputGroup label="Full Name" htmlFor="ws-name" error={errors.fullName?.message}>
                    <Input
                      id="ws-name"
                      placeholder="Your name"
                      error={errors.fullName}
                      {...register('fullName')}
                    />
                  </InputGroup>
                  <InputGroup label="Shop / Company Name" htmlFor="ws-shop" error={errors.shopName?.message}>
                    <Input
                      id="ws-shop"
                      placeholder="Shop name"
                      error={errors.shopName}
                      {...register('shopName')}
                    />
                  </InputGroup>
                </div>

                <div className="form-grid form-grid--2">
                  <InputGroup label="Phone / WhatsApp" htmlFor="ws-phone" error={errors.phone?.message}>
                    <Input
                      id="ws-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      error={errors.phone}
                      {...register('phone')}
                    />
                  </InputGroup>
                  <InputGroup label="City" htmlFor="ws-city" error={errors.city?.message}>
                    <Input
                      id="ws-city"
                      placeholder="Mumbai"
                      error={errors.city}
                      {...register('city')}
                    />
                  </InputGroup>
                </div>

                <InputGroup label="GST Number (optional)" htmlFor="ws-gst" error={errors.gst?.message}>
                  <Input
                    id="ws-gst"
                    placeholder="If you have GST"
                    error={errors.gst}
                    {...register('gst')}
                  />
                </InputGroup>

                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="What do you want to buy?"
                    htmlFor="ws-categories"
                    error={errors.categories?.message}
                  >
                    <Input
                      id="ws-categories"
                      placeholder="Earrings, sets, necklaces..."
                      error={errors.categories}
                      {...register('categories')}
                    />
                  </InputGroup>
                  <InputGroup
                    label="Approximate quantity"
                    htmlFor="ws-quantity"
                    error={errors.quantity?.message}
                  >
                    <Input
                      id="ws-quantity"
                      placeholder="e.g. 50 sets or 200 pieces"
                      error={errors.quantity}
                      {...register('quantity')}
                    />
                  </InputGroup>
                </div>

                <InputGroup label="Message (optional)" htmlFor="ws-message" error={errors.message?.message}>
                  <textarea
                    id="ws-message"
                    className={`input ${errors.message ? 'input--error' : ''}`}
                    rows={4}
                    placeholder="Tell us about your shop, first order, or any special requirement."
                    {...register('message')}
                  />
                </InputGroup>

                <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
