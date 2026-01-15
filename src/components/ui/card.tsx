import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "neon" | "elevated" | "premium" | "hero" | "gradient"
    hover?: boolean
    glow?: boolean
  }
>(({ className, variant = "default", hover = false, glow = false, ...props }, ref) => {
  const variants = {
    default: "bg-bg-secondary/80 backdrop-blur-sm border border-border/50",
    glass: "bg-glass-bg/60 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
    neon: "bg-bg-secondary/90 backdrop-blur-xl border-2 border-accent/50 shadow-[0_0_30px_rgba(251,191,36,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
    elevated: "bg-gradient-to-b from-bg-elevated/95 to-bg-secondary/95 backdrop-blur-xl border border-border/50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]",
    premium: "bg-gradient-to-br from-bg-elevated via-bg-secondary to-bg-tertiary border border-accent/20 shadow-[0_0_40px_rgba(251,191,36,0.15),0_20px_60px_-20px_rgba(0,0,0,0.6)]",
    hero: "relative overflow-hidden bg-gradient-to-br from-accent/10 via-bg-secondary to-neon-purple/10 border border-accent/30 shadow-[0_0_60px_rgba(251,191,36,0.2)]",
    gradient: "bg-gradient-to-br from-neon-purple/20 via-bg-secondary to-accent/20 border border-white/10 backdrop-blur-xl",
  }

  const hoverStyles = hover
    ? "hover:border-accent hover:shadow-[0_0_40px_rgba(251,191,36,0.4),0_25px_60px_-15px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:scale-[1.01] cursor-pointer"
    : ""

  const glowStyles = glow
    ? "animate-pulse-glow"
    : ""

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl text-text-primary transition-all duration-500 ease-out",
        variants[variant],
        hoverStyles,
        glowStyles,
        className
      )}
      {...props}
    >
      {/* Shine effect overlay */}
      {(variant === "premium" || variant === "hero") && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] opacity-20">
            <div className="absolute top-1/2 left-1/2 w-1/2 h-[500%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}
      {props.children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight",
      gradient
        ? "bg-gradient-to-r from-accent via-accent-hover to-accent bg-clip-text text-transparent"
        : "text-text-primary",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
