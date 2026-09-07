import { Printer, Loader2, FileText, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useOrderInvoice } from '../hooks'
import { formatOrderDate } from '../utils'
import { formatPrice } from '@/lib/utils'

export function OrderInvoiceModal({ open, onClose, orderId }) {
  const { data, isLoading, isError, error } = useOrderInvoice(orderId, {
    enabled: Boolean(open && orderId),
  })

  const invoice = data?.invoice
  const gstInvoice = data?.gstInvoice

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Tax Invoice"
      subtitle={invoice?.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : `Order #${orderId || ''}`}
      className="order-invoice-modal"
    >
      <div className="order-invoice-content">
        {isLoading && (
          <div className="account-orders-state" style={{ minHeight: '260px' }}>
            <Loader2 size={24} className="account-orders-state__spin" aria-hidden="true" />
            <p className="body-sm text-muted">Generating invoice details…</p>
          </div>
        )}

        {isError && (
          <div className="order-tracking-empty">
            <AlertCircle size={32} className="text-muted" />
            <p className="heading-sm">Invoice not available</p>
            <p className="body-sm text-muted">
              {error?.message || 'Invoice details could not be retrieved for this order.'}
            </p>
          </div>
        )}

        {invoice && (
          <div className="order-invoice-sheet" id="printable-order-invoice">
            {/* Header / Brand */}
            <div className="order-invoice-sheet__top">
              <div>
                <h3 className="order-invoice-brand">FABUNIQO</h3>
                <p className="body-xs text-muted">Premium Fashion & Jewellery</p>
              </div>

              <div className="order-invoice-meta">
                <span className="order-invoice-badge">TAX INVOICE</span>
                <p className="body-sm">
                  <strong>Invoice:</strong> {invoice.invoiceNumber || `INV-${orderId}`}
                </p>
                <p className="body-sm text-muted">
                  <strong>Date:</strong> {formatOrderDate(invoice.date || new Date())}
                </p>
                <p className="body-sm text-muted">
                  <strong>Order ID:</strong> {invoice.orderId || orderId}
                </p>
              </div>
            </div>

            {/* Bill To */}
            {invoice.customer && (
              <div className="order-invoice-sheet__parties">
                <div className="order-invoice-party">
                  <p className="order-invoice-party__title">Billed To</p>
                  <p className="body-sm">
                    <strong>{invoice.customer.name || invoice.customer.fullName || 'Valued Customer'}</strong>
                  </p>
                  {invoice.customer.email && (
                    <p className="body-xs text-muted">{invoice.customer.email}</p>
                  )}
                  {invoice.customer.phone && (
                    <p className="body-xs text-muted">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.address && (
                    <p className="body-xs text-muted">
                      {[
                        invoice.customer.address.addressLine1 || invoice.customer.address.line1,
                        invoice.customer.address.city,
                        invoice.customer.address.state,
                        invoice.customer.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>

                <div className="order-invoice-party">
                  <p className="order-invoice-party__title">Payment Status</p>
                  <p className="body-sm">
                    <strong>Status:</strong> {(invoice.paymentStatus || 'Paid').toUpperCase()}
                  </p>
                  <p className="body-xs text-muted">
                    <strong>Method:</strong> {(invoice.paymentMethod || 'Online').toUpperCase()}
                  </p>
                  {gstInvoice?.gstin && (
                    <p className="body-xs text-muted">
                      <strong>GSTIN:</strong> {gstInvoice.gstin}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="order-invoice-table-wrap">
              <table className="order-invoice-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
                    invoice.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <p className="body-sm" style={{ fontWeight: 600 }}>{item.name}</p>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity || 1}</td>
                        <td style={{ textAlign: 'right' }}>{formatPrice(item.price || 0)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatPrice(item.total || (item.price || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>
                        No item details listed
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="order-invoice-sheet__summary">
              <div className="order-invoice-summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(invoice.subtotal ?? invoice.total ?? 0)}</span>
              </div>
              <div className="order-invoice-summary-row">
                <span>Delivery:</span>
                <span>{Number(invoice.deliveryCharges) === 0 ? 'FREE' : formatPrice(invoice.deliveryCharges || 0)}</span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="order-invoice-summary-row">
                  <span>Taxes (GST):</span>
                  <span>{formatPrice(invoice.tax || 0)}</span>
                </div>
              )}
              <div className="order-invoice-summary-row order-invoice-summary-row--total">
                <span>Grand Total:</span>
                <span>{formatPrice(invoice.total || 0)}</span>
              </div>
            </div>

            <div className="order-invoice-sheet__footer no-print">
              <Button type="button" variant="primary" size="sm" onClick={handlePrint}>
                <Printer size={15} /> Print / Save as PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
