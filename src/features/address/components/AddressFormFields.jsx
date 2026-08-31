import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { ChevronDown, Loader2, MapPin, PlusCircle } from 'lucide-react'
import { Input, InputGroup } from '@/components/ui/Input'
import { buildCourierLines } from '@/features/address/mappers'
import { COURIER_MAX_LENGTH } from '@/features/address/schema'
import { fetchPostalPincode } from '@/features/address/pincode'

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
]

export function usePincodeLookup(postalCodeVal, setValue, cityVal, stateVal, areaVal) {
  const [pincodeDetails, setPincodeDetails] = useState(null)
  const [isFetchingPin, setIsFetchingPin] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cleanPin = String(postalCodeVal || '').trim()

    if (/^\d{6}$/.test(cleanPin)) {
      setIsFetchingPin(true)
      fetchPostalPincode(cleanPin).then((res) => {
        if (cancelled) return
        setIsFetchingPin(false)
        if (res) {
          setPincodeDetails(res)

          if (setValue) {
            if (!cityVal || cityVal !== res.district) {
              setValue('city', res.district, { shouldValidate: true })
            }
            if (!stateVal || stateVal !== res.state) {
              setValue('state', res.state, { shouldValidate: true })
            }
            if (!areaVal && res.areas && res.areas.length > 0) {
              setValue('area', res.areas[0], { shouldValidate: true })
            }
          }
        } else {
          setPincodeDetails(null)
        }
      })
    } else {
      setPincodeDetails(null)
      setIsFetchingPin(false)
    }

    return () => {
      cancelled = true
    }
  }, [postalCodeVal, setValue, cityVal, stateVal, areaVal])

  return { pincodeDetails, isFetchingPin }
}

export function AddressContactFields({
  register,
  control: controlProp,
  errors: errorsProp,
  idPrefix = 'addr',
  layout = 'default',
}) {
  const formContext = useFormContext()
  const control = controlProp || formContext?.control
  const errors = errorsProp || formContext?.formState?.errors || {}
  const setValue = formContext?.setValue

  const watched = useWatch({
    control,
    name: ['postalCode', 'city', 'state', 'area'],
    disabled: !control,
  })
  const [postalCodeVal, cityVal, stateVal, areaVal] = watched || []

  const { pincodeDetails, isFetchingPin } = usePincodeLookup(
    postalCodeVal,
    setValue,
    cityVal,
    stateVal,
    areaVal
  )

  const locationPill = (
    <>
      {isFetchingPin && (
        <div className="pincode-location-pill pincode-location-pill--loading">
          <Loader2 size={16} className="animate-spin text-muted" />
          <span>Searching pincode area details…</span>
        </div>
      )}

      {pincodeDetails && !isFetchingPin && (
        <div className="pincode-location-pill">
          <MapPin size={16} className="pincode-location-pill__icon" />
          <span>
            <strong className="pincode-location-pill__title">
              {pincodeDetails.district}, {pincodeDetails.state}
            </strong>
            <span className="pincode-location-pill__count">
              {' '}· {pincodeDetails.count} area{pincodeDetails.count > 1 ? 's' : ''} available
            </span>
          </span>
        </div>
      )}
    </>
  )

  if (layout === 'wizard') {
    return (
      <div className="address-wizard__fields">
        <InputGroup label="Full name" htmlFor={`${idPrefix}-fullName`} error={errors.fullName?.message} required>
          <Input id={`${idPrefix}-fullName`} placeholder="Rahul Sharma" error={errors.fullName} {...register('fullName')} />
        </InputGroup>

        <InputGroup label="Phone" htmlFor={`${idPrefix}-phone`} error={errors.phone?.message} required>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile"
            error={errors.phone}
            {...register('phone')}
          />
        </InputGroup>

        <InputGroup label="Pincode" htmlFor={`${idPrefix}-pin`} error={errors.postalCode?.message} required>
          <Input
            id={`${idPrefix}-pin`}
            inputMode="numeric"
            placeholder="110045"
            error={errors.postalCode}
            {...register('postalCode')}
          />
        </InputGroup>
        {locationPill}
      </div>
    )
  }

  return (
    <section className="address-form__section" aria-labelledby={`${idPrefix}-contact-heading`}>
      <div className="address-form__section-head">
        <h4 id={`${idPrefix}-contact-heading`} className="address-form__section-title">
          Contact
        </h4>
        <p className="address-form__section-copy">Who should we deliver to?</p>
      </div>

      <div className="address-form__row">
        <InputGroup label="Full name" htmlFor={`${idPrefix}-fullName`} error={errors.fullName?.message} required>
          <Input id={`${idPrefix}-fullName`} placeholder="Rahul Sharma" error={errors.fullName} {...register('fullName')} />
        </InputGroup>

        <InputGroup label="Phone" htmlFor={`${idPrefix}-phone`} error={errors.phone?.message} required>
          <Input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile"
            error={errors.phone}
            {...register('phone')}
          />
        </InputGroup>
      </div>
    </section>
  )
}

