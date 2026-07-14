export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg p-4">
      <div className="w-full max-w-md rounded-[28px] bg-card p-8 shadow-2xl shadow-black/20 border border-white/5">
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="Revly" className="h-16 w-16 rounded-2xl object-cover" />
        </div>
        {children}
      </div>
    </div>
  )
}
