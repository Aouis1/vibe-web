export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="flex flex-col items-center gap-8">
          <div className="skeleton w-72 h-72 rounded-full" />
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-2 w-64 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton w-12 h-7 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
