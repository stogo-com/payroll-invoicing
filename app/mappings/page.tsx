export default function MappingsDashboard() {
  const clients = [
    { id: "1", name: "Lehigh Valley Health Network", code: "LVHN", status: "Active", updated: "10/24/2025" },
    { id: "2", name: "Arkansas Children's", code: "ARChildrens", status: "Active", updated: "10/24/2025" },
    { id: "3", name: "University of Louisville", code: "UofL", status: "Active", updated: "10/24/2025" },
  ]

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[30px] font-semibold text-foreground leading-tight">Client Mappings</h1>
          <p className="text-gray-600">Manage data transformation mappings for each client</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add New Client</button>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-2">All Clients</h2>
        <p className="text-gray-600 mb-4">Click on a client to manage their field mappings and employee ID mappings</p>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Client Name</th>
              <th className="text-left py-3 px-4">Client Code</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Last Updated</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{client.name}</td>
                <td className="py-3 px-4">{client.code}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{client.status}</span>
                </td>
                <td className="py-3 px-4">{client.updated}</td>
                <td className="py-3 px-4 text-right">
                  <a href={`/mappings/${client.id}`}>
                    <button className="px-3 py-1 border rounded hover:bg-gray-100">Manage Mappings</button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
