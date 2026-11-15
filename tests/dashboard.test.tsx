import { render, screen } from "@testing-library/react"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { Dashboard } from "../components/dashboard"
import { loadRepos } from "../components/load-repos"
import { data } from "./fixture"

vi.mock("next/server", () => ({ connection: async () => {} }))

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "repos-"))
  mkdirSync(path.join(dir, "data"))
  vi.spyOn(process, "cwd").mockReturnValue(dir)
})
afterEach(() => {
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

const write = (text: string) =>
  writeFileSync(path.join(dir, "data", "repos.json"), text)

test("shows the empty state when data/repos.json is missing", async () => {
  expect(await loadRepos()).toBeNull()
  render(await Dashboard())
  expect(screen.getByText(/npm run fetch/)).toBeTruthy()
  expect(screen.queryByRole("tablist")).toBeNull()
})

test("shows the empty state for invalid JSON", async () => {
  write("{ nope")
  render(await Dashboard())
  expect(screen.getByText(/npm run fetch/)).toBeTruthy()
})

test("treats the wrong shape as missing data", async () => {
  write(JSON.stringify({ generatedAt: "2026-11-15T00:00:00Z" }))
  expect(await loadRepos()).toBeNull()
})

test("renders the board and a relative Updated time for valid data", async () => {
  write(JSON.stringify(data))
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-15T09:30:00Z"))
  try {
    render(await Dashboard())
  } finally {
    vi.useRealTimers()
  }
  expect(screen.getByText("3 hours ago")).toBeTruthy()
  expect(screen.getByRole("tab", { name: /Skills/ })).toBeTruthy()
  expect(screen.getByRole("heading", { name: /acme\/big-skill/ })).toBeTruthy()
})
