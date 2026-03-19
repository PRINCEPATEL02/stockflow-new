export const Inp = ({ label, className='', textarea=false, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
    {textarea
      ? <textarea className={`border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white resize-none ${className}`} {...p}/>
      : <input    className={`border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white ${className}`} {...p}/>
    }
  </div>
)

export const Sel = ({ label, children, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
    <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" {...p}>{children}</select>
  </div>
)

export const Btn = ({ children, v='pri', sz='md', className='', ...p }) => {
  const vs={pri:'bg-violet-600 text-white hover:bg-violet-700 shadow-sm',sec:'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',dan:'bg-red-500 text-white hover:bg-red-600',grn:'bg-emerald-500 text-white hover:bg-emerald-600',org:'bg-orange-500 text-white hover:bg-orange-600',gst:'text-slate-600 hover:bg-slate-100'}
  const ss={sm:'px-3 py-1.5 text-xs',md:'px-4 py-2 text-sm',lg:'px-6 py-2.5 text-sm'}
  return <button className={`font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${vs[v]} ${ss[sz]} ${className}`} {...p}>{children}</button>
}

export const Card = ({ children, className='' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
)

export const Bdg = ({ children, c='slate' }) => {
  const cs={slate:'bg-slate-100 text-slate-600',blue:'bg-blue-50 text-blue-700',green:'bg-emerald-50 text-emerald-700',red:'bg-red-50 text-red-600',yellow:'bg-yellow-50 text-yellow-700',violet:'bg-violet-50 text-violet-700',orange:'bg-orange-50 text-orange-700'}
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cs[c]||cs.slate}`}>{children}</span>
}

export const Modal = ({ title, onClose, children, w='max-w-3xl', open=true }) => {
  if (!open) return null
  return (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
    <div className={`bg-white rounded-2xl ${w} w-full my-4`} onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
        <h2 className="text-base font-black text-slate-800">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 text-xl">×</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)}

export const PageHeader = ({ title, actions }) => (
  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
    <h1 className="text-2xl font-black text-slate-800">{title}</h1>
    <div className="flex gap-2 flex-wrap">{actions}</div>
  </div>
)

export const EmptyState = ({ icon, msg }) => (
  <div className="text-center py-16 text-slate-400">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="text-sm">{msg}</p>
  </div>
)

export const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"/>
  </div>
)

export const ErrBanner = ({ msg, onClose }) => msg ? (
  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
    <span>{msg}</span>
    {onClose && <button onClick={onClose} className="ml-3 text-red-400 font-bold text-lg leading-none">×</button>}
  </div>
) : null
