import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

export interface PromptSuggestionProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

const PromptSuggestion = forwardRef<HTMLButtonElement, PromptSuggestionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

PromptSuggestion.displayName = "PromptSuggestion"

export { PromptSuggestion } 