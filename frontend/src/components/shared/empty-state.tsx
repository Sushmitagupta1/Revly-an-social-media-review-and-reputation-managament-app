interface Props {
  title: string
  description?: string
}

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card-secondary">
        <span className="text-2xl">📊</span>
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  )
}
