import { useState } from "react"
import { X, Mail, Smartphone, ArrowLeft, CheckCircle, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationStore } from "@/stores/integration-store"

interface Props {
  platform: string
  onClose: () => void
}

const platformConfig: Record<string, { name: string; color: string; icon: string }> = {
  google: { name: "Google Business", color: "#4A74FF", icon: "G" },
  zomato: { name: "Zomato", color: "#E04F5F", icon: "Z" },
  swiggy: { name: "Swiggy", color: "#FF8C00", icon: "S" },
  reelo: { name: "Reelo", color: "#8B5CF6", icon: "R" },
  magicpin: { name: "Magicpin", color: "#20C997", icon: "M" },
  tripadvisor: { name: "TripAdvisor", color: "#34E0A1", icon: "T" },
}

const mockAccounts = [
  { id: "1", email: "graphics@uppercrust.com", locations: 15 },
  { id: "2", email: "marketing@uppercrust.com", locations: 8 },
  { id: "3", email: "franchise@uppercrust.com", locations: 5 },
]

const mockLocations = [
  { id: "1", name: "Upper Crust Vastrapur", selected: true },
  { id: "2", name: "Upper Crust Vijay Cross", selected: true },
  { id: "3", name: "Lithosphere", selected: false },
  { id: "4", name: "Prahlad Nagar", selected: true },
  { id: "5", name: "Sindhu Bhavan", selected: true },
]

type Step = "auth" | "account" | "locations" | "success"

export default function ConnectModal({ platform, onClose }: Props) {
  const [step, setStep] = useState<Step>("auth")
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null)
  const [authValue, setAuthValue] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [locations, setLocations] = useState(mockLocations)
  const { createIntegration } = useIntegrationStore()
  const config = platformConfig[platform] || { name: platform, color: "#6B7280", icon: "?" }

  const handleAuth = () => {
    if (!authValue.trim()) return
    setStep("account")
  }

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccount(accountId)
    setStep("locations")
  }

  const handleToggleLocation = (id: string) => {
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, selected: !l.selected } : l))
  }

  const handleConnect = async () => {
    const account = mockAccounts.find((a) => a.id === selectedAccount)
    await createIntegration({ platform, account_name: account?.email || authValue })
    setStep("success")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[28px] bg-[#1A1A2E] p-8 shadow-2xl border border-white/10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "auth" && (
              <button onClick={() => setStep(step === "locations" ? "account" : "auth")} className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-[16px] font-bold text-white" style={{ backgroundColor: config.color }}>
              {config.icon}
            </div>
            <span className="text-[16px] font-semibold text-white">
              {step === "auth" && `Connect ${config.name}`}
              {step === "account" && "Select Account"}
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

            {platform === "google" ? (
              <button
                onClick={() => { setAuthValue("graphics@uppercrust.com"); setStep("account"); }}
                className="flex w-full items-center gap-4 rounded-[16px] bg-white/5 p-5 text-left transition-all hover:bg-white/10 border border-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white">
                  <span className="text-[20px] font-bold text-[#4A74FF]">G</span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">Continue with Google</p>
                  <p className="text-[12px] text-white/40">Sign in with your Google account</p>
                </div>
              </button>
            ) : (
              <>
                <div className="flex gap-2 rounded-[14px] bg-white/5 p-1">
                  <button
                    onClick={() => setAuthMethod("email")}
                    className={cn("flex-1 rounded-[12px] px-4 py-2.5 text-[13px] font-medium transition-all", authMethod === "email" ? "bg-accent text-white" : "text-white/50 hover:text-white")}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setAuthMethod("phone")}
                    className={cn("flex-1 rounded-[12px] px-4 py-2.5 text-[13px] font-medium transition-all", authMethod === "phone" ? "bg-accent text-white" : "text-white/50 hover:text-white")}
                  >
                    Mobile
                  </button>
                </div>

                {authMethod && (
                  <div className="space-y-3">
                    <input
                      type={authMethod === "email" ? "email" : "tel"}
                      value={authValue}
                      onChange={(e) => setAuthValue(e.target.value)}
                      placeholder={authMethod === "email" ? "you@gmail.com" : "+91 98765 43210"}
                      className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-3.5 text-[14px] text-white placeholder-white/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                    />
                    <button
                      onClick={handleAuth}
                      disabled={!authValue.trim()}
                      className="w-full rounded-[14px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {!authMethod && (
                  <div className="space-y-3">
                    <button
                      onClick={() => { setAuthValue("user@example.com"); setStep("account"); }}
                      className="flex w-full items-center gap-4 rounded-[16px] bg-white/5 p-5 text-left transition-all hover:bg-white/10 border border-white/5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-card-blue">
                        <Mail className="h-6 w-6 text-[#4A74FF]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">Continue with Email</p>
                        <p className="text-[12px] text-white/40">Sign in with email & password</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setAuthValue("+91 98765 43210"); setStep("account"); }}
                      className="flex w-full items-center gap-4 rounded-[16px] bg-white/5 p-5 text-left transition-all hover:bg-white/10 border border-white/5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-card-green">
                        <Smartphone className="h-6 w-6 text-[#20C997]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">Continue with Mobile</p>
                        <p className="text-[12px] text-white/40">Verify with OTP</p>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === "account" && (
          <div className="space-y-3">
            <p className="text-[13px] text-white/50 mb-4">Choose an account to connect</p>
            {mockAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelectAccount(account.id)}
                className="flex w-full items-center justify-between rounded-[16px] bg-white/5 p-5 text-left transition-all hover:bg-white/10 border border-white/5"
              >
                <div>
                  <p className="text-[14px] font-semibold text-white">{account.email}</p>
                  <p className="text-[12px] text-white/40">{account.locations} Locations</p>
                </div>
                <span className="text-[12px] text-white/30">→</span>
              </button>
            ))}
            <button className="w-full rounded-[14px] border border-dashed border-white/20 px-5 py-3.5 text-[13px] font-medium text-white/50 transition-all hover:border-white/40 hover:text-white/70">
              + Connect Another Account
            </button>
          </div>
        )}

        {step === "locations" && (
          <div className="space-y-4">
            <p className="text-[13px] text-white/50">Select locations to sync reviews from</p>
            <div className="space-y-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleToggleLocation(loc.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] px-5 py-4 text-left transition-all border",
                    loc.selected ? "bg-accent/10 border-accent/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                    loc.selected ? "border-accent bg-accent" : "border-white/30"
                  )}>
                    {loc.selected && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <MapPin className="h-4 w-4 text-white/40" />
                  <span className="text-[14px] font-medium text-white">{loc.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const allSelected = locations.every((l) => l.selected)
                  setLocations((prev) => prev.map((l) => ({ ...l, selected: !allSelected })))
                }}
                className="text-[13px] font-medium text-white/50 hover:text-white/70 transition-colors"
              >
                {locations.every((l) => l.selected) ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleConnect}
                disabled={locations.filter((l) => l.selected).length === 0}
                className="rounded-[14px] bg-accent px-6 py-3 text-[14px] font-semibold text-white shadow-[0_0_25px_rgba(255,106,43,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                Connect {locations.filter((l) => l.selected).length} Locations
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20C997]/20">
              <CheckCircle className="h-8 w-8 text-[#20C997]" />
            </div>
            <p className="text-[18px] font-semibold text-white">Successfully Connected</p>
            <p className="mt-1 text-[13px] text-white/50">{config.name}</p>
            <p className="mt-1 text-[12px] text-white/40">{locations.filter((l) => l.selected).length} Locations Connected</p>
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
