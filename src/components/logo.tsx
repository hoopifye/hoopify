"use client"

import { useDarkMode } from "@/hooks/use-dark-mode"

export function Logo() {
  const isDarkMode = useDarkMode()

  return (
    <img
      src={isDarkMode ? "/banner2.png" : "/banner1.png"}
      alt="Hoopifye"
      className="h-8 w-auto"
    />
  )
}
