export interface AuthUser {
  email: string
  name: string
  role: 'admin' | 'demo'
}

const CREDENTIALS = [
  { email: 'admin@carbfood.id', password: 'admin123', name: 'Admin', role: 'admin' as const },
]

const STORAGE_KEY = 'carbfood_user'

export function login(email: string, password: string, remember: boolean): AuthUser | null {
  const found = CREDENTIALS.find((u) => u.email === email && u.password === password)
  if (!found) return null
  const user: AuthUser = { email: found.email, name: found.name, role: found.role }
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function loginDemo(remember: boolean): AuthUser {
  const user: AuthUser = { email: 'demo@carbfood.id', name: 'Demo', role: 'demo' }
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function getUser(): AuthUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)
    return data ? (JSON.parse(data) as AuthUser) : null
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}
