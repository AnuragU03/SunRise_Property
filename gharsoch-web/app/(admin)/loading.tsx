export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
        <p className="mt-4 text-sm text-ink-3">Loading...</p>
      </div>
    </div>
  )
}
