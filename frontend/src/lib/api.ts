import apiClient from "./api-client"

export async function downloadReviewsCsv(platform?: string, rating?: number) {
  const params = new URLSearchParams()
  if (platform) params.set("platform", platform)
  if (rating) params.set("rating", String(rating))

  const response = await apiClient.get(`/reviews/export?${params}`, {
    responseType: "blob",
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "reviews.csv")
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
