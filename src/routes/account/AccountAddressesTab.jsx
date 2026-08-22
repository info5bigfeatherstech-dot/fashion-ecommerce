import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddressFormFields } from '@/features/address/components/AddressFormFields'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/features/address/hooks'
import { applyFieldErrors } from '@/features/address/mappers'
import { ADDRESS_FORM_DEFAULTS, addressFormSchema } from '@/features/address/schema'
import { useAppStore } from '@/store'

export function AccountAddressesTab() {
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const [addressFormError, setAddressFormError] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)

  const {
    data: addressData,
    isLoading: addressesLoading,
    isError: addressesFailed,
    error: addressesError,
  } = useAddresses({ enabled: isAuthenticated })
  const createAddress = useCreateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const addresses = addressData?.all || []

  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user?.name || '',
      phone: user?.phone || '',
    },
  })

  const openAddressForm = () => {
    setAddressFormError('')
    addressForm.reset({
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user?.name || '',
      phone: user?.phone || '',
    })
    setShowAddressForm(true)
  }

  const closeAddressForm = () => {
    setAddressFormError('')
    setShowAddressForm(false)
  }

  const handleAddAddress = async (data) => {
    setAddressFormError('')
    try {
      const result = await createAddress.mutateAsync(data)
      toast.success(result.message || 'Address saved')
      addressForm.reset({
        ...ADDRESS_FORM_DEFAULTS,
        fullName: user?.name || data.fullName || '',
        phone: user?.phone || '',
      })
      setShowAddressForm(false)
    } catch (err) {
      const applied = applyFieldErrors(err, addressForm.setError)
      if (!applied) {
        setAddressFormError(err?.message || 'Could not save address')
        toast.error(err?.message || 'Could not save address')
      }
    }
  }

  const handleRemoveAddress = async (id) => {
    try {
      const result = await deleteAddress.mutateAsync(id)
      const checkout = useAppStore.getState().checkoutAddress
      if (checkout?.id === id) {
        useAppStore.getState().clearCheckoutAddress()
      }
      toast.success(result.message || 'Address removed')
    } catch (err) {
      toast.error(err?.message || 'Could not remove address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      const result = await setDefaultAddress.mutateAsync(id)
      toast.success(result.message || 'Default address updated')
    } catch (err) {
      toast.error(err?.message || 'Could not update default address')
    }
  }

  useEffect(() => {
    if (!user) return
    addressForm.reset({
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user.name || '',
      phone: user.phone || '',
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="account-section">
      <div className="account-section__header">
        <div>
          <p className="heading-sm text-accent">Addresses</p>
          <h2 className="display-md">Saved Addresses</h2>
        </div>
        {!addressesLoading && !addressesFailed && !showAddressForm && addresses.length > 0 && (
          <Button variant="secondary" size="sm" onClick={openAddressForm}>
            <Plus size={16} />
            Add address
          </Button>
        )}
      </div>

      {addressesLoading ? (
        <div className="account-panel">
          <p className="body-lg text-muted">Loading addresses…</p>
        </div>
      ) : addressesFailed ? (
        <div className="account-panel">
          <p className="body-lg" style={{ color: 'var(--color-danger, #b42318)' }}>
            {addressesError?.message || 'Could not load addresses.'}
          </p>
        </div>
      ) : showAddressForm ? (
        <div className="account-panel account-panel--address-form">
          <div className="account-panel__header account-address-form__header">
            <div>
              <p className="heading-sm text-accent">New address</p>
              <h3 className="display-md">
                {addresses.length === 0 ? 'Add your address' : 'Add a new address'}
              </h3>
              <p className="body-sm text-muted account-address-form__lede">
                Enter your delivery details so checkout is faster next time.
              </p>
            </div>
          </div>

          <form
            className="account-address-form"
            onSubmit={addressForm.handleSubmit(handleAddAddress)}
            noValidate
          >
            <AddressFormFields
              register={addressForm.register}
              control={addressForm.control}
              errors={addressForm.formState.errors}
              idPrefix="account-addr"
            />

            {addressFormError && (
              <p className="body-sm account-address-form__error">
                {addressFormError}
              </p>
            )}

            <div className="address-form__actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={closeAddressForm}
                disabled={createAddress.isPending || addressForm.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={createAddress.isPending || addressForm.formState.isSubmitting}
              >
                {createAddress.isPending ? 'Saving…' : 'Save address'}
              </Button>
            </div>
          </form>
        </div>
      ) : addresses.length === 0 ? (
        <div className="account-panel">
          <div className="account-empty">
            <div className="account-empty__icon"><MapPin size={22} /></div>
            <p className="body-lg">No saved addresses yet</p>
            <p className="body-sm text-muted">
              Add your first delivery address to speed up future checkout.
            </p>
            <Button
              variant="primary"
              style={{ marginTop: 'var(--space-3)' }}
              onClick={openAddressForm}
            >
              <Plus size={16} />
              Add address
            </Button>
          </div>
        </div>
      ) : (
        <div className="account-address-list">
          {addresses.map((addr) => (
            <article key={addr.id} className="account-address-card">
              <div className="account-address-card__head">
                <p className="account-address-card__name">{addr.fullName}</p>
                <Badge className="account-badge">
                  {addr.isDefault ? 'Default' : addr.addressType || 'Saved'}
                </Badge>
              </div>
              <div className="account-address-card__body">
                <p>{addr.displayLine1 || addr.fullAddress}</p>
                {addr.displayLine2 && <p>{addr.displayLine2}</p>}
                <p>
                  {[addr.city, addr.state].filter(Boolean).join(', ')}
                  {(addr.postalCode || addr.zip) ? ` · ${addr.postalCode || addr.zip}` : ''}
                </p>
                {addr.phone && <p className="account-address-card__phone">Phone: {addr.phone}</p>}
              </div>
              <div className="account-address-card__actions">
                {!addr.isDefault && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={setDefaultAddress.isPending}
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteAddress.isPending}
                  onClick={() => handleRemoveAddress(addr.id)}
                >
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
