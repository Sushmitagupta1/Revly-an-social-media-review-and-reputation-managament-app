import { useState } from "react"
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy } from "lucide-react"
import apiClient from "@/lib/api-client"

interface Props {
  onClose: () => void
}

export default function ZomatoConnectModal({ onClose }: Props) {
  const [step, setStep] = useState<"instructions" | "paste" | "connecting" | "success" | "error">("instructions")
  const [authToken, setAuthToken] = useState("")
  const [csrfToken, setCsrfToken] = useState("")
  const [mxCsrfToken, setMxCsrfToken] = useState("")
  const [cookies, setCookies] = useState("")
  const [restaurantIds, setRestaurantIds] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ message?: string; review_count?: number } | null>(null)

  const handleConnect = async () => {
    if (!authToken.trim()) return
    setLoading(true)
    setError("")
    setStep("connecting")
    try {
      const ids = restaurantIds.split(",").map((s) => s.trim()).filter(Boolean)
      const { data } = await apiClient.post("/zomato/connect", {
        auth_token: authToken.trim(),
        csrf_token: csrfToken.trim(),
        mx_csrf_token: mxCsrfToken.trim(),
        cookies: cookies.trim(),
        restaurant_ids: ids,
      })
      setResult(data)
      setStep("success")
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to connect. Check your tokens and try again.")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleFetchReviews = async () => {
    if (!authToken.trim() || !restaurantIds.trim()) return
    setLoading(true)
    setError("")
    try {
      const ids = restaurantIds.split(",").map((s) => s.trim()).filter(Boolean)
      const { data } = await apiClient.post("/zomato/fetch-reviews", {
        auth_token: authToken.trim(),
        csrf_token: csrfToken.trim(),
        mx_csrf_token: mxCsrfToken.trim(),
        cookies: cookies.trim(),
        restaurant_ids: ids,
      })
      setResult(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to fetch reviews.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#1A1A2E] p-8 shadow-2xl border border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E04F5F] text-[16px] font-bold text-white">Z</div>
            <span className="text-[16px] font-semibold text-white">Connect Zomato Partner Dashboard</span>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "instructions" && (
          <div className="space-y-5">
            <div className="rounded-[16px] bg-[#E04F5F]/10 border border-[#E04F5F]/20 p-4">
              <p className="text-[13px] text-[#E04F5F] font-medium mb-1">How it works</p>
              <p className="text-[12px] text-white/60">
                Zomato doesn't provide a public API for partners. We use your browser session to fetch reviews from your partner dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-medium text-white">Step 1: Open Zomato Partner Dashboard</p>
              <a href="https://www.zomato.com/partners/onlineordering/reviews/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[14px] bg-white/5 border border-white/10 px-4 py-3 text-[13px] text-[#E04F5F] hover:bg-white/10 transition-colors">
                <ExternalLink className="h-4 w-4" />
                Open Zomato Reviews Dashboard
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-medium text-white">Step 2: Find the Reviews API Call</p>
              <ol className="text-[12px] text-white/50 space-y-1.5 list-decimal pl-4">
                <li>Open Chrome DevTools (F12) → <strong className="text-white/70">Network</strong> tab</li>
                <li>Type <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#E04F5F]">reviews</code> in the filter</li>
                <li>Hard refresh the page (Ctrl+Shift+R)</li>
                <li>Click the request to <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#E04F5F]">api.zomato.com/merchant-gw/web/reviews</code></li>
                <li>Go to <strong className="text-white/70">Headers</strong> tab</li>
                <li>Copy the values for the 3 tokens below from the request headers/cookies</li>
              </ol>
            </div>

            <div className="rounded-[12px] bg-black/30 border border-white/5 p-3">
              <p className="text-[11px] text-white/40 font-mono mb-2">Quick way — paste this in Console (F12):</p>
              <code className="text-[11px] text-green-400 font-mono break-all">
                {`copy(document.cookie)`}
              </code>
            </div>

            <button onClick={() => setStep("paste")}
              className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]">
              I have the tokens — Continue
            </button>
          </div>
        )}

        {step === "paste" && (
          <div className="space-y-4">
            <p className="text-[13px] text-white/50">Paste the Zomato authentication data from your browser</p>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-white/70">X-Zomato-Mx-Auth-Token</label>
              <input type="text" value={authToken} onChange={(e) => setAuthToken(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIs..."
                className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3 text-[13px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-white/70">x-zomato-csrft</label>
                <input type="text" value={csrfToken} onChange={(e) => setCsrfToken(e.target.value)}
                  placeholder="d1e3966f..."
                  className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-[12px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono" />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-white/70">x-zomato-mx-csrf-token</label>
                <input type="text" value={mxCsrfToken} onChange={(e) => setMxCsrfToken(e.target.value)}
                  placeholder="d97e70ef..."
                  className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-[12px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-white/70">Restaurant IDs (comma-separated)</label>
              <input type="text" value={restaurantIds} onChange={(e) => setRestaurantIds(e.target.value)}
                placeholder="20590610, 110076, 110412"
                className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3 text-[13px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono" />
              <p className="mt-1 text-[11px] text-white/40">Find these in the URL: zomato.com/.../res_id=<strong>20590610</strong></p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-white/70">Full Cookie String</label>
              <textarea value={cookies} onChange={(e) => setCookies(e.target.value)}
                placeholder="Paste all cookies from the request headers..."
                rows={4}
                className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3 text-[12px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono resize-none" />
              <p className="mt-1 text-[11px] text-white/40">From Request Headers → Cookie field (includes auth token, csrf, etc.)</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("instructions")}
                className="rounded-[14px] bg-white/5 border border-white/10 px-5 py-3 text-[13px] font-medium text-white/70 hover:bg-white/10 transition-colors">
                Back
              </button>
              <button onClick={handleConnect} disabled={!authToken.trim() || loading}
                className="flex-1 rounded-[14px] bg-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50">
                {loading ? "Connecting..." : "Connect to Zomato"}
              </button>
            </div>
          </div>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
            <p className="text-[14px] text-white">Connecting to Zomato...</p>
            <p className="text-[12px] text-white/40 mt-1">Verifying your partner dashboard access</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20C997]/20">
              <CheckCircle className="h-8 w-8 text-[#20C997]" />
            </div>
            <p className="text-[18px] font-semibold text-white">Successfully Connected!</p>
            <p className="mt-1 text-[13px] text-white/50">{result?.message || "Zomato reviews imported"}</p>

            {restaurantIds.trim() && (
              <button onClick={handleFetchReviews} disabled={loading}
                className="mt-4 rounded-[14px] bg-[#20C997] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50">
                {loading ? "Fetching..." : "Fetch All Reviews Now"}
              </button>
            )}

            {result && "new_saved" in (result as Record<string, unknown>) && (
              <p className="mt-3 text-[12px] text-[#20C997]">
                {(result as { new_saved: number }).new_saved} new reviews saved to Revly
              </p>
            )}

            <button onClick={onClose}
              className="mt-6 rounded-[14px] bg-accent px-8 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]">
              Go To Dashboard
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-[16px] font-semibold text-white">Connection Failed</p>
              <p className="mt-1 text-[13px] text-white/50 text-center max-w-sm">{error}</p>
            </div>
            <button onClick={() => setStep("paste")}
              className="w-full rounded-[14px] bg-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
