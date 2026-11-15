import { connection } from "next/server"
import { Board } from "./board"
import { loadRepos } from "./load-repos"
import { formatRelative } from "./repos"

const updatedAgo = (iso: string) => formatRelative(iso, Date.now())

async function Dashboard() {
  // Read at request time, so a fresh `npm run fetch` shows up without a rebuild.
  await connection()
  const data = await loadRepos()

  if (!data) {
    return (
      <div className="empty">
        <p>No data yet. Run npm run fetch to load trending repositories.</p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 text-sm text-subtle">
        Updated{" "}
        <time dateTime={data.generatedAt}>
          {updatedAgo(data.generatedAt)}
        </time>
      </p>
      <Board data={data} />
    </>
  )
}

export { Dashboard }
