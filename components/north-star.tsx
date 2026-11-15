export function NorthStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        opacity="0.55"
        d="M10.3 10.3 L16 14.6 L21.7 10.3 L17.4 16 L21.7 21.7 L16 17.4 L10.3 21.7 L14.6 16 Z"
      />
      <path d="M16 1 L18 14 L27 16 L18 18 L16 31 L14 18 L5 16 L14 14 Z" />
    </svg>
  )
}
