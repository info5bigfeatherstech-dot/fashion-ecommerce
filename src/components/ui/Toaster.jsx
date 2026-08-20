import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      richColors={false}
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
