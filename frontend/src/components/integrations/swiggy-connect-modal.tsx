import { useState } from "react"
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import apiClient from "@/lib/api-client"
import { useIntegrationStore } from "@/stores/integration-store"

interface Props {
  onClose: () => void
}

interface SwiggyRestaurant {
  rest_id: number
  rest_name: string
  locality: string
  city_name: string
  rating: number
}

export default function SwiggyConnectModal({ onClose }: Props) {
  const [step, setStep] = useState<"instructions" | "paste" | "connecting" | "success" | "error">("instructions")
  const [accessToken, setAccessToken] = useState("")
  const [restaurants, setRestaurants] = useState<SwiggyRestaurant[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ message?: string } | null>(null)
  const { createIntegration } = useIntegrationStore()

  const handleFetchRestaurants = async () => {
    if (!accessToken.trim()) return
    setLoading(true)
    setError("")
    try {
      const { data } = await apiClient.post("/swiggy/restaurants", { access_token: accessToken.trim() })
      setRestaurants(data.restaurants || [])
      if ((data.restaurants || []).length > 0) {
        setSelectedRestaurants(new Set((data.restaurants as SwiggyRestaurant[]).map((r) => r.rest_id)))
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to fetch restaurants. Check your token.")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!accessToken.trim()) return
    setLoading(true)
    setError("")
    setStep("connecting")
    try {
      const { data } = await apiClient.post("/swiggy/connect", {
        access_token: accessToken.trim(),
        account_name: "Swiggy Partner",
        restaurant_ids: Array.from(selectedRestaurants).map(String),
      })
      setResult(data)
      await createIntegration({ platform: "swiggy", account_name: "Swiggy Partner" })
      setStep("success")
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to connect. Check your token and try again.")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    setError("")
    try {
      const { data } = await apiClient.post("/swiggy/sync")
      setResult(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to start sync.")
    } finally {
      setLoading(false)
    }
  }

  const toggleRestaurant = (id: number) => {
    setSelectedRestaurants((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#1A1A2E] p-8 shadow-2xl border border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF8C00] text-[16px] font-bold text-white">S</div>
            <span className="text-[16px] font-semibold text-white">Connect Swiggy Partner Dashboard</span>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "instructions" && (
          <div className="space-y-5">
            <div className="rounded-[16px] bg-[#FF8C00]/10 border border-[#FF8C00]/20 p-4">
              <p className="text-[13px] text-[#FF8C00] font-medium mb-1">How it works</p>
              <p className="text-[12px] text-white/60">
                Swiggy doesn't provide a public API for partners. We use your partner dashboard session token to fetch ratings, reviews, and order/bill details from the merchant dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-medium text-white">Step 1: Open Swiggy Partner Dashboard</p>
              <a href="https://partner.swiggy.com/food/ratings" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[14px] bg-white/5 border border-white/10 px-4 py-3 text-[13px] text-[#FF8C00] hover:bg-white/10 transition-colors">
                <ExternalLink className="h-4 w-4" />
                Open Swiggy Ratings Dashboard
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-[14px] font-medium text-white">Step 2: Find the Session Token</p>
              <ol className="text-[12px] text-white/50 space-y-1.5 list-decimal pl-4">
                <li>Open Chrome DevTools (F12) → <strong className="text-white/70">Network</strong> tab</li>
                <li>Reload the ratings page</li>
                <li>Find a GraphQL request to <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#FF8C00]">vhc-composer.swiggy.com</code></li>
                <li>Go to <strong className="text-white/70">Headers</strong> tab → Request Headers</li>
                <li>Copy the value of the <code className="rounded bg-white/10 px-1.5 py-0.5 text-[#FF8C00]">access_token</code> header</li>
              </ol>
            </div>

            <button onClick={() => setStep("paste")}
              className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]">
              I have the token — Continue
            </button>
          </div>
        )}

        {step === "paste" && (
          <div className="space-y-4">
            <p className="text-[13px] text-white/50">Paste your Swiggy partner dashboard session token</p>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-white/70">access_token</label>
              <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                placeholder="be16b48f-c8e4-4067-9a7b-6300f5b8ab22"
                rows={3}
                className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3 text-[12px] text-white placeholder-white/30 focus:border-accent focus:outline-none font-mono resize-none" />
              <p className="mt-1 text-[11px] text-white/40">From Network tab → vhc-composer.swiggy.com → Request Headers → access_token</p>
            </div>

            {error && (
              <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{error}</div>
            )}

            <button onClick={handleFetchRestaurants} disabled={!accessToken.trim() || loading}
              className="w-full rounded-[14px] bg-white/5 border border-white/10 px-5 py-3 text-[13px] font-medium text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50">
              {loading ? "Fetching Restaurants..." : "Fetch My Restaurants"}
            </button>

            {restaurants.length > 0 && (
              <>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {restaurants.map((r) => (
                    <button
                      key={r.rest_id}
                      onClick={() => toggleRestaurant(r.rest_id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-[14px] px-5 py-3 text-left transition-all border ${
                        selectedRestaurants.has(r.rest_id) ? "bg-[#FF8C00]/10 border-[#FF8C00]/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{r.rest_name}</p>
                        <p className="text-[11px] text-white/40 truncate">{r.locality}, {r.city_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-white/40">★ {r.rating}</span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                          selectedRestaurants.has(r.rest_id) ? "border-[#FF8C00] bg-[#FF8C00]" : "border-white/30"
                        }`}>
                          {selectedRestaurants.has(r.rest_id) && <span className="text-[10px] text-white">✓</span>}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("instructions")}
                    className="rounded-[14px] bg-white/5 border border-white/10 px-5 py-3 text-[13px] font-medium text-white/70 hover:bg-white/10 transition-colors">
                    Back
                  </button>
                  <button onClick={handleConnect} disabled={selectedRestaurants.size === 0 || loading}
                    className="flex-1 rounded-[14px] bg-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50">
                    {loading ? "Connecting..." : `Connect ${selectedRestaurants.size} Restaurant${selectedRestaurants.size > 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
            <p className="text-[14px] text-white">Connecting to Swiggy...</p>
            <p className="text-[12px] text-white/40 mt-1">Verifying your partner dashboard access</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20C997]/20">
              <CheckCircle className="h-8 w-8 text-[#20C997]" />
            </div>
            <p className="text-[18px] font-semibold text-white">Successfully Connected!</p>
            <p className="mt-1 text-[13px] text-white/50">{result?.message || "Swiggy account connected"}</p>

            <button onClick={handleSync} disabled={loading}
              className="mt-4 rounded-[14px] bg-[#20C997] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50">
              {loading ? "Starting..." : "Sync Reviews Now"}
            </button>
            <p className="mt-2 text-[11px] text-white/30">Reviews sync automatically every 15 minutes</p>

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
