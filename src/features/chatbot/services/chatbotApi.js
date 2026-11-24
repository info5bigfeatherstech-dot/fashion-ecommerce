const BASE_URL = '/api/chatbot';

export function getActiveChatLanguage() {
  try {
    return localStorage.getItem('chat_preferred_lang') || 'en';
  } catch {
    return 'en';
  }
}

async function fetchJson(url, options = {}) {
  const currentLang = getActiveChatLanguage();
  const sep = url.includes('?') ? '&' : '?';
  const urlWithLang = url.includes('lang=') ? url : `${url}${sep}lang=${encodeURIComponent(currentLang)}`;

  const response = await fetch(urlWithLang, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-chat-lang': currentLang,
      ...(options.headers || {}),
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
  getWelcome: (lang) => fetchJson(lang ? `${BASE_URL}/welcome?lang=${lang}` : `${BASE_URL}/welcome`),
  getCategoryQuestions: (categoryKey, lang) => fetchJson(lang ? `${BASE_URL}/category/${categoryKey}?lang=${lang}` : `${BASE_URL}/category/${categoryKey}`),
  getAnswer: (questionId, lang) =>
    fetchJson(`${BASE_URL}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, lang: lang || getActiveChatLanguage() }),
    }),
  trackOrder: (query, lang) =>
    fetchJson(`${BASE_URL}/track-order`, {
      method: 'POST',
      body: JSON.stringify({ query, lang: lang || getActiveChatLanguage() }),
    }),
  getUserOrders: (params = {}) =>
    fetchJson(`${BASE_URL}/user-orders`, {
      method: 'POST',
      body: JSON.stringify({ lang: getActiveChatLanguage(), ...params }),
    }),
  getBestSellers: (lang) => fetchJson(lang ? `${BASE_URL}/best-sellers?lang=${lang}` : `${BASE_URL}/best-sellers`),
  getCoupons: (lang) => fetchJson(lang ? `${BASE_URL}/coupons?lang=${lang}` : `${BASE_URL}/coupons`),
  getCheaperProducts: (lang) => fetchJson(lang ? `${BASE_URL}/cheaper-products?lang=${lang}` : `${BASE_URL}/cheaper-products`),
  getExpensiveProducts: (lang) => fetchJson(lang ? `${BASE_URL}/expensive-products?lang=${lang}` : `${BASE_URL}/expensive-products`),
  checkPincode: (payload, lang) =>
    fetchJson(`${BASE_URL}/check-pincode`, {
      method: 'POST',
      body: JSON.stringify({
        lang: lang || getActiveChatLanguage(),
        ...(typeof payload === 'string' ? { pincode: payload } : (payload || {})),
      }),
    }),
  checkReturnRefund: (payload, lang) =>
    fetchJson(`${BASE_URL}/check-return-refund`, {
      method: 'POST',
      body: JSON.stringify({
        lang: lang || getActiveChatLanguage(),
        ...(typeof payload === 'string' ? { query: payload } : (payload || {})),
      }),
    }),
  getExchangeInquiry: (payload, lang) =>
    fetchJson(`${BASE_URL}/exchange-inquiry`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage(), ...(payload || {}) }),
    }),
  getCodRefundInfo: (lang) =>
    fetchJson(`${BASE_URL}/cod-refund-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getPartialPaymentInfo: (lang) =>
    fetchJson(`${BASE_URL}/partial-payment-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getFreeShippingInfo: (lang) =>
    fetchJson(`${BASE_URL}/free-shipping-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getEmiInfo: (lang) =>
    fetchJson(`${BASE_URL}/emi-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getPaymentSafetyInfo: (lang) =>
    fetchJson(`${BASE_URL}/payment-safety-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getGstInvoiceInfo: (payload, lang) =>
    fetchJson(`${BASE_URL}/gst-invoice-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage(), ...(payload || {}) }),
    }),
  browseCategories: (payload, lang) =>
    fetchJson(`${BASE_URL}/browse-categories`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage(), ...(payload || {}) }),
    }),
  getJewelryCareInfo: (lang) =>
    fetchJson(`${BASE_URL}/jewelry-care`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getGiftPackagingInfo: (lang) =>
    fetchJson(`${BASE_URL}/gift-packaging`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  getHypoallergenicInfo: (lang) =>
    fetchJson(`${BASE_URL}/hypoallergenic-info`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage() }),
    }),
  submitTicket: (payload, lang) =>
    fetchJson(`${BASE_URL}/ticket`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage(), ...(payload || {}) }),
    }),
  checkDeliveryDispute: (payload, lang) =>
    fetchJson(`${BASE_URL}/delivery-dispute-check`, {
      method: 'POST',
      body: JSON.stringify({
        lang: lang || getActiveChatLanguage(),
        ...(typeof payload === 'string' ? { orderId: payload } : (payload || {})),
      }),
    }),
  raiseDeliveryTicket: (payload, lang) =>
    fetchJson(`${BASE_URL}/raise-delivery-ticket`, {
      method: 'POST',
      body: JSON.stringify({ lang: lang || getActiveChatLanguage(), ...(payload || {}) }),
    }),
  sendGeneralQuery: (query, lang) =>
    fetchJson(`${BASE_URL}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, lang: lang || getActiveChatLanguage() }),
    }),
};

