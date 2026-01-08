import { cookies } from 'next/headers'
import prisma from './prisma'

export type AdminUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  avatarUrl: string | null
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session_token')?.value

  if (!sessionToken) {
    return null
  }

  try {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Only allow ADMIN or SUPER_ADMIN roles (use string comparison for Prisma 7 driver adapter)
    const role = String(session.user.role).toUpperCase()
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      avatarUrl: session.user.avatarUrl,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export async function requireAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  return session
}

export async function requireSuperAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  const role = String(session?.role).toUpperCase()
  if (role !== 'SUPER_ADMIN') {
    return null
  }
  return session
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function createAdminSession(userId: string, ipAddress?: string, userAgent?: string) {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours for admin sessions

  await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
      ipAddress,
      userAgent,
    },
  })

  return { sessionToken, expiresAt }
}

export async function destroySession(sessionToken: string) {
  await prisma.userSession.delete({
    where: { sessionToken },
  }).catch(() => null)
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function logAdminActivity(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.adminActivityLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      ipAddress,
      userAgent,
    },
  })
}
