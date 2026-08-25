export function timelineRowsFromTracking(tracking) {
  const events = Array.isArray(tracking?.timeline) ? tracking.timeline : []
  return events.map((event, idx) => ({
    id: `tl-${idx}-${String(event?.status || 'step')}`,
    status: event?.status || 'Shipment update',
    description: event?.description || null,
    location: event?.location || null,
    timestamp: event?.timestamp || null,
  }))
}

export function timelineRowsFromSimple(tracking) {
  const events = Array.isArray(tracking?.simpleTimeline) ? tracking.simpleTimeline : []
  return events.map((event, idx) => ({
    id: `simple-${idx}-${String(event?.status || 'step')}`,
    status: event?.status || 'Update',
    description: event?.description || event?.status || null,
    location: event?.location || null,
    timestamp: event?.timestamp || null,
  }))
}

export function normalizeTrackingEvents(rawEvents = []) {
  if (!Array.isArray(rawEvents)) return []
  return rawEvents
    .map((event, idx) => ({
      id: `${idx}-${String(event?.status || event?.description || 'event')}`,
      status: event?.status || 'Shipment update',
      description: event?.description || null,
      location: event?.location || null,
      timestamp: event?.timestamp || event?.at || null,
    }))
    .filter((event) => event.status || event.description || event.timestamp)
}

export function unwrapTrackingPayload(tracking) {
  if (!tracking || typeof tracking !== 'object') return null
  if (tracking.data && typeof tracking.data === 'object' && !Array.isArray(tracking.data)) {
    return tracking.data
  }
  return tracking
}

export function resolveCarrierStatusDisplay({ tracking, ship, ops }) {
  const providerStatusRaw = tracking?.providerStatus || ship?.providerStatus || null
  const opsExceptionStates = new Set(['PICKUP_EXCEPTION', 'PROVIDER_RESET', 'NEEDS_MANUAL_REVIEW'])
  const shiprocketMirrorOps = new Set(['AWB_ASSIGNED', 'PICKUP_SCHEDULED', 'MANIFEST_READY'])
  const useOpsPrimaryStatus = ops?.opsState && opsExceptionStates.has(ops.opsState)
  const opsMirrorLine = [ops?.courierOpsLine1, ops?.courierOpsLine2].filter(Boolean).join(' · ')

  const carrierStatusDisplay = shiprocketMirrorOps.has(ops?.opsState)
    ? opsMirrorLine || providerStatusRaw || ops?.opsStateLabel
    : useOpsPrimaryStatus
      ? ops.courierOpsLine1 || ops.opsStateLabel || providerStatusRaw
      : providerStatusRaw || ops.courierOpsLine1 || ops.opsStateLabel || null

  const carrierStatusSecondary =
    useOpsPrimaryStatus && providerStatusRaw && providerStatusRaw !== carrierStatusDisplay
      ? providerStatusRaw
      : ops.courierOpsLine2 || null

  return { carrierStatusDisplay, carrierStatusSecondary, providerStatusRaw }
}

export function buildCarrierTimeline({ tracking, ship, ops, lastSyncedAt }) {
  const trackingTimeline = timelineRowsFromTracking(tracking)
  const simpleTimeline = timelineRowsFromSimple(tracking)

  let rows =
    trackingTimeline.length > 0
      ? trackingTimeline
      : simpleTimeline.length > 0
        ? simpleTimeline
        : normalizeTrackingEvents(ship?.rawEvents)

  const providerNow = tracking?.providerStatus || ship?.providerStatus || null
  const preInTransit = ![
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'PROVIDER_RESET',
    'PAYMENT_FAILED',
  ].includes(ops?.opsState)

  const norm = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')

  const isStaleCancel = (value) =>
    /pickupcancelled|pickup cancelled|auto cancel|shipment reset on shiprocket/.test(norm(value))

  const onlyStaleCancel =
    rows.length > 0 && rows.every((row) => isStaleCancel(row.status || row.description))
  const hasCurrent = providerNow && rows.some((row) => norm(row.status) === norm(providerNow))

  if (preInTransit && providerNow && (!hasCurrent || onlyStaleCancel)) {
    rows = [
      ...rows.filter((row) => !isStaleCancel(row.status || row.description)),
      {
        id: 'provider-current',
        status: providerNow,
        description:
          ops?.opsState === 'AWB_ASSIGNED'
            ? 'Schedule pickup on Shiprocket to continue.'
            : null,
        location: null,
        timestamp: lastSyncedAt || new Date().toISOString(),
      },
    ]
  } else if (preInTransit && providerNow) {
    rows = rows.filter((row) => !isStaleCancel(row.status || row.description))
  }

  return rows
}
