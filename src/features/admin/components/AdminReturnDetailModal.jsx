import { useState, useMemo, useRef, useEffect } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Mail,
  Maximize2,
  MessageSquare,
  Package,
  PackageCheck,
  PackageX,
  Phone,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import {
  getOrderItems,
  getOrderItemName,
  getOrderItemImage,
  getOrderItemVariantLabel,
} from '@/features/orders/utils'
import {
  useAdminReturnDetail,
  useAdminReturnChat,
  useSendAdminReturnChatMessage,
  useDecideAdminReturnRequest,
  useInitiateAdminReturnRefund,
  useRetryAdminReturnReversePickup,
} from '@/features/admin/hooks'

function getReturnStatusBadgeClass(status = '') {
  const st = String(status).toLowerCase()
  if (['approved', 'qc_passed', 'refunded'].includes(st)) return 'admin-badge--success'
  if (['rejected', 'approval_failed'].includes(st)) return 'admin-badge--danger'
  if (['received', 'refund_pending', 'pickup_in_progress'].includes(st)) return 'admin-badge--info'
  return 'admin-badge--warning'
}

function resolveMediaUrl(value) {
  if (!value) return null
  let str = ''
  if (typeof value === 'string') {
    str = value.trim()
  } else if (typeof value === 'object') {
    str = (value.url || value.path || value.secure_url || value.src || '').trim()
  }
  if (!str) return null
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('blob:') || str.startsWith('data:')) {
    return str
  }
  const clean = str.replace(/^[/\\]+/, '').replace(/\\/g, '/')
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const host = apiBase ? apiBase.replace(/\/api\/?$/, '') : ''
  return host ? `${host}/${clean}` : `/${clean}`
}

