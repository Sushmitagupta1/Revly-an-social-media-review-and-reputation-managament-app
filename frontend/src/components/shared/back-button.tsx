import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  to?: string
  className?: string
}

export default function BackButton({ to, className = "" }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  )
}
