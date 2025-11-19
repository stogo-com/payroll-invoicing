"use client"

import { useState } from "react"
import { Settings2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WidgetConfig {
  id: string
  title: string
  visible: boolean
}

interface DashboardCustomizerProps {
  widgets: WidgetConfig[]
  onWidgetsChange: (widgets: WidgetConfig[]) => void
}

export function DashboardCustomizer({ widgets, onWidgetsChange }: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (widgetId: string) => {
    const updated = widgets.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    onWidgetsChange(updated)
  }

  const visibleCount = widgets.filter((w) => w.visible).length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Show or hide widgets on your dashboard. {visibleCount} of {widgets.length} widgets visible.
          </DialogDescription>
        </DialogHeader>
        <CardContent className="space-y-3 pt-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="flex items-center space-x-3">
              <Checkbox
                id={widget.id}
                checked={widget.visible}
                onCheckedChange={() => handleToggle(widget.id)}
              />
              <Label
                htmlFor={widget.id}
                className="flex-1 cursor-pointer flex items-center justify-between"
              >
                <span>{widget.title}</span>
                {widget.visible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Label>
            </div>
          ))}
        </CardContent>
      </DialogContent>
    </Dialog>
  )
}

