import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthLayout from "./routes/auth-layout"
import LoginPage from "./routes/login"
import RegisterPage from "./routes/register"
import DashboardLayout from "./routes/dashboard-layout"
import OverviewPage from "./routes/overview"
import ReviewsPage from "./routes/reviews"
import InboxPage from "./routes/inbox"
import ComplaintsPage from "./routes/complaints"
import PraisesPage from "./routes/praises"
import LocationLeaderboardPage from "./routes/location-leaderboard"
import CompetitorsPage from "./routes/competitors"
import ReportsPage from "./routes/reports"
import AskRevlyPage from "./routes/ask-revly"
import AutomationPage from "./routes/automation"
import NotificationsPage from "./routes/notifications"
import IntegrationsPage from "./routes/integrations"
import AuditLogsPage from "./routes/audit-logs"
import ProfilePage from "./routes/account/profile"
import LocationsPage from "./routes/account/locations"
import TeamPage from "./routes/account/team"
import AutoResponsePage from "./routes/account/auto-response"
import PlatformIntegrationPage from "./routes/account/platform-integration"
import ResolvePage from "./routes/account/resolve"
import AccountLayout from "./routes/account-layout"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    path: "/register",
    element: <AuthLayout><RegisterPage /></AuthLayout>,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: "overview", element: <OverviewPage /> },
      { path: "reviews", element: <ReviewsPage /> },
      { path: "inbox", element: <InboxPage /> },
      { path: "complaints", element: <ComplaintsPage /> },
      { path: "praises", element: <PraisesPage /> },
      { path: "location-leaderboard", element: <LocationLeaderboardPage /> },
      { path: "competitors", element: <CompetitorsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "ask-revly", element: <AskRevlyPage /> },
      { path: "automation", element: <AutomationPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "integrations", element: <IntegrationsPage /> },
      { path: "audit-logs", element: <AuditLogsPage /> },
      {
        path: "account",
        element: <AccountLayout />,
        children: [
          { index: true, element: <Navigate to="profile" replace /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "locations", element: <LocationsPage /> },
          { path: "team", element: <TeamPage /> },
          { path: "auto-response", element: <AutoResponsePage /> },
          { path: "platform-integration", element: <PlatformIntegrationPage /> },
          { path: "resolve", element: <ResolvePage /> },
        ],
      },
    ],
  },
])
