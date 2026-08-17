export const loyaltyKeys = {
  all: ['loyalty'],
  status: () => [...loyaltyKeys.all, 'status'],
  rewards: () => [...loyaltyKeys.all, 'rewards'],
}
