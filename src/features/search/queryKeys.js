export const searchKeys = {
  all: ['search'],
  query: (q, params = {}) => [...searchKeys.all, String(q || '').trim().toLowerCase(), params],
}
