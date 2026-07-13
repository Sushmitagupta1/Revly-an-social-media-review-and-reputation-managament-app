import { useEffect, useState } from "react"
import { MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import apiClient from "@/lib/api-client"

interface Loc {
  id: string
  name: string
  address: string | null
  city: string | null
}

export default function LocationList() {
  const [locations, setLocations] = useState<Loc[]>([])
  const [name, setName] = useState("")
  const [city, setCity] = useState("")

  const fetch = () => apiClient.get("/locations").then(({ data }) => setLocations(data.locations))

  useEffect(() => { fetch() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await apiClient.post("/locations", { name: name.trim(), city: city.trim() || undefined })
    setName("")
    setCity("")
    fetch()
  }

  const remove = async (id: string) => {
    await apiClient.delete(`/locations/${id}`)
    fetch()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder="Location name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-40" />
        <Button type="submit" size="sm" disabled={!name.trim()}>Add</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {locations.map((loc) => (
          <div key={loc.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text">{loc.name}</p>
                {loc.city && <p className="text-xs text-text-secondary">{loc.city}</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => remove(loc.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
