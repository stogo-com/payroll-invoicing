import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

interface AuditLogData {
  actorUserId?: string
  action: string
  entityType: string
  entityId?: string
  details?: any
}

export async function createAuditLog(data: AuditLogData) {
  const headersList = headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip")
  const userAgent = headersList.get("user-agent")

  return prisma.auditLog.create({
    data: {
      ...data,
      ip,
      userAgent,
    },
  })
}

export async function logAuditEvent(data: {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  details?: any
}) {
  const headersList = headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip")
  const userAgent = headersList.get("user-agent")

  return prisma.auditLog.create({
    data: {
      actorUserId: data.userId,
      action: data.action,
      entityType: data.resourceType,
      entityId: data.resourceId,
      details: data.details,
      ip,
      userAgent,
    },
  })
}
