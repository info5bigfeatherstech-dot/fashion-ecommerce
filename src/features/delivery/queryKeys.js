export const deliveryKeys = {
  all: ['delivery'],
  check: (pincode) => [...deliveryKeys.all, 'check', String(pincode || '')],
  charges: (pincode, weight) => [...deliveryKeys.all, 'charges', String(pincode || ''), Number(weight) || 1],
}
