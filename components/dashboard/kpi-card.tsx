import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: "up" | "down" | "neutral"
  }
  variant?: "default" | "success" | "warning" | "destructive"
}

export function KPICard({ title, value, change, variant = "default" }: KPICardProps) {
  const getTrendIcon = () => {
    if (!change) return null

    switch (change.trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />
      case "down":
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!change) return "text-muted-foreground"

    switch (change.trend) {
      case "up":
        return variant === "destructive" ? "text-destructive" : "text-green-600"
      case "down":
        return variant === "destructive" ? "text-green-600" : "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getValueColor = () => {
    switch (variant) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "destructive":
        return "text-destructive"
      default:
        return "text-primary"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          <span className={getValueColor()}>{value}</span>
        </div>
        {change && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">{change.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
