export const categoryKeys = {
  all: ['categories'],
  list: () => [...categoryKeys.all, 'list'],
  movingFast: () => [...categoryKeys.all, 'moving-fast'],
}
