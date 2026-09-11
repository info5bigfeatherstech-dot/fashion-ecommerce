/**
 * @typedef {Object} RtoRefundCalculation
 * @property {number} orderAmount - Total order value
 * @property {number} amountPaid - Actual amount paid by customer
 * @property {number} shippingCharges - Forward shipping fee
 * @property {number} rtoCharges - RTO / reverse freight fee deduction
 * @property {number} otherDeductions - Any operational or restocking deductions
 * @property {number} eligibleRefundAmount - Maximum refund possible
 * @property {number} proposedRefundAmount - Recommended net refund
 * @property {string} deductionReason - Description of any deductions
 * @property {boolean} isPrepaid - True if prepaid order
 */

/**
 * @typedef {Object} RtoOrder
 * @property {string} orderId - Primary order identification number
 * @property {string} [id] - Database id fallback
 * @property {string} [_id] - Mongo ID fallback
 * @property {string} customerName - Name of the customer
 * @property {string} [userEmail] - Email of the customer
 * @property {string} [customerPhone] - Phone number of customer
 * @property {number} totalAmount - Total order amount in INR
 * @property {number} [amountPaid] - Amount already paid by customer
 * @property {'pending'|'closed'|'refunded'|'refund_failed'|'refund_rejected'|string} rtoStatus - Status of the RTO
 * @property {string} [stage] - Current delivery/processing stage (e.g., in_transit, out_for_delivery, delivered_to_warehouse, closed)
 * @property {string} [rtoReason] - Cause of RTO (customer refused, incorrect address, door closed, etc.)
 * @property {string} [reason] - Generic reason fallback
 * @property {number} [refundAmount] - Refund amount processed or eligible
 * @property {'prepaid'|'cod'|'partial'|string} [paymentType] - Payment mechanism
 * @property {string} [paymentMethod] - Alternative payment method field
 * @property {string} createdAt - Timestamp order was placed
 * @property {string} [rtoInitiatedAt] - When RTO was triggered
 * @property {string} [returnedAt] - When returned to warehouse
 * @property {string} [trackingNumber] - Courier AWB / tracking number
 * @property {string} [courierName] - Logistics provider (Shiprocket, Shipmozo, etc.)
 * @property {string} [warehouseName] - Receiving warehouse facility
 * @property {string} [warehouseDeliveredAt] - Warehouse intake timestamp
 * @property {boolean} [canRefund] - Backend flag indicating if refund is executable
 * @property {boolean} [canReject] - Backend flag indicating if rejection is permissible
 * @property {boolean} [canClose] - Backend flag indicating if case can be marked closed
 * @property {RtoRefundCalculation} [refundCalculation] - Breakdown of calculated refund
 * @property {Array<{ name: string, quantity: number, price: number, sku?: string, image?: string }>} [items] - Ordered items
 */

/**
 * @typedef {Object} RtoSummaryCounts
 * @property {number} total - Total RTO orders
 * @property {number} pending - Pending inspection or action
 * @property {number} refunded - Successfully refunded
 * @property {number} closed - Case closed
 * @property {number} refund_failed - Refund processing failed
 * @property {number} refund_rejected - Refund request rejected
 */

/**
 * @typedef {Object} RtoAnalyticsResponse
 * @property {number} totalRto - Total RTO orders count
 * @property {number} pending - Pending RTO count
 * @property {number} refunded - Refunded RTO count
 * @property {number} closed - Closed RTO count
 * @property {number} refundFailed - Failed refunds count
 * @property {number} customerRelated - Count of customer-attributed RTOs
 * @property {number} courierRelated - Count of courier/logistics-attributed RTOs
 * @property {number} eligibleForRefund - Count of RTOs eligible for refund
 * @property {number} totalRefundAmountInr - Sum of refund amounts in INR
 * @property {Array<{ date: string, count: number, refundAmount?: number }>} [timeline] - Daily trends for charts
 * @property {Array<{ date: string, count: number, refundAmount?: number }>} [byDate] - Alternative trend format
 */

export const RTO_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'refund_failed', label: 'Refund Failed' },
  { value: 'refund_rejected', label: 'Refund Rejected' },
]

export const RTO_SECTION_OPTIONS = [
  { value: 'all', label: 'All Sections' },
  { value: 'customer_related', label: 'Customer Related' },
  { value: 'courier_related', label: 'Courier Related' },
  { value: 'partial_paid', label: 'Partial Paid' },
  { value: 'refund_pending', label: 'Refund Pending' },
  { value: 'refund_processed', label: 'Refund Processed' },
  { value: 'refund_rejected', label: 'Refund Rejected' },
  { value: 'closed', label: 'Closed' },
  { value: 'resolved', label: 'Resolved' },
]

export const RTO_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Creation Date' },
  { value: 'totalAmount', label: 'Order Amount' },
  { value: 'orderStatus', label: 'Status' },
]
