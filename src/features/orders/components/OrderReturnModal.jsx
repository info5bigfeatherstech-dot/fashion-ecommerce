import { useState, useRef, useEffect } from 'react'
import {
  AlertCircle,
  Clock,
  ExternalLink,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  PackageCheck,
  PackageX,
  Send,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import {
  useCreateReturnRequest,
  useReturnChat,
  useSendReturnChatMessage,
} from '../hooks'
import { formatOrderDateTime } from '../utils'

const MAX_PROOF_IMAGES = 3
const MAX_VIDEO_SIZE_MB = 60

function getErrorMessage(err) {
  const code = err?.response?.data?.code || err?.code
  const msg = err?.response?.data?.message || err?.message

  switch (code) {
    case 'RETURN_NOT_ELIGIBLE':
      return msg || 'This order is not eligible for return. Order must be delivered and within the return window.'
    case 'RETURN_REQUEST_EXISTS':
      return 'A return request already exists for this order.'
    case 'RETURN_WINDOW_EXPIRED':
      return 'The return request window for this delivered order has expired.'
    case 'RETURN_PROOF_REQUIRED':
      return 'Please upload both an unboxing/defect video and at least 1 proof photo.'
    case 'RETURN_MESSAGE_REQUIRED':
      return 'Please describe the issue with your item (up to 500 characters).'
    case 'RETURN_PROOF_INVALID':
      return 'One or more of the uploaded proof files is invalid or exceeds the size limit (max 60MB).'
    default:
      return msg || 'Failed to submit return request. Please try again.'
  }
}

export function OrderReturnModal({ open, onClose, order }) {
  const orderId = order?.orderId
  const returnInfo = order?.returnInfo || order?.returnRequest || {}
  const orderStatus = String(order?.orderStatus || '').toLowerCase()
  const isDelivered = orderStatus === 'delivered' || orderStatus === 'return_requested'

  const hasExistingReturn = Boolean(
    order?.returnInfo?.status ||
    order?.returnRequest?.status ||
    orderStatus === 'return_requested'
  )

  const [activeTab, setActiveTab] = useState(hasExistingReturn ? 'chat' : 'request')
  const [reasonType, setReasonType] = useState('damaged')
  const [reasonMessage, setReasonMessage] = useState('')
  const [proofVideo, setProofVideo] = useState(null)
  const [proofImages, setProofImages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef(null)

  const createReturn = useCreateReturnRequest()
  const { data: chatData, isLoading: isChatLoading, refetch: refetchChat } = useReturnChat(
    orderId,
    { enabled: Boolean(open && orderId && isDelivered && hasExistingReturn && activeTab === 'chat') }
  )
  const sendChatMessage = useSendReturnChatMessage()

  const chatMessages = chatData?.chat || returnInfo?.chat || []

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTab, chatMessages.length])

  if (!order) return null

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (proofImages.length + files.length > MAX_PROOF_IMAGES) {
      toast.error(`You can upload at most ${MAX_PROOF_IMAGES} proof images.`)
      return
    }
    setProofImages((prev) => [...prev, ...files].slice(0, MAX_PROOF_IMAGES))
  }

  const removeImage = (idx) => {
    setProofImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast.error(`Video file size exceeds ${MAX_VIDEO_SIZE_MB}MB limit.`)
        return
      }
      setProofVideo(file)
    }
  }

  const handleReturnSubmit = async (e) => {
    e.preventDefault()
    if (!reasonMessage.trim()) {
      toast.error('Please describe the issue with your item.')
      return
    }
    if (reasonMessage.length > 500) {
      toast.error('Reason message must not exceed 500 characters.')
      return
    }
    if (!proofVideo) {
      toast.error('Please upload an unboxing or proof video.')
      return
    }
    if (proofImages.length === 0) {
      toast.error('Please upload at least 1 proof image (max 3).')
      return
    }

    try {
      await createReturn.mutateAsync({
        orderId,
        data: {
          reasonType,
          reasonMessage: reasonMessage.trim(),
          proofVideo,
          proofImages,
        },
      })
      toast.success('Return request submitted successfully!')
      setActiveTab('chat')
      refetchChat()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const msg = chatInput.trim()
    setChatInput('')
    try {
      await sendChatMessage.mutateAsync({ orderId, message: msg })
      refetchChat()
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } catch (err) {
      toast.error(err?.message || 'Could not send message')
      setChatInput(msg)
    }
  }

  const isChatActive = chatData?.isChatActive ?? true
  const deadline = chatData?.chatWindowDeadline || returnInfo?.chatWindowDeadline
  const returnStatus = returnInfo?.status || order?.orderStatus || 'requested'
  const reverseAwb = returnInfo?.reverseAwb || returnInfo?.trackingNumber

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Product Return & Refund"
      subtitle={`Order #${orderId}`}
      className="order-return-modal"
    >
      <div className="order-return-content">
        {hasExistingReturn && (
          <div className="order-return-tabs">
            <button
              type="button"
              className={`order-return-tab ${activeTab === 'chat' ? 'order-return-tab--active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={15} /> Return Support Chat
            </button>
            <button
              type="button"
              className={`order-return-tab ${activeTab === 'request' ? 'order-return-tab--active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              <PackageX size={15} /> Return Status & Proofs
            </button>
          </div>
        )}

        {activeTab === 'request' && (
          <form onSubmit={handleReturnSubmit} className="order-return-form">
            <div className="order-return-banner">
              <PackageX size={18} />
              <div>
                <p className="body-sm font-semibold">
                  {hasExistingReturn ? 'Return Request Active' : 'Initiate Customer Return'}
                </p>
                <p className="body-xs text-muted">
                  {hasExistingReturn
                    ? 'Your return request has been recorded. Our team will review your proofs and initiate reverse pickup.'
                    : 'Return requests are accepted for damaged products or wrong items delivered. Please upload 1 unboxing/defect video and 1–3 clear photos.'}
                </p>
              </div>
            </div>

            {hasExistingReturn && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(250, 247, 242, 0.8)',
                  border: '1px solid rgba(221, 215, 204, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="body-xs text-muted">Return Status:</span>
                  <span className="admin-badge admin-badge--warning" style={{ textTransform: 'capitalize' }}>
                    {returnStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {reverseAwb && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="body-xs text-muted">Reverse Pickup AWB:</span>
                    <span className="body-xs font-mono font-semibold">{reverseAwb}</span>
                  </div>
                )}
              </div>
            )}

            <div className="order-change-form__field">
              <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                Reason for Return *
              </label>
              <select
                value={returnInfo.reasonType || reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="order-change-select"
                disabled={hasExistingReturn}
              >
                <option value="damaged">Damaged Item Received</option>
                <option value="wrong_item">Wrong Item Delivered</option>
              </select>
            </div>

            <div className="order-change-form__field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="body-sm font-semibold">Describe the Issue *</label>
                {!hasExistingReturn && (
                  <span className="body-xs text-muted">{reasonMessage.length}/500</span>
                )}
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={returnInfo.reasonMessage || reasonMessage}
                onChange={(e) => setReasonMessage(e.target.value)}
                placeholder="Explain the damage or mismatch in detail (maximum 500 characters)..."
                className="order-change-textarea"
                required
                disabled={hasExistingReturn}
              />
            </div>

            {!hasExistingReturn ? (
              <>
                <div className="order-change-form__field">
                  <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                    Proof Video * (1 video: mp4/mov/mkv/webm, max 60MB)
                  </label>
                  <div className="order-upload-box">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/*"
                      onChange={handleVideoChange}
                      id="proofVideoInput"
                      className="order-upload-input"
                    />
                    <label htmlFor="proofVideoInput" className="order-upload-label">
                      <FileVideo size={18} />
                      <span>{proofVideo ? proofVideo.name : 'Choose unboxing / defect video *'}</span>
                    </label>
                  </div>
                </div>

                <div className="order-change-form__field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="body-sm font-semibold">
                      Proof Photos * (1 to {MAX_PROOF_IMAGES} images: JPG/PNG/WebP)
                    </label>
                    <span className="body-xs text-muted">{proofImages.length}/{MAX_PROOF_IMAGES}</span>
                  </div>
                  <div className="order-upload-box">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      multiple
                      onChange={handleImageChange}
                      id="proofImagesInput"
                      className="order-upload-input"
                      disabled={proofImages.length >= MAX_PROOF_IMAGES}
                    />
                    <label htmlFor="proofImagesInput" className="order-upload-label">
                      <ImageIcon size={18} />
                      <span>Upload photos of the product & packaging (Max {MAX_PROOF_IMAGES})</span>
                    </label>
                  </div>

                  {proofImages.length > 0 && (
                    <div className="order-proof-previews">
                      {proofImages.map((file, idx) => (
                        <div key={idx} className="order-proof-thumb">
                          <img src={URL.createObjectURL(file)} alt={`Proof ${idx + 1}`} />
                          <button
                            type="button"
                            className="order-proof-remove"
                            onClick={() => removeImage(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="order-change-form__actions">
                  <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={createReturn.isPending || !reasonMessage.trim() || !proofVideo || proofImages.length === 0}
                  >
                    {createReturn.isPending ? (
                      <>
                        <Loader2 size={14} className="account-orders-state__spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Return Request'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="order-change-form__actions">
                <Button type="button" variant="primary" size="sm" onClick={() => setActiveTab('chat')}>
                  <MessageSquare size={14} /> Open Support Chat
                </Button>
              </div>
            )}
          </form>
        )}

        {activeTab === 'chat' && (
          <div className="order-chat-container">
            {deadline && (
              <div className="order-chat-deadline">
                <Clock size={13} />
                <span>Return Support window active until {formatOrderDateTime(deadline)}</span>
              </div>
            )}

            <div className="order-chat-messages">
              {isChatLoading && chatMessages.length === 0 ? (
                <div className="account-orders-state" style={{ padding: '24px' }}>
                  <Loader2 size={20} className="account-orders-state__spin" />
                  <p className="body-xs text-muted">Loading messages…</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="order-chat-empty">
                  <MessageSquare size={24} className="text-muted" />
                  <p className="body-sm text-muted">No messages yet. Send a message below to our support team.</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((item, idx) => {
                    const isMe = item.sender === 'user'
                    return (
                      <div
                        key={idx}
                        className={`order-chat-bubble-wrap ${
                          isMe ? 'order-chat-bubble-wrap--me' : 'order-chat-bubble-wrap--other'
                        }`}
                      >
                        <span className="order-chat-sender">
                          {isMe ? 'You' : 'Customer Support'}
                        </span>
                        <div
                          className={`order-chat-bubble ${
                            isMe ? 'order-chat-bubble--me' : 'order-chat-bubble--other'
                          }`}
                        >
                          <p className="body-sm">{item.message}</p>
                        </div>
                        {item.createdAt && (
                          <span className="order-chat-time">
                            {formatOrderDateTime(item.createdAt)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </>
              )}
            </div>

            {isChatActive ? (
              <form onSubmit={handleSendMessage} className="order-chat-form">
                <input
                  type="text"
                  placeholder="Type your message to support..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="order-chat-input"
                  disabled={sendChatMessage.isPending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={sendChatMessage.isPending || !chatInput.trim()}
                >
                  <Send size={14} />
                </Button>
              </form>
            ) : (
              <p className="body-xs text-muted text-center" style={{ padding: '8px' }}>
                This return conversation has ended.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
