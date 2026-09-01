import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const content = (
    <Sonner
      position="bottom-right"
      closeButton={false}
      richColors={false}
      offset={20}
      gap={12}
      visibleToasts={4}
      style={{
        zIndex: 999999,
      }}
      toastOptions={{
        classNames: {
          toast: 'sonner-toast',
          title: 'sonner-toast__title',
          description: 'sonner-toast__description',
          actionButton: 'sonner-toast__action',
          closeButton: 'sonner-toast__close',
        },
      }}
    />
  )

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(content, document.body)
}

