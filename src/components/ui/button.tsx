import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-accent via-accent-hover to-accent bg-[length:200%_100%] text-text-inverse shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:bg-[position:100%_0] hover:shadow-[0_8px_40px_rgba(251,191,36,0.6),0_0_60px_rgba(251,191,36,0.3)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-red-500 via-rose-500 to-red-500 bg-[length:200%_100%] text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:bg-[position:100%_0] hover:shadow-[0_8px_40px_rgba(239,68,68,0.6)] hover:-translate-y-0.5",
        outline:
          "border-2 border-accent/50 bg-transparent text-accent hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_30px_rgba(251,191,36,0.3),inset_0_0_20px_rgba(251,191,36,0.1)]",
        secondary:
          "bg-gradient-to-br from-bg-tertiary to-bg-secondary text-text-primary border border-border/50 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:-translate-y-0.5",
        ghost:
          "text-text-secondary hover:bg-accent/10 hover:text-accent hover:shadow-[inset_0_0_20px_rgba(251,191,36,0.1)]",
        link:
          "text-accent underline-offset-4 hover:underline hover:text-accent-hover",
        neon:
          "border-2 border-accent bg-transparent text-accent shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:bg-accent hover:text-text-inverse hover:shadow-[0_0_40px_rgba(251,191,36,0.6),0_0_80px_rgba(251,191,36,0.3)]",
        glass:
          "bg-white/5 backdrop-blur-xl border border-white/10 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)]",
        premium:
          "bg-gradient-to-r from-accent via-amber-400 to-accent bg-[length:200%_100%] text-text-inverse shadow-[0_4px_30px_rgba(251,191,36,0.5)] hover:bg-[position:100%_0] hover:shadow-[0_8px_50px_rgba(251,191,36,0.7),0_0_100px_rgba(251,191,36,0.3)] hover:-translate-y-1 hover:scale-[1.03]",
        cyber:
          "bg-gradient-to-r from-neon-purple via-neon-pink to-neon-purple bg-[length:200%_100%] text-white shadow-[0_4px_30px_rgba(168,85,247,0.5)] hover:bg-[position:100%_0] hover:shadow-[0_8px_50px_rgba(236,72,153,0.6)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {/* Ripple effect layer */}
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="absolute top-1/2 left-1/2 w-0 h-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 group-hover:w-[500px] group-hover:h-[500px] transition-all duration-700 ease-out" />
          </span>
        </span>

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}

        {/* Content */}
        <span className={cn("relative z-10 flex items-center gap-2", loading && "opacity-0")}>
          {children}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
