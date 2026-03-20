import { useState } from 'react'

const NAV = [
  { id:'dashboard', ico:'◧', lbl:'Dashboard' },
  { id:'sales',     ico:'↑', lbl:'Sales',     sub:[{id:'new-sale',lbl:'New Invoice'},{id:'all-sales',lbl:'All Invoices'}] },
  { id:'purchases', ico:'↓', lbl:'Purchases', sub:[{id:'new-purchase',lbl:'New Purchase'},{id:'all-purchases',lbl:'All Purchases'}] },
  { id:'estimates', ico:'⊞', lbl:'Estimates', sub:[{id:'new-estimate',lbl:'New Estimate'},{id:'all-estimates',lbl:'All Estimates'}] },
  { id:'customers', ico:'◉', lbl:'Customers' },
  { id:'products',  ico:'◈', lbl:'Products',  sub:[{id:'add-product',lbl:'Add Product'},{id:'all-products',lbl:'All Products'}] },
  { id:'stock',     ico:'▦', lbl:'Stock' },
  { id:'reports',   ico:'▤', lbl:'Reports' },
  { id:'settings',  ico:'⚙', lbl:'Settings' },
  { id:'profile',   ico:'👤', lbl:'My Profile' },
]

export default function Sidebar({ page, setPage, user, company, onLogout }) {
  const [exp, setExp] = useState({ sales:true, purchases:false, estimates:false, products:false })
  const isActive = item => page===item.id || (item.sub && item.sub.some(s=>s.id===page))

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif"}} className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-xl">
      {/* Brand */}
      <div className="p-5 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          {company?.logo
            ? <img src={company.logo} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="logo"/>
            : <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0">S</div>
          }
          <div className="overflow-hidden">
            <div className="font-black text-sm leading-tight truncate" style={{fontFamily:"'Syne',sans-serif"}}>
              {company?.name || 'StockFlow Pro'}
            </div>
            <div className="text-xs text-slate-400 truncate">{user?.name}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(item => (
          <div key={item.id}>
            <button
              onClick={() => item.sub ? setExp(e=>({...e,[item.id]:!e[item.id]})) : setPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive(item) ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm w-4 text-center">{item.ico}</span>
                <span className="font-semibold">{item.lbl}</span>
              </div>
              {item.sub && <span className="text-xs opacity-50">{exp[item.id]?'▾':'›'}</span>}
            </button>
            {item.sub && exp[item.id] && (
              <div className="ml-7 mt-0.5 mb-1 border-l-2 border-white/20 pl-3 space-y-0.5">
                {item.sub.map(s => (
                  <button key={s.id} onClick={()=>setPage(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      page===s.id ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >{s.lbl}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      
    </div>
  )
}
