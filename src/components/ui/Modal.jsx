import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { startLenis, stopLenis } from '@/lib/lenis'

export function Modal({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  className,
  overlayClassName,
  footer,
  dismissible = true,
  hideClose = false,
}) {
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

  const handleOpenChange = (next) => {
    if (!next && !dismissible) return
    onOpenChange?.(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`modal-overlay${overlayClassName ? ` ${overlayClassName}` : ''}`} />
        <Dialog.Content
          className={`modal-content ${className || ''}`}
          data-lenis-prevent
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onPointerDownOutside={(event) => {
            if (!dismissible) event.preventDefault()
          }}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault()
          }}
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
            {!hideClose && (
              <Dialog.Close asChild>
                <button className="btn btn--ghost btn--icon" aria-label="Close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            )}
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
