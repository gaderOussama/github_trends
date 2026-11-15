import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createAgent } from "@ui-sdk/react/agent"
import { describe, expect, test } from "vitest"
import { Board } from "../components/board"
import { data } from "./fixture"

function setup() {
  const user = userEvent.setup()
  render(<Board data={data} />)
  return user
}

const rowOf = (name: RegExp) =>
  screen.getByRole("heading", { name }).closest("li") as HTMLElement

describe("Board", () => {
  test("tabs carry names and counts, and the first one is selected", () => {
    setup()
    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Skills2",
      "MCP1",
      "Memory & Context0",
      "Agent tooling1",
    ])
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[1]).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tablist", { name: "Categories" })).toBeTruthy()
  })

  test("a repo shows link, stars, gain, language, at most 4 topics and install", () => {
    setup()
    const row = rowOf(/acme\/big-skill/)
    const link = within(row).getByRole("link", { name: /acme\/big-skill/ })
    expect(link).toHaveAttribute("href", "https://github.com/acme/big-skill")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
    expect(row).toHaveTextContent("12.3k")
    expect(row).toHaveTextContent("+420 today")
    expect(row).toHaveTextContent("Python")
    expect(row).toHaveTextContent("docs")
    expect(row).not.toHaveTextContent("fifth-topic")
    expect(row).toHaveTextContent("npx skills add acme/big-skill")
    expect(row).not.toHaveTextContent("NEW")
    expect(row).toHaveTextContent("WATCHED")
  })

  test("a new repo is marked and a repo without install has no copy button", async () => {
    const user = setup()
    expect(rowOf(/fresh\/tiny-skill/)).toHaveTextContent("NEW")
    await user.click(screen.getByRole("tab", { name: /MCP/ }))
    const mcp = rowOf(/acme\/db-server/)
    expect(mcp).toHaveTextContent("+15 this week")
    expect(within(mcp).queryByRole("button")).toBeNull()
  })

  test("search filters across tabs and updates counts", async () => {
    const user = setup()
    await user.type(
      screen.getByRole("searchbox", { name: "Search repositories" }),
      "sqlite"
    )
    expect(screen.getByRole("tab", { name: /Skills/ })).toHaveTextContent("0")
    expect(screen.getByRole("tab", { name: /MCP/ })).toHaveTextContent("1")
    expect(
      screen.getByText("No Skills repositories match your filters.")
    ).toBeTruthy()
  })

  test("New only filters, and Clear filters resets both filters", async () => {
    const user = setup()
    const toggle = screen.getByRole("switch", { name: "New only" })
    expect(toggle).toHaveAttribute("aria-checked", "false")
    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(screen.queryByRole("heading", { name: /acme\/big-skill/ })).toBeNull()
    expect(screen.getByRole("heading", { name: /fresh\/tiny-skill/ })).toBeTruthy()

    await user.click(screen.getByRole("tab", { name: /MCP/ }))
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(screen.getByRole("heading", { name: /acme\/db-server/ })).toBeTruthy()
  })

  test("an empty category without filters points at npm run fetch", async () => {
    const user = setup()
    await user.click(screen.getByRole("tab", { name: /Memory/ }))
    expect(screen.getByText(/npm run fetch/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull()
  })

  test("Space toggles New only, and arrows move between tabs", async () => {
    const user = setup()
    const toggle = screen.getByRole("switch", { name: "New only" })
    toggle.focus()
    await user.keyboard(" ")
    expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(toggle).not.toHaveAttribute("aria-disabled")

    screen.getByRole("tab", { name: /Skills/ }).focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: /MCP/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  test("Copy puts the command on the clipboard and says Copied briefly", async () => {
    const user = setup()
    const button = screen.getByRole("button", {
      name: "Copy acme/big-skill install command",
    })
    expect(button).toHaveTextContent("Copy")
    await user.click(button)
    expect(await navigator.clipboard.readText()).toBe(
      "npx skills add acme/big-skill"
    )
    expect(button).toHaveTextContent("Copied")
    await new Promise((r) => setTimeout(r, 1800))
    expect(button).not.toHaveTextContent("Copied")
  })

  test("an agent can find and change every control", async () => {
    const agent = createAgent()
    render(<Board data={data} />)

    const entries = agent
      .snapshot()
      .filter((entry) => !entry.offPage && entry.component !== "more")
    for (const entry of entries) {
      expect(
        entry.label,
        `${entry.component} ${entry.ref} has no name`
      ).toBeTruthy()
    }
    const labels = entries.map((entry) => entry.label)
    for (const label of [
      "Search repositories",
      "New only",
      "Categories",
      "Copy acme/big-skill install command",
      "Copy fresh/tiny-skill install command",
    ]) {
      expect(labels.join("|"), `${label} is missing`).toContain(label)
    }

    const result = await agent.act({
      steps: [
        { ref: "Search repositories", action: "setValue", args: ["fresh"] },
        { ref: "New only", action: "setChecked", args: [true] },
      ],
    })
    expect(result.ok, result.error?.message).toBe(true)
    expect(
      screen.getByRole<HTMLInputElement>("searchbox", {
        name: "Search repositories",
      }).value
    ).toBe("fresh")
    expect(screen.getByRole("switch", { name: "New only" })).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(screen.queryByRole("heading", { name: /acme\/big-skill/ })).toBeNull()
  })
})
