"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:border-slate-100 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans",
          title: "group-[.toast]:text-slate-800 group-[.toast]:font-medium",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:bg-teal-50 group-[.toaster]:border-teal-200 group-[.toaster]:text-teal-800 [&>svg]:text-teal-600",
          error:
            "group-[.toaster]:bg-amber-50 group-[.toaster]:border-amber-200 group-[.toaster]:text-amber-800 [&>svg]:text-amber-600",
          info: "group-[.toaster]:bg-slate-50 group-[.toaster]:border-slate-200 group-[.toaster]:text-slate-800 [&>svg]:text-slate-600",
          warning:
            "group-[.toaster]:bg-orange-50 group-[.toaster]:border-orange-200 group-[.toaster]:text-orange-800 [&>svg]:text-orange-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
