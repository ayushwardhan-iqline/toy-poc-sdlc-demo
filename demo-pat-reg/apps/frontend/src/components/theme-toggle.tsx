import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ICON_STROKE_WIDTH } from "@/lib/shadcn/constants"

type ThemeMode = "light" | "dark"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<ThemeMode>("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setTheme("light")
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) {
      return
    }

    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [mounted, theme])

  const icon = theme === "dark"
    ? <Moon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
    : <Sun strokeWidth={ICON_STROKE_WIDTH} className="size-4" />

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Toggle theme" />}
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun strokeWidth={ICON_STROKE_WIDTH} className="mr-2 size-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon strokeWidth={ICON_STROKE_WIDTH} className="mr-2 size-4" />
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}




