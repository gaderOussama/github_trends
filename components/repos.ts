export type CategoryKey = "skills" | "mcp" | "memory" | "tooling"

export type Repo = {
  fullName: string
  url: string
  description: string | null
  stars: number
  starsGained: number | null
  gainedPeriod: "today" | "week" | null
  language: string | null
  topics: string[]
  pushedAt: string | null
  createdAt: string | null
  isNew: boolean
  watched: boolean
  install: string | null
  source: "trending" | "search"
}

export type RepoData = {
  generatedAt: string
  categories: Record<CategoryKey, Repo[]>
}

export const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "mcp", label: "MCP" },
  { key: "memory", label: "Memory & Context" },
  { key: "tooling", label: "Agent tooling" },
]

const isString = (v: unknown): v is string => typeof v === "string"
const orNull = (v: unknown) => (isString(v) ? v : null)

function parseRepo(raw: unknown): Repo | null {
  if (typeof raw !== "object" || raw === null) return null
  const r = raw as Record<string, unknown>
  if (!isString(r.fullName) || !isString(r.url) || typeof r.stars !== "number") {
    return null
  }
  return {
    fullName: r.fullName,
    url: r.url,
    description: orNull(r.description),
    stars: r.stars,
    starsGained: typeof r.starsGained === "number" ? r.starsGained : null,
    gainedPeriod:
      r.gainedPeriod === "today" || r.gainedPeriod === "week"
        ? r.gainedPeriod
        : null,
    language: orNull(r.language),
    topics: Array.isArray(r.topics) ? r.topics.filter(isString) : [],
    pushedAt: orNull(r.pushedAt),
    createdAt: orNull(r.createdAt),
    isNew: r.isNew === true,
    watched: r.watched === true,
    install: orNull(r.install),
    source: r.source === "search" ? "search" : "trending",
  }
}

export function parseRepoData(raw: unknown): RepoData | null {
  if (typeof raw !== "object" || raw === null) return null
  const { generatedAt, categories } = raw as Record<string, unknown>
  if (!isString(generatedAt) || Number.isNaN(Date.parse(generatedAt))) {
    return null
  }
  if (typeof categories !== "object" || categories === null) return null
  const result = {} as Record<CategoryKey, Repo[]>
  for (const { key } of CATEGORIES) {
    const list = (categories as Record<string, unknown>)[key]
    if (list === undefined && key === "tooling") {
      result[key] = []
      continue
    }
    if (!Array.isArray(list)) return null
    result[key] = list.map(parseRepo).filter((r): r is Repo => r !== null)
  }
  return { generatedAt, categories: result }
}

export function formatCount(n: number): string {
  const compact = (value: number, unit: string) =>
    `${value.toFixed(1).replace(/\.0$/, "")}${unit}`
  if (n >= 1_000_000) return compact(n / 1_000_000, "M")
  if (n >= 1_000) return compact(n / 1_000, "k")
  return String(n)
}

export function formatRelative(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  const units: [number, string][] = [
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
  ]
  for (const [size, name] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size)
      return `${n} ${name}${n === 1 ? "" : "s"} ago`
    }
  }
  return "just now"
}

export function filterRepos(
  repos: Repo[],
  query: string,
  newOnly: boolean
): Repo[] {
  const q = query.trim().toLowerCase()
  return repos.filter((repo) => {
    if (newOnly && !repo.isNew) return false
    if (!q) return true
    return [repo.fullName, repo.description ?? "", ...repo.topics].some((s) =>
      s.toLowerCase().includes(q)
    )
  })
}
