import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "relative inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-accent to-accent-hover text-text-inverse shadow-[0_2px_15px_rgba(251,191,36,0.4)]",
        secondary:
          "border-border/50 bg-bg-tertiary/80 backdrop-blur-sm text-text-secondary hover:border-accent/30 hover:text-text-primary",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_2px_15px_rgba(239,68,68,0.4)]",
        outline:
          "border-accent/50 bg-transparent text-accent hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]",
        accent:
          "border-accent/30 bg-accent/10 text-accent shadow-[inset_0_0_10px_rgba(251,191,36,0.1)] hover:bg-accent/20",
        glass:
          "border-white/10 bg-white/5 backdrop-blur-xl text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
        earth:
          "border-element-earth/50 bg-gradient-to-r from-element-earth/20 to-emerald-500/20 text-element-earth shadow-[0_0_15px_rgba(34,197,94,0.3)]",
        water:
          "border-element-water/50 bg-gradient-to-r from-element-water/20 to-blue-400/20 text-element-water shadow-[0_0_15px_rgba(59,130,246,0.3)]",
        fire:
          "border-element-fire/50 bg-gradient-to-r from-element-fire/20 to-orange-500/20 text-element-fire shadow-[0_0_15px_rgba(239,68,68,0.3)]",
        wind:
          "border-element-wind/50 bg-gradient-to-r from-element-wind/20 to-yellow-400/20 text-element-wind shadow-[0_0_15px_rgba(234,179,8,0.3)]",
        normal:
          "border-grade-normal/30 bg-bg-tertiary/80 text-grade-normal",
        rare:
          "border-grade-rare/50 bg-gradient-to-r from-grade-rare/20 to-purple-400/20 text-grade-rare shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse-glow",
        hero:
          "border-transparent bg-gradient-to-r from-accent via-amber-400 to-accent bg-[length:200%_100%] text-text-inverse font-bold shadow-[0_0_25px_rgba(251,191,36,0.5)] animate-[gradient-shift_3s_ease_infinite]",
        premium:
          "border-accent/50 bg-gradient-to-r from-accent/20 via-amber-300/20 to-accent/20 text-accent font-bold shadow-[0_0_20px_rgba(251,191,36,0.3),inset_0_0_10px_rgba(251,191,36,0.1)]",
        cyber:
          "border-neon-purple/50 bg-gradient-to-r from-neon-purple/20 via-neon-pink/20 to-neon-purple/20 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        success:
          "border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-green-400/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        warning:
          "border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
        info:
          "border-sky-500/50 bg-gradient-to-r from-sky-500/20 to-cyan-400/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  glow?: boolean
  pulse?: boolean
}

function Badge({ className, variant, size, glow = false, pulse = false, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        glow && "shadow-[0_0_20px_currentColor]",
        pulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {/* Shine effect for premium variants */}
      {(variant === "hero" || variant === "premium") && (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute -inset-[100%] animate-[spin_4s_linear_infinite] opacity-30">
            <span className="absolute top-1/2 left-1/2 w-1/3 h-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-1/2 -translate-y-1/2" />
          </span>
        </span>
      )}
      <span className="relative z-10 inline-flex items-center">{props.children}</span>
    </div>
  )
}

export { Badge, badgeVariants }
