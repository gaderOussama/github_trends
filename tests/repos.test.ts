import { describe, expect, test } from "vitest"
import {
  filterRepos,
  formatCount,
  formatRelative,
  parseRepoData,
} from "../components/repos"
import { data } from "./fixture"

describe("formatCount", () => {
  test.each([
    [0, "0"],
    [999, "999"],
    [1000, "1k"],
    [12345, "12.3k"],
    [48210, "48.2k"],
    [1_250_000, "1.3M"],
  ])("%i -> %s", (n, expected) => {
    expect(formatCount(n)).toBe(expected)
  })
})

describe("formatRelative", () => {
  const now = Date.parse("2026-11-15T12:00:00Z")
  test.each([
    ["2026-11-15T11:59:50Z", "just now"],
    ["2026-11-15T11:59:00Z", "1 minute ago"],
    ["2026-11-15T11:15:00Z", "45 minutes ago"],
    ["2026-11-15T09:00:00Z", "3 hours ago"],
    ["2026-11-13T12:00:00Z", "2 days ago"],
    ["2026-11-16T12:00:00Z", "just now"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatRelative(iso, now)).toBe(expected)
  })
})

describe("filterRepos", () => {
  const skills = data.categories.skills
  test("matches name, description and topics, case-insensitively", () => {
    expect(filterRepos(skills, "BIG", false)).toHaveLength(1)
    expect(filterRepos(skills, "documents", false)).toHaveLength(1)
    expect(filterRepos(skills, "fifth", false)).toHaveLength(1)
    expect(filterRepos(skills, "nothing-matches", false)).toHaveLength(0)
  })
  test("newOnly keeps only new repos and combines with the query", () => {
    expect(filterRepos(skills, "", true).map((r) => r.fullName)).toEqual([
      "fresh/tiny-skill",
    ])
    expect(filterRepos(skills, "big", true)).toHaveLength(0)
  })
  test("a blank query keeps everything", () => {
    expect(filterRepos(skills, "   ", false)).toHaveLength(2)
  })
})

describe("parseRepoData", () => {
  test("accepts the fixture shape", () => {
    expect(parseRepoData(data)).toEqual(data)
  })
  test.each([
    ["null", null],
    ["a string", "x"],
    ["no categories", { generatedAt: "2026-11-15T00:00:00Z" }],
    ["bad date", { generatedAt: "nope", categories: data.categories }],
    [
      "a missing category",
      { generatedAt: "2026-11-15T00:00:00Z", categories: { skills: [] } },
    ],
  ])("rejects %s", (_name, value) => {
    expect(parseRepoData(value)).toBeNull()
  })
  test("drops malformed repos and fills defaults", () => {
    const parsed = parseRepoData({
      generatedAt: "2026-11-15T00:00:00Z",
      categories: {
        skills: [{ fullName: "a/b", url: "https://x", stars: 1 }, { fullName: 3 }],
        mcp: [],
        memory: [],
      },
    })
    expect(parsed?.categories.tooling).toEqual([])
    expect(parsed?.categories.skills).toEqual([
      expect.objectContaining({
        fullName: "a/b",
        topics: [],
        isNew: false,
        watched: false,
        install: null,
        source: "trending",
      }),
    ])
  })
})
