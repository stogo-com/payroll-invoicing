"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InboundMappingTable } from "./InboundMappingTable"
import { OutboundMappingTable } from "./OutboundMappingTable"
import { useMappings } from "@/hooks/useMappings"

interface TimesheetTabsProps {
  networkId: string
}

export function TimesheetTabs({ networkId }: TimesheetTabsProps) {
  const { data, createMapping, updateMapping, deleteMapping } = useMappings(networkId, "timesheet")

  return (
    <Tabs defaultValue="inbound" className="w-full">
      <TabsList>
        <TabsTrigger value="inbound">Inbound</TabsTrigger>
        <TabsTrigger value="outbound">Outbound</TabsTrigger>
      </TabsList>
      <TabsContent value="inbound" className="space-y-4">
        <InboundMappingTable data={data} onCreate={createMapping} onUpdate={updateMapping} onDelete={deleteMapping} />
      </TabsContent>
      <TabsContent value="outbound" className="space-y-4">
        <OutboundMappingTable data={data} onCreate={createMapping} onUpdate={updateMapping} onDelete={deleteMapping} />
      </TabsContent>
    </Tabs>
  )
}
