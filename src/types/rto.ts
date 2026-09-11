export interface RtoRefundCalculation {
  orderAmount: number
  amountPaid: number
  shippingCharges: number
  rtoCharges: number
  otherDeductions: number
  eligibleRefundAmount: number
  proposedRefundAmount: number
  deductionReason?: string
  isPrepaid?: boolean
}

export interface RtoOrderItem {
  name: string
  quantity: number
  price: number
  sku?: string
  image?: string
}

export interface RtoOrder {
  orderId: string
  id?: string
  _id?: string
  customerName: string
  userEmail?: string
  customerPhone?: string
  totalAmount: number
  amountPaid?: number
  rtoStatus: 'pending' | 'closed' | 'refunded' | 'refund_failed' | 'refund_rejected' | string
  stage?: string
  rtoReason?: string
  reason?: string
  refundAmount?: number
  paymentType?: 'prepaid' | 'cod' | 'partial' | string
  paymentMethod?: string
  createdAt: string
  rtoInitiatedAt?: string
  returnedAt?: string
  trackingNumber?: string
  courierName?: string
  warehouseName?: string
  warehouseDeliveredAt?: string
  canRefund?: boolean
  canReject?: boolean
  canClose?: boolean
  refundCalculation?: RtoRefundCalculation
  items?: RtoOrderItem[]
}

export interface RtoSummaryCounts {
  total: number
  pending: number
  refunded: number
  closed: number
  refund_failed: number
  refund_rejected: number
}

export interface RtoAnalyticsTrend {
  date: string
  count: number
  refundAmount?: number
}

export interface RtoAnalyticsResponse {
  totalRto: number
  pending: number
  refunded: number
  closed: number
  refundFailed: number
  customerRelated: number
  courierRelated: number
  eligibleForRefund: number
  totalRefundAmountInr: number
  timeline?: RtoAnalyticsTrend[]
  byDate?: RtoAnalyticsTrend[]
}
