import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store'
import {
  AddressContactFields,
  AddressLocationFields,
} from '@/features/address/components/AddressFormFields'
import { useAddresses, useCreateAddress } from '@/features/address/hooks'
import { prefetchCheckoutForAddress } from '@/features/checkout/hooks'
import { applyFieldErrors } from '@/features/address/mappers'
import {
  ADDRESS_CONTACT_FIELDS,
  ADDRESS_FORM_DEFAULTS,
  addressFormSchema,
} from '@/features/address/schema'

const EMPTY_ADDRESSES = []

const FORM_STEPS = [
  { id: 'contact', label: 'Contact' },
  { id: 'location', label: 'Location' },
]

function AddressWizardSteps({ currentStep }) {
  return (
    <div className="address-wizard__steps" aria-label="Address form progress">
      {FORM_STEPS.map((step, index) => {
        const isActive = currentStep === index
        const isComplete = currentStep > index

        return (
          <div
            key={step.id}
            className={`address-wizard__step${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
          >
            <span className="address-wizard__step-num">{index + 1}</span>
            <span className="address-wizard__step-label">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CheckoutAddressModal({ open, onOpenChange, onProceed }) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const checkoutAddress = useAppStore((s) => s.checkoutAddress)
  const setCheckoutAddress = useAppStore((s) => s.setCheckoutAddress)

  const { data, isLoading, isError, error, refetch } = useAddresses({
    enabled: open && isAuthenticated,
  })
  const createAddress = useCreateAddress()

  const addresses = data?.all ?? EMPTY_ADDRESSES
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [formError, setFormError] = useState('')
  const [view, setView] = useState('list')
  const [formStep, setFormStep] = useState(0)

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((a) => a.id === selectedAddressId) || null
  }, [addresses, selectedAddressId])

  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: ADDRESS_FORM_DEFAULTS,
  })

  const resetModalState = () => {
    setView('list')
    setFormStep(0)
    setFormError('')
    setSelectedAddressId(null)
    addressForm.reset(ADDRESS_FORM_DEFAULTS)
  }

  useEffect(() => {
    if (!open) {
      resetModalState()
      return
    }

    const preferredId = checkoutAddress?.id
    let nextId = null

    if (preferredId && addresses.some((a) => a.id === preferredId)) {
      nextId = preferredId
    } else {
      nextId = data?.defaultAddress?.id || addresses[0]?.id || null
    }

    setSelectedAddressId((current) => (current === nextId ? current : nextId))
  }, [open, addresses, checkoutAddress?.id, data?.defaultAddress?.id])

  useEffect(() => {
    if (!open || !selectedAddressId) return
    prefetchCheckoutForAddress(queryClient, { addressId: selectedAddressId })
  }, [open, queryClient, selectedAddressId])

  const handleProceed = () => {
    if (!selectedAddress) return
    setCheckoutAddress(selectedAddress)
    prefetchCheckoutForAddress(queryClient, { addressId: selectedAddress.id })
    void import('@/routes/Checkout')
    onProceed?.()
    onOpenChange?.(false)
  }

  const openNewAddressForm = () => {
    setFormError('')
    setFormStep(0)
    addressForm.reset(ADDRESS_FORM_DEFAULTS)
    setView('new')
  }

  const backToList = () => {
    setFormError('')
    setFormStep(0)
    setView('list')
  }

  const handleNextStep = async () => {
    setFormError('')
    const valid = await addressForm.trigger(ADDRESS_CONTACT_FIELDS)
    if (valid) setFormStep(1)
  }

  const handleCreate = async (formData, { continueAfter } = {}) => {
    setFormError('')
    try {
      const result = await createAddress.mutateAsync(formData)
      toast.success(result.message || 'Address saved')
      setSelectedAddressId(result.address?.id || null)
      if (continueAfter && result.address) {
        setCheckoutAddress(result.address)
        prefetchCheckoutForAddress(queryClient, { addressId: result.address.id })
        void import('@/routes/Checkout')
        onProceed?.()
        onOpenChange?.(false)
      } else {
        setView('list')
        setFormStep(0)
      }
      addressForm.reset(ADDRESS_FORM_DEFAULTS)
      await refetch()
    } catch (err) {
      const applied = applyFieldErrors(err, addressForm.setError)
      if (!applied) {
        setFormError(err?.message || 'Could not save address')
        toast.error(err?.message || 'Could not save address')
      }
    }
  }

  const submitNewAddress = (continueAfter) => {
    return addressForm.handleSubmit((data) => handleCreate(data, { continueAfter }))
  }

  const modalTitle = view === 'new' ? 'New address' : 'Delivery address'
  const wizardHint = formStep === 0
    ? 'Name and phone for delivery updates.'
    : 'Where the courier should arrive.'

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      className={`modal-content--address${view === 'new' ? ' modal-content--address-wizard' : ''}`}
    >
      <div className="address-modal">
        {!isAuthenticated ? (
          <div className="address-modal__guest">
            <p className="body-sm text-muted">
              Sign in to choose a saved delivery address or add a new one.
            </p>
            <Button asChild variant="primary">
              <Link to="/login" state={{ redirectTo: '/cart' }}>
                Sign in
              </Link>
            </Button>
          </div>
        ) : view === 'list' ? (
          <>
            <div className="address-modal__section">
              <h2 className="address-modal__heading">Choose a saved address</h2>

              {isLoading ? (
                <p className="body-sm text-muted">Loading addresses…</p>
              ) : isError ? (
                <p className="body-sm address-modal__error">
                  {error?.message || 'Could not load addresses.'}
                </p>
              ) : addresses.length === 0 ? (
                <p className="body-sm text-muted">
                  No saved addresses yet. Add your first delivery address to continue.
                </p>
              ) : (
                <div className="address-modal__list">
                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`address-modal__card${isSelected ? ' address-modal__card--selected' : ''}`}
                        aria-label={`Select address: ${addr.fullAddress}`}
                      >
                        <div className="address-modal__card-top">
                          <p className="address-modal__card-name">{addr.fullName}</p>
                          {addr.isDefault && <Badge>Default</Badge>}
                        </div>
                        <p className="address-modal__card-line">{addr.displayLine1 || addr.fullAddress}</p>
                        {addr.displayLine2 && (
                          <p className="address-modal__card-line address-modal__card-line--muted">
                            {addr.displayLine2}
                          </p>
                        )}
                        <p className="address-modal__card-line address-modal__card-line--muted">
                          {addr.city}, {addr.state} · {addr.postalCode || addr.zip}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button type="button" className="address-modal__add" onClick={openNewAddressForm}>
              <Plus size={16} aria-hidden="true" />
              Add a new address
            </button>

            <Button
              variant="accent"
              fullWidth
              type="button"
              onClick={handleProceed}
              disabled={!selectedAddress}
            >
              Continue to checkout
            </Button>
          </>
        ) : (
          <form onSubmit={submitNewAddress(true)} noValidate className="address-wizard">
            <AddressWizardSteps currentStep={formStep} />
            <p className="address-wizard__hint">{wizardHint}</p>

            {formStep === 0 ? (
              <AddressContactFields
                register={addressForm.register}
                errors={addressForm.formState.errors}
                idPrefix="checkout-addr"
                layout="wizard"
              />
            ) : (
              <AddressLocationFields
                register={addressForm.register}
                control={addressForm.control}
                errors={addressForm.formState.errors}
                idPrefix="checkout-addr"
                layout="wizard"
              />
            )}

            {formError && (
              <p className="body-sm address-modal__error">{formError}</p>
            )}

            <div className="address-wizard__footer">
              {formStep === 0 ? (
                <>
                  <button type="button" className="address-wizard__back" onClick={backToList}>
                    <ChevronLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                  <Button type="button" variant="accent" onClick={handleNextStep}>
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <button type="button" className="address-wizard__back" onClick={() => setFormStep(0)}>
                    <ChevronLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                  <div className="address-wizard__footer-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={createAddress.isPending}
                      onClick={addressForm.handleSubmit((data) => handleCreate(data, { continueAfter: false }))}
                    >
                      Save
                    </Button>
                    <Button type="submit" variant="accent" disabled={createAddress.isPending}>
                      Save & continue
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
