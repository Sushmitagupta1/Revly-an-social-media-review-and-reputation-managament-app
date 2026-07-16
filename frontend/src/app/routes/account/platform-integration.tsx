import { useEffect, useState } from "react"
import { useIntegrationStore } from "@/stores/integration-store"
import LoadingSpinner from "@/components/shared/loading-spinner"
import SummaryCards from "@/components/integrations/summary-cards"
import PlatformCard from "@/components/integrations/platform-card"
import ConnectModal from "@/components/integrations/connect-modal"
import ManagePlatform from "@/components/integrations/manage-platform"
import BackButton from "@/components/shared/back-button"
// import type { Integration } from "@/types/integration"

const allPlatforms = [
  { id: "google", name: "Google Business", icon: "G", color: "#4A74FF" },
  { id: "zomato", name: "Zomato", icon: "Z", color: "#E04F5F" },
  { id: "swiggy", name: "Swiggy", icon: "S", color: "#FF8C00" },
  { id: "reelo", name: "Reelo", icon: "R", color: "#8B5CF6" },
  { id: "magicpin", name: "Magicpin", icon: "M", color: "#20C997" },
  { id: "tripadvisor", name: "TripAdvisor", icon: "T", color: "#34E0A1" },
]

export default function PlatformIntegrationPage() {
  const { integrations, isLoading, fetchIntegrations } = useIntegrationStore()
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null)
  const [managePlatform, setManagePlatform] = useState<string | null>(null)
  const [view, setView] = useState<"dashboard" | "manage">("dashboard")

  useEffect(() => { fetchIntegrations() }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get("access_token")
    const email = params.get("email")
    if (accessToken && email) {
      setConnectPlatform("google")
    }
    const savedPlatform = localStorage.getItem("revly_google_connect")
    if (savedPlatform && !accessToken) {
      setConnectPlatform(savedPlatform)
      localStorage.removeItem("revly_google_connect")
    }
  }, [])

  const connectedPlatforms = integrations.filter((i) => i.is_connected)
  const connectedCount = connectedPlatforms.length

  const handleManage = (platformId: string) => {
    setManagePlatform(platformId)
    setView("manage")
  }

  const handleBack = () => {
    setView("dashboard")
    setManagePlatform(null)
    fetchIntegrations()
  }

  if (view === "manage" && managePlatform) {
    const integration = integrations.find((i) => i.platform === managePlatform)
    return <ManagePlatform integration={integration} onBack={handleBack} />
  }

  return (
    <div className="space-y-8">
      <div>
        <BackButton to="/account" />
        <h1 className="text-[24px] font-bold text-white">Platform Integration</h1>
        <p className="mt-1 text-[13px] text-white/50">Manage review platform connections</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <>
          <SummaryCards connectedCount={connectedCount} totalLocations={0} lastSync="Never" />

          <div>
            <h2 className="mb-4 text-[16px] font-semibold text-white">Connected Platforms</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {connectedPlatforms.map((integration) => {
                const config = allPlatforms.find((p) => p.id === integration.platform)
                return (
                  <PlatformCard
                    key={integration.id}
                    integration={integration}
                    config={config || { id: integration.platform, name: integration.platform, icon: "?", color: "#6B7280" }}
                    onManage={() => handleManage(integration.platform)}
                  />
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-[16px] font-semibold text-white">Other Platforms</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {allPlatforms
                .filter((p) => !connectedPlatforms.find((c) => c.platform === p.id))
                .map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setConnectPlatform(platform.id)}
                    className="rounded-[20px] bg-white/5 p-6 text-left transition-all hover:bg-white/10 border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[18px] font-bold text-white" style={{ backgroundColor: platform.color }}>
                        {platform.icon}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">{platform.name}</p>
                        <p className="text-[12px] text-white/40">Click to Connect</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <span className="text-[12px] font-medium text-accent">Connect →</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {connectPlatform && (
        <ConnectModal
          platform={connectPlatform}
          onClose={() => { setConnectPlatform(null); fetchIntegrations(); }}
        />
      )}
    </div>
  )
}
