import { NotificationPanelShell } from "@/design-system/defaults/notifications/notification-panel-shell"
import {
  DEFAULT_HEADER_NOTIFICATIONS,
  type Notification,
  type NotificationType,
} from "@/lib/notifications"

interface NotificationPanelProps {
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onNotificationClick?: (notification: Notification) => void
}

export type { Notification, NotificationType }

export function NotificationPanel({
  notifications = DEFAULT_HEADER_NOTIFICATIONS,
  onMarkAllRead,
  onNotificationClick,
}: NotificationPanelProps) {
  return (
    <NotificationPanelShell
      notifications={notifications}
      onMarkAllRead={onMarkAllRead}
      onNotificationClick={onNotificationClick}
    />
  )
}