export function AdminReturnDetailModal({ open, onClose, orderId, initialData, onUpdated }) {
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'chat'
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [previewMediaIndex, setPreviewMediaIndex] = useState(null)
  const [videoTheaterOpen, setVideoTheaterOpen] = useState(false)
  const chatBottomRef = useRef(null)

  const { data: detailData, isLoading, isError, error, refetch } = useAdminReturnDetail(orderId, {
    enabled: Boolean(open && orderId),
  })

  const { data: chatData, isLoading: isChatLoading, refetch: refetchChat } = useAdminReturnChat(
    orderId,
    { enabled: Boolean(open && orderId && activeTab === 'chat'), refetchInterval: activeTab === 'chat' ? 8000 : false }
  )

  const decideMutation = useDecideAdminReturnRequest()
  const refundMutation = useInitiateAdminReturnRefund()
  const retryPickupMutation = useRetryAdminReturnReversePickup()
  const sendChatMessage = useSendAdminReturnChatMessage()

  if (!orderId) return null

  // Consolidate response data across all possible API response envelopes
  const raw =
    detailData?.order ||
    detailData?.returnRequest ||
    detailData?.return ||
    detailData?.data?.order ||
    detailData?.data?.returnRequest ||
    detailData?.data ||
    detailData ||
    {}
  const fallback = initialData || {}

  const returnInfo =
    raw.returnInfo ||
    raw.returnRequest ||
    fallback.returnInfo ||
    fallback.returnRequest ||
    raw

  const returnStatus = String(
    returnInfo.status ||
    raw.returnStatus ||
    raw.orderStatus ||
    raw.status ||
    fallback.returnInfo?.status ||
    fallback.returnStatus ||
    fallback.status ||
    'requested'
  ).toLowerCase()

  const canDecide = returnStatus === 'requested' || returnStatus === 'pending' || returnStatus === 'return_requested'
  const canRetryPickup =
    returnStatus === 'approval_failed' ||
    (returnStatus === 'approved' && !returnInfo.reverseAwb && !returnInfo.trackingNumber)
  const canRefund = ['received', 'qc_passed', 'refund_pending'].includes(returnStatus)
  const hasRefunded = returnStatus === 'refunded'

  // Extract proofs array from API returnInfo.proofs (which contains both video and image with kind)
  const proofsArray = Array.isArray(returnInfo.proofs)
    ? returnInfo.proofs
    : Array.isArray(raw.proofs)
    ? raw.proofs
    : Array.isArray(fallback.returnInfo?.proofs)
    ? fallback.returnInfo.proofs
    : []

  // Extract Proof Video (from proofs array kind === 'video' or mp4 url or fallback fields)
  const videoObj = proofsArray.find(
    (p) =>
      p?.kind === 'video' ||
      /\.(mp4|mov|webm|m4v|mkv)(\?.*)?$/i.test(p?.url || '') ||
      p?.url?.includes('/video/')
  )
  const rawProofVideo =
    videoObj?.url ||
    returnInfo.proofVideo ||
    returnInfo.video ||
    returnInfo.videoUrl ||
    returnInfo.proofVideoUrl ||
    raw.proofVideo ||
    raw.video ||
    raw.videoUrl ||
    fallback.proofVideo ||
    fallback.returnInfo?.proofVideo ||
    fallback.returnInfo?.video ||
    null

  const proofVideo = resolveMediaUrl(rawProofVideo)

  // Extract Proof Images (from proofs array kind === 'image' or fallback fields)
  const imagesFromProofs = proofsArray
    .filter(
      (p) =>
        p?.kind === 'image' ||
        (p?.url && p.url !== rawProofVideo && !p.url.includes('/video/') && !/\.(mp4|mov|webm|m4v|mkv)(\?.*)?$/i.test(p.url))
    )
    .map((p) => p.url)

  const rawImages =
    imagesFromProofs.length > 0
      ? imagesFromProofs
      : returnInfo.proofImages ||
        returnInfo.images ||
        returnInfo.photos ||
        returnInfo.proofPhotos ||
        raw.proofImages ||
        raw.images ||
        fallback.proofImages ||
        fallback.returnInfo?.proofImages ||
        fallback.returnInfo?.images ||
        []

  const proofImages = (Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [])
    .map(resolveMediaUrl)
    .filter(Boolean)

  // Customer Information (check addressSnapshot first)
  const addressSnapshot =
    raw.addressSnapshot ||
    raw.shippingAddress ||
    fallback.addressSnapshot ||
    fallback.shippingAddress ||
    {}

  const customerName =
    addressSnapshot.fullName ||
    addressSnapshot.name ||
    raw.customerName ||
    raw.user?.name ||
    raw.customer?.name ||
    fallback.customerName ||
    fallback.user?.name ||
    fallback.shippingAddress?.fullName ||
    'Customer'

  const customerPhone =
    addressSnapshot.phone ||
    raw.customerPhone ||
    raw.user?.phone ||
    fallback.customerPhone ||
    fallback.user?.phone ||
    ''

  const customerEmail =
    raw.customerEmail ||
    raw.user?.email ||
    raw.email ||
    fallback.customerEmail ||
    fallback.user?.email ||
    ''

  const customerAddress = [
    addressSnapshot.houseNumber,
    addressSnapshot.building,
    addressSnapshot.area,
    addressSnapshot.addressLine1,
    addressSnapshot.city,
    addressSnapshot.state,
    addressSnapshot.postalCode,
  ]
    .filter(Boolean)
    .join(', ')

  // Return Reason & Description
  const reasonType =
    returnInfo.reasonType ||
    raw.reasonType ||
    fallback.returnInfo?.reasonType ||
    fallback.reasonType ||
    'damaged'

  const reasonMessage =
    returnInfo.reasonMessage ||
    returnInfo.customerQuery ||
    returnInfo.description ||
    returnInfo.message ||
    raw.reasonMessage ||
    raw.customerQuery ||
    fallback.returnInfo?.reasonMessage ||
    fallback.returnInfo?.customerQuery ||
    fallback.reasonMessage ||
    ''

  const requestedDate =
    returnInfo.requestedAt ||
    raw.requestedAt ||
    fallback.returnInfo?.requestedAt ||
    fallback.requestedAt ||
    raw.createdAt ||
    fallback.createdAt ||
    null

  const totalAmount =
    raw.totalAmount ??
    raw.refundAmount ??
    fallback.refundAmount ??
    fallback.totalAmount ??
    0

  // Product Items normalization from order.items and shippingWeightSnapshot
  const rawItems =
    (Array.isArray(raw.items) && raw.items.length > 0 && raw.items) ||
    (Array.isArray(fallback.items) && fallback.items.length > 0 && fallback.items) ||
    []
  const weightLines = Array.isArray(raw.shippingWeightSnapshot?.lines) ? raw.shippingWeightSnapshot.lines : []

  const items = useMemo(() => {
    if (rawItems.length === 0 && raw.item) return [raw.item]
    return rawItems.map((item, idx) => {
      const weightLine = weightLines[idx] || {}
      const pId = item.productId && typeof item.productId === 'object' ? item.productId : {}
      const name = item.productName || item.name || item.title || pId.name || pId.title || weightLine.productName || 'Product'
      const slug = item.slug || pId.slug || weightLine.productSlug || null
      const sku = item.productCode || item.sku || weightLine.sku || ''
      const qty = Number(item.quantity) || 1
      const price = item.priceSnapshot?.total ?? (item.priceSnapshot?.sale ? item.priceSnapshot.sale * qty : (item.price ? item.price * qty : 0))
      const unitPrice = item.priceSnapshot?.sale ?? item.priceSnapshot?.base ?? (price / qty)

      let variant = ''
      if (Array.isArray(item.variantAttributesSnapshot) && item.variantAttributesSnapshot.length > 0) {
        variant = item.variantAttributesSnapshot.map((a) => `${a.key}: ${a.value}`).join(' · ')
      } else {
        variant = getOrderItemVariantLabel(item) || ''
      }

      const image =
        getOrderItemImage(item) ||
        (typeof item.productId === 'object' ? resolveMediaUrl(item.productId?.image || item.productId?.images?.[0]) : null)

      return {
        ...item,
        name,
        slug,
        sku,
        quantity: qty,
        price,
        unitPrice,
        variant,
        image,
      }
    })
  }, [rawItems, weightLines, raw.item])

  const chatMessages = chatData?.chat || returnInfo.chat || fallback.returnInfo?.chat || []

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTab, chatMessages.length])

  const handleApprove = async () => {
    if (!window.confirm(`Approve return request for order #${orderId}? This will initiate reverse pickup.`)) return
    try {
      await decideMutation.mutateAsync({
        orderId,
        decision: 'approve',
        customerRequest: 'REFUND',
      })
      toast.success('Return request approved and reverse pickup initiated.')
      refetch()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to approve return request')
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    try {
      await decideMutation.mutateAsync({
        orderId,
        decision: 'reject',
        decisionReason: rejectionReason.trim(),
      })
      toast.success('Return request has been rejected.')
      setRejectModalOpen(false)
      setRejectionReason('')
      refetch()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to reject return request')
    }
  }

  const handleInitiateRefund = async () => {
    if (!window.confirm(`Initiate online refund for order #${orderId}?`)) return
    try {
      const res = await refundMutation.mutateAsync(orderId)
      toast.success(res?.message || 'Refund initiated successfully.')
      refetch()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to initiate refund')
    }
  }

  const handleRetryPickup = async () => {
    try {
      await retryPickupMutation.mutateAsync(orderId)
      toast.success('Reverse pickup retry requested.')
      refetch()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Reverse pickup retry failed')
    }
  }

  const handleSendAdminMessage = async (e) => {
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
      toast.error(err?.message || 'Failed to send chat message')
      setChatInput(msg)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={`Return Request: #${orderId}`}
        subtitle={requestedDate ? `Requested on ${new Date(requestedDate).toLocaleString()}` : ''}
        className="order-return-modal admin-return-detail-modal"
      >
        {isLoading && !initialData ? (
          <div className="account-orders-state" style={{ padding: '40px' }}>
            <Loader2 size={28} className="account-orders-state__spin" />
            <p className="body-sm text-muted">Loading return request details…</p>
          </div>
        ) : isError && !initialData ? (
          <div className="account-orders-state text-error" style={{ padding: '30px' }}>
            <AlertCircle size={24} />
            <p className="body-sm">{error?.message || 'Failed to load return details'}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()} style={{ marginTop: '12px' }}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="order-return-content admin-return-modal-content">
            {/* Navigation Tabs */}
            <div className="order-return-tabs">
              <button
                type="button"
                className={`order-return-tab ${activeTab === 'details' ? 'order-return-tab--active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <PackageX size={15} /> Return Overview & Proofs
              </button>
              <button
                type="button"
                className={`order-return-tab ${activeTab === 'chat' ? 'order-return-tab--active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={15} /> Return Support Chat
                {chatMessages.length > 0 && ` (${chatMessages.length})`}
              </button>
            </div>

            {activeTab === 'details' && (
              <div className="admin-return-scroll-body">
                {/* 1. Status & Customer Summary Header Card */}
                <div className="admin-return-profile-card">
                  <div className="admin-return-profile-user">
                    <div className="admin-return-avatar">
                      <User size={20} />
                    </div>
                    <div className="admin-return-user-details">
                      <p className="admin-return-customer-name">
                        {customerName || 'Customer'}
                      </p>
                      <div className="admin-return-contact-pills">
                        {customerPhone && (
                          <a href={`tel:${customerPhone}`} className="admin-contact-pill" title="Call customer">
                            <Phone size={12} />
                            <span>{customerPhone}</span>
                          </a>
                        )}
                        {customerEmail && (
                          <a href={`mailto:${customerEmail}`} className="admin-contact-pill" title="Email customer">
                            <Mail size={12} />
                            <span>{customerEmail}</span>
                          </a>
                        )}
                        {customerAddress && (
                          <span className="admin-contact-pill" title={`Shipping Address: ${customerAddress}`}>
                            <span>📍 {customerAddress}</span>
                          </span>
                        )}
                        {!customerPhone && !customerEmail && !customerAddress && (
                          <span className="body-xs text-muted">No direct contact listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-return-status-box">
                    <span className="admin-return-status-label">Return Status</span>
                    <span className={`admin-badge ${getReturnStatusBadgeClass(returnStatus)}`}>
                      {returnStatus.replace(/_/g, ' ') || 'Requested'}
                    </span>
                    <p className="admin-return-price-tag">
                      Refund: <strong>{formatPrice(totalAmount)}</strong>
                    </p>
                  </div>
                </div>

                {/* 2. Claimed Items / Product Information */}
                {items.length > 0 && (
                  <div className="admin-return-section-card">
                    <div className="admin-return-section-header">
                      <div className="admin-return-section-title">
                        <Package size={16} className="text-accent" />
                        <span>Defective Product / Claimed Item ({items.length})</span>
                      </div>
                    </div>

                    <div className="admin-return-items-list">
                      {items.map((item, idx) => {
                        const name = item.name || 'Product'
                        const image = item.image
                        const variant = item.variant
                        const qty = Number(item.quantity) || 1
                        const price = item.price || 0

                        return (
                          <div key={item._id || item.variantId || idx} className="admin-return-product-row">
                            <div className="admin-return-product-media">
                              {image ? (
                                <img src={image} alt={name} loading="lazy" />
                              ) : (
                                <Package size={22} className="text-accent" />
                              )}
                            </div>
                            <div className="admin-return-product-info">
                              <p className="admin-return-product-name">{name}</p>
                              <div className="admin-return-product-meta">
                                {variant && <span className="admin-variant-badge">{variant}</span>}
                                {item.sku && <span className="body-xs text-muted font-mono">Code: {item.sku}</span>}
                                <span className="body-xs text-muted">Qty: <strong>{qty}</strong></span>
                              </div>
                            </div>
                            <div className="admin-return-product-price">
                              <span className="body-sm font-semibold">{formatPrice(price)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Return Reason & Customer Description */}
                <div className="admin-return-section-card">
                  <div className="admin-return-section-header">
                    <div className="admin-return-section-title">
                      <ShieldAlert size={16} className="text-warning" />
                      <span>Return Reason & Description</span>
                    </div>
                    <span className="admin-return-reason-tag">
                      {reasonType ? reasonType.replace(/_/g, ' ') : 'Damaged Product'}
                    </span>
                  </div>

                  <div className="admin-return-reason-quote">
                    <span className="admin-return-quote-label">Customer Explanation:</span>
                    <p className="admin-return-quote-text">
                      &ldquo;{reasonMessage || 'No written explanation provided.'}&rdquo;
                    </p>
                  </div>

                  {returnInfo.decisionReason && (
                    <div className="admin-return-decision-box">
                      <span className="body-xs text-error font-semibold">Previous Decision Note / Rejection Reason:</span>
                      <p className="body-sm text-error">{returnInfo.decisionReason}</p>
                    </div>
                  )}
                </div>

                {/* 4. CUSTOMER PROOFS & MEDIA (Showcase: Video & Photos) */}
                <div className="admin-return-section-card admin-return-proofs-card">
                  <div className="admin-return-section-header">
                    <div className="admin-return-section-title">
                      <FileVideo size={17} className="text-accent" />
                      <span>Customer Proofs & Defect Evidence</span>
                    </div>
                    <span className="body-xs text-muted">
                      {proofVideo ? '1 Video' : 'No video'} · {proofImages.length} Photo{proofImages.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* 4A. Defect / Unboxing Video Proof Player */}
                  <div className="admin-return-media-block">
                    <div className="admin-return-media-header">
                      <span className="admin-return-media-heading">
                        <FileVideo size={14} />
                        Unboxing & Defect Video Proof
                      </span>
                      {proofVideo && (
                        <div className="admin-return-media-actions">
                          <button
                            type="button"
                            className="admin-media-action-btn"
                            onClick={() => setVideoTheaterOpen(true)}
                            title="Expand video player"
                          >
                            <Maximize2 size={12} />
                            <span>Theater Mode</span>
                          </button>
                          <a
                            href={proofVideo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-media-action-btn"
                            title="Open video in new browser tab"
                          >
                            <ExternalLink size={12} />
                            <span>New Tab</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {proofVideo ? (
                      <div className="admin-video-player-frame">
                        <video
                          src={proofVideo}
                          controls
                          playsInline
                          preload="metadata"
                          className="admin-embedded-video"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div className="admin-media-empty-box">
                        <FileVideo size={22} className="text-muted" />
                        <p className="body-xs text-muted">No unboxing or defect video attached by the customer.</p>
                      </div>
                    )}
                  </div>

                  {/* 4B. Photos Gallery */}
                  <div className="admin-return-media-block">
                    <div className="admin-return-media-header">
                      <span className="admin-return-media-heading">
                        <ImageIcon size={14} />
                        Defect Photos ({proofImages.length})
                      </span>
                      {proofImages.length > 0 && (
                        <span className="body-xs text-muted">Click any photo to zoom</span>
                      )}
                    </div>

                    {proofImages.length > 0 ? (
                      <div className="admin-proof-images-grid">
                        {proofImages.map((imgUrl, i) => (
                          <div
                            key={i}
                            className="admin-proof-image-thumb"
                            onClick={() => setPreviewMediaIndex(i)}
                            title={`Proof Photo ${i + 1} - Click to zoom`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setPreviewMediaIndex(i)}
                          >
                            <img src={imgUrl} alt={`Defect proof ${i + 1}`} loading="lazy" />
                            <div className="admin-proof-image-overlay">
                              <Maximize2 size={16} />
                              <span>Zoom</span>
                            </div>
                            <span className="admin-proof-image-idx">#{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-media-empty-box">
                        <ImageIcon size={22} className="text-muted" />
                        <p className="body-xs text-muted">No photo evidence attached by the customer.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Reverse Pickup / Courier Info (if generated) */}
                {(returnInfo.reverseAwb || returnInfo.trackingNumber || returnInfo.courier) && (
                  <div className="admin-return-shipment-box">
                    <div>
                      <div className="admin-return-shipment-title">
                        <Truck size={16} className="text-success" />
                        <span className="body-sm font-semibold">Reverse Shipment / Pickup</span>
                      </div>
                      <p className="body-xs text-muted" style={{ marginTop: '3px' }}>
                        Courier: <strong>{returnInfo.courier || returnInfo.reverseCourier || 'Shipmozo'}</strong> · AWB:{' '}
                        <strong className="font-mono">{returnInfo.reverseAwb || returnInfo.trackingNumber || '—'}</strong>
                      </p>
                    </div>
                    {returnInfo.reverseStatus && (
                      <span className="admin-badge admin-badge--info">
                        {returnInfo.reverseStatus.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}

                {/* 6. Action Buttons Toolbar */}
                <div className="admin-return-actions-bar">
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    Close
                  </Button>

                  {canDecide && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectModalOpen(true)}
                        disabled={decideMutation.isPending}
                        className="admin-btn-reject"
                      >
                        <XCircle size={14} /> Reject Request
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleApprove}
                        disabled={decideMutation.isPending}
                        className="admin-btn-approve"
                      >
                        {decideMutation.isPending ? (
                          <Loader2 size={14} className="account-orders-state__spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Approve & Generate Reverse Pickup
                      </Button>
                    </>
                  )}

                  {canRetryPickup && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetryPickup}
                      disabled={retryPickupMutation.isPending}
                    >
                      <RotateCcw size={14} /> Retry Reverse Pickup
                    </Button>
                  )}

                  {canRefund && !hasRefunded && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleInitiateRefund}
                      disabled={refundMutation.isPending}
                      style={{ background: '#059669', borderColor: '#059669' }}
                    >
                      {refundMutation.isPending ? (
                        <Loader2 size={14} className="account-orders-state__spin" />
                      ) : (
                        <RotateCcw size={14} />
                      )}
                      Initiate Return Refund ({formatPrice(totalAmount)})
                    </Button>
                  )}

                  {hasRefunded && (
                    <span className="admin-badge admin-badge--success">
                      <CheckCircle size={12} /> Refund Completed
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="order-chat-container">
                <div className="order-chat-messages" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {isChatLoading && chatMessages.length === 0 ? (
                    <div className="account-orders-state" style={{ padding: '24px' }}>
                      <Loader2 size={20} className="account-orders-state__spin" />
                      <p className="body-xs text-muted">Loading messages…</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                  <div className="order-chat-empty" style={{ padding: '30px 16px', textAlign: 'center' }}>
                      <MessageSquare size={28} className="text-muted" style={{ margin: '0 auto 8px' }} />
                      <p className="body-sm text-muted">No messages yet. Send a message to the customer below.</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((item, idx) => {
                        const isMe = item.sender === 'admin'
                        return (
                          <div
                            key={idx}
                            className={`order-chat-bubble-wrap ${
                              isMe ? 'order-chat-bubble-wrap--me' : 'order-chat-bubble-wrap--other'
                            }`}
                          >
                            <span className="order-chat-sender">
                              {isMe ? 'Store Support (You)' : customerName || 'Customer'}
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
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      <div ref={chatBottomRef} />
                    </>
                  )}
                </div>

                <form onSubmit={handleSendAdminMessage} className="order-chat-form">
                  <input
                    type="text"
                    placeholder="Reply as Store Support..."
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
                    {sendChatMessage.isPending ? <Loader2 size={14} className="account-orders-state__spin" /> : <Send size={14} />}
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Confirmation Modal */}
      {rejectModalOpen && (
        <Modal
          open={rejectModalOpen}
          onOpenChange={(isOpen) => !isOpen && setRejectModalOpen(false)}
          title="Reject Return Request"
          subtitle={`Order #${orderId}`}
        >
          <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p className="body-sm text-muted">
              Please specify the reason for rejecting this return request. This explanation will be communicated to the customer.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Return request submitted past the policy period / Proof indicates item was already altered..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="order-change-textarea"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={decideMutation.isPending || !rejectionReason.trim()}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                {decideMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Photo Lightbox Preview Modal */}
      {previewMediaIndex !== null && proofImages[previewMediaIndex] && (
        <Modal
          open={previewMediaIndex !== null}
          onOpenChange={() => setPreviewMediaIndex(null)}
          title={`Defect Proof Photo (${previewMediaIndex + 1} of ${proofImages.length})`}
          className="admin-lightbox-modal"
        >
          <div className="admin-lightbox-container">
            <div className="admin-lightbox-image-wrap">
              <img
                src={proofImages[previewMediaIndex]}
                alt={`Proof ${previewMediaIndex + 1}`}
                className="admin-lightbox-image"
              />
            </div>

            <div className="admin-lightbox-toolbar">
              <div className="admin-lightbox-nav">
                {proofImages.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setPreviewMediaIndex((prev) => (prev > 0 ? prev - 1 : proofImages.length - 1))
                      }
                      title="Previous photo"
                    >
                      <ChevronLeft size={16} /> Previous
                    </Button>
                    <span className="body-xs text-muted">
                      {previewMediaIndex + 1} / {proofImages.length}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setPreviewMediaIndex((prev) => (prev < proofImages.length - 1 ? prev + 1 : 0))
                      }
                      title="Next photo"
                    >
                      Next <ChevronRight size={16} />
                    </Button>
                  </>
                )}
              </div>

              <a
                href={proofImages[previewMediaIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-lightbox-ext-btn"
                download
              >
                <Download size={14} /> Open Full Size
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Video Theater Preview Modal */}
      {videoTheaterOpen && proofVideo && (
        <Modal
          open={videoTheaterOpen}
          onOpenChange={() => setVideoTheaterOpen(false)}
          title="Unboxing & Defect Video Proof"
          subtitle={`Order #${orderId}`}
          className="admin-video-theater-modal"
        >
          <div className="admin-theater-player-wrap">
            <video
              src={proofVideo}
              controls
              autoPlay
              playsInline
              className="admin-theater-video"
            >
              Your browser does not support HTML5 video.
            </video>
          </div>
        </Modal>
      )}
    </>
  )
}

