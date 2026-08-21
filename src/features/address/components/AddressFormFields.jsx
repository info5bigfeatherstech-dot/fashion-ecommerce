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
    <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
      <InputGroup label="Full name" htmlFor={`${idPrefix}-fullName`} error={errors.fullName?.message}>
        <Input id={`${idPrefix}-fullName`} placeholder="Rahul Sharma" error={errors.fullName} {...register('fullName')} />
      </InputGroup>

      <InputGroup label="Phone" htmlFor={`${idPrefix}-phone`} error={errors.phone?.message}>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="numeric"
          placeholder="10-digit mobile"
          error={errors.phone}
          {...register('phone')}
        />
      </InputGroup>

      <div className="form-grid form-grid--2">
        <InputGroup label="House / flat no." htmlFor={`${idPrefix}-house`} error={errors.houseNumber?.message}>
          <Input id={`${idPrefix}-house`} placeholder="12-A" error={errors.houseNumber} {...register('houseNumber')} />
        </InputGroup>
        <InputGroup label="Building (optional)" htmlFor={`${idPrefix}-building`} error={errors.building?.message}>
          <Input id={`${idPrefix}-building`} placeholder="Apartment / society" error={errors.building} {...register('building')} />
        </InputGroup>
      </div>

      <div className="form-grid form-grid--2">
        <InputGroup label="Floor (optional)" htmlFor={`${idPrefix}-floor`} error={errors.floor?.message}>
          <Input id={`${idPrefix}-floor`} placeholder="3" error={errors.floor} {...register('floor')} />
        </InputGroup>
        <InputGroup label="Area / locality" htmlFor={`${idPrefix}-area`} error={errors.area?.message}>
          <Input id={`${idPrefix}-area`} placeholder="Andheri West" error={errors.area} {...register('area')} />
        </InputGroup>
      </div>

      <InputGroup label="Street address" htmlFor={`${idPrefix}-line1`} error={errors.addressLine1?.message}>
        <Input
          id={`${idPrefix}-line1`}
          placeholder="Road, street, opposite landmark (min 10 chars)"
          error={errors.addressLine1}
          {...register('addressLine1')}
        />
      </InputGroup>

      <InputGroup label="Address line 2 (optional)" htmlFor={`${idPrefix}-line2`} error={errors.addressLine2?.message}>
        <Input id={`${idPrefix}-line2`} placeholder="Lane / wing" error={errors.addressLine2} {...register('addressLine2')} />
      </InputGroup>

      <InputGroup label="Landmark (optional)" htmlFor={`${idPrefix}-landmark`} error={errors.landmark?.message}>
        <Input id={`${idPrefix}-landmark`} placeholder="Near metro station" error={errors.landmark} {...register('landmark')} />
      </InputGroup>

      <div className="form-grid form-grid--2">
        <InputGroup label="City" htmlFor={`${idPrefix}-city`} error={errors.city?.message}>
          <Input id={`${idPrefix}-city`} placeholder="Mumbai" error={errors.city} {...register('city')} />
        </InputGroup>
        <InputGroup label="State" htmlFor={`${idPrefix}-state`} error={errors.state?.message}>
          <Input id={`${idPrefix}-state`} placeholder="Maharashtra" error={errors.state} {...register('state')} />
        </InputGroup>
      </div>

      <div className="form-grid form-grid--2">
        <InputGroup label="PIN code" htmlFor={`${idPrefix}-pin`} error={errors.postalCode?.message}>
          <Input
            id={`${idPrefix}-pin`}
            inputMode="numeric"
            placeholder="400053"
            error={errors.postalCode}
            {...register('postalCode')}
          />
        </InputGroup>
        <InputGroup label="Country" htmlFor={`${idPrefix}-country`} error={errors.country?.message}>
          <Input id={`${idPrefix}-country`} placeholder="India" error={errors.country} {...register('country')} />
        </InputGroup>
      </div>

      <div className="form-grid form-grid--2">
        <InputGroup label="Address type" htmlFor={`${idPrefix}-type`} error={errors.addressType?.message}>
          <select
            id={`${idPrefix}-type`}
            className="input"
            {...register('addressType')}
          >
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </InputGroup>
        <InputGroup label="Delivery notes (optional)" htmlFor={`${idPrefix}-notes`} error={errors.deliveryInstructions?.message}>
          <Input
            id={`${idPrefix}-notes`}
            placeholder="Call before delivery"
            error={errors.deliveryInstructions}
            {...register('deliveryInstructions')}
          />
        </InputGroup>
      </div>

      <label className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" {...register('isDefault')} />
        Set as default address
      </label>

      <label className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" {...register('isGift')} />
        This is a gift address
      </label>

      <p
        className="body-sm"
        style={{
          margin: 0,
          color: overLimit ? 'var(--color-danger, #b42318)' : 'var(--color-muted)',
        }}
      >
        Courier address length: {courier.combinedLength}/{COURIER_MAX_LENGTH}
        {overLimit ? ' — shorten street, area, or landmark' : ''}
      </p>
    </div>
  )
}
