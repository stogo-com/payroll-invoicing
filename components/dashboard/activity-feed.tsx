import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Users, AlertTriangle } from "lucide-react"

interface ActivityItem {
  id: string
  type: "import" | "match" | "error" | "user"
  title: string
  description: string
  timestamp: string
  status?: "success" | "warning" | "error"
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "import",
    title: "CSV Import Completed",
    description: "UofL timesheets processed: 245 matched, 12 need review",
    timestamp: "2 minutes ago",
    status: "success",
  },
  {
    id: "2",
    type: "match",
    title: "Auto-Match Run",
    description: "Processed 89 pending records, 76 successfully matched",
    timestamp: "15 minutes ago",
    status: "success",
  },
  {
    id: "3",
    type: "error",
    title: "Processing Error",
    description: "Willis Knight file failed validation - invalid date format",
    timestamp: "1 hour ago",
    status: "error",
  },
  {
    id: "4",
    type: "user",
    title: "New User Added",
    description: "coordinator@willisknight.com added with Coordinator role",
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: "5",
    type: "import",
    title: "Bulk Timesheet Creation",
    description: "Created 156 timesheets for matched records",
    timestamp: "3 hours ago",
    status: "success",
  },
]

export function ActivityFeed() {
  const getIcon = (type: string) => {
    switch (type) {
      case "import":
        return <FileText className="h-4 w-4" />
      case "match":
        return <Clock className="h-4 w-4" />
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        )
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
              <div className="flex-shrink-0 mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
