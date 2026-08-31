import { z } from 'zod'
import { buildCourierLines } from './mappers'

export const COURIER_MAX_LENGTH = 190

export const addressFormSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name required'),
    phone: z
      .string()
      .trim()
      .refine((v) => /^\d{10}$/.test(v.replace(/\D/g, '')), 'Enter a 10-digit mobile number'),
    houseNumber: z.string().trim().min(1, 'House / flat number required'),
    building: z.string().optional(),
    floor: z.string().optional(),
    area: z.string().trim().min(1, 'Area / locality required'),
    landmark: z.string().optional(),
    addressLine1: z
      .string()
      .trim()
      .min(10, 'Street address must be at least 10 characters')
      .max(120, 'Street address is too long'),
    addressLine2: z.string().optional(),
    city: z.string().trim().min(1, 'City required'),
    state: z.string().trim().min(1, 'State required'),
    postalCode: z
      .string()
      .trim()
      .refine((v) => /^\d{6}$/.test(v), 'Enter a 6-digit PIN code'),
    country: z.string().trim().min(1, 'Country required'),
    addressType: z.enum(['home', 'work', 'other']),
    isDefault: z.boolean().optional(),
    isGift: z.boolean().optional(),
    deliveryInstructions: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { combinedLength } = buildCourierLines(data)
    if (combinedLength > COURIER_MAX_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addressLine1'],
        message: `Address is too long for courier (${combinedLength}/${COURIER_MAX_LENGTH} chars). Shorten street, area, or landmark.`,
      })
    }
  })

export const ADDRESS_CONTACT_FIELDS = ['fullName', 'phone', 'postalCode']

export const ADDRESS_LOCATION_FIELDS = [
  'houseNumber',
  'building',
  'floor',
  'area',
  'landmark',
  'addressLine1',
  'addressLine2',
  'postalCode',
  'city',
  'state',
  'country',
  'addressType',
]

export const ADDRESS_FORM_DEFAULTS = {
  fullName: '',
  phone: '',
  houseNumber: '',
  building: '',
  floor: '',
  area: '',
  landmark: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  addressType: 'home',
  isDefault: false,
  isGift: false,
  deliveryInstructions: '',
}
