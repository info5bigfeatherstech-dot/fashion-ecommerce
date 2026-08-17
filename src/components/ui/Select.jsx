import { forwardRef } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = forwardRef(function SelectTrigger(
  { className, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn('select-trigger', className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

export const SelectContent = forwardRef(function SelectContent(
  { className, children, position = 'popper', ...props },
  ref
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn('select-content', className)}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport className="select-viewport">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

export const SelectItem = forwardRef(function SelectItem(
  { className, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Item ref={ref} className={cn('select-item', className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="select-item__check">
        <Check size={14} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
})

export const SelectLabel = forwardRef(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label ref={ref} className={cn('select-label', className)} {...props} />
  )
})
