import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createAgent } from "@ui-sdk/react/agent"
import { expect, test } from "vitest"
import { ThemeControl } from "../components/theme-control"

const html = document.documentElement

test("offers System, Light and Dark, with System checked by default", () => {
  render(<ThemeControl />)
  expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeTruthy()
  expect(screen.getAllByRole("radio")).toHaveLength(3)
  expect(screen.getByRole("radio", { name: "System" })).toBeChecked()
  expect(screen.getByRole("radio", { name: "Light" })).not.toBeChecked()
  expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked()
})

test("choosing Dark or Light sets data-theme and persists; System clears both", async () => {
  const user = userEvent.setup()
  render(<ThemeControl />)

  await user.click(screen.getByRole("radio", { name: "Dark" }))
  expect(html.dataset.theme).toBe("dark")
  expect(localStorage.getItem("theme")).toBe("dark")
  expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked()

  await user.click(screen.getByRole("radio", { name: "Light" }))
  expect(html.dataset.theme).toBe("light")
  expect(localStorage.getItem("theme")).toBe("light")

  await user.click(screen.getByRole("radio", { name: "System" }))
  expect(html.dataset.theme).toBeUndefined()
  expect(localStorage.getItem("theme")).toBeNull()
})

test("starts from the theme the inline script already applied", () => {
  html.dataset.theme = "dark"
  render(<ThemeControl />)
  expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked()
})

test("arrow keys change the theme", async () => {
  const user = userEvent.setup()
  render(<ThemeControl />)
  await user.tab()
  await user.keyboard("{ArrowRight}")
  expect(html.dataset.theme).toBe("light")
})

test("still switches when localStorage throws", async () => {
  const user = userEvent.setup()
  const original = Storage.prototype.setItem
  Storage.prototype.setItem = () => {
    throw new Error("blocked")
  }
  try {
    render(<ThemeControl />)
    await user.click(screen.getByRole("radio", { name: "Dark" }))
    expect(html.dataset.theme).toBe("dark")
  } finally {
    Storage.prototype.setItem = original
  }
})

test("an agent can find and set the theme", async () => {
  const agent = createAgent()
  render(<ThemeControl />)
  const labels = agent
    .snapshot()
    .filter((e) => !e.offPage)
    .map((e) => e.label)
  expect(labels).toContain("Theme")
  const result = await agent.act({
    steps: [{ ref: "Theme", action: "setValue", args: ["dark"] }],
  })
  expect(result.ok, result.error?.message).toBe(true)
  expect(html.dataset.theme).toBe("dark")
})
