export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  timestamp: Date
  read: boolean
  href?: string
}

// App-owned notification sample data. Replace with API state when available.
export const DEFAULT_HEADER_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "info",
    title: "New project assigned",
    description: "This is a demo project with demo defaults setup.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  }
]
