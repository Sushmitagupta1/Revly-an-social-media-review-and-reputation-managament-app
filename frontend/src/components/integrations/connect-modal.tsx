import { useState, useEffect } from "react"
import { X, ArrowLeft, CheckCircle, MapPin, Loader2, Key, ExternalLink, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationStore } from "@/stores/integration-store"
import apiClient from "@/lib/api-client"

interface Props {
  platform: string
  onClose: () => void
}

const platformConfig: Record<string, { name: string; color: string; icon: string; apiUrl: string; helpUrl: string; authType: "api_key" | "email" | "phone" }> = {
  google: { name: "Google Business", color: "#4A74FF", icon: "G", apiUrl: "", helpUrl: "https://developers.google.com/my-business", authType: "api_key" },
  zomato: { name: "Zomato", color: "#E04F5F", icon: "Z", apiUrl: "", helpUrl: "", authType: "email" },
  swiggy: { name: "Swiggy", color: "#FF8C00", icon: "S", apiUrl: "", helpUrl: "", authType: "phone" },
  reelo: { name: "Reelo", color: "#8B5CF6", icon: "R", apiUrl: "", helpUrl: "https://reelo.io", authType: "api_key" },
  magicpin: { name: "Magicpin", color: "#20C997", icon: "M", apiUrl: "", helpUrl: "", authType: "api_key" },
  tripadvisor: { name: "TripAdvisor", color: "#34E0A1", icon: "T", apiUrl: "", helpUrl: "", authType: "api_key" },
}

type Step = "auth" | "locations" | "success"

interface GoogleLocation {
  id: string
  name: string
  address: string
  state: string
}

