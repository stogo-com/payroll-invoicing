export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface Session {
  user: User
}

const mockSession: Session = {
  user: {
    id: "1",
    email: "admin@stogo.com",
    name: "Demo Admin",
    role: "admin",
  },
}

export async function requireAuth() {
  return mockSession
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Insufficient permissions")
  }
  return session
}

export function withAuth<T extends any[]>(handler: (...args: T) => Promise<any>, allowedRoles?: string[]) {
  return async (...args: T) => {
    const session = allowedRoles ? await requireRole(allowedRoles) : await requireAuth()
    return handler(...args)
  }
}
