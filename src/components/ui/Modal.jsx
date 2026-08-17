import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export function Modal({ open, onOpenChange, title, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal-content ${className || ''}`}>
          <div className="modal-header">
            {title && (
              <Dialog.Title className="modal-title">{title}</Dialog.Title>
            )}
            <Dialog.Close asChild>
              <button className="btn btn--ghost btn--icon" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalTrigger({ children, asChild = true }) {
  return <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
}
