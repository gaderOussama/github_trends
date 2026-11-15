import { Suspense } from "react"
import { Dashboard } from "../components/dashboard"
import { ThemeControl } from "../components/theme-control"

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-240">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          GitHub Trends
        </h1>
        <ThemeControl />
      </header>
      <Suspense fallback={<p className="mt-6 text-sm text-subtle">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  )
}
