import { readFile } from "node:fs/promises"
import path from "node:path"
import { parseRepoData, type RepoData } from "./repos"

export async function loadRepos(): Promise<RepoData | null> {
  try {
    const file = path.join(process.cwd(), "data", "repos.json")
    return parseRepoData(JSON.parse(await readFile(file, "utf8")))
  } catch {
    return null
  }
}
