"use client"

import { Button } from "@ui-sdk/react/button"
import { useEffect, useRef, useState } from "react"

type Status = "idle" | "copied" | "failed"

function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<Status>("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus("idle"), 1600)
  }

  const visible =
    status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy"

  return (
    <>
      <Button onClick={copy} className="shrink-0">
        {visible}{" "}
        <span className="sr-only">{label}</span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? "Copied to clipboard" : ""}
      </span>
    </>
  )
}

export { CopyButton }
