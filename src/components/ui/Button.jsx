import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'btn--primary',
  accent: 'btn--accent',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
}

const sizes = {
  sm: 'btn--sm',
  md: '',
  lg: 'btn--lg',
}

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', asChild = false, fullWidth = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        fullWidth && 'btn--full',
        className
      )}
      {...props}
    />
  )
})
