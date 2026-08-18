import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'

export default function Checkout() {
  const cartItems = useAppStore((s) => s.cartItems)
  const cartTotal = useCartTotal()
  const clearCart = useAppStore((s) => s.clearCart)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [prepaidOption, setPrepaidOption] = useState('card')

  const shipping = cartTotal >= 100 ? 0 : 9.95
  const total = cartTotal + shipping

  const checkoutSchema = useMemo(() => {
    return z
      .object({
        email: z.string().email('Valid email required'),
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        address: z.string().min(1, 'Address required'),
        city: z.string().min(1, 'City required'),
        state: z.string().min(1, 'State required'),
        zip: z.string().min(3, 'ZIP code required'),

        paymentMethod: z.enum(['prepaid', 'cod', 'partial']),
        prepaidOption: z.enum(['razorpay', 'card']).optional(),
        cardNumber: z.string().optional(),
        expiry: z.string().optional(),
        cvv: z.string().optional(),
        partialAmount: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.paymentMethod === 'prepaid') {
          if (!data.prepaidOption) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['prepaidOption'],
              message: 'Select a prepaid option',
            })
            return
          }
          if (!data.cardNumber || data.cardNumber.length < 16 || data.cardNumber.length > 19) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cardNumber'],
              message: 'Valid card number required',
            })
          }
          if (!data.expiry || !/^\d{2}\/\d{2}$/.test(data.expiry)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['expiry'],
              message: 'Use MM/YY format',
            })
          }
          if (!data.cvv || data.cvv.length < 3 || data.cvv.length > 4) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['cvv'],
              message: 'CVV required',
            })
          }
        }

        if (data.paymentMethod === 'partial') {
          const num = Number(data.partialAmount)
          if (!data.partialAmount || Number.isNaN(num) || num <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['partialAmount'],
              message: 'Enter a valid amount',
            })
          } else if (num > total) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['partialAmount'],
              message: `Amount cannot exceed ${formatPrice(total)}`,
            })
          }
        }
      })
  }, [total])

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'prepaid',
      prepaidOption: 'card',
      partialAmount: '',
    },
  })

  const paymentMethod = watch('paymentMethod')
  const partialAmountNum = Number(watch('partialAmount') || 0)

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Nothing to checkout</h1>
        <Link to="/shop/women"><Button variant="primary">Continue Shopping</Button></Link>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Order Confirmed</h1>
        <p className="body-lg text-muted">Thank you for shopping with VERAÒ. You'll receive a confirmation email shortly.</p>
        <Link to="/"><Button variant="primary">Back to Home</Button></Link>
      </div>
    )
  }

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 1000))
    clearCart()
    setOrderPlaced(true)
  }

  return (
    <div className="container checkout">
      <div>
        <h1 className="display-lg" style={{ marginBottom: 'var(--space-4)' }}>Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <section className="checkout-section">
            <h2 className="checkout-section__title">Contact</h2>
            <InputGroup label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" error={errors.email} {...register('email')} />
            </InputGroup>
          </section>

          <Separator style={{ marginBlock: 'var(--space-4)' }} />

          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping Address</h2>
            <div className="form-grid">
              <InputGroup label="First Name" htmlFor="firstName" error={errors.firstName?.message}>
                <Input id="firstName" error={errors.firstName} {...register('firstName')} />
              </InputGroup>
              <InputGroup label="Last Name" htmlFor="lastName" error={errors.lastName?.message}>
                <Input id="lastName" error={errors.lastName} {...register('lastName')} />
              </InputGroup>
              <InputGroup label="Address" htmlFor="address" error={errors.address?.message}>
                <Input id="address" error={errors.address} {...register('address')} />
              </InputGroup>
              <div className="form-grid form-grid--2">
                <InputGroup label="City" htmlFor="city" error={errors.city?.message}>
                  <Input id="city" error={errors.city} {...register('city')} />
                </InputGroup>
                <InputGroup label="State" htmlFor="state" error={errors.state?.message}>
                  <Input id="state" error={errors.state} {...register('state')} />
                </InputGroup>
              </div>
              <InputGroup label="ZIP Code" htmlFor="zip" error={errors.zip?.message}>
                <Input id="zip" error={errors.zip} {...register('zip')} />
              </InputGroup>
            </div>
          </section>

          <Separator style={{ marginBlock: 'var(--space-4)' }} />

          <section className="checkout-section">
            <h2 className="checkout-section__title">Payment</h2>
            <input type="hidden" {...register('paymentMethod')} />
            <Tabs
              defaultValue="prepaid"
              value={paymentMethod}
              onValueChange={(v) => setValue('paymentMethod', v, { shouldValidate: true })}
              className="checkout-payment-tabs"
            >
              <TabsList>
                <TabsTrigger value="prepaid">Prepaid</TabsTrigger>
                <TabsTrigger value="cod">COD</TabsTrigger>
                <TabsTrigger value="partial">Partial</TabsTrigger>
              </TabsList>

              <TabsContent value="prepaid">
                <Tabs
                  defaultValue="card"
                  value={prepaidOption}
                  onValueChange={(v) => {
                    setPrepaidOption(v)
                    setValue('prepaidOption', v, { shouldValidate: true })
                  }}
                  className="checkout-prepaid-tabs"
                >
                  <TabsList>
                    <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
                    <TabsTrigger value="card">Card</TabsTrigger>
                  </TabsList>

                  <TabsContent value="razorpay">
                    <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
                      <InputGroup label="Card Number" htmlFor="cardNumber" error={errors.cardNumber?.message}>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          error={errors.cardNumber}
                          {...register('cardNumber')}
                        />
                      </InputGroup>
                      <div className="form-grid form-grid--2">
                        <InputGroup label="Expiry" htmlFor="expiry" error={errors.expiry?.message}>
                          <Input id="expiry" placeholder="MM/YY" error={errors.expiry} {...register('expiry')} />
                        </InputGroup>
                        <InputGroup label="CVV" htmlFor="cvv" error={errors.cvv?.message}>
                          <Input id="cvv" placeholder="123" error={errors.cvv} {...register('cvv')} />
                        </InputGroup>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="card">
                    <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
                      <InputGroup label="Card Number" htmlFor="cardNumber" error={errors.cardNumber?.message}>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          error={errors.cardNumber}
                          {...register('cardNumber')}
                        />
                      </InputGroup>
                      <div className="form-grid form-grid--2">
                        <InputGroup label="Expiry" htmlFor="expiry" error={errors.expiry?.message}>
                          <Input id="expiry" placeholder="MM/YY" error={errors.expiry} {...register('expiry')} />
                        </InputGroup>
                        <InputGroup label="CVV" htmlFor="cvv" error={errors.cvv?.message}>
                          <Input id="cvv" placeholder="123" error={errors.cvv} {...register('cvv')} />
                        </InputGroup>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="cod">
                <div className="card" style={{ padding: 'var(--space-4)' }}>
                  <p className="body-sm text-muted">
                    Pay on delivery. No card details required for COD.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="partial">
                <div className="form-grid">
                  <InputGroup
                    label="Amount to pay now"
                    htmlFor="partialAmount"
                    error={errors.partialAmount?.message}
                  >
                    <Input
                      id="partialAmount"
                      placeholder={`Up to ${formatPrice(total)}`}
                      error={errors.partialAmount}
                      {...register('partialAmount')}
                    />
                  </InputGroup>
                  <p className="body-sm text-muted">
                    Remaining balance will be collected later (API integration later).
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            style={{ marginTop: 'var(--space-4)' }}
          >
            {isSubmitting
              ? 'Processing...'
              : paymentMethod === 'cod'
                ? 'Place Order'
                : paymentMethod === 'partial'
                  ? `Pay ${formatPrice(partialAmountNum || 0)} now`
                  : `Pay ${formatPrice(total)}`
            }
          </Button>
        </form>
      </div>

      <div className="checkout-summary">
        <h2 className="checkout-section__title">Order Summary</h2>
        {cartItems.map((item) => (
          <div key={item.id} className="checkout-summary__row">
            <span>{item.name} × {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="checkout-summary__row">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div className="checkout-summary__total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
