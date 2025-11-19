"use client"

import { useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface PayrollFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function PayrollFilters({ onFiltersChange }: PayrollFiltersProps) {
  const [network, setNetwork] = useState<string>("")

  const handleNetworkChange = (value: string) => {
    setNetwork(value)
    onFiltersChange?.({
      network: value,
    })
  }

  const clearFilters = () => {
    setNetwork("")
    onFiltersChange?.({
      network: "",
    })
  }

  const hasActiveFilters = network

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select value={network} onValueChange={handleNetworkChange}>
        <SelectTrigger className="w-60">
          <SelectValue placeholder="Network *" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="13">13 - Lehigh Valley</SelectItem>
          <SelectItem value="16">16 - Willis Knighton</SelectItem>
          <SelectItem value="18">18 - Baptist Arkansas</SelectItem>
          <SelectItem value="19">19 - UofL</SelectItem>
          <SelectItem value="21">21 - Parrish Medical Center</SelectItem>
          <SelectItem value="29">29 - Arkansas Childrens</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          {network && (
            <Badge variant="secondary">
              {network === "13" && "Lehigh Valley"}
              {network === "16" && "Willis Knighton"}
              {network === "18" && "Baptist Arkansas"}
              {network === "19" && "UofL"}
              {network === "21" && "Parrish Medical Center"}
              {network === "29" && "Arkansas Childrens"}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
