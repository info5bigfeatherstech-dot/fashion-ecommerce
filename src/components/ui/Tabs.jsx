import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function Tabs({ defaultValue, children, className }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className={className}>
      {children}
    </TabsPrimitive.Root>
  )
}

export function TabsList({ children, className }) {
  return (
    <TabsPrimitive.List className={cn('tabs-list', className)}>
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ value, children }) {
  return (
    <TabsPrimitive.Trigger value={value} className="tab-trigger">
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ value, children }) {
  return (
    <TabsPrimitive.Content value={value} className="tab-content">
      {children}
    </TabsPrimitive.Content>
  )
}
