"use client"

import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { useSyncExternalStore } from "react"

type Theme = "system" | "light" | "dark"

const KEY = "theme"
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// The layout's inline script sets data-theme before paint, so the attribute is the source of truth.
function getTheme(): Theme {
  const value = document.documentElement.dataset.theme
  return value === "light" || value === "dark" ? value : "system"
}

function setTheme(theme: Theme) {
  if (theme === "system") delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  try {
    if (theme === "system") localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {}
  listeners.forEach((listener) => listener())
}

function ThemeControl() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system")

  return (
    <SegmentedControl
      aria-label="Theme"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value as Theme)
      }}
    >
      <SegmentedControlIndicator />
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  )
}

export { ThemeControl }
