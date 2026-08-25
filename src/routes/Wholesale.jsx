import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { SITE_CONTACT } from '@/config/site'

const WHOLESALE_EMAIL = SITE_CONTACT.wholesaleEmail || 'fabuniqo@gmail.com'

const BUSINESS_TYPES = [
  'Retail Shop',
  'Boutique',
  'Online Store',
  'Distributor / Wholesaler',
  'Reseller',
  'Corporate / Gifting',
  'Other',
]

const COUNTRIES = [
  'India',
  'United Arab Emirates',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Other',
]

const ORDER_VOLUMES = [
  'Below 50 pieces',
  '50 – 100 pieces',
  '100 – 500 pieces',
  '500 – 1000 pieces',
  '1000+ pieces',
  'Not sure yet',
]

const CATEGORY_OPTIONS = [
  'Earrings',
  'Necklaces',
  'Rings',
  'Bracelets / Bangles',
  'Pendants',
  'Sets',
  'Mangalsutras',
  'Gifting',
]

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

const wholesaleSchema = z.object({
  contactName: z.string().min(2, 'Contact person name is required'),
  businessEmail: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid business email'),
  phone: z
    .string()
    .min(8, 'Phone / WhatsApp number is required')
    .max(20, 'Phone number looks too long'),
  country: z.string().min(2, 'Country is required'),
  cityState: z.string().min(2, 'City & state is required'),
  companyName: z.string().optional(),
  businessType: z.string().min(1, 'Business type is required'),
  gstin: z.string().optional(),
  categories: z.array(z.string()).optional(),
  orderVolume: z.string().optional(),
  message: z.string().min(10, 'Please share your requirement (at least 10 characters)'),
  attachment: z
    .any()
    .optional()
    .refine(
      (files) => !files?.length || files[0].size <= MAX_ATTACHMENT_BYTES,
      'Attachment must be under 5MB'
    )
    .refine(
      (files) =>
        !files?.length ||
        /^(image\/|application\/pdf)/.test(files[0].type) ||
        /\.(jpe?g|png|webp|gif|pdf)$/i.test(files[0].name),
      'Upload an image or PDF only'
    ),
})

