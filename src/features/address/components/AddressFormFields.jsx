import { useWatch } from 'react-hook-form'
import { Input, InputGroup } from '@/components/ui/Input'
import { buildCourierLines } from '@/features/address/mappers'
import { COURIER_MAX_LENGTH } from '@/features/address/schema'

export function AddressFormFields({ register, control, errors, idPrefix = 'addr' }) {
  const watched = useWatch({
    control,
    name: ['houseNumber', 'building', 'floor', 'addressLine1', 'addressLine2', 'area', 'landmark'],
  })

  const courier = buildCourierLines({
    houseNumber: watched?.[0],
    building: watched?.[1],
    floor: watched?.[2],
    addressLine1: watched?.[3],
    addressLine2: watched?.[4],
    area: watched?.[5],
    landmark: watched?.[6],
  })

  const overLimit = courier.combinedLength > COURIER_MAX_LENGTH

  return (
    <div className="address-form">
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
            <Input id={`${idPrefix}-area`} placeholder="Andheri West" error={errors.area} {...register('area')} />
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
      </section>

    </div>
  )
}
