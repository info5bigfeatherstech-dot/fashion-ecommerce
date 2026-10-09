export const addressKeys = {
  all: ['addresses'],
  list: (userId) => [...addressKeys.all, 'list', String(userId || '')],
}
