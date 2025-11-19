import { requireRole } from "@/lib/auth-guards"
import Link from "next/link"

export default async function AdminMappingsPage() {
  await requireRole(["admin"])

  // Mock client data
  const clients = [
    {
      id: 1,
      name: "Lehigh Valley Health Network",
      code: "LVHN",
      status: "Active",
      lastUpdated: "2025-10-24",
    },
    {
      id: 2,
      name: "Arkansas Children's",
      code: "ARCHI",
      status: "Active",
      lastUpdated: "2025-10-24",
    },
    {
      id: 3,
      name: "University of Louisville",
      code: "ULOU",
      status: "Active",
      lastUpdated: "2025-10-24",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground leading-tight">Client Mappings</h1>
          <p className="text-muted-foreground">Manage data transformation mappings for each client</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Add New Client
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">All Clients</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Updated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground">{client.name}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{client.code}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{client.lastUpdated}</td>
                    <td className="py-3 px-4 text-sm">
                      <Link
                        href={`/admin/mappings/${client.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                      >
                        Manage Mappings
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
