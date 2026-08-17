import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('input', error && 'input--error', className)}
      {...props}
    />
  )
})

export function Label({ className, htmlFor, children, ...props }) {
  return (
    <label htmlFor={htmlFor} className={cn('input-label', className)} {...props}>
      {children}
    </label>
  )
}

export function InputGroup({ label, htmlFor, error, children }) {
  return (
    <div className="input-group">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <span className="input-error" role="alert">{error}</span>}
    </div>
  )
}
