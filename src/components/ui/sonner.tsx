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
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white group-[.toaster]:border-slate-100 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl font-sans border-0 !opacity-100",
          title: "group-[.toast]:text-[#0F4C75] group-[.toast]:font-black group-[.toast]:text-base tracking-tight",
          description: "group-[.toast]:text-slate-600 font-bold",
          actionButton:
            "group-[.toast]:bg-[#0F4C75] group-[.toast]:text-white group-[.toast]:font-black group-[.toast]:rounded-2xl px-6 py-2 transition-transform active:scale-95",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 font-bold px-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
