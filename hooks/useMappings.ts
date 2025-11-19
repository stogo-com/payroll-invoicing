"use client"

import { useState, useEffect } from "react"
import type { FieldMapping, MappingType } from "@/types/mapping"

export function useMappings(networkId: string | null, type: MappingType) {
  const [data, setData] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (networkId) {
      fetchMappings()
    }
  }, [networkId, type])

  const fetchMappings = async () => {
    setLoading(true)
    // Mock API call - replace with actual API
    setTimeout(() => {
      setData(getMockMappings(type))
      setLoading(false)
    }, 500)
  }

  const createMapping = async (mapping: Omit<FieldMapping, "id">) => {
    const newMapping = { ...mapping, id: Date.now().toString() }
    setData([...data, newMapping])
    return newMapping
  }

  const updateMapping = async (id: string, updates: Partial<FieldMapping>) => {
    setData(data.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const deleteMapping = async (id: string) => {
    setData(data.filter((m) => m.id !== id))
  }

  return { data, loading, createMapping, updateMapping, deleteMapping, refetch: fetchMappings }
}

function getMockMappings(type: MappingType): FieldMapping[] {
  if (type === "timesheet") {
    return [
      {
        id: "1",
        fieldName: "Employee ID",
        dataType: "string",
        format: "",
        order: 1,
        direction: "inbound",
        validationRules: [
          {
            id: "v1",
            fieldName: "Employee ID",
            ruleType: "required",
            errorMessage: "Employee ID is required",
          },
        ],
      },
      {
        id: "2",
        fieldName: "Clock In Time",
        dataType: "datetime",
        format: "MM/DD/YYYY HH:mm",
        order: 2,
        direction: "inbound",
        validationRules: [],
      },
    ]
  }
  return []
}
