"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldMappingEditor } from "@/components/mappings/FieldMappingEditor"
import { ForeignEmployeeMapEditor } from "@/components/mappings/ForeignEmployeeMapEditor"
import type { Client } from "@/types/mapping"

export default function ClientMappingPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/mappings/clients/${clientId}`)
      const data = await response.json()
      setClient(data)
    } catch (error) {
      console.error("Failed to fetch client:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex-1 p-8">Loading...</div>
  }

  if (!client) {
    return <div className="flex-1 p-8">Client not found</div>
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-[30px] font-semibold text-foreground leading-tight">{client.name}</h1>
        <p className="text-muted-foreground">Manage field mappings and employee ID mappings for {client.name}</p>
      </div>

      <Tabs defaultValue="field-mappings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="field-mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="employee-mappings">Foreign Employee Map</TabsTrigger>
        </TabsList>

        <TabsContent value="field-mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Editor</CardTitle>
              <CardDescription>
                Configure how source fields from {client.name} CSV files map to target fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldMappingEditor clientId={clientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employee-mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Foreign Employee Map</CardTitle>
              <CardDescription>Map {client.name} employee IDs to internal employee IDs</CardDescription>
            </CardHeader>
            <CardContent>
              <ForeignEmployeeMapEditor clientId={clientId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
