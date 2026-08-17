import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'

export function Accordion({ items, type = 'single', collapsible = true }) {
  return (
    <AccordionPrimitive.Root type={type} collapsible={collapsible}>
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.value} value={item.value} className="accordion-item">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="accordion-trigger">
              {item.title}
              <ChevronDown size={18} />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="accordion-content">
            {item.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
