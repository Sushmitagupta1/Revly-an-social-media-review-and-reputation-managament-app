export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1"

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  OVERVIEW: "/overview",
  REVIEWS: "/reviews",
  INBOX: "/inbox",
  COMPLAINTS: "/complaints",
  PRAISES: "/praises",
  LOCATION_LEADERBOARD: "/location-leaderboard",
  COMPETITORS: "/competitors",
  REPORTS: "/reports",
  ASK_REVLY: "/ask-revly",
  AUTOMATION: "/automation",
  NOTIFICATIONS: "/notifications",
  INTEGRATIONS: "/integrations",
  AUDIT_LOGS: "/audit-logs",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_LOCATIONS: "/account/locations",
  ACCOUNT_TEAM: "/account/team",
  ACCOUNT_AUTO_RESPONSE: "/account/auto-response",
  ACCOUNT_PLATFORM: "/account/platform-integration",
  ACCOUNT_RESOLVE: "/account/resolve",
} as const
