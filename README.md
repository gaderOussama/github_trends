# GitHub Trends

A daily list of rising GitHub repos that make AI agents better: **Claude skills**, **MCP servers**, **memory & context** tools and **agent tooling** (token savers, gateways, code intelligence).

- Four tabs: Skills, MCP, Memory & Context, Agent tooling
- Star totals, stars gained today or this week, and a **NEW** mark for repos not seen before
- Copy-ready `npx skills add owner/repo` commands for skills
- Search, a "New only" filter, and system / light / dark themes
- Data refreshes every day through a GitHub Action

Built with Next.js, React 19 and [ui-sdk](https://ui-sdk.dev).

## Run it locally

```bash
npm install
npm run fetch   # collect fresh repos into data/repos.json (~2.5 min)
npm run dev     # http://localhost:3000
```

`npm run fetch` uses `GITHUB_TOKEN` if set, otherwise your `gh auth token`, otherwise unauthenticated (slower).

## How the data works

`scripts/fetch.mjs` has no dependencies. It:

1. Searches the GitHub API by topics and keywords for each category (recently pushed and recently created repos).
2. Reads github.com/trending (daily and weekly) and keeps matching repos.
3. Always includes the repos on the `WATCHLIST` at the top of the script.
4. Filters noise, caps each category at 30, and writes `data/repos.json`.
5. Keeps `data/seen.json` (for the NEW mark) and `data/history.json` (daily star snapshots used for weekly gains).

To follow your own niche, edit `QUERIES`, `KEYWORDS` and `WATCHLIST` at the top of the script.

## Automation

- `.github/workflows/ci.yml` runs lint, tests and the build on every push and pull request.
- `.github/workflows/fetch.yml` runs the fetch every day at 06:00 UTC (or on demand) and commits the new data.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run fetch` | Refresh the data |
| `npm test` | Run the tests |
| `npm run lint` | Lint |
| `npm run build` | Production build |
