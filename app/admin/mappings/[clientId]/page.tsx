import { requireRole } from "@/lib/auth-guards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimeSheetsMapping } from "@/components/mappings/TimeSheetsMapping"
import { PayrollMapping } from "@/components/mappings/PayrollMapping"
import { InvoicingMapping } from "@/components/mappings/InvoicingMapping"

export default async function ClientMappingEditorPage({
  params,
}: {
  params: { clientId: string }
}) {
  await requireRole(["admin"])

  const clientId = Number.parseInt(params.clientId)

  // Mock client data
  const clients = [
    { id: 1, name: "Lehigh Valley Health Network", code: "LVHN" },
    { id: 2, name: "Arkansas Children's", code: "ARCHI" },
    { id: 3, name: "University of Louisville", code: "ULOU" },
  ]

  const client = clients.find((c) => c.id === clientId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-foreground leading-tight">Field Mapping Editor</h1>
        <p className="text-muted-foreground">
          {client?.name} ({client?.code})
        </p>
      </div>

      <Tabs defaultValue="timesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timesheets">Time Sheets</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets" className="space-y-4">
          <TimeSheetsMapping clientId={clientId} />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollMapping clientId={clientId} />
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-4">
          <InvoicingMapping clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
