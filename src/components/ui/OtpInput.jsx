import { forwardRef } from 'react'
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp'
import { cn } from '@/lib/utils'

export const OtpInput = forwardRef(function OtpInput(
  { className, containerClassName, maxLength = 6, ...props },
  ref
) {
  return (
    <OTPInput
      ref={ref}
      maxLength={maxLength}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      containerClassName={cn('otp-input', containerClassName)}
      className={cn('otp-input__hidden', className)}
      render={({ slots }) => (
        <>
          {slots.map((slot, index) => (
            <div
              key={index}
              className={cn(
                'otp-slot',
                slot.isActive && 'otp-slot--active',
                slot.char && 'otp-slot--filled'
              )}
            >
              {slot.char ?? (slot.hasFakeCaret ? <span className="otp-slot__caret" /> : null)}
            </div>
          ))}
        </>
      )}
      {...props}
    />
  )
})
