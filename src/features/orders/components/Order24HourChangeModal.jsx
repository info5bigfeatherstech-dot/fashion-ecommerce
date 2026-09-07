import { useState } from 'react'
import { Clock, Send, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { toast } from 'sonner'
import { getHoursRemainingIn24h, formatOrderDateTime } from '../utils'

export function Order24HourChangeModal({ open, onClose, order }) {
  const [requestType, setRequestType] = useState('address_change')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!order) return null

  const hoursRemaining = getHoursRemainingIn24h(order.createdAt)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!notes.trim()) {
      toast.error('Please enter your request details')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      toast.success('Your order modification request has been received!')
    }, 600)
  }

  const handleResetAndClose = () => {
    setSubmitted(false)
    setNotes('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleResetAndClose()}
      title="24-Hour Order Window Request"
      subtitle={`Order #${order.orderId}`}
      className="order-change-modal"
    >
      <div className="order-change-content">
        {submitted ? (
          <div className="order-change-success">
            <div className="order-change-success__icon">
              <CheckCircle size={36} />
            </div>
            <h4 className="heading-md">Request Submitted Successfully</h4>
            <p className="body-sm text-muted">
              We have received your order change request for Order #{order.orderId}. Our customer
              care team will review it before dispatch and update your order accordingly.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleResetAndClose}
              style={{ marginTop: '16px' }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="order-change-banner">
              <div className="order-change-banner__badge">
                <Clock size={15} />
                <span>Confirmed Order 24h Window</span>
              </div>
              <p className="order-change-banner__text body-sm">
                This order was confirmed on {formatOrderDateTime(order.createdAt)}. You have approx.{' '}
                <strong>{hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'} remaining</strong> to
                submit changes before fulfillment processing begins.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="order-change-form">
              <div className="order-change-form__field">
                <label className="body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  What would you like to request?
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="order-change-select"
                >
                  <option value="address_change">Change Shipping / Delivery Address</option>
                  <option value="contact_update">Update Contact Phone / Alternate Number</option>
                  <option value="item_variant">Size / Color Variant Change</option>
                  <option value="delivery_instruction">Special Delivery Instructions</option>
                  <option value="other_support">Other Order Assistance</option>
                </select>
              </div>

              <div className="order-change-form__field">
                <InputGroup label="Preferred contact phone number (optional)">
                  <Input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="order-change-form__field">
                <label className="body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Describe your request / details *
                </label>
                <textarea
                  rows={4}
                  className="order-change-textarea"
                  placeholder="Please specify the updated address, instructions, or changes you require..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

              <div className="order-change-form__actions">
                <Button type="button" variant="secondary" size="sm" onClick={handleResetAndClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !notes.trim()}
                >
                  <Send size={14} />
                  {isSubmitting ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
