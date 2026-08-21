import { useAppStore } from '@/store'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getMemberStatus() {
  await delay()
  const token = useAppStore.getState().accessToken
  if (!token) {
    return { isMember: false, points: 0, tier: null, nextTier: 'Member', pointsToNext: 500 }
  }
  return {
    isMember: true,
    points: 1240,
    tier: 'Insider',
    nextTier: 'Elite',
    pointsToNext: 760,
    memberSince: '2024-03-15',
  }
}

export async function getRewards() {
  await delay()
  return [
    { id: 'r1', title: '$10 Off', pointsCost: 200, description: 'Any purchase over $50' },
    { id: 'r2', title: 'Free Shipping', pointsCost: 150, description: 'One-time free shipping' },
    { id: 'r3', title: 'Exclusive Mini Set', pointsCost: 500, description: 'Skincare travel trio' },
    { id: 'r4', title: '$25 Off', pointsCost: 400, description: 'Any purchase over $100' },
    { id: 'r5', title: 'Birthday Gift', pointsCost: 0, description: 'Complimentary for members' },
  ]
}
