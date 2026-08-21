import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store'
import { AddressFormFields } from '@/features/address/components/AddressFormFields'
import { useAddresses, useCreateAddress } from '@/features/address/hooks'
import { applyFieldErrors } from '@/features/address/mappers'
import { ADDRESS_FORM_DEFAULTS, addressFormSchema } from '@/features/address/schema'

export function CheckoutAddressModal({ open, onOpenChange, onProceed }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const checkoutAddress = useAppStore((s) => s.checkoutAddress)
  const setCheckoutAddress = useAppStore((s) => s.setCheckoutAddress)

  const { data, isLoading, isError, error, refetch } = useAddresses({
    enabled: open && isAuthenticated,
  })
  const createAddress = useCreateAddress()

  const addresses = data?.all || []
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [formError, setFormError] = useState('')

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((a) => a.id === selectedAddressId) || null
  }, [addresses, selectedAddressId])

  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: ADDRESS_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!open) return

    const preferredId = checkoutAddress?.id
    if (preferredId && addresses.some((a) => a.id === preferredId)) {
      setSelectedAddressId(preferredId)
      return
    }

    const defaultId = data?.defaultAddress?.id || addresses[0]?.id || null
    setSelectedAddressId(defaultId)
  }, [open, addresses, checkoutAddress?.id, data?.defaultAddress?.id])

  const handleProceed = () => {
    if (!selectedAddress) return
    setCheckoutAddress(selectedAddress)
    onProceed?.()
    onOpenChange?.(false)
  }

  const handleCreate = async (formData, { continueAfter } = {}) => {
    setFormError('')
    try {
      const result = await createAddress.mutateAsync(formData)
      toast.success(result.message || 'Address saved')
      setSelectedAddressId(result.address?.id || null)
      if (continueAfter && result.address) {
        setCheckoutAddress(result.address)
        onProceed?.()
        onOpenChange?.(false)
      }
      addressForm.reset({
        ...ADDRESS_FORM_DEFAULTS,
        fullName: formData.fullName,
        phone: formData.phone,
      })
      await refetch()
    } catch (err) {
      const applied = applyFieldErrors(err, addressForm.setError)
      if (!applied) {
        setFormError(err?.message || 'Could not save address')
        toast.error(err?.message || 'Could not save address')
      }
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Delivery Address">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {!isAuthenticated ? (
          <div>
            <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
              Sign in to choose a saved delivery address or add a new one.
            </p>
            <Button asChild variant="primary">
              <Link to="/login" state={{ redirectTo: '/cart' }}>
                Sign in
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>
                Choose a saved address
              </h2>

              {isLoading ? (
                <p className="body-sm text-muted">Loading addresses…</p>
              ) : isError ? (
                <p className="body-sm" style={{ color: 'var(--color-danger, #b42318)' }}>
                  {error?.message || 'Could not load addresses.'}
                </p>
              ) : addresses.length === 0 ? (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <p className="body-sm" style={{ fontWeight: 'var(--weight-semibold)', margin: 0 }}>
                            {addr.fullName}
                          </p>
                          {addr.isDefault && <Badge>Default</Badge>}
                        </div>
                        <p className="body-sm" style={{ marginBottom: 4 }}>{addr.displayLine1 || addr.fullAddress}</p>
                        {addr.displayLine2 && (
                          <p className="body-sm text-muted" style={{ marginBottom: 4 }}>{addr.displayLine2}</p>
                        )}
                        <p className="body-sm text-muted">
                          {addr.city}, {addr.state} · {addr.postalCode || addr.zip}
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
                onSubmit={addressForm.handleSubmit((data) => handleCreate(data, { continueAfter: true }))}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
              >
                <AddressFormFields
                  register={addressForm.register}
                  control={addressForm.control}
                  errors={addressForm.formState.errors}
                  idPrefix="checkout-addr"
                />

                {formError && (
                  <p className="body-sm" style={{ color: 'var(--color-danger, #b42318)', margin: 0 }}>
                    {formError}
                  </p>
                )}

                <div className="address-form__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={createAddress.isPending}
                    onClick={addressForm.handleSubmit((data) => handleCreate(data, { continueAfter: false }))}
                  >
                    Save address
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={createAddress.isPending}>
                    Save & Continue
                  </Button>
                </div>
              </form>
            </div>

            <Separator />

            <Button
              variant="primary"
              fullWidth
              type="button"
              onClick={handleProceed}
              disabled={!selectedAddress}
            >
              Continue to checkout
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
