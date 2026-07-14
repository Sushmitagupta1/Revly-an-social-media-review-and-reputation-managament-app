import LocationList from "@/components/account/location-list"
import BackButton from "@/components/shared/back-button"

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/account" />
        <h1 className="text-2xl font-bold text-white">Locations</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your business locations</p>
      </div>
      <LocationList />
    </div>
  )
}
