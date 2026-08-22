import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  abandonOnlineCheckout,
  confirmCheckoutQuote,
  createCheckoutQuote,
  createOrder,
  getCheckoutSettings,
  getRazorpayKey,
  verifyRazorpayPayment,
} from './api'
import { checkoutKeys } from './queryKeys'
import { quoteParamsForPaymentMethod } from './constants'
import { isCodPlacedOrder } from './mappers'
import { getCart } from '@/features/cart/api'
import { useAppStore } from '@/store'

const CHECKOUT_QUOTE_STALE_MS = 1000 * 60
const CHECKOUT_SETTINGS_STALE_MS = 1000 * 60 * 5

/** Warm checkout settings + quote cache before navigating to /checkout. */
export function prefetchCheckoutForAddress(
  queryClient,
  {
    addressId,
    couponCode = '',
    cartKey,
    paymentMethod = 'prepaid',
  } = {}
) {
  const { isAuthenticated, accessToken, cartItems } = useAppStore.getState()
  if (!isAuthenticated || !accessToken) return

  const id = String(addressId || '').trim()
  if (!id) return

  const resolvedCartKey = cartKey ?? buildCheckoutCartKey(cartItems)
  const quoteParams = quoteParamsForPaymentMethod(paymentMethod)
  const paymentKey = `${quoteParams.paymentMethodHint}:${quoteParams.paymentPlan}:${quoteParams.balanceCollection}`

  void queryClient.prefetchQuery({
    queryKey: checkoutKeys.settings(),
    queryFn: ({ signal }) => getCheckoutSettings({ signal }),
    staleTime: CHECKOUT_SETTINGS_STALE_MS,
  })

  void queryClient.prefetchQuery({
    queryKey: checkoutKeys.quote(id, couponCode, resolvedCartKey, paymentKey),
    queryFn: ({ signal }) => createCheckoutQuote({
      addressId: id,
      couponCode,
      ...quoteParams,
      signal,
    }),
    staleTime: CHECKOUT_QUOTE_STALE_MS,
  })
}

export function buildCheckoutCartKey(cartItems = []) {
  return cartItems
    .map((item) => `${item.id}:${item.quantity}:${item.variantId || ''}:${item.price ?? ''}`)
    .join('|')
}

/**
 * Sync server cart, bust quote cache, and POST a brand-new quote.
 * Use before confirm so quoteId matches live server pricing.
 */
export async function fetchFreshCheckoutQuote({
  queryClient,
  addressId,
  couponCode,
  paymentMethod = 'prepaid',
  replaceCartFromApi,
} = {}) {
  if (replaceCartFromApi) {
    try {
      const cart = await getCart()
      replaceCartFromApi(cart)
    } catch {
      // Continue — quote API reads server cart directly
    }
  }

  const id = String(addressId || '').trim()
  const cartKey = buildCheckoutCartKey(useAppStore.getState().cartItems)
  const quoteParams = quoteParamsForPaymentMethod(paymentMethod)
  const paymentKey = `${quoteParams.paymentMethodHint}:${quoteParams.paymentPlan}:${quoteParams.balanceCollection}`
  const queryKey = checkoutKeys.quote(id, couponCode, cartKey, paymentKey)

  // Cancel in-flight quote fetches (removeQueries would trigger useCheckoutQuote to create a second quote).
  await queryClient.cancelQueries({ queryKey: checkoutKeys.all })

  const quote = await createCheckoutQuote({
    addressId: id,
    couponCode,
    ...quoteParams,
  })

  queryClient.setQueryData(queryKey, quote)
  return quote
}

export function useCheckoutSettings({ enabled = true } = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: checkoutKeys.settings(),
    queryFn: ({ signal }) => getCheckoutSettings({ signal }),
    enabled: enabled && isAuthenticated && Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Auto-quote when addressId is present.
 * paymentMethod drives paymentMethodHint for server-side totals.
 */
export function   useCheckoutQuote({
  addressId,
  couponCode,
  cartKey,
  paymentMethod = 'prepaid',
  enabled = true,
} = {}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const accessToken = useAppStore((s) => s.accessToken)
  const id = String(addressId || '').trim()
  const quoteParams = quoteParamsForPaymentMethod(paymentMethod)
  const paymentKey = `${quoteParams.paymentMethodHint}:${quoteParams.paymentPlan}:${quoteParams.balanceCollection}`

  return useQuery({
    queryKey: checkoutKeys.quote(id, couponCode, cartKey, paymentKey),
    queryFn: ({ signal }) => createCheckoutQuote({
      addressId: id,
      couponCode,
      ...quoteParams,
      signal,
    }),
    enabled: enabled && isAuthenticated && Boolean(accessToken) && Boolean(id),
    staleTime: CHECKOUT_QUOTE_STALE_MS,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useRazorpayKey({ enabled = false } = {}) {
  return useQuery({
    queryKey: checkoutKeys.razorpayKey(),
    queryFn: ({ signal }) => getRazorpayKey({ signal }),
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })
}

export function useConfirmCheckout() {
  return useMutation({
    mutationFn: confirmCheckoutQuote,
  })
}

export function useCreateOrderFromConfirm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args) => createOrder(args),
    onSuccess: (result) => {
      // Online orders consume the server cart until payment completes or is abandoned.
      // Invalidating checkout/cart here races with Razorpay and triggers CART_EMPTY quotes.
      if (isCodPlacedOrder(result)) {
        queryClient.invalidateQueries({ queryKey: checkoutKeys.all })
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    },
  })
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyRazorpayPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkoutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useAbandonOnlineCheckout() {
  return useMutation({
    mutationFn: abandonOnlineCheckout,
  })
}
