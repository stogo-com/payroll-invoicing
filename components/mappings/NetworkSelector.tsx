"use client"

import type { Network } from "@/types/mapping"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const NETWORKS: Network[] = [
  { id: "13", name: "Lehigh Valley" },
  { id: "16", name: "Willis Knighton" },
  { id: "18", name: "Baptist Arkansas" },
  { id: "19", name: "UofL" },
  { id: "29", name: "Arkansas Childrens" },
  { id: "30", name: "Shannon Health" },
]

interface NetworkSelectorProps {
  value: string | null
  onChange: (value: string) => void
}

export function NetworkSelector({ value, onChange }: NetworkSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Network:</label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a network" />
        </SelectTrigger>
        <SelectContent>
          {NETWORKS.map((network) => (
            <SelectItem key={network.id} value={network.id}>
              {network.id} - {network.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