/**
 * Custom dropdown for Area / Locality selection with option to add custom area
 */
function AreaLocalitySelect({
  id,
  value = '',
  onChange,
  areas = [],
  error,
  registerProps = {},
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isCustomMode || !areas || areas.length === 0) {
    return (
      <div className="area-locality-custom-wrapper">
        <Input
          id={id}
          placeholder="Enter custom area / locality"
          error={error}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          {...registerProps}
        />
        {areas && areas.length > 0 && (
          <button
            type="button"
            className="area-locality__toggle-btn"
            onClick={() => setIsCustomMode(false)}
          >
            ← Pick from listed areas ({areas.length})
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="area-locality-select-wrapper" ref={dropdownRef}>
      <button
        type="button"
        id={id}
        className={`input area-locality-select__trigger${error ? ' input--error' : ''}${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`area-locality-select__value${!value ? ' is-placeholder' : ''}`}>
          {value ? (
            <span className="area-locality-select__value-text">
              <MapPin size={15} className="area-locality-select__value-icon" />
              {value}
            </span>
          ) : (
            'Select area / locality'
          )}
        </span>
        <ChevronDown size={16} className={`area-locality-select__chevron${isOpen ? ' is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="area-locality-select__menu" role="listbox">
          <div className="area-locality-select__options">
            {areas.map((areaName) => (
              <button
                key={areaName}
                type="button"
                role="option"
                aria-selected={value === areaName}
                className={`area-locality-select__option${value === areaName ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(areaName)
                  setIsOpen(false)
                }}
              >
                <MapPin size={14} className="area-locality-select__option-icon" />
                <span>{areaName}</span>
              </button>
            ))}
          </div>

          <div className="area-locality-select__custom-divider" />

          <button
            type="button"
            className="area-locality-select__custom-btn"
            onClick={() => {
              setIsCustomMode(true)
              setIsOpen(false)
            }}
          >
            <PlusCircle size={15} />
            <span>+ Add custom area (if not listed)</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function AddressLocationFields({
  register,
  control: controlProp,
  errors: errorsProp,
  idPrefix = 'addr',
  layout = 'default',
}) {
  const formContext = useFormContext()
  const control = controlProp || formContext?.control
  const errors = errorsProp || formContext?.formState?.errors || {}
  const setValue = formContext?.setValue

  const isWizard = layout === 'wizard'

  const watched = useWatch({
    control,
    name: [
      'houseNumber',
      'building',
      'floor',
      'addressLine1',
      'addressLine2',
      'area',
      'landmark',
      'postalCode',
      'city',
      'state',
    ],
    disabled: !control,
  })

  const [
    houseNumberVal,
    buildingVal,
    floorVal,
    line1Val,
    line2Val,
    areaVal,
    landmarkVal,
    postalCodeVal,
    cityVal,
    stateVal,
  ] = watched || []

  const { pincodeDetails, isFetchingPin } = usePincodeLookup(
    postalCodeVal,
    setValue,
    cityVal,
    stateVal,
    areaVal
  )

  const courier = buildCourierLines({
    houseNumber: houseNumberVal,
    building: buildingVal,
    floor: floorVal,
    addressLine1: line1Val,
    addressLine2: line2Val,
    area: areaVal,
    landmark: landmarkVal,
  })

  const overLimit = courier.combinedLength > COURIER_MAX_LENGTH

  const locationPill = (
    <>
      {isFetchingPin && (
        <div className="pincode-location-pill pincode-location-pill--loading">
          <Loader2 size={16} className="animate-spin text-muted" />
          <span>Searching pincode area details…</span>
        </div>
      )}

      {pincodeDetails && !isFetchingPin && (
        <div className="pincode-location-pill">
          <MapPin size={16} className="pincode-location-pill__icon" />
          <span>
            <strong className="pincode-location-pill__title">
              {pincodeDetails.district}, {pincodeDetails.state}
            </strong>
            <span className="pincode-location-pill__count">
              {' '}· {pincodeDetails.count} area{pincodeDetails.count > 1 ? 's' : ''} available
            </span>
          </span>
        </div>
      )}
    </>
  )

  if (isWizard) {
    return (
      <div className="address-wizard__fields address-wizard__fields--location">
        <input type="hidden" {...register('country')} />

        <div className="address-wizard__row address-wizard__row--2col">
          <InputGroup label="House / flat no." htmlFor={`${idPrefix}-house`} error={errors.houseNumber?.message} required>
            <Input id={`${idPrefix}-house`} placeholder="e.g. 42B" error={errors.houseNumber} {...register('houseNumber')} />
          </InputGroup>
          <InputGroup label="Floor no." htmlFor={`${idPrefix}-floor`} error={errors.floor?.message}>
            <Input id={`${idPrefix}-floor`} placeholder="e.g. 4th Floor" error={errors.floor} {...register('floor')} />
          </InputGroup>
        </div>

        <div className="address-wizard__row address-wizard__row--2col">
          <InputGroup label="Building no." htmlFor={`${idPrefix}-building`} error={errors.building?.message}>
            <Input id={`${idPrefix}-building`} placeholder="e.g. Sunrise Apartments" error={errors.building} {...register('building')} />
          </InputGroup>
          <InputGroup label="Area / locality" htmlFor={`${idPrefix}-area`} error={errors.area?.message} required>
            <Controller
              control={control}
              name="area"
              render={({ field }) => (
                <AreaLocalitySelect
                  id={`${idPrefix}-area`}
                  value={field.value}
                  onChange={field.onChange}
                  areas={pincodeDetails?.areas || []}
                  error={errors.area}
                  registerProps={register('area')}
                />
              )}
            />
          </InputGroup>
        </div>

        <InputGroup label="Landmark" htmlFor={`${idPrefix}-landmark`} error={errors.landmark?.message}>
          <Input id={`${idPrefix}-landmark`} placeholder="Near City Mall (optional)" error={errors.landmark} {...register('landmark')} />
        </InputGroup>

        <InputGroup label="Street address (line 1)" htmlFor={`${idPrefix}-line1`} error={errors.addressLine1?.message} required>
          <Input
            id={`${idPrefix}-line1`}
            placeholder="Street and road details"
            error={errors.addressLine1}
            {...register('addressLine1')}
          />
        </InputGroup>

        <InputGroup label="Address line 2 (optional)" htmlFor={`${idPrefix}-line2`} error={errors.addressLine2?.message}>
          <Input id={`${idPrefix}-line2`} placeholder="Wing and apartment details" error={errors.addressLine2} {...register('addressLine2')} />
        </InputGroup>

        <div className="address-wizard__row address-wizard__row--2col">
          <InputGroup label="City" htmlFor={`${idPrefix}-city`} error={errors.city?.message} required>
            <Input id={`${idPrefix}-city`} placeholder="City" error={errors.city} {...register('city')} />
          </InputGroup>
          <InputGroup label="PIN code" htmlFor={`${idPrefix}-pin`} error={errors.postalCode?.message} required>
            <Input
              id={`${idPrefix}-pin`}
              inputMode="numeric"
              placeholder="110045"
              error={errors.postalCode}
              {...register('postalCode')}
            />
          </InputGroup>
        </div>
        {locationPill}

        <div className="address-form__group address-form__group--last">
          <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Address type</label>
          <Controller
            control={control}
            name="addressType"
            render={({ field }) => (
              <div className="address-type-pills" role="radiogroup" aria-label="Address type">
                {ADDRESS_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === value}
                    className={`address-type-pills__btn${field.value === value ? ' address-type-pills__btn--active' : ''}`}
                    onClick={() => field.onChange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.addressType?.message && (
            <span className="input-error" role="alert">{errors.addressType.message}</span>
          )}
        </div>

        {overLimit && (
          <p className="address-form__hint address-form__hint--warn">
            Address is {courier.combinedLength}/{COURIER_MAX_LENGTH} chars — shorten a field to fit courier limits.
          </p>
        )}
      </div>
    )
  }

  return (
    <section className="address-form__section" aria-labelledby={`${idPrefix}-location-heading`}>
      <div className="address-form__section-head">
        <h4 id={`${idPrefix}-location-heading`} className="address-form__section-title">
          Delivery location
        </h4>
        <p className="address-form__section-copy">Exact doorstep details for the courier</p>
      </div>

      <div className="address-form__row">
        <InputGroup label="House / flat no." htmlFor={`${idPrefix}-house`} error={errors.houseNumber?.message} required>
          <Input id={`${idPrefix}-house`} placeholder="12-A" error={errors.houseNumber} {...register('houseNumber')} />
        </InputGroup>
        <InputGroup label="Building (optional)" htmlFor={`${idPrefix}-building`} error={errors.building?.message}>
          <Input id={`${idPrefix}-building`} placeholder="Apartment / society" error={errors.building} {...register('building')} />
        </InputGroup>
      </div>

      <div className="address-form__row address-form__row--asymmetric">
        <InputGroup label="Floor (optional)" htmlFor={`${idPrefix}-floor`} error={errors.floor?.message}>
          <Input id={`${idPrefix}-floor`} placeholder="3" error={errors.floor} {...register('floor')} />
        </InputGroup>
        <InputGroup label="Area / locality" htmlFor={`${idPrefix}-area`} error={errors.area?.message} required>
          <Controller
            control={control}
            name="area"
            render={({ field }) => (
              <AreaLocalitySelect
                id={`${idPrefix}-area`}
                value={field.value}
                onChange={field.onChange}
                areas={pincodeDetails?.areas || []}
                error={errors.area}
                registerProps={register('area')}
              />
            )}
          />
        </InputGroup>
      </div>

      <div className="address-form__row">
        <InputGroup label="Street address" htmlFor={`${idPrefix}-line1`} error={errors.addressLine1?.message} required>
          <Input
            id={`${idPrefix}-line1`}
            placeholder="Road, street, landmark"
            error={errors.addressLine1}
            {...register('addressLine1')}
          />
        </InputGroup>
        <InputGroup label="Address line 2 (optional)" htmlFor={`${idPrefix}-line2`} error={errors.addressLine2?.message}>
          <Input id={`${idPrefix}-line2`} placeholder="Lane / wing" error={errors.addressLine2} {...register('addressLine2')} />
        </InputGroup>
      </div>

      <div className="address-form__row">
        <InputGroup label="Landmark (optional)" htmlFor={`${idPrefix}-landmark`} error={errors.landmark?.message}>
          <Input id={`${idPrefix}-landmark`} placeholder="Near metro" error={errors.landmark} {...register('landmark')} />
        </InputGroup>
        <InputGroup label="PIN code" htmlFor={`${idPrefix}-pin`} error={errors.postalCode?.message} required>
          <Input
            id={`${idPrefix}-pin`}
            inputMode="numeric"
            placeholder="400053"
            error={errors.postalCode}
            {...register('postalCode')}
          />
        </InputGroup>
      </div>
      {locationPill}

      <div className="address-form__row">
        <InputGroup label="City" htmlFor={`${idPrefix}-city`} error={errors.city?.message} required>
          <Input id={`${idPrefix}-city`} placeholder="Mumbai" error={errors.city} {...register('city')} />
        </InputGroup>
        <InputGroup label="State" htmlFor={`${idPrefix}-state`} error={errors.state?.message} required>
          <Input id={`${idPrefix}-state`} placeholder="Maharashtra" error={errors.state} {...register('state')} />
        </InputGroup>
      </div>

      <div className="address-form__row">
        <InputGroup label="Country" htmlFor={`${idPrefix}-country`} error={errors.country?.message} required>
          <Input id={`${idPrefix}-country`} placeholder="India" error={errors.country} {...register('country')} />
        </InputGroup>
        <InputGroup label="Address type" htmlFor={`${idPrefix}-type`} error={errors.addressType?.message} required>
          <select
            id={`${idPrefix}-type`}
            className="input address-form__select"
            {...register('addressType')}
          >
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </InputGroup>
      </div>

      {overLimit && (
        <p className="address-form__hint address-form__hint--warn">
          Address is {courier.combinedLength}/{COURIER_MAX_LENGTH} chars — shorten a field to fit courier limits.
        </p>
      )}
    </section>
  )
}

export function AddressFormFields({ register, control, errors, idPrefix = 'addr' }) {
  return (
    <div className="address-form">
      <AddressContactFields register={register} errors={errors} idPrefix={idPrefix} />
      <AddressLocationFields register={register} control={control} errors={errors} idPrefix={idPrefix} />
    </div>
  )
}
