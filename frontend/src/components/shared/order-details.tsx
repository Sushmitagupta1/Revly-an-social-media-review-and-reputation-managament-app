import { Package, Clock, IndianRupee, MapPin } from "lucide-react"
import type { OrderDetails, OrderDish } from "@/types/review"

interface Props {
  order: OrderDetails
}

function formatTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatRupees(value: number | null | undefined): string {
  if (value == null) return ""
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`
}

function dishName(d: OrderDish): string {
  return "name" in d ? d.name : d.title
}

export default function OrderDetails({ order }: Props) {
  const dishes = order.dishes?.filter((d) => dishName(d)) ?? []

  return (
    <div className="rounded-xl border border-border bg-card-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-semibold text-text">
            Order #{order.order_id}
          </span>
        </div>
        {order.state && (
          <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium uppercase text-info">
            {order.state}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        {order.ordered_at && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatTime(order.ordered_at)}
          </span>
        )}
        {order.delivery_mode && (
          <span className="inline-flex items-center gap-1 capitalize">
            <MapPin className="h-3 w-3" /> {order.delivery_mode.toLowerCase()}
          </span>
        )}
        {order.total != null && (
          <span className="inline-flex items-center gap-1 font-medium text-text">
            <IndianRupee className="h-3 w-3" /> {formatRupees(order.total)}
          </span>
        )}
      </div>

      {dishes.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {dishes.map((d, i) => {
            const qty = "quantity" in d ? d.quantity : 1
            const total = "total_cost" in d ? d.total_cost : undefined
            const rating = "rating" in d ? d.rating : undefined
            return (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-text">
                  <span className="mr-1.5 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-surface px-1 font-medium text-text-secondary">
                    {qty}×
                  </span>
                  {dishName(d)}
                </span>
                {total != null ? (
                  <span className="shrink-0 text-text-secondary">{formatRupees(total)}</span>
                ) : rating ? (
                  <span className="shrink-0 text-xs text-warning">★ {rating}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