export default function Wholesale() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(wholesaleSchema),
    defaultValues: {
      country: 'India',
      categories: [],
      businessEmail: '',
      companyName: '',
      gstin: '',
      orderVolume: '',
    },
  })

  const attachmentFiles = watch('attachment')
  const attachmentName = attachmentFiles?.[0]?.name

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      formData.append('_subject', `Wholesale inquiry — ${data.companyName || data.contactName}`)
      formData.append('_template', 'table')
      formData.append('_captcha', 'false')
      formData.append('Contact Person Name', data.contactName)
      formData.append('Business Email', data.businessEmail || '—')
      formData.append('Phone / WhatsApp Number', data.phone)
      formData.append('Country', data.country)
      formData.append('City & State', data.cityState)
      formData.append('Company / Shop Name', data.companyName || '—')
      formData.append('Business Type', data.businessType)
      formData.append('GSTIN / Business Registration', data.gstin || '—')
      formData.append(
        'Categories of Interest',
        data.categories?.length ? data.categories.join(', ') : '—'
      )
      formData.append('Expected Order Volume', data.orderVolume || '—')
      formData.append('Your Requirement / Message', data.message)

      const file = data.attachment?.[0]
      if (file) {
        formData.append('attachment', file, file.name)
      }

      const res = await fetch(`https://formsubmit.co/ajax/${WHOLESALE_EMAIL}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Could not send inquiry')
      }

      setSubmitted(true)
      reset({
        country: 'India',
        categories: [],
        businessEmail: '',
        companyName: '',
        gstin: '',
        orderVolume: '',
        contactName: '',
        phone: '',
        cityState: '',
        businessType: '',
        message: '',
        attachment: undefined,
      })
    } catch {
      toast.error('Could not send inquiry. Please try again or email us directly.')
    }
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
            <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
              <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="Contact Person Name"
                    htmlFor="ws-contact"
                    required
                    error={errors.contactName?.message}
                  >
                    <Input
                      id="ws-contact"
                      placeholder="Your full name"
                      error={errors.contactName}
                      {...register('contactName')}
                    />
                  </InputGroup>
                  <InputGroup
                    label="Business Email"
                    htmlFor="ws-email"
                    error={errors.businessEmail?.message}
                  >
                    <Input
                      id="ws-email"
                      type="email"
                      placeholder="you@business.com"
                      error={errors.businessEmail}
                      {...register('businessEmail')}
                    />
                  </InputGroup>
                </div>

                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="Phone / WhatsApp Number"
                    htmlFor="ws-phone"
                    required
                    error={errors.phone?.message}
                  >
                    <Input
                      id="ws-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      error={errors.phone}
                      {...register('phone')}
                    />
                  </InputGroup>
                  <InputGroup label="Country" htmlFor="ws-country" required error={errors.country?.message}>
                    <select
                      id="ws-country"
                      className={`input ${errors.country ? 'input--error' : ''}`}
                      {...register('country')}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </InputGroup>
                </div>

                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="City & State"
                    htmlFor="ws-city-state"
                    required
                    error={errors.cityState?.message}
                  >
                    <Input
                      id="ws-city-state"
                      placeholder="e.g. Mumbai, Maharashtra"
                      error={errors.cityState}
                      {...register('cityState')}
                    />
                  </InputGroup>
                  <InputGroup
                    label="Company / Shop Name"
                    htmlFor="ws-company"
                    error={errors.companyName?.message}
                  >
                    <Input
                      id="ws-company"
                      placeholder="Shop or company name"
                      error={errors.companyName}
                      {...register('companyName')}
                    />
                  </InputGroup>
                </div>

                <div className="form-grid form-grid--2">
                  <InputGroup
                    label="Business Type"
                    htmlFor="ws-business-type"
                    required
                    error={errors.businessType?.message}
                  >
                    <select
                      id="ws-business-type"
                      className={`input ${errors.businessType ? 'input--error' : ''}`}
                      {...register('businessType')}
                    >
                      <option value="">Select business type</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </InputGroup>
                  <InputGroup
                    label="GSTIN / Business Registration"
                    htmlFor="ws-gstin"
                    error={errors.gstin?.message}
                  >
                    <Input
                      id="ws-gstin"
                      placeholder="GSTIN or registration number"
                      error={errors.gstin}
                      {...register('gstin')}
                    />
                  </InputGroup>
                </div>

                <fieldset className="wholesale-page__fieldset">
                  <legend className="input-label">Categories of Interest</legend>
                  <div className="wholesale-page__categories">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <label key={cat} className="wholesale-page__check">
                        <input type="checkbox" value={cat} {...register('categories')} />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <InputGroup
                  label="Expected Order Volume"
                  htmlFor="ws-volume"
                  error={errors.orderVolume?.message}
                >
                  <select
                    id="ws-volume"
                    className={`input ${errors.orderVolume ? 'input--error' : ''}`}
                    {...register('orderVolume')}
                  >
                    <option value="">Select approximate volume</option>
                    {ORDER_VOLUMES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </InputGroup>

                <InputGroup
                  label="Your Requirement / Message"
                  htmlFor="ws-message"
                  required
                  error={errors.message?.message}
                >
                  <textarea
                    id="ws-message"
                    className={`input ${errors.message ? 'input--error' : ''}`}
                    rows={4}
                    placeholder="Tell us about your shop, first order, products needed, or any special requirement."
                    {...register('message')}
                  />
                </InputGroup>

                <InputGroup
                  label="Attach Business Card / Shop Photo"
                  htmlFor="ws-attachment"
                  error={errors.attachment?.message}
                >
                  <label htmlFor="ws-attachment" className="wholesale-page__file">
                    <input
                      id="ws-attachment"
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      className="wholesale-page__file-input"
                      {...register('attachment')}
                    />
                    <span className="wholesale-page__file-btn">Choose file</span>
                    <span className="wholesale-page__file-name text-muted">
                      {attachmentName || 'Image or PDF, max 5MB'}
                    </span>
                  </label>
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
