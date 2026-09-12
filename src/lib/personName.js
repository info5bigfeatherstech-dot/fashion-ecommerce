import { z } from 'zod'

export const PERSON_NAME_MIN_LEN = 3
export const PERSON_NAME_MAX_LEN = 50
export const PERSON_NAME_MAX_WORDS = 3
export const PERSON_NAME_MIN_WORD_LEN = 2

const PERSON_NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+){0,2}$/
const TITLE_SET = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'sir'])

export function normalizePersonName(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Keep typing usable: letters + one trailing space while under the 3-word cap. */
export function filterPersonNameInput(raw) {
  let next = String(raw || '').replace(/[^A-Za-z\s]/g, '')
  next = next.replace(/^\s+/, '').replace(/\s{2,}/g, ' ')
  const hasTrailingSpace = /\s$/.test(next)
  const words = next.trim() ? next.trim().split(' ') : []

  if (words.length > PERSON_NAME_MAX_WORDS) {
    next = words.slice(0, PERSON_NAME_MAX_WORDS).join(' ')
  } else if (hasTrailingSpace && words.length >= 1 && words.length < PERSON_NAME_MAX_WORDS) {
    next = `${words.join(' ')} `
  } else {
    next = words.join(' ')
  }

  return next.slice(0, PERSON_NAME_MAX_LEN)
}

export function getPersonNameError(raw) {
  const name = normalizePersonName(raw)
  if (!name) return 'Full name is required'
  if (name.length < PERSON_NAME_MIN_LEN) return 'Name must be at least 3 characters'
  if (name.length > PERSON_NAME_MAX_LEN) return 'Name must be at most 50 characters'

  const words = name.split(' ')
  if (words.length > PERSON_NAME_MAX_WORDS) {
    return 'Use at most 3 words (first, middle, last)'
  }
  if (!PERSON_NAME_PATTERN.test(name)) {
    return 'Use English letters only. No numbers or special characters.'
  }
  if (words.some((word) => word.length < PERSON_NAME_MIN_WORD_LEN)) {
    return 'Each name word must be at least 2 letters'
  }
  if (words.some((word) => TITLE_SET.has(word.toLowerCase()))) {
    return 'Do not include titles like Mr or Dr'
  }
  if (words.some((word) => /^(.)\1{2,}$/i.test(word))) {
    return 'Enter a valid name'
  }
  return null
}

export const personNameSchema = z
  .string()
  .transform(normalizePersonName)
  .superRefine((name, ctx) => {
    const message = getPersonNameError(name)
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    }
  })

/** Filter keystrokes before react-hook-form reads the value. */
export function bindPersonNameRegister(registerFn, name) {
  const registered = registerFn(name, { setValueAs: normalizePersonName })
  return {
    ...registered,
    maxLength: PERSON_NAME_MAX_LEN,
    autoComplete: 'name',
    onChange: (event) => {
      event.target.value = filterPersonNameInput(event.target.value)
      return registered.onChange(event)
    },
  }
}
