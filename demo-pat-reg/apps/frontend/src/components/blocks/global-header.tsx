import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/shadcn/utils"
import { ICON_STROKE_WIDTH } from "@/lib/shadcn/constants"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Settings, LogOut } from "lucide-react"
import { generateBreadcrumbs, getRouteLabel, type BreadcrumbItem as BreadcrumbItemType } from "@/lib/navigation"
import { NotificationPanel } from "@/components/blocks/notification-panel"
import { CommandPaletteTrigger } from "@/components/blocks/command-palette"

interface GlobalHeaderProps {
  breadcrumbs?: BreadcrumbItemType[]
  onLogout?: () => void
  userName?: string
  userEmail?: string
  userAvatar?: string
  onCommandPaletteOpen?: () => void
}

export function GlobalHeader({
  breadcrumbs,
  onLogout,
  userName = "John Doe",
  userEmail = "john@example.com",
  userAvatar,
  onCommandPaletteOpen,
}: GlobalHeaderProps) {
  const location = useLocation()

  const getBreadcrumbs = React.useMemo(
    () => generateBreadcrumbs(location.pathname, breadcrumbs),
    [breadcrumbs, location.pathname]
  )

  // Current page label for mobile
  const currentPageLabel = React.useMemo(
    () => getRouteLabel(location.pathname),
    [location.pathname]
  )

  const handleLogout = () => {
    onLogout?.()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-10 items-center gap-2 px-4">
        {/* Left Side - Sidebar Trigger & Breadcrumbs */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="self-stretch" />

          {/* Desktop breadcrumb */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {getBreadcrumbs.map((item, index) => {
                const isLast = index === getBreadcrumbs.length - 1
                return (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {isLast || !item.href ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link to={item.href} />}>
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile: show current page title only */}
          <span className="md:hidden text-sm font-medium truncate">{currentPageLabel}</span>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-1">
          {onCommandPaletteOpen !== undefined && (
            <>
              <CommandPaletteTrigger onClick={onCommandPaletteOpen} />
              <Separator orientation="vertical" className="self-stretch mx-1" />
            </>
          )}

          {/* Notifications */}
          <NotificationPanel />

          <Separator orientation="vertical" className="self-stretch mx-1" />

          {/* Theme Toggle */}
          <ThemeToggle />

          <Separator orientation="vertical" className="self-stretch mx-1" />

          {/* Settings shortcut */}
          <button
            type="button"
            aria-label="Settings"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Settings strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
          </button>

          <Separator orientation="vertical" className="self-stretch mx-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="flex items-center gap-2 h-9 px-2" />}
            >
              <Avatar className="size-7">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-xs">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium max-w-[120px] truncate">
                {userName}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

