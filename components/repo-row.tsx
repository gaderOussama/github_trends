import { CopyButton } from "./copy-button"
import { formatCount, type Repo } from "./repos"

function RepoRow({ repo }: { repo: Repo }) {
  const gained =
    repo.starsGained !== null && repo.gainedPeriod
      ? `+${formatCount(repo.starsGained)} ${repo.gainedPeriod === "today" ? "today" : "this week"}`
      : null

  return (
    <li className="repo">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="min-w-0 break-words text-base font-medium">
          <a href={repo.url} target="_blank" rel="noopener noreferrer">
            {repo.fullName}{" "}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </h3>
        {repo.isNew && <span className="badge">NEW</span>}
        {repo.watched && <span className="badge">WATCHED</span>}
        <p className="num flex sm:ml-auto flex-wrap items-baseline gap-x-3 text-sm">
          <span>
            <span aria-hidden="true">★</span>{" "}
            <span className="sr-only">Stars{" "}</span>
            {formatCount(repo.stars)}
          </span>
          {gained && <span className="text-subtle">{gained}</span>}
        </p>
      </div>

      {repo.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-subtle">
          {repo.description}
        </p>
      )}

      {(repo.language || repo.topics.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {repo.language && <span>{repo.language}</span>}
          {repo.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="tag">
              {topic}
            </span>
          ))}
        </div>
      )}

      {repo.install && (
        <div className="mt-3 flex items-center gap-2">
          <code className="command">{repo.install}</code>
          <CopyButton
            text={repo.install}
            label={`${repo.fullName} install command`}
          />
        </div>
      )}
    </li>
  )
}

export { RepoRow }
