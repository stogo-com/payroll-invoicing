export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface Session {
  user: User
}

export const mockSession: Session = {
  user: {
    id: "1",
    email: "admin@stogo.com",
    name: "Demo Admin",
    role: "admin",
  },
}

export const authOptions = {
  // Mock auth options for demo mode
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
}

export function getSession(): Session | null {
  return mockSession
}

export function requireAuth(): Session {
  return mockSession
}

export function requireRole(allowedRoles: string[]): Session {
  const session = mockSession
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Insufficient permissions")
  }
  return session
}
