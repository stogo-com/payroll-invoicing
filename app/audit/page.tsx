import { requireRole } from "@/lib/auth-guards"
import { AuditLog } from "@/components/admin/audit-log"

export default async function AuditPage() {
  await requireRole(["admin"])

  return <AuditLog />
}
