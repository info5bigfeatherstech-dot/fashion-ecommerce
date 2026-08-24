import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { startLenis, stopLenis } from '@/lib/lenis'

export function Modal({ open, onOpenChange, title, subtitle, children, className, overlayClassName, footer }) {
  useEffect(() => {
    if (!open) {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      return undefined
    }

    stopLenis()
    document.documentElement.classList.add('modal-open')

    return () => {
      startLenis()
      document.documentElement.classList.remove('modal-open')
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`modal-overlay${overlayClassName ? ` ${overlayClassName}` : ''}`} />
        <Dialog.Content
          className={`modal-content ${className || ''}`}
          data-lenis-prevent
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            {(title || subtitle) && (
              <div className="modal-header__text">
                {title && (
                  <Dialog.Title className="modal-title">{title}</Dialog.Title>
                )}
                {subtitle && (
                  <p className="modal-subtitle">{subtitle}</p>
                )}
              </div>
            )}
            <Dialog.Close asChild>
              <button className="btn btn--ghost btn--icon" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
          {footer}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalTrigger({ children, asChild = true }) {
  return <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
}
