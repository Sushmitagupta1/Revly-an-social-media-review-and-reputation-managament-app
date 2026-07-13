import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { platform: string; account_name: string }) => void
}

const PLATFORMS = ["google", "yelp", "tripadvisor", "facebook", "zomato", "reelo"]

export default function IntegrationForm({ onSubmit }: Props) {
  const [platform, setPlatform] = useState("google")
  const [accountName, setAccountName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return
    onSubmit({ platform, account_name: accountName.trim() })
    setAccountName("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Connect New Platform</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text capitalize">
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <Input placeholder="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="sm:col-span-2" />
      </div>
      <Button type="submit" size="sm" disabled={!accountName.trim()}>Connect Platform</Button>
    </form>
  )
}
