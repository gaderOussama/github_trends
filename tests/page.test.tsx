import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import Home from "../app/page"

vi.mock("../components/dashboard", () => ({ Dashboard: () => null }))

test("footer credits Oussama Gader with portfolio and LinkedIn links", () => {
  render(<Home />)
  expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
    "href",
    expect.stringContaining("linkedin.com/in/")
  )
  const link = screen.getByRole("link", { name: /Oussama Gader/ })
  expect(link).toHaveAttribute("href", "https://www.oussamagader.tech/")
  expect(link).toHaveAttribute("target", "_blank")
  expect(link).toHaveAttribute("rel", "noopener noreferrer")
  expect(screen.getByRole("contentinfo")).toContainElement(link)
})
