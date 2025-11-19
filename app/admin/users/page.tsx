import { requireRole } from "@/lib/auth-guards"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage() {
  await requireRole(["admin"])

  return <UserManagement />
}
