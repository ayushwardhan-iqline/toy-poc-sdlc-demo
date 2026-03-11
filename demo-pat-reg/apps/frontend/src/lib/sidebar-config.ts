import type { LucideIcon } from "lucide-react"
import { Home } from "lucide-react"

/**
 * Sidebar Navigation Item Type
 */
export interface SidebarItem {
  /** Display label for the menu item */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Navigation href (optional - items without href are non-clickable) */
  href?: string
  /** Optional badge text (e.g., "New", "3") */
  badge?: string
  /** Optional roles that can see this item (empty = all roles) */
  roles?: string[]
  /** Optional flag to mark item as disabled */
  disabled?: boolean
  /** Optional child items for nested/collapsible navigation */
  children?: SidebarItem[]
}

/**
 * Sidebar Group Type
 */
export interface SidebarGroup {
  /** Group label displayed above items */
  label: string
  /** Items in this group */
  items: SidebarItem[]
  /** Optional roles that can see this group */
  roles?: string[]
}

/**
 * Grouped sidebar navigation — consumed by GlobalSidebar
 */
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Home", icon: Home, href: "/" },
    ],
  },
]

/**
 * Flat list of all sidebar items (used for breadcrumb lookups, etc.)
 */
export const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_GROUPS.flatMap((g) =>
  g.items.flatMap((item) => [item, ...(item.children ?? [])])
)

/**
 * Helper: filter sidebar groups by user role
 */
export function filterSidebarGroupsByRole(
  groups: SidebarGroup[],
  userRole?: string
): SidebarGroup[] {
  if (!userRole) return groups

  return groups
    .filter((group) => {
      if (!group.roles || group.roles.length === 0) return true
      return group.roles.includes(userRole)
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(userRole)
      }),
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * Helper: filter sidebar items by user role (kept for backwards compatibility)
 */
export function filterSidebarItemsByRole(items: SidebarItem[], userRole?: string): SidebarItem[] {
  if (!userRole) return items
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.includes(userRole)
  })
}
