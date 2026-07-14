import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import OneTapOpener from "@/components/shared/one-tap-opener"

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <div className="text-sm text-white/50">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />
      <OneTapOpener />
      <div className="flex flex-1 flex-col ml-[260px]">
        <Header />
        <div className="flex-1 overflow-y-auto rounded-tl-[40px] bg-main-panel">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
