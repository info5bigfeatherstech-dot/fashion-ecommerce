import { useState } from 'react'
import {
  AlertCircle,
  Clock,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  PackageX,
  Send,
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

export function OrderReturnModal({ open, onClose, order }) {
  const orderId = order?.orderId
  const hasExistingReturn = Boolean(
    order?.returnInfo?.status ||
    order?.returnRequest?.status ||
    order?.orderStatus === 'return_requested'
  )

  const [activeTab, setActiveTab] = useState(hasExistingReturn ? 'chat' : 'request')
  const [reasonType, setReasonType] = useState('damaged')
  const [reasonMessage, setReasonMessage] = useState('')
  const [proofVideo, setProofVideo] = useState(null)
  const [proofImages, setProofImages] = useState([])
  const [chatInput, setChatInput] = useState('')

  const createReturn = useCreateReturnRequest()
  const { data: chatData, isLoading: isChatLoading, refetch: refetchChat } = useReturnChat(
    orderId,
    { enabled: Boolean(open && orderId && (hasExistingReturn || activeTab === 'chat')) }
  )
  const sendChatMessage = useSendReturnChatMessage()

  if (!order) return null

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (proofImages.length + files.length > 3) {
      toast.error('You can upload at most 3 proof images.')
      return
    }
    setProofImages((prev) => [...prev, ...files].slice(0, 3))
  }

  const removeImage = (idx) => {
    setProofImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 60 * 1024 * 1024) {
        toast.error('Video file size exceeds 60MB limit.')
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
    if (!proofVideo) {
      toast.error('Please upload an unboxing or proof video.')
      return
    }
    if (proofImages.length === 0) {
      toast.error('Please upload at least 1 proof image.')
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
      toast.error(err?.message || 'Failed to submit return request.')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const msg = chatInput.trim()
    setChatInput('')
    try {
      await sendChatMessage.mutateAsync({ orderId, message: msg })
    } catch (err) {
      toast.error(err?.message || 'Could not send message')
      setChatInput(msg)
    }
  }

  const chatMessages = chatData?.chat || []
  const isChatActive = chatData?.isChatActive ?? true
  const deadline = chatData?.chatWindowDeadline

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Returns & Return Support"
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
              <PackageX size={15} /> Request Details
            </button>
          </div>
        )}

        {activeTab === 'request' && (
          <form onSubmit={handleReturnSubmit} className="order-return-form">
            <div className="order-return-banner">
              <PackageX size={18} />
              <div>
                <p className="body-sm font-semibold">Initiate Return Request</p>
                <p className="body-xs text-muted">
                  Return requests are accepted for damaged products or wrong items delivered. Please provide clear proof images and an unboxing video.
                </p>
              </div>
            </div>

            <div className="order-change-form__field">
              <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                Reason for Return *
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="order-change-select"
                disabled={hasExistingReturn}
              >
                <option value="damaged">Damaged Item Received</option>
                <option value="wrong_item">Wrong Item Delivered</option>
              </select>
            </div>

            <div className="order-change-form__field">
              <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                Describe the Issue *
              </label>
              <textarea
                rows={3}
                value={reasonMessage}
                onChange={(e) => setReasonMessage(e.target.value)}
                placeholder="Explain the damage or mismatch in detail..."
                className="order-change-textarea"
                required
                disabled={hasExistingReturn}
              />
            </div>

            {!hasExistingReturn && (
              <>
                <div className="order-change-form__field">
                  <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                    Proof Video * (1 video: mp4/mov/webm, max 60MB)
                  </label>
                  <div className="order-upload-box">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                      onChange={handleVideoChange}
                      id="proofVideoInput"
                      className="order-upload-input"
                    />
                    <label htmlFor="proofVideoInput" className="order-upload-label">
                      <FileVideo size={18} />
                      <span>{proofVideo ? proofVideo.name : 'Choose unboxing / proof video'}</span>
                    </label>
                  </div>
                </div>

                <div className="order-change-form__field">
                  <label className="body-sm font-semibold" style={{ display: 'block', marginBottom: '6px' }}>
                    Proof Images * (1 to 3 images: JPG/PNG/WebP)
                  </label>
                  <div className="order-upload-box">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageChange}
                      id="proofImagesInput"
                      className="order-upload-input"
                      disabled={proofImages.length >= 3}
                    />
                    <label htmlFor="proofImagesInput" className="order-upload-label">
                      <ImageIcon size={18} />
                      <span>Upload photos of the product (Max 3)</span>
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
                    disabled={createReturn.isPending}
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
                chatMessages.map((item, idx) => {
                  const isUser = item.sender === 'user'
                  return (
                    <div
                      key={idx}
                      className={`order-chat-bubble-wrap ${
                        isUser ? 'order-chat-bubble-wrap--user' : 'order-chat-bubble-wrap--admin'
                      }`}
                    >
                      <span className="order-chat-sender">
                        {isUser ? 'You' : 'Fabuniqo Support'}
                      </span>
                      <div
                        className={`order-chat-bubble ${
                          isUser ? 'order-chat-bubble--user' : 'order-chat-bubble--admin'
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
                })
              )}
            </div>

            {isChatActive ? (
              <form onSubmit={handleSendMessage} className="order-chat-form">
                <input
                  type="text"
                  placeholder="Type your reply here..."
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
