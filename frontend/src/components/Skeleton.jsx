// Skeleton loaders for better loading experience
// These provide a more modern, polished loading state than spinners

// Base skeleton component
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  )
}

// Table row skeleton
export function SkeletonTableRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
      <td className="py-3 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    </tr>
  )
}

// Table skeleton
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Invoice</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Customer</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Date</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Amount</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Card skeleton for dashboard/stats
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

// Stats grid skeleton
export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Chart skeleton
export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-5">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-end gap-3" style={{ height: '150px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
              <Skeleton className="flex-1 rounded-t-lg" />
              <Skeleton className="flex-1 rounded-t-lg" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

// List item skeleton
export function SkeletonListItem() {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

// Form skeleton
export function SkeletonForm({ fields = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

// Page skeleton
export function SkeletonPage() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <SkeletonCard />
      <SkeletonTable rows={8} />
    </div>
  )
}

// Detail skeleton
export function SkeletonDetail() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonForm fields={4} />
        <SkeletonForm fields={4} />
      </div>
    </div>
  )
}

// Button skeleton
export function SkeletonButton() {
  return <Skeleton className="h-10 w-24 rounded-lg" />
}

// Input skeleton
export function SkeletonInput() {
  return <Skeleton className="h-10 w-full rounded-lg" />
}

// Badge skeleton
export function SkeletonBadge() {
  return <Skeleton className="h-6 w-16 rounded-full" />
}
