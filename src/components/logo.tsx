"use client"

import { useDarkMode } from "@/hooks/use-dark-mode"

export function Logo({ square }: { square?: boolean }) {
  const isDarkMode = useDarkMode()

  if (square) {
    return (
      <img
        src="/logo.ico"
        alt="Hoopify"
        className="h-8 w-auto"
      />
    )
  }

  return (
    <img
      src={isDarkMode ? "/banner2.ico" : "/banner1.ico"}
      alt="Hoopifye"
      className="h-8 w-auto"
    />
  )
}
