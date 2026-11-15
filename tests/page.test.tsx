import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import Home from "../app/page"

vi.mock("../components/dashboard", () => ({ Dashboard: () => null }))

test("footer credits Oussama Gader with a new-tab LinkedIn link", () => {
  render(<Home />)
  const link = screen.getByRole("link", { name: /Oussama Gader/ })
  expect(link).toHaveAttribute("href", expect.stringContaining("linkedin.com/in/"))
  expect(link).toHaveAttribute("target", "_blank")
  expect(link).toHaveAttribute("rel", "noopener noreferrer")
  expect(screen.getByRole("contentinfo")).toContainElement(link)
})
