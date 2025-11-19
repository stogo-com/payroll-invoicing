"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimesheetTabs } from "./TimesheetTabs"
import { PayrollMappingsTable } from "./PayrollMappingsTable"
import { InvoicingMappingsTable } from "./InvoicingMappingsTable"

interface MappingsTabsProps {
  networkId: string
}

export function MappingsTabs({ networkId }: MappingsTabsProps) {
  return (
    <Tabs defaultValue="timesheets" className="w-full">
      <TabsList>
        <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
        <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
      </TabsList>
      <TabsContent value="timesheets" className="space-y-4">
        <TimesheetTabs networkId={networkId} />
      </TabsContent>
      <TabsContent value="payroll" className="space-y-4">
        <PayrollMappingsTable networkId={networkId} />
      </TabsContent>
      <TabsContent value="invoicing" className="space-y-4">
        <InvoicingMappingsTable networkId={networkId} />
      </TabsContent>
    </Tabs>
  )
}
