import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "underline" | "floating"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: cn(
      "inline-flex h-12 items-center justify-center rounded-2xl",
      "bg-bg-tertiary/50 backdrop-blur-sm p-1.5 text-text-secondary gap-1",
      "border border-border/30 animate-scale-in"
    ),
    pills: cn(
      "inline-flex items-center gap-2 p-1",
      "animate-slide-up"
    ),
    underline: cn(
      "inline-flex items-center gap-6 border-b border-border/30 pb-px",
      "animate-slide-down"
    ),
    floating: cn(
      "inline-flex items-center gap-2 p-2 rounded-2xl",
      "bg-bg-secondary/30 backdrop-blur-xl border border-white/5",
      "animate-scale-in"
    ),
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "underline" | "floating"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium",
      "ring-offset-bg-primary transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "text-text-muted hover:text-text-primary hover:scale-[1.02]",
      "data-[state=active]:text-text-primary data-[state=active]:bg-bg-elevated",
      "data-[state=active]:shadow-lg data-[state=active]:shadow-black/10",
      "data-[state=active]:scale-[1.02]",
      "active:scale-[0.98]"
    ),
    pills: cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium",
      "transition-all duration-300 ease-out overflow-hidden",
      "text-text-muted hover:text-text-primary hover:scale-105",
      "data-[state=active]:text-text-inverse",
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-amber-500",
      "data-[state=active]:shadow-lg data-[state=active]:shadow-accent/30",
      "data-[state=active]:scale-105",
      "before:absolute before:inset-0 before:rounded-full",
      "before:bg-gradient-to-r before:from-accent/0 before:via-white/20 before:to-accent/0",
      "before:translate-x-[-100%] before:transition-transform before:duration-500",
      "hover:before:translate-x-[100%]",
      "data-[state=active]:before:hidden",
      "active:scale-95"
    ),
    underline: cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap pb-3 text-sm font-medium",
      "transition-all duration-300",
      "text-text-muted hover:text-text-primary",
      "data-[state=active]:text-accent",
      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
      "after:bg-gradient-to-r after:from-accent after:to-amber-500",
      "after:scale-x-0 after:transition-transform after:duration-300 after:ease-out after:origin-left",
      "data-[state=active]:after:scale-x-100",
      "hover:after:scale-x-50 hover:after:opacity-50"
    ),
    floating: cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium",
      "transition-all duration-300 ease-out",
      "text-text-muted hover:text-text-primary hover:scale-[1.02]",
      "data-[state=active]:text-accent",
      "data-[state=active]:bg-accent/10 data-[state=active]:shadow-[inset_0_0_20px_rgba(251,191,36,0.1)]",
      "data-[state=active]:scale-[1.02]",
      "hover:bg-white/5",
      "active:scale-[0.98]"
    ),
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      animated && "data-[state=active]:animate-slide-up data-[state=inactive]:animate-fadeIn",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
