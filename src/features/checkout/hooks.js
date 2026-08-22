import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  abandonOnlineCheckout,
  confirmCheckoutQuote,
  createCheckoutQuote,
  createOrderFromConfirm,
  getCheckoutSettings,
  getRazorpayKey,
  verifyRazorpayPayment,
} from './api'
import { checkoutKeys } from './queryKeys'
import { quoteParamsForPaymentMethod } from './constants'
import { getCart } from '@/features/cart/api'
import { useAppStore } from '@/store'

/** Stable key for quote cache — includes price so pricing drift invalidates quotes. */
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

  await queryClient.removeQueries({ queryKey, exact: true })

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
    staleTime: 0,
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
    mutationFn: ({ next, idempotencyKey }) => createOrderFromConfirm(next, { idempotencyKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkoutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: abandonOnlineCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkoutKeys.all })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
