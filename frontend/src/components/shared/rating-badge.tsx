import { cn } from "@/lib/utils"

const ratingColors: Record<number, string> = {
  5: "bg-success text-white",
  4: "bg-[#5AC8FA] text-white",
  3: "bg-warning text-white",
  2: "bg-[#FF8A3D] text-white",
  1: "bg-danger text-white",
}

interface Props {
  rating: number
  size?: "sm" | "md" | "lg"
}

export default function RatingBadge({ rating, size = "md" }: Props) {
  const rounded = Math.round(rating)
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        ratingColors[rounded] || "bg-gray-400 text-white",
        size === "sm" && "h-6 w-6 text-xs",
        size === "md" && "h-8 w-8 text-sm",
        size === "lg" && "h-10 w-10 text-base"
      )}
    >
      {rating.toFixed(1)}
    </span>
  )
}
