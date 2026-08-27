import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton={false}
      richColors={false}
      offset={20}
      gap={12}
      visibleToasts={3}
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
}
