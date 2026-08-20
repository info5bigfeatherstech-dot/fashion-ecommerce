import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store'

const addressSchema = z.object({
  fullAddress: z.string().min(3, 'Address required'),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  zip: z.string().min(3, 'ZIP code required').max(10, 'ZIP code too long'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, '').length >= 8, 'Phone number looks too short'),
})

export function CheckoutAddressModal({ open, onOpenChange, onProceed }) {
  const addresses = useAppStore((s) => s.addresses)
  const checkoutAddress = useAppStore((s) => s.checkoutAddress)
  const addAddress = useAppStore((s) => s.addAddress)
  const setCheckoutAddress = useAppStore((s) => s.setCheckoutAddress)

  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((a) => a.id === selectedAddressId) || null
  }, [addresses, selectedAddressId])

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullAddress: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!open) return

    const preferredId = checkoutAddress?.id
    if (preferredId) {
      setSelectedAddressId(preferredId)
      return
    }

    setSelectedAddressId(addresses[0]?.id ?? null)
  }, [open, addresses, checkoutAddress?.id])

  const handleProceed = () => {
    if (!selectedAddress) return
    setCheckoutAddress(selectedAddress)
    onProceed?.()
    onOpenChange?.(false)
  }

  const handleSaveAndContinue = async (data) => {
    const newId = addAddress({
      fullAddress: data.fullAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone || undefined,
    })

    const newAddress = {
      id: newId,
      fullAddress: data.fullAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone || undefined,
    }

    setSelectedAddressId(newId)
    setCheckoutAddress(newAddress)
    onProceed?.()
    onOpenChange?.(false)
    addressForm.reset()
  }

  const handleSaveOnly = async (data) => {
    const newId = addAddress({
      fullAddress: data.fullAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone || undefined,
    })

    // Select the newly-added address so user can immediately continue.
    setSelectedAddressId(newId)
    addressForm.reset()
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delivery Address"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>
            Choose a saved address
          </h2>

          {addresses.length === 0 ? (
            <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
              No saved addresses yet. Add your first delivery address below.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddressId(addr.id)}
                    className="card"
                    style={{
                      padding: 'var(--space-3)',
                      textAlign: 'left',
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(197,162,109,0.08)' : 'var(--color-white)',
                    }}
                    aria-label={`Select address: ${addr.fullAddress}`}
                  >
                    <p className="body-sm" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      {addr.fullAddress}
                    </p>
                    <p className="body-sm text-muted">
                      {addr.city}, {addr.state} · {addr.zip}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>
            Add a new address
          </h2>

          <form
            onSubmit={addressForm.handleSubmit(handleSaveAndContinue)}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <InputGroup label="Full address" htmlFor="addr-full" error={addressForm.formState.errors.fullAddress?.message}>
              <Input id="addr-full" placeholder="House / Street / Area" {...addressForm.register('fullAddress')} />
            </InputGroup>

            <div className="form-grid form-grid--2">
              <InputGroup label="City" htmlFor="addr-city" error={addressForm.formState.errors.city?.message}>
                <Input id="addr-city" placeholder="City" {...addressForm.register('city')} />
              </InputGroup>

              <InputGroup label="State" htmlFor="addr-state" error={addressForm.formState.errors.state?.message}>
                <Input id="addr-state" placeholder="State" {...addressForm.register('state')} />
              </InputGroup>
            </div>

            <InputGroup label="ZIP Code" htmlFor="addr-zip" error={addressForm.formState.errors.zip?.message}>
              <Input id="addr-zip" placeholder="ZIP" {...addressForm.register('zip')} />
            </InputGroup>

            <InputGroup label="Phone (optional)" htmlFor="addr-phone" error={addressForm.formState.errors.phone?.message}>
              <Input id="addr-phone" placeholder="Phone number" {...addressForm.register('phone')} />
            </InputGroup>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexDirection: 'row', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={addressForm.handleSubmit(handleSaveOnly)}
              >
                Save address
              </Button>

              <Button
                type="submit"
                variant="primary"
              >
                Save & Continue
              </Button>
            </div>
          </form>
        </div>

        <Separator />

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="primary"
            fullWidth
            type="button"
            onClick={handleProceed}
            disabled={!selectedAddress}
          >
            Continue to checkout
          </Button>
        </div>
      </div>
    </Modal>
  )
}

