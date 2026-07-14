import { useEffect } from "react"
import { useReportStore } from "@/stores/report-store"
import ReportSummary from "@/components/reports/report-summary"
import LoadingSpinner from "@/components/shared/loading-spinner"
import BackButton from "@/components/shared/back-button"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ReportsPage() {
  const { summary, isLoading, fetchSummary, exportCsv } = useReportStore()

  useEffect(() => { fetchSummary() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton to="/overview" />
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-sm text-text-secondary">Summary of your reputation metrics</p>
        </div>
        <Button variant="ghost" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {isLoading || !summary ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <ReportSummary summary={summary} />
      )}
    </div>
  )
}
