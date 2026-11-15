import { Suspense } from "react"
import { Dashboard } from "../components/dashboard"
import { NorthStar } from "../components/north-star"
import { ThemeControl } from "../components/theme-control"

const PORTFOLIO_URL = "https://www.oussamagader.tech/"
const LINKEDIN_URL = "https://www.linkedin.com/in/oussama-gader-46763230b/"
const SOURCE_URL = "https://github.com/gaderOussama/github_trends"

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-sm">
      {children} <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-240">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <NorthStar className="size-[22px] shrink-0" />
          GitHub Trends
        </h1>
        <ThemeControl />
      </header>
      <Suspense fallback={<p className="mt-6 text-sm text-subtle">Loading…</p>}>
        <Dashboard />
      </Suspense>
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-subtle">
        <p className="flex flex-wrap items-center gap-x-2">
          <NorthStar className="size-3.5 shrink-0" />
          <span>
            Built by{" "}
            <External href={PORTFOLIO_URL}>
              <strong className="font-semibold">Oussama Gader</strong>
            </External>
            {" · "}
            <External href={LINKEDIN_URL}>LinkedIn</External>
          </span>
        </p>
        <External href={SOURCE_URL}>Source on GitHub</External>
      </footer>
    </main>
  )
}
