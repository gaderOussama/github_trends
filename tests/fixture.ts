import type { Repo, RepoData } from "../components/repos"

function repo(partial: Partial<Repo> & { fullName: string }): Repo {
  return {
    url: `https://github.com/${partial.fullName}`,
    description: null,
    stars: 100,
    starsGained: null,
    gainedPeriod: null,
    language: null,
    topics: [],
    pushedAt: null,
    createdAt: null,
    isNew: false,
    watched: false,
    install: null,
    source: "trending",
    ...partial,
  }
}

export const data: RepoData = {
  generatedAt: "2026-11-15T06:30:00.000Z",
  categories: {
    skills: [
      repo({
        fullName: "acme/big-skill",
        description: "Handles documents end to end.",
        stars: 12345,
        starsGained: 420,
        gainedPeriod: "today",
        language: "Python",
        topics: ["pdf", "docs", "a", "b", "fifth-topic"],
        install: "npx skills add acme/big-skill",
        watched: true,
      }),
      repo({
        fullName: "fresh/tiny-skill",
        stars: 12,
        isNew: true,
        install: "npx skills add fresh/tiny-skill",
      }),
    ],
    mcp: [
      repo({
        fullName: "acme/db-server",
        description: "SQL access",
        stars: 2100,
        starsGained: 15,
        gainedPeriod: "week",
        topics: ["sqlite"],
      }),
    ],
    memory: [],
    tooling: [
      repo({
        fullName: "acme/token-saver",
        description: "Cuts agent token usage.",
        stars: 800,
      }),
    ],
  },
}
