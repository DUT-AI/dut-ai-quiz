"use client"

import { useThemeStore } from "@/store/theme-store"
import { Toaster as RadixToaster } from "sonner"

type ToasterProps = React.ComponentProps<typeof RadixToaster>

const Toaster = ({ ...props }: ToasterProps) => {
  const { darkMode } = useThemeStore()
  const theme = darkMode ? "dark" : "light"

  return (
    <RadixToaster
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
