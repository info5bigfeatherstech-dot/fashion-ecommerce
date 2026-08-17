const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export async function login(credentials) {
  await delay()
  if (credentials.email && credentials.password) {
    const user = {
      id: 'u1',
      email: credentials.email,
      firstName: 'Alex',
      lastName: 'Chen',
    }
    localStorage.setItem('verao_token', 'mock-jwt-token')
    localStorage.setItem('verao_user', JSON.stringify(user))
    return user
  }
  throw new Error('Invalid credentials')
}

export async function register(data) {
  await delay()
  const user = {
    id: 'u1',
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
  }
  localStorage.setItem('verao_token', 'mock-jwt-token')
  localStorage.setItem('verao_user', JSON.stringify(user))
  return user
}

export async function logout() {
  await delay(100)
  localStorage.removeItem('verao_token')
  localStorage.removeItem('verao_user')
}

export function getStoredUser() {
  const raw = localStorage.getItem('verao_user')
  return raw ? JSON.parse(raw) : null
}
