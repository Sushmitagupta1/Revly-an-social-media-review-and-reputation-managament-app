import { cn } from "@/lib/utils"

interface Props {
  value: string
  direction: "up" | "down"
  className?: string
}

export default function TrendIndicator({ value, direction, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        direction === "up" ? "text-success" : "text-danger",
        className
      )}
    >
      {direction === "up" ? "↑" : "↓"} {value}
    </span>
  )
}
