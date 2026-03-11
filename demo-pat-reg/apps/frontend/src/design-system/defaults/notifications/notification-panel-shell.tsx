import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, CheckCheck, Info, AlertTriangle, XCircle } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/shadcn/constants"
import { cn } from "@/lib/shadcn/utils"
import { formatDistanceToNow } from "date-fns"
import type { Notification, NotificationType } from "@/lib/notifications"

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-destructive",
}

interface NotificationPanelShellProps {
  notifications: Notification[]
  onMarkAllRead?: () => void
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationPanelShell({
  notifications: initialNotifications,
  onMarkAllRead,
  onNotificationClick,
}: NotificationPanelShellProps) {
  const [notifications, setNotifications] = React.useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onMarkAllRead?.()
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    onNotificationClick?.(notification)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
      >
        <Bell strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0 px-1 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck strokeWidth={ICON_STROKE_WIDTH} className="size-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type]
              const iconColor = NOTIFICATION_COLORS[notification.type]
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn("mt-0.5 shrink-0", iconColor)}>
                    <Icon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-muted-foreground hover:text-foreground">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
