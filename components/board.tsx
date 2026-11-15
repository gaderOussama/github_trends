"use client"

import { Button } from "@ui-sdk/react/button"
import { Input } from "@ui-sdk/react/input"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { useState } from "react"
import { RepoRow } from "./repo-row"
import { CATEGORIES, filterRepos, type RepoData } from "./repos"

function Board({ data }: { data: RepoData }) {
  const [query, setQuery] = useState("")
  const [newOnly, setNewOnly] = useState(false)
  const filtering = query.trim() !== "" || newOnly

  return (
    <Tabs defaultValue="skills">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-60">
          <Input
            type="search"
            aria-label="Search repositories"
            placeholder="Search name, description or topic"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <label>
          <Switch checked={newOnly} onCheckedChange={setNewOnly}>
            <SwitchThumb />
          </Switch>
          New only
        </label>
      </div>

      <TabsList aria-label="Categories">
        {CATEGORIES.map(({ key, label }) => (
          <TabsTab key={key} value={key}>
            {label}
            <span className="num text-subtle">
              {filterRepos(data.categories[key], query, newOnly).length}
            </span>
          </TabsTab>
        ))}
      </TabsList>

      {CATEGORIES.map(({ key, label }) => {
        const repos = filterRepos(data.categories[key], query, newOnly)
        return (
          <TabsPanel key={key} value={key}>
            {repos.length > 0 ? (
              <ul className="repos">
                {repos.map((repo) => (
                  <RepoRow key={repo.fullName} repo={repo} />
                ))}
              </ul>
            ) : (
              <div className="empty">
                <p>
                  {filtering
                    ? `No ${label} repositories match your filters.`
                    : `No ${label} repositories yet. Run npm run fetch to refresh.`}
                </p>
                {filtering && (
                  <Button
                    onClick={() => {
                      setQuery("")
                      setNewOnly(false)
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </TabsPanel>
        )
      })}
    </Tabs>
  )
}

export { Board }
