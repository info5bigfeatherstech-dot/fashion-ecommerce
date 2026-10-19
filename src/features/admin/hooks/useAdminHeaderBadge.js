import {
  useAdminFestiveOfferSettings,
  useAdminSaleLiveSettings,
  useUpdateAdminFestiveOfferSettings,
  useUpdateAdminSaleLiveSettings,
} from '@/features/admin/hooks'
import {
  HEADER_BADGE_IDS,
  getHeaderBadgeDef,
} from '@/features/admin/config/headerBadges'

/**
 * Settings + mutation for one header badge (or all rows for the list screen).
 * Hooks are always called; `enabled` gates the unused query.
 */
export function useAdminHeaderBadge(badgeId, { enabled = true } = {}) {
  const def = getHeaderBadgeDef(badgeId)
  const isSale = badgeId === HEADER_BADGE_IDS.SALE_LIVE
  const isFestive = badgeId === HEADER_BADGE_IDS.FESTIVE_OFFER

  const saleQuery = useAdminSaleLiveSettings({ enabled: enabled && isSale })
  const festiveQuery = useAdminFestiveOfferSettings({ enabled: enabled && isFestive })
  const saleUpdate = useUpdateAdminSaleLiveSettings()
  const festiveUpdate = useUpdateAdminFestiveOfferSettings()

  if (isSale) {
    return {
      def,
      data: saleQuery.data,
      isLoading: saleQuery.isLoading,
      isError: saleQuery.isError,
      error: saleQuery.error,
      refetch: saleQuery.refetch,
      update: saleUpdate,
    }
  }

  if (isFestive) {
    return {
      def,
      data: festiveQuery.data,
      isLoading: festiveQuery.isLoading,
      isError: festiveQuery.isError,
      error: festiveQuery.error,
      refetch: festiveQuery.refetch,
      update: festiveUpdate,
    }
  }

  return {
    def: null,
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error('Unknown header badge'),
    refetch: () => {},
    update: { mutateAsync: async () => {}, isPending: false },
  }
}

/** Load all registered badges for the WordPress-style list table. */
export function useAdminHeaderBadgesList() {
  const saleQuery = useAdminSaleLiveSettings()
  const festiveQuery = useAdminFestiveOfferSettings()

  const rows = [
    {
      id: HEADER_BADGE_IDS.SALE_LIVE,
      def: getHeaderBadgeDef(HEADER_BADGE_IDS.SALE_LIVE),
      data: saleQuery.data,
      isLoading: saleQuery.isLoading,
      isError: saleQuery.isError,
      error: saleQuery.error,
      refetch: saleQuery.refetch,
    },
    {
      id: HEADER_BADGE_IDS.FESTIVE_OFFER,
      def: getHeaderBadgeDef(HEADER_BADGE_IDS.FESTIVE_OFFER),
      data: festiveQuery.data,
      isLoading: festiveQuery.isLoading,
      isError: festiveQuery.isError,
      error: festiveQuery.error,
      refetch: festiveQuery.refetch,
    },
  ]

  return {
    rows,
    isLoading: rows.some((r) => r.isLoading),
    isError: rows.some((r) => r.isError),
    refetchAll: () => {
      saleQuery.refetch()
      festiveQuery.refetch()
    },
  }
}
