const BASE_URL = '/api/chatbot';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Network response was not ok');
  }
  return data;
}

export const chatbotApi = {
  getWelcome: () => fetchJson(`${BASE_URL}/welcome`),
  getCategoryQuestions: (categoryKey) => fetchJson(`${BASE_URL}/category/${categoryKey}`),
  getAnswer: (questionId) =>
    fetchJson(`${BASE_URL}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId }),
    }),
  trackOrder: (query) =>
    fetchJson(`${BASE_URL}/track-order`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  getUserOrders: (params = {}) =>
    fetchJson(`${BASE_URL}/user-orders`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getBestSellers: () => fetchJson(`${BASE_URL}/best-sellers`),
  getCoupons: () => fetchJson(`${BASE_URL}/coupons`),
  getCheaperProducts: () => fetchJson(`${BASE_URL}/cheaper-products`),
  getExpensiveProducts: () => fetchJson(`${BASE_URL}/expensive-products`),
  checkPincode: (payload) =>
    fetchJson(`${BASE_URL}/check-pincode`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { pincode: payload } : (payload || {})),
    }),
  checkReturnRefund: (payload) =>
    fetchJson(`${BASE_URL}/check-return-refund`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { query: payload } : (payload || {})),
    }),
  getExchangeInquiry: (payload) =>
    fetchJson(`${BASE_URL}/exchange-inquiry`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  getCodRefundInfo: () =>
    fetchJson(`${BASE_URL}/cod-refund-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getPartialPaymentInfo: () =>
    fetchJson(`${BASE_URL}/partial-payment-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getFreeShippingInfo: () =>
    fetchJson(`${BASE_URL}/free-shipping-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getEmiInfo: () =>
    fetchJson(`${BASE_URL}/emi-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getPaymentSafetyInfo: () =>
    fetchJson(`${BASE_URL}/payment-safety-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getGstInvoiceInfo: (payload) =>
    fetchJson(`${BASE_URL}/gst-invoice-info`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  browseCategories: (payload) =>
    fetchJson(`${BASE_URL}/browse-categories`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  getJewelryCareInfo: () =>
    fetchJson(`${BASE_URL}/jewelry-care`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getGiftPackagingInfo: () =>
    fetchJson(`${BASE_URL}/gift-packaging`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getHypoallergenicInfo: () =>
    fetchJson(`${BASE_URL}/hypoallergenic-info`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  submitTicket: (payload) =>
    fetchJson(`${BASE_URL}/ticket`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendGeneralQuery: (query) =>
    fetchJson(`${BASE_URL}/query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};

