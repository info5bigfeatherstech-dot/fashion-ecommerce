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

