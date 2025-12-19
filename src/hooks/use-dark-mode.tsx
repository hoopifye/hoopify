"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useDarkMode() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and hydration, we can't know the theme, so we return false
  // or you could return undefined if you want to handle the loading state
  if (!mounted) {
    return false
  }

  return resolvedTheme === "dark"
}