export default function ConnectModal({ platform, onClose }: Props) {
  const [step, setStep] = useState<Step>("auth")
  const [loading, setLoading] = useState(false)
  const [googleEmail, setGoogleEmail] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [credential, setCredential] = useState("")
  const [apiError, setApiError] = useState("")
  const [locations, setLocations] = useState<GoogleLocation[]>([])
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [error, setError] = useState("")
  const { createIntegration } = useIntegrationStore()
  const config = platformConfig[platform] || { name: platform, color: "#6B7280", icon: "?", apiUrl: "", helpUrl: "" }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get("google_connected")
    const googleErr = params.get("google_error")

    if (googleErr) {
      setError("Google sign-in failed. Please try again.")
      window.history.replaceState({}, "", "/overview")
    }

    if (connected) {
      try {
        const data = JSON.parse(decodeURIComponent(connected))
        setGoogleEmail(data.email)
        setStep("locations")
        fetchLocations(data.access_token)
      } catch {
        setError("Failed to parse Google response")
      }
      window.history.replaceState({}, "", "/overview")
    }
  }, [])

  const fetchLocations = async (token: string) => {
    setLoading(true)
    try {
      const { data } = await apiClient.post("/google/fetch-locations", { access_token: token })
      setLocations(data.locations || [])
    } catch {
      setError("Failed to fetch locations from Google")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError("")
    try {
      const { data } = await apiClient.get("/google/auth-url")
      window.location.href = data.url
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || "Failed to start Google sign-in")
      setLoading(false)
    }
  }

  const handleVerifyApiKey = async () => {
    const value = config.authType === "api_key" ? apiKey : credential
    if (!value.trim()) return
    setLoading(true)
    setApiError("")
    try {
      const payload = config.authType === "api_key" ? { api_key: apiKey } : { credential: value, auth_type: config.authType }
      const { data } = await apiClient.post(`/platforms/${platform}/verify`, payload)
      if (data.valid) {
        setLocations(data.locations || [])
        setStep("locations")
      } else {
        setApiError(data.message || "Invalid credentials")
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setApiError(axiosErr.response?.data?.detail || "Failed to verify. Check and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLocation = (id: string) => {
    setSelectedLocations((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConnect = async () => {
    setLoading(true)
    setError("")
    try {
      for (const _loc of locations.filter((l) => selectedLocations.has(l.id))) {
        await createIntegration({
          platform,
          account_name: googleEmail || credential || apiKey.slice(0, 8) + "...",
        })
      }
      setStep("success")
    } catch {
      setError("Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[28px] bg-[#1A1A2E] p-8 shadow-2xl border border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "auth" && (
              <button onClick={() => setStep("auth")} className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-[16px] font-bold text-white" style={{ backgroundColor: config.color }}>
              {config.icon}
            </div>
            <span className="text-[16px] font-semibold text-white">
              {step === "auth" && `Connect ${config.name}`}
              {step === "locations" && "Select Locations"}
              {step === "success" && "Connected!"}
            </span>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "auth" && (
          <div className="space-y-4">
            <p className="text-[13px] text-white/50">Sign in to your {config.name} Account</p>
            {error && (
              <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{error}</div>
            )}

            {platform === "google" ? (
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="flex w-full items-center gap-4 rounded-[16px] bg-white/5 p-5 text-left transition-all hover:bg-white/10 border border-white/5 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin text-[#4A74FF]" /> : <span className="text-[20px] font-bold text-[#4A74FF]">G</span>}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{loading ? "Redirecting to Google..." : "Continue with Google"}</p>
                  <p className="text-[12px] text-white/40">Sign in with your Google Business account</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                {config.authType === "email" ? (
                  <>
                    <div className="flex items-center gap-3 rounded-[16px] bg-white/5 p-5 border border-white/5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: config.color + "20" }}>
                        <Mail className="h-6 w-6" style={{ color: config.color }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">Connect with Email</p>
                        <p className="text-[12px] text-white/40">Enter your {config.name} registered email</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-white/70">Email Address</label>
                        <input
                          type="email"
                          value={credential}
                          onChange={(e) => { setCredential(e.target.value); setApiError("") }}
                          placeholder={`your@email.com`}
                          className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3.5 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                        />
                      </div>
                      {apiError && <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{apiError}</div>}
                      <button
                        onClick={handleVerifyApiKey}
                        disabled={!credential.trim() || loading}
                        className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                      >
                        {loading ? "Connecting..." : "Connect Account"}
                      </button>
                    </div>
                  </>
                ) : config.authType === "phone" ? (
                  <>
                    <div className="flex items-center gap-3 rounded-[16px] bg-white/5 p-5 border border-white/5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: config.color + "20" }}>
                        <Phone className="h-6 w-6" style={{ color: config.color }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">Connect with Phone</p>
                        <p className="text-[12px] text-white/40">Enter your {config.name} registered phone number</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-white/70">Phone Number</label>
                        <input
                          type="tel"
                          value={credential}
                          onChange={(e) => { setCredential(e.target.value); setApiError("") }}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3.5 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                        />
                      </div>
                      {apiError && <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{apiError}</div>}
                      <button
                        onClick={handleVerifyApiKey}
                        disabled={!credential.trim() || loading}
                        className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                      >
                        {loading ? "Connecting..." : "Connect Account"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-[16px] bg-white/5 p-5 border border-white/5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: config.color + "20" }}>
                        <Key className="h-6 w-6" style={{ color: config.color }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">Connect with API Key</p>
                        <p className="text-[12px] text-white/40">Enter your {config.name} API key</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-medium text-white/70">API Key</label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => { setApiKey(e.target.value); setApiError("") }}
                          placeholder={`Enter your ${config.name} API key`}
                          className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3.5 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors font-mono"
                        />
                      </div>
                      {apiError && <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{apiError}</div>}
                      {config.helpUrl && (
                        <a href={config.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/60 transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          Get your API key from {config.name}
                        </a>
                      )}
                      <button
                        onClick={handleVerifyApiKey}
                        disabled={!apiKey.trim() || loading}
                        className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                      >
                        {loading ? "Verifying..." : "Verify & Connect"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {step === "locations" && (
          <div className="space-y-4">
            <p className="text-[13px] text-white/50">
              {googleEmail ? `Signed in as ${googleEmail}` : "Select locations to sync reviews from"}
            </p>
            {error && (
              <div className="rounded-[14px] bg-red-500/10 p-3 text-[13px] text-red-400">{error}</div>
            )}
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-[13px] text-white/50">Fetching locations...</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <MapPin className="h-8 w-8 text-white/20" />
                <p className="text-[13px] text-white/50">No locations found for this account</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleToggleLocation(loc.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[14px] px-5 py-4 text-left transition-all border",
                        selectedLocations.has(loc.id) ? "bg-accent/10 border-accent/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                        selectedLocations.has(loc.id) ? "border-accent bg-accent" : "border-white/30"
                      )}>
                        {selectedLocations.has(loc.id) && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      <MapPin className="h-4 w-4 text-white/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-white truncate">{loc.name}</p>
                        <p className="text-[11px] text-white/40 truncate">{loc.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      if (selectedLocations.size === locations.length) setSelectedLocations(new Set())
                      else setSelectedLocations(new Set(locations.map((l) => l.id)))
                    }}
                    className="text-[13px] font-medium text-white/50 hover:text-white/70 transition-colors"
                  >
                    {selectedLocations.size === locations.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={selectedLocations.size === 0 || loading}
                    className="rounded-[14px] bg-accent px-6 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading ? "Connecting..." : `Connect ${selectedLocations.size} Locations`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20C997]/20">
              <CheckCircle className="h-8 w-8 text-[#20C997]" />
            </div>
            <p className="text-[18px] font-semibold text-white">Successfully Connected</p>
            <p className="mt-1 text-[13px] text-white/50">{config.name}</p>
            <p className="mt-1 text-[12px] text-white/40">{selectedLocations.size} Locations Connected</p>
            <p className="mt-1 text-[11px] text-white/30">Last Sync: Just Now</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-[14px] bg-accent px-8 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02]"
            >
              Go To Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
