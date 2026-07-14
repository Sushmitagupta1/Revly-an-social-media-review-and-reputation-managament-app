import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/overview")
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg p-4">
      <div className="w-full max-w-md rounded-[28px] bg-card p-8 shadow-2xl shadow-black/20 border border-white/5">
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="Revly" className="h-14 w-auto rounded-2xl object-contain" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-[13px] text-text-secondary">Sign in to your Revly account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[14px] bg-danger-bg p-3 text-[13px] text-danger">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-[14px] border border-border bg-card-secondary px-4 py-3 text-[14px] text-text placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-[14px] border border-border bg-card-secondary px-4 py-3 text-[14px] text-text placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent px-4 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-text-secondary">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-accent hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
