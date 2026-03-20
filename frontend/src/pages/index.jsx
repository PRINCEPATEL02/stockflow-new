import { useState, useEffect, useRef } from 'react'
import {
  dashboard as dashApi, sales as salesApi, purchases as purchApi,
  estimates as estApi, customers as custApi, products as prodApi,
  rawMaterials as rawMatApi, reports as repApi,
  company as coApi, auth
} from '../utils/api'
import { TEMPLATES } from '../components/BillTemplates'
import { genId, fc, fd, todayStr, calcTotals, numToWords, STATES, GST_RATES, UNITS } from '../utils/helpers'
import { Inp, Sel, Btn, Card, Bdg, Modal, PageHeader, EmptyState, Spinner, ErrBanner } from '../components/ui'
import BillPreview from '../components/BillPreview'


export function Dashboard({ setPage }) {
  const [data, setData] = useState(null)
  useEffect(() => { dashApi.stats().then(setData).catch(console.error) }, [])
  if (!data) return <Spinner/>

  const { totSales, totPurch, profit, custCount, prodCount, unpaidCount, pendEst, productionCapacity=[], rawMaterialsStock=[], recentSales=[], months=[] } = data
  const maxV = Math.max(...months.map(m=>Math.max(m.s,m.p)), 1)

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" actions={<>
        <Btn v="sec" sz="sm" onClick={()=>setPage('new-estimate')}>+ Estimate</Btn>
        <Btn v="sec" sz="sm" onClick={()=>setPage('new-purchase')}>+ Purchase</Btn>
        <Btn sz="sm" onClick={()=>setPage('new-sale')}>+ New Invoice</Btn>
      </>}/>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {lbl:'Total Revenue',   val:fc(totSales),  ico:'↑',bg:'bg-emerald-50',tc:'text-emerald-600',bc:'border-emerald-100'},
          {lbl:'Total Purchases', val:fc(totPurch),  ico:'↓',bg:'bg-blue-50',   tc:'text-blue-600',   bc:'border-blue-100'},
          {lbl:'Net Profit',      val:fc(profit),    ico:'₹',bg:profit>=0?'bg-violet-50':'bg-red-50',tc:profit>=0?'text-violet-600':'text-red-600',bc:profit>=0?'border-violet-100':'border-red-100'},
          {lbl:'Customers',       val:custCount,     ico:'◉',bg:'bg-purple-50', tc:'text-purple-600', bc:'border-purple-100'},
          {lbl:'Products',        val:prodCount,     ico:'◈',bg:'bg-orange-50', tc:'text-orange-600', bc:'border-orange-100'},
          {lbl:'Unpaid Invoices', val:unpaidCount,   ico:'⊡',bg:'bg-yellow-50', tc:'text-yellow-600', bc:'border-yellow-100'},
        ].map(s=>(
          <Card key={s.lbl} className={`p-5 border ${s.bc}`}>
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.lbl}</p>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${s.bg} ${s.tc}`}>{s.ico}</span>
            </div>
            <div className={`text-2xl font-black ${s.tc}`}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-black text-slate-700">Sales vs Purchases — Last 6 Months</h2>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 bg-violet-500 rounded-sm inline-block"></span>Sales</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 bg-orange-400 rounded-sm inline-block"></span>Purchases</span>
          </div>
        </div>
        <div className="flex items-end gap-3" style={{height:'150px'}}>
          {months.map(m=>(
            <div key={m.lbl} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{height:'120px'}}>
                <div className="flex-1 bg-violet-500 rounded-t-lg hover:bg-violet-600 transition-colors" style={{height:`${(m.s/maxV)*100}%`,minHeight:m.s>0?'3px':'0'}} title={`Sales: ${fc(m.s)}`}/>
                <div className="flex-1 bg-orange-400 rounded-t-lg hover:bg-orange-500 transition-colors" style={{height:`${(m.p/maxV)*100}%`,minHeight:m.p>0?'3px':'0'}} title={`Purchases: ${fc(m.p)}`}/>
              </div>
              <span className="text-xs text-slate-400 font-medium">{m.lbl}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Raw Materials Stock */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-slate-700">🧱 Raw Materials</h2>
            <button className="text-xs text-violet-600 font-bold hover:underline" onClick={()=>setPage('stock')}>View →</button>
          </div>
          {rawMaterialsStock.length===0 ? (
            <div className="text-center py-8"><div className="text-4xl mb-2">🧱</div><p className="text-xs text-slate-500 font-semibold">No raw materials</p></div>
          ) : (
            <div className="space-y-2">
              {rawMaterialsStock.slice(0,10).map(p=>(
                <div key={p._id} className={`flex justify-between items-center p-2.5 rounded-xl ${p.stock===0?'bg-red-50':p.stock<=5?'bg-yellow-50':'bg-emerald-50'}`}>
                  <span className="text-xs font-semibold text-slate-700 truncate">{p.name}</span>
                  <Bdg c={p.stock===0?'red':p.stock<=5?'yellow':'green'}>{p.stock} {p.unit}</Bdg>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Production Capacity */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-slate-700">📦 Production Capacity</h2>
            <button className="text-xs text-violet-600 font-bold hover:underline" onClick={()=>setPage('products')}>View →</button>
          </div>
          {productionCapacity.length===0 ? (
            <div className="text-center py-8"><div className="text-4xl mb-2">📦</div><p className="text-xs text-slate-500 font-semibold">No products with BOM</p></div>
          ) : (
            <div className="space-y-2">
              {productionCapacity.slice(0,10).map(p=>(
                <div key={p._id} className={`flex justify-between items-center p-2.5 rounded-xl ${p.canMake===0?'bg-red-50':p.canMake<=5?'bg-yellow-50':'bg-emerald-50'}`}>
                  <div className="truncate max-w-[140px]">
                    <span className="text-xs font-semibold text-slate-700 block truncate">{p.name}</span>
                    <span className="text-xs text-slate-400">Limiting: {p.limitingMaterial}</span>
                  </div>
                  <Bdg c={p.canMake===0?'red':p.canMake<=5?'yellow':'green'}>{p.canMake} {p.unit}</Bdg>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BILL FORM (Invoice + Estimate)
// ═══════════════════════════════════════════════════════════════════════════════
export function BillForm({ type, setPage, company }) {
  const isEst = type === 'estimate'
  const [customers, setCustomers] = useState([])
  const [productList, setProductList] = useState([])
  const [f, setF] = useState({
    date:todayStr(), dueDate:'', validTill:'', customerId:'',
    items:[{id:genId(),productId:'',productName:'',hsnCode:'',qty:1,unit:'pcs',price:0,gstRate:18}],
    notes:'', terms:company?.defaultTerms||'Payment due within 30 days.', disc:0, status:'unpaid',
    templateId: company?.defaultTemplate || 'classic-tally',
    declaration: company?.declaration || '',
    placeOfSupply: ''
  })
  const [preview, setPreview] = useState(null)
  const [saved,   setSaved]   = useState(null)
  const [err,     setErr]     = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(()=>{
    custApi.list().then(setCustomers).catch(()=>{})
    prodApi.list().then(setProductList).catch(()=>{})
  },[])

  // Update template from company settings
  useEffect(()=>{
    if (company?.defaultTemplate && !f.templateId) {
      setF(x => ({ ...x, templateId: company.defaultTemplate }))
    }
    if (company?.declaration && !f.declaration) {
      setF(x => ({ ...x, declaration: company.declaration }))
    }
    if (company?.defaultTerms && !f.terms) {
      setF(x => ({ ...x, terms: company.defaultTerms }))
    }
  }, [company])

  const cust    = customers.find(c=>c._id===f.customerId)
  const isIntra = !!(cust && company?.state && cust.state===company.state)
  const {sub,cgst,sgst,igst} = calcTotals(f.items, isIntra)
  const taxTotal = cgst+sgst+igst
  const discAmt  = (sub*(f.disc||0))/100
  const grand    = sub+taxTotal-discAmt

  const upd = (k,v) => setF(x=>({...x,[k]:v}))
  const updItem = (idx,k,v) => {
    const items=[...f.items]; items[idx]={...items[idx],[k]:v}
    if(k==='productId'){
      const p=productList.find(pr=>pr._id===v)
      if(p) items[idx]={...items[idx],productName:p.name,price:p.price||0,unit:p.unit||'pcs',gstRate:p.gstRate||18}
    }
    setF(x=>({...x,items}))
  }
  const addItem = ()=>setF(x=>({...x,items:[...x.items,{id:genId(),productId:'',productName:'',hsnCode:'',qty:1,unit:'pcs',price:0,gstRate:18}]}))
  const remItem = idx=>setF(x=>({...x,items:x.items.filter((_,i)=>i!==idx)}))

  const buildPayload = () => ({
    date:f.date, ...(isEst?{validTill:f.validTill}:{dueDate:f.dueDate}),
    customerId:f.customerId||null, customerName:cust?.name||'', customer:cust||{},
    billTo: cust ? { name:cust.name, address:cust.address, state:cust.state, gstin:cust.gstin } : {},
    shipTo: cust ? { name:cust.name, address:cust.address, state:cust.state, gstin:cust.gstin } : {},
    items:f.items.map(i=>({...i,productId:i.productId||null})),
    sub, cgst, sgst, igst, discPct:f.disc||0, discAmt, total:grand,
    isIntra, status:f.status, notes:f.notes, terms:f.terms, type,
    templateId: f.templateId,
    declaration: f.declaration || company?.declaration || '',
    placeOfSupply: f.placeOfSupply || cust?.state || ''
  })

  const doSave = async () => {
    setErr(''); setSaving(true)
    try {
      const res = isEst ? await estApi.create(buildPayload()) : await salesApi.create(buildPayload())
      setSaved(res)
    } catch(e){ setErr(e.message) }
    finally { setSaving(false) }
  }

  if (saved) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">{isEst?'Estimate':'Invoice'} Created!</h2>
      <p className="text-slate-500 mb-6">#{saved.invoiceNo||saved.estimateNo} · {fc(saved.total)}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Btn onClick={()=>setPreview({...saved,company,isIntra:saved.isIntra,type})}>🖨 Preview & Print</Btn>
        <Btn v="sec" onClick={()=>setPage(isEst?'all-estimates':'all-sales')}>View All</Btn>
        <Btn v="sec" onClick={()=>setSaved(null)}>Create Another</Btn>
      </div>
      {preview && <BillPreview data={preview} onClose={()=>setPreview(null)}/>}
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader title={`New ${isEst?'Estimate':'Invoice'}`} actions={<>
        <Btn v="sec" sz="sm" onClick={()=>setPreview({...buildPayload(),invoiceNo:'PREVIEW',company,isIntra})}>Preview</Btn>
        <Btn sz="sm" onClick={doSave} disabled={saving}>{saving?'Saving…':'Save & Generate'}</Btn>
      </>}/>
      <ErrBanner msg={err} onClose={()=>setErr('')}/>

      {!isEst && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl text-sm">
          <span className="text-lg">📦</span>
          <span className="text-violet-800 font-semibold">Invoice items are <strong>Finished Products only.</strong></span>
          <span className="text-violet-600">Raw materials are purchased, not sold directly.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isEst
          ? <Inp label="Valid Till" type="date" value={f.validTill} onChange={e=>upd('validTill',e.target.value)}/>
          : <Inp label="Due Date"   type="date" value={f.dueDate}   onChange={e=>upd('dueDate',e.target.value)}/>
        }
        <Sel label="Customer" value={f.customerId} onChange={e=>upd('customerId',e.target.value)}>
          <option value="">— Select Customer —</option>
          {customers.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
        </Sel>
        <Inp label="Discount %" type="number" min="0" max="100" value={f.disc} onChange={e=>upd('disc',parseFloat(e.target.value)||0)}/>
        {!isEst && <Sel label="Invoice Template" value={f.templateId} onChange={e=>upd('templateId',e.target.value)}>
          <option value="classic-tally">📋 Classic Tally</option>
          <option value="modern-itc">💳 Modern ITC</option>
          <option value="premium-tata">👑 Premium TATA</option>
          <option value="simple-gst">📄 Simple GST</option>
        </Sel>}
      </div>

      {cust && (
        <Card className="p-4 bg-violet-50 border border-violet-100">
          <div className="flex flex-wrap gap-5 text-sm">
            {[['Customer',cust.name],['Mobile',cust.mobile||'—'],['State',cust.state||'—'],['GSTIN',cust.gstin||'N/A']].map(([l,v])=>(
              <div key={l}><span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-0.5">{l}</span><span className="font-bold text-slate-800">{v}</span></div>
            ))}
            <div><span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-0.5">GST Type</span>
              <Bdg c={isIntra?'green':'blue'}>{isIntra?'⚡ Intra (CGST+SGST)':'🌐 Inter (IGST)'}</Bdg>
            </div>
            <div className="ml-auto">
              <Inp label="Place of Supply" value={f.placeOfSupply || cust.state || ''} onChange={e=>upd('placeOfSupply',e.target.value)} placeholder="State name"/>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-black text-slate-700">Line Items</h2>
          <Btn v="sec" sz="sm" onClick={addItem}>+ Add Row</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Product / Description','HSN/SAC','Qty','Unit','Rate (₹)','GST%','Taxable','Tax','Total',''].map(h=>(
                <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {f.items.map((item,idx)=>{
                const taxable=(item.qty||0)*(item.price||0)
                const taxAmt=taxable*(item.gstRate||0)/100
                return (
                  <tr key={item.id} className="border-t border-slate-50 hover:bg-slate-50/40">
                    <td className="px-2 py-2 min-w-[180px]">
                      <select className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" value={item.productId} onChange={e=>updItem(idx,'productId',e.target.value)}>
                        <option value="">— Select Product —</option>
                        {productList.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Or type description" value={item.productName} onChange={e=>updItem(idx,'productName',e.target.value)}/>
                    </td>
                    <td className="px-1 py-2"><input type="text" className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="HSN" value={item.hsnCode || ''} onChange={e=>updItem(idx,'hsnCode',e.target.value)}/></td>
                    <td className="px-2 py-2"><input type="number" min="0" className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-400" value={item.qty} onChange={e=>updItem(idx,'qty',parseFloat(e.target.value)||0)}/></td>
                    <td className="px-2 py-2"><select className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-xs bg-white" value={item.unit} onChange={e=>updItem(idx,'unit',e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
                    <td className="px-2 py-2"><input type="number" min="0" className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" value={item.price} onChange={e=>updItem(idx,'price',parseFloat(e.target.value)||0)}/></td>
                    <td className="px-2 py-2"><select className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-xs bg-white" value={item.gstRate} onChange={e=>updItem(idx,'gstRate',parseFloat(e.target.value))}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
                    <td className="px-3 py-2 text-sm text-slate-500">{fc(taxable)}</td>
                    <td className="px-3 py-2 text-sm text-slate-500">{fc(taxAmt)}</td>
                    <td className="px-3 py-2 text-sm font-bold text-slate-700">{fc(taxable+taxAmt)}</td>
                    <td className="px-2 py-2"><button onClick={()=>remItem(idx)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs font-bold">×</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-5 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fc(sub)}</span></div>
            {isIntra?<><div className="flex justify-between text-slate-600"><span>CGST</span><span>{fc(cgst)}</span></div><div className="flex justify-between text-slate-600"><span>SGST</span><span>{fc(sgst)}</span></div></>:<div className="flex justify-between text-slate-600"><span>IGST</span><span>{fc(igst)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Total Tax</span><span>{fc(taxTotal)}</span></div>
            {f.disc>0&&<div className="flex justify-between text-red-500"><span>Discount ({f.disc}%)</span><span>-{fc(discAmt)}</span></div>}
            <div className="flex justify-between font-black text-base border-t-2 border-violet-200 pt-3 mt-1 text-violet-700"><span>Grand Total</span><span>{fc(grand)}</span></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Inp label="Notes" textarea className="h-24" value={f.notes} onChange={e=>upd('notes',e.target.value)} placeholder="Thank you for your business!"/>
        <Inp label="Terms & Conditions" textarea className="h-24" value={f.terms} onChange={e=>upd('terms',e.target.value)}/>
        <Inp label="Declaration" textarea className="h-24" value={f.declaration || company?.declaration || ''} onChange={e=>upd('declaration',e.target.value)} placeholder="We declare that this invoice..."/>
      </div>
      {preview && <BillPreview data={preview} onClose={()=>setPreview(null)}/>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE FORM
// ═══════════════════════════════════════════════════════════════════════════════
export function PurchaseForm({ setPage }) {
  const [rawList,setRawList]=useState([])
  const [f,setF]=useState({date:todayStr(),supplierName:'',supplierGstin:'',billNo:'',items:[{id:genId(),rawMaterialId:'',productName:'',qty:1,unit:'kg',price:0,gstRate:18}],notes:'',status:'paid'})
  const [saved,setSaved]=useState(false)
  const [err,setErr]=useState('')
  const [saving,setSaving]=useState(false)

  useEffect(()=>{ rawMatApi.list().then(setRawList).catch(()=>{}) },[])

  const {sub,cgst,sgst,total}=calcTotals(f.items,true)
  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const updItem=(idx,k,v)=>{
    const items=[...f.items]; items[idx]={...items[idx],[k]:v}
    if(k==='rawMaterialId'){ const m=rawList.find(r=>r._id===v); if(m) items[idx]={...items[idx],productName:m.name,unit:m.unit||'kg',gstRate:m.gstRate||18,price:m.costPrice||0} }
    setF(x=>({...x,items}))
  }
  const addItem=()=>setF(x=>({...x,items:[...x.items,{id:genId(),rawMaterialId:'',productName:'',qty:1,unit:'kg',price:0,gstRate:18}]}))
  const remItem=idx=>setF(x=>({...x,items:x.items.filter((_,i)=>i!==idx)}))

  const doSave=async()=>{
    setErr(''); setSaving(true)
    try {
      await purchApi.create({date:f.date,supplierName:f.supplierName,supplierGstin:f.supplierGstin,billNo:f.billNo,items:f.items.map(i=>({...i,rawMaterialId:i.rawMaterialId||null,productId:null})),sub,cgst,sgst,igst:0,total,status:f.status,notes:f.notes})
      setSaved(true)
    } catch(e){ setErr(e.message) }
    finally { setSaving(false) }
  }

  if(saved) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Purchase Recorded!</h2>
      <p className="text-slate-500 mb-6">Raw material stock updated automatically.</p>
      <div className="flex gap-3 justify-center">
        <Btn onClick={()=>setPage('all-purchases')}>View All Purchases</Btn>
        <Btn v="sec" onClick={()=>setSaved(false)}>Add Another</Btn>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader title="New Purchase" actions={<Btn sz="sm" onClick={doSave} disabled={saving}>{saving?'Saving…':'Save Purchase'}</Btn>}/>
      <ErrBanner msg={err} onClose={()=>setErr('')}/>

      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
        <span className="text-lg">🧱</span>
        <span className="text-amber-800 font-semibold">Purchase is for <strong>Raw Materials only.</strong></span>
        <span className="text-amber-600">Go to Products page to manage raw materials inventory.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Inp label="Date" type="date" value={f.date} onChange={e=>upd('date',e.target.value)}/>
        <Inp label="Supplier Bill No." value={f.billNo} onChange={e=>upd('billNo',e.target.value)} placeholder="e.g. SUP-001"/>
        <Inp label="Supplier Name" value={f.supplierName} onChange={e=>upd('supplierName',e.target.value)} placeholder="Vendor name"/>
        <Inp label="Supplier GSTIN" value={f.supplierGstin} onChange={e=>upd('supplierGstin',e.target.value)} placeholder="Optional"/>
      </div>
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-black text-slate-700 flex items-center gap-2">🧱 Raw Material Items</h2>
          <Btn v="sec" sz="sm" onClick={addItem}>+ Add Row</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Raw Material','Qty','Unit','Cost Price (₹)','GST%','Taxable','Tax','Total',''].map(h=>(
                <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {f.items.map((item,idx)=>{
                const taxable=(item.qty||0)*(item.price||0), taxAmt=taxable*(item.gstRate||0)/100
                return (
                  <tr key={item.id} className="border-t border-slate-50">
                    <td className="px-2 py-2 min-w-[180px]">
                      <select className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" value={item.rawMaterialId} onChange={e=>updItem(idx,'rawMaterialId',e.target.value)}>
                        <option value="">— Select Material —</option>
                        {rawList.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                      <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs mt-1" placeholder="Or type name" value={item.productName} onChange={e=>updItem(idx,'productName',e.target.value)}/>
                    </td>
                    <td className="px-2 py-2"><input type="number" min="0" className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" value={item.qty} onChange={e=>updItem(idx,'qty',parseFloat(e.target.value)||0)}/></td>
                    <td className="px-2 py-2"><select className="w-16 border border-slate-200 rounded-lg px-1 py-1.5 text-xs bg-white" value={item.unit} onChange={e=>updItem(idx,'unit',e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
                    <td className="px-2 py-2"><input type="number" min="0" className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={item.price} onChange={e=>updItem(idx,'price',parseFloat(e.target.value)||0)}/></td>
                    <td className="px-2 py-2"><select className="w-16 border border-slate-200 rounded-lg px-1 py-1.5 text-xs bg-white" value={item.gstRate} onChange={e=>updItem(idx,'gstRate',parseFloat(e.target.value))}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
                    <td className="px-3 py-2 text-sm text-slate-500">{fc(taxable)}</td>
                    <td className="px-3 py-2 text-sm text-slate-500">{fc(taxAmt)}</td>
                    <td className="px-3 py-2 text-sm font-bold">{fc(taxable+taxAmt)}</td>
                    <td className="px-2 py-2"><button onClick={()=>remItem(idx)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs font-bold">×</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-5 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fc(sub)}</span></div>
            <div className="flex justify-between text-slate-600"><span>CGST + SGST</span><span>{fc(cgst+sgst)}</span></div>
            <div className="flex justify-between font-black text-base border-t-2 border-orange-200 pt-2 mt-1 text-orange-600"><span>Total Amount</span><span>{fc(total)}</span></div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Inp label="Notes" textarea className="h-20" value={f.notes} onChange={e=>upd('notes',e.target.value)} placeholder="Optional notes…"/>
        <Sel label="Payment Status" value={f.status} onChange={e=>upd('status',e.target.value)}>
          <option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option>
        </Sel>
      </div>
    </div>
  )
}



// ═══════════════════════════════════════════════════════════════════════════════
// LIST PAGE (Sales / Purchases / Estimates)
// ═══════════════════════════════════════════════════════════════════════════════
const LIST_CFG = {
  sales:     { api:salesApi,  title:'All Invoices',  newPage:'new-sale',     numKey:'invoiceNo',  noMsg:'No invoices yet',  noIco:'📄' },
  purchases: { api:purchApi,  title:'All Purchases', newPage:'new-purchase', numKey:'purchaseNo', noMsg:'No purchases yet', noIco:'📦' },
  estimates: { api:estApi,    title:'All Estimates', newPage:'new-estimate', numKey:'estimateNo', noMsg:'No estimates yet', noIco:'📋' },
}

export function ListPage({ type, setPage, company }) {
  const cfg = LIST_CFG[type]
  const isEst = type === 'estimates'
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [preview, setPreview] = useState(null)
  const [del,     setDel]     = useState(null)

  const load = () => { setLoading(true); cfg.api.list(search).then(d=>{ setItems(d); setLoading(false) }).catch(()=>setLoading(false)) }
  useEffect(load, [type])

  const doDelete = async(id)=>{ await cfg.api.remove(id).catch(()=>{}); setItems(items.filter(i=>i._id!==id)); setDel(null) }
  const updateStatus = async(id,status)=>{ await cfg.api.updateStatus?.(id,status).catch(()=>{}); setItems(items.map(i=>i._id===id?{...i,status}:i)) }

  const openPreview = (item) => setPreview({
    ...item, 
    items:item.items||[], 
    customer:item.customer||{}, 
    billTo:item.billTo||{}, 
    shipTo:item.shipTo||{},
    company:company||{}, 
    type:type==='estimates'?'estimate':'sale',
    templateId: item.templateId || company?.defaultTemplate || 'classic-tally'
  })

  const doDuplicate = async (item) => {
    if (!window.confirm(`Duplicate this ${isEst?'estimate':'invoice'}?`)) return
    try {
      const res = type === 'estimates' 
        ? await estApi.duplicate(item._id) 
        : await salesApi.duplicate(item._id)
      setItems([res, ...items])
    } catch(e) { alert(e.message) }
  }

  const total = items.reduce((a,i)=>a+(i.total||0),0)

  return (
    <div className="space-y-5">
      <PageHeader title={`${cfg.title} (${items.length})`} actions={<>
        <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-48" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <Btn v="sec" sz="sm" onClick={load}>Search</Btn>
        <Btn sz="sm" onClick={()=>setPage(cfg.newPage)}>+ New</Btn>
      </>}/>

      {items.length>0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-3 flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">{items.length} records</span>
          <span className="font-black text-violet-700">{fc(total)} total</span>
        </div>
      )}

      {loading ? <Spinner/> : items.length===0 ? <EmptyState icon={cfg.noIco} msg={cfg.noMsg}/> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Number','Date',type==='purchases'?'Supplier':'Customer','Amount','GST','Paid','Pending','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.map((item,i)=>{
                  const tax=(item.cgst||0)+(item.sgst||0)+(item.igst||0)
                  return (
                    <tr key={item._id} className={`border-t border-slate-50 hover:bg-slate-50/70 transition-all ${i%2===0?'':'bg-slate-50/30'}`}>
                      <td className="px-4 py-3 font-bold text-slate-700 text-sm">{item[cfg.numKey]}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{fd(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.customerName||item.supplierName||'—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-violet-600">{fc(item.total)}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{fc(tax)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">{fc(item.amountPaid || 0)}</td>
                      <td className="px-4 py-3 text-sm text-orange-600">{fc((item.total || 0) - (item.amountPaid || 0))}</td>
                      <td className="px-4 py-3">
                        {type==='sales'
                          ? <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white" value={item.status||'unpaid'} onChange={e=>updateStatus(item._id,e.target.value)}>
                              {['unpaid','paid','partial','overdue'].map(s=><option key={s}>{s}</option>)}
                            </select>
                          : <Bdg c={item.status==='paid'||item.status==='converted'?'green':'yellow'}>{item.status||'—'}</Bdg>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {type!=='purchases' && <>
                            <Btn v="sec" sz="sm" onClick={()=>openPreview(item)}>View</Btn>
                            <Btn v="pri" sz="sm" onClick={()=>doDuplicate(item)}>📋</Btn>
                          </>}
                          <Btn v="gst" sz="sm" className="text-red-400 hover:bg-red-50" onClick={()=>setDel(item._id)}>Del</Btn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {preview && <BillPreview data={preview} onClose={()=>setPreview(null)}/>}
      {del && (
        <Modal title="Confirm Delete" onClose={()=>setDel(null)} w="max-w-sm">
          <p className="text-slate-600 mb-5">Delete this record permanently?</p>
          <div className="flex gap-3">
            <Btn v="dan" onClick={()=>doDelete(del)}>Yes, Delete</Btn>
            <Btn v="sec" onClick={()=>setDel(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const blankCust = { name:'',mobile:'',email:'',address:'',state:'',gstin:'',type:'customer' }

export function CustomersPage() {
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false); const [edit,setEdit]=useState(null)
  const [search,setSearch]=useState(''); const [f,setF]=useState(blankCust); const [saving,setSaving]=useState(false)

  const load=()=>{ setLoading(true); custApi.list(search).then(d=>{ setList(d); setLoading(false) }).catch(()=>setLoading(false)) }
  useEffect(load,[])

  const save=async()=>{
    if(!f.name.trim()) return; setSaving(true)
    try {
      if(edit){ const r=await custApi.update(edit,f); setList(list.map(c=>c._id===edit?r:c)) }
      else    { const r=await custApi.create(f);     setList([...list,r]) }
      setModal(false); setEdit(null); setF(blankCust)
    } catch(e){ alert(e.message) } finally { setSaving(false) }
  }
  const del=async(id)=>{ if(!window.confirm('Delete?')) return; await custApi.remove(id).catch(()=>{}); setList(list.filter(c=>c._id!==id)) }
  const openEdit=(c)=>{ setF({name:c.name,mobile:c.mobile||'',email:c.email||'',address:c.address||'',state:c.state||'',gstin:c.gstin||'',type:c.type||'customer'}); setEdit(c._id); setModal(true) }

  return (
    <div className="space-y-5">
      <PageHeader title={`Customers (${list.length})`} actions={<>
        <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none w-48" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <Btn v="sec" sz="sm" onClick={load}>Search</Btn>
        <Btn sz="sm" onClick={()=>{ setF(blankCust); setEdit(null); setModal(true) }}>+ Add Customer</Btn>
      </>}/>

      {loading ? <Spinner/> : list.length===0 ? <EmptyState icon="👤" msg="No customers yet."/> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(c=>(
            <Card key={c._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center font-black text-violet-600 text-lg">{c.name[0]?.toUpperCase()}</div>
                <Bdg c={c.type==='supplier'?'orange':c.type==='both'?'blue':'violet'}>{c.type||'customer'}</Bdg>
              </div>
              <div className="font-black text-slate-800">{c.name}</div>
              {c.mobile  && <div className="text-sm text-slate-500 mt-0.5">📱 {c.mobile}</div>}
              {c.email   && <div className="text-xs text-slate-400">✉ {c.email}</div>}
              {c.state   && <div className="text-xs text-slate-400 mt-1">📍 {c.state}</div>}
              {c.address && <div className="text-xs text-slate-400 truncate">{c.address}</div>}
              {c.gstin   && <div className="mt-1.5"><Bdg c="slate">GST: {c.gstin}</Bdg></div>}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                <Btn v="sec" sz="sm" onClick={()=>openEdit(c)}>Edit</Btn>
                <Btn v="gst" sz="sm" className="text-red-400 hover:bg-red-50" onClick={()=>del(c._id)}>Delete</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={edit?'Edit Customer':'Add Customer'} onClose={()=>{ setModal(false); setEdit(null) }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Inp label="Name *" value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} placeholder="Customer / Company Name"/>
            <Inp label="Mobile" value={f.mobile} onChange={e=>setF(x=>({...x,mobile:e.target.value}))} placeholder="+91 XXXXX XXXXX"/>
            <Inp label="Email" type="email" value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))}/>
            <Inp label="GSTIN" value={f.gstin} onChange={e=>setF(x=>({...x,gstin:e.target.value}))} placeholder="GST Number"/>
            <Sel label="State" value={f.state} onChange={e=>setF(x=>({...x,state:e.target.value}))}>
              <option value="">— Select State —</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </Sel>
            <Sel label="Type" value={f.type} onChange={e=>setF(x=>({...x,type:e.target.value}))}>
              <option value="customer">Customer</option><option value="supplier">Supplier</option><option value="both">Both</option>
            </Sel>
            <div className="md:col-span-2"><Inp label="Address" textarea className="h-20" value={f.address} onChange={e=>setF(x=>({...x,address:e.target.value}))}/></div>
          </div>
          <div className="flex gap-3 mt-5">
            <Btn onClick={save} disabled={saving}>{saving?'Saving…':edit?'Update Customer':'Add Customer'}</Btn>
            <Btn v="sec" onClick={()=>{ setModal(false); setEdit(null) }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const blankProd = { name:'',sku:'',category:'',unit:'pcs',price:0,costPrice:0,gstRate:18,stock:0,minStock:5,description:'' }

// ─── blank forms ────────────────────────────────────────────────────────────
const blankRaw  = { name:'', sku:'', category:'', unit:'kg',  costPrice:0, gstRate:18, stock:0, minStock:5, description:'' }
const blankProd2= { name:'', sku:'', category:'', unit:'pcs', price:0, costPrice:0, gstRate:18, stock:0, minStock:5, description:'', rawMaterials:[] }

// ─── Raw Materials panel ─────────────────────────────────────────────────────
function RawMaterialsPanel() {
  const [list,setList]   = useState([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch]   = useState('')
  const [modal,setModal]     = useState(false)
  const [edit,setEdit]       = useState(null)
  const [f,setF]             = useState(blankRaw)
  const [saving,setSaving]   = useState(false)

  const load = () => { setLoading(true); rawMatApi.list(search).then(d=>{ setList(d); setLoading(false) }).catch(()=>setLoading(false)) }
  useEffect(load, [])

  const save = async () => {
    if (!f.name.trim()) return; setSaving(true)
    try {
      if (edit) { const r = await rawMatApi.update(edit, f); setList(list.map(m=>m._id===edit?r:m)) }
      else      { const r = await rawMatApi.create(f);       setList([...list, r]) }
      setModal(false); setEdit(null); setF(blankRaw)
    } catch(e) { alert(e.message) } finally { setSaving(false) }
  }
  const del = async (id) => { if (!window.confirm('Delete raw material?')) return; await rawMatApi.remove(id).catch(()=>{}); setList(list.filter(m=>m._id!==id)) }
  const openEdit = (m) => { setF({ name:m.name, sku:m.sku||'', category:m.category||'', unit:m.unit||'kg', costPrice:m.costPrice||0, gstRate:m.gstRate||18, stock:m.stock||0, minStock:m.minStock||5, description:m.description||'' }); setEdit(m._id); setModal(true) }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm">🧱</span>
            Raw Materials
            <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{list.length}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 ml-9">Purchase only · builds finished products</p>
        </div>
        <Btn sz="sm" onClick={()=>{ setF(blankRaw); setEdit(null); setModal(true) }}>+ Add Raw Material</Btn>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Search materials…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <Btn v="sec" sz="sm" onClick={load}>Go</Btn>
      </div>

      {/* List */}
      {loading ? <Spinner/> : list.length===0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="text-4xl mb-2">🧱</div>
          <p className="text-sm font-bold text-slate-500">No raw materials yet</p>
          <p className="text-xs text-slate-400 mt-1">Add materials you purchase to make products</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {list.map(m=>(
            <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm shrink-0">🧱</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-700 text-sm truncate">{m.name}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {m.sku && <span className="text-xs text-slate-400">{m.sku}</span>}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${(m.stock||0)===0?'bg-red-100 text-red-600':(m.stock||0)<=(m.minStock||5)?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{m.stock||0} {m.unit}</span>
                  <span className="text-xs text-slate-400">{fc(m.costPrice)}/unit</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">{m.gstRate}% GST</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>openEdit(m)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-500 hover:text-violet-600 flex items-center justify-center text-xs font-bold transition-colors">✏</button>
                <button onClick={()=>del(m._id)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center text-xs font-bold transition-colors">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={edit?'Edit Raw Material':'Add Raw Material'} onClose={()=>{ setModal(false); setEdit(null) }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Inp label="Material Name *" value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))}/>
            </div>
            <Inp label="SKU / Code"   value={f.sku}      onChange={e=>setF(x=>({...x,sku:e.target.value}))}/>
            <Inp label="Category"     value={f.category} onChange={e=>setF(x=>({...x,category:e.target.value}))}/>
            <Inp label="Cost Price ₹" type="number" min="0" value={f.costPrice} onChange={e=>setF(x=>({...x,costPrice:parseFloat(e.target.value)||0}))}/>
            <Sel label="Unit" value={f.unit} onChange={e=>setF(x=>({...x,unit:e.target.value}))}>{UNITS.map(u=><option key={u}>{u}</option>)}</Sel>
            <Sel label="GST Rate" value={f.gstRate} onChange={e=>setF(x=>({...x,gstRate:parseFloat(e.target.value)}))}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</Sel>
            <Inp label="Opening Stock"   type="number" min="0" value={f.stock}    onChange={e=>setF(x=>({...x,stock:parseFloat(e.target.value)||0}))}/>
            <Inp label="Min Stock Alert" type="number" min="0" value={f.minStock} onChange={e=>setF(x=>({...x,minStock:parseFloat(e.target.value)||0}))}/>
            <div className="col-span-2"><Inp label="Description" textarea className="h-14" value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))}/></div>
          </div>
          <div className="flex gap-3 mt-5">
            <Btn onClick={save} disabled={saving}>{saving?'Saving…':edit?'Update Material':'Add Material'}</Btn>
            <Btn v="sec" onClick={()=>{ setModal(false); setEdit(null) }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Finished Products panel ─────────────────────────────────────────────────
function FinishedProductsPanel() {
  const [list,setList]       = useState([])
  const [rawList,setRawList] = useState([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch]   = useState('')
  const [modal,setModal]     = useState(false)
  const [edit,setEdit]       = useState(null)
  const [f,setF]             = useState(blankProd2)
  const [saving,setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([prodApi.list(search), rawMatApi.list()])
      .then(([prods, raws]) => { setList(prods); setRawList(raws); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async () => {
    if (!f.name.trim()) return; setSaving(true)
    try {
      const payload = { ...f, rawMaterials: f.rawMaterials.filter(r=>r.materialId&&r.qty>0) }
      if (edit) { const r = await prodApi.update(edit, payload); setList(list.map(p=>p._id===edit?r:p)) }
      else      { const r = await prodApi.create(payload);       setList([...list, r]) }
      setModal(false); setEdit(null); setF(blankProd2)
    } catch(e) { alert(e.message) } finally { setSaving(false) }
  }
  const del = async (id) => { if (!window.confirm('Delete product?')) return; await prodApi.remove(id).catch(()=>{}); setList(list.filter(p=>p._id!==id)) }
  const openEdit = (p) => {
    setF({ name:p.name, sku:p.sku||'', category:p.category||'', unit:p.unit||'pcs', price:p.price||0, costPrice:p.costPrice||0, gstRate:p.gstRate||18, stock:p.stock||0, minStock:p.minStock||5, description:p.description||'', rawMaterials:p.rawMaterials||[] })
    setEdit(p._id); setModal(true)
  }

  // BOM helpers
  const addBomRow    = () => setF(x=>({...x, rawMaterials:[...x.rawMaterials,{materialId:'',materialName:'',qty:1,unit:''}]}))
  const remBomRow    = (i) => setF(x=>({...x, rawMaterials:x.rawMaterials.filter((_,idx)=>idx!==i)}))
  const updBomRow    = (i,k,v) => {
    const bom = [...f.rawMaterials]; bom[i]={...bom[i],[k]:v}
    if (k==='materialId') { const rm=rawList.find(r=>r._id===v); if(rm) bom[i]={...bom[i],materialName:rm.name,unit:rm.unit||''} }
    setF(x=>({...x,rawMaterials:bom}))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-sm">📦</span>
            Finished Products
            <span className="ml-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">{list.length}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 ml-9">Sell only · made from raw materials</p>
        </div>
        <Btn sz="sm" onClick={()=>{ setF(blankProd2); setEdit(null); setModal(true) }}>+ Add Product</Btn>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <input className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}/>
        <Btn v="sec" sz="sm" onClick={load}>Go</Btn>
      </div>

      {/* List */}
      {loading ? <Spinner/> : list.length===0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm font-bold text-slate-500">No products yet</p>
          <p className="text-xs text-slate-400 mt-1">Add finished products you sell to customers</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {list.map(p=>{
            const margin = p.price&&p.costPrice ? (((p.price-p.costPrice)/p.price)*100).toFixed(0) : 0
            return (
              <div key={p._id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm shrink-0 mt-0.5">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-700 text-sm truncate">{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {p.sku && <span className="text-xs text-slate-400">{p.sku}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${(p.stock||0)===0?'bg-red-100 text-red-600':(p.stock||0)<=(p.minStock||5)?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{p.stock||0} {p.unit}</span>
                    <span className="text-xs font-bold text-violet-600">{fc(p.price)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${margin>=30?'bg-green-100 text-green-700':margin>=10?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-600'}`}>{margin}% margin</span>
                  </div>
                  {(p.rawMaterials||[]).length>0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.rawMaterials.map((rm,i)=>(
                        <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md">
                          🧱 {rm.materialName||'?'} × {rm.qty} {rm.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={()=>openEdit(p)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-500 hover:text-violet-600 flex items-center justify-center text-xs font-bold transition-colors">✏</button>
                  <button onClick={()=>del(p._id)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center text-xs font-bold transition-colors">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={edit?'Edit Product':'Add Finished Product'} onClose={()=>{ setModal(false); setEdit(null) }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Inp label="Product Name *" value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))}/></div>
            <Inp label="SKU / Code"      value={f.sku}       onChange={e=>setF(x=>({...x,sku:e.target.value}))}/>
            <Inp label="Category"        value={f.category}  onChange={e=>setF(x=>({...x,category:e.target.value}))}/>
            <Inp label="Selling Price ₹" type="number" min="0" value={f.price}     onChange={e=>setF(x=>({...x,price:parseFloat(e.target.value)||0}))}/>
            <Inp label="Cost Price ₹"    type="number" min="0" value={f.costPrice} onChange={e=>setF(x=>({...x,costPrice:parseFloat(e.target.value)||0}))}/>
            <Sel label="Unit" value={f.unit} onChange={e=>setF(x=>({...x,unit:e.target.value}))}>{UNITS.map(u=><option key={u}>{u}</option>)}</Sel>
            <Sel label="GST Rate" value={f.gstRate} onChange={e=>setF(x=>({...x,gstRate:parseFloat(e.target.value)}))}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</Sel>
            <Inp label="Opening Stock"   type="number" min="0" value={f.stock}    onChange={e=>setF(x=>({...x,stock:parseFloat(e.target.value)||0}))}/>
            <Inp label="Min Stock Alert" type="number" min="0" value={f.minStock} onChange={e=>setF(x=>({...x,minStock:parseFloat(e.target.value)||0}))}/>
            <div className="col-span-2"><Inp label="Description" textarea className="h-12" value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))}/></div>
          </div>

          {/* Bill of Materials */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5">🧱 Raw Materials Used <span className="text-xs font-normal text-slate-400">(Bill of Materials)</span></h3>
              <button onClick={addBomRow} className="text-xs px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-bold transition-colors">+ Add Material</button>
            </div>
            {f.rawMaterials.length===0 ? (
              <div className="text-center py-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/40">
                <p className="text-xs text-amber-600 font-semibold">No raw materials added yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Link which raw materials are needed to make this product</p>
              </div>
            ) : (
              <div className="space-y-2">
                {f.rawMaterials.map((row,i)=>(
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-sm">🧱</span>
                    <select className="flex-1 border border-amber-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" value={row.materialId} onChange={e=>updBomRow(i,'materialId',e.target.value)}>
                      <option value="">— Select Material —</option>
                      {rawList.map(r=><option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="Qty" className="w-20 border border-amber-200 rounded-lg px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" value={row.qty} onChange={e=>updBomRow(i,'qty',parseFloat(e.target.value)||0)}/>
                    <span className="text-xs text-amber-700 font-semibold w-8">{row.unit}</span>
                    <button onClick={()=>remBomRow(i)} className="w-6 h-6 rounded-md bg-red-100 text-red-400 hover:bg-red-200 flex items-center justify-center text-xs font-bold shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <Btn onClick={save} disabled={saving}>{saving?'Saving…':edit?'Update Product':'Add Product'}</Btn>
            <Btn v="sec" onClick={()=>{ setModal(false); setEdit(null) }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Main Products Page ───────────────────────────────────────────────────────
export function ProductsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Products" actions={null}/>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span>🧱</span>
          <span className="font-bold text-amber-700">Raw Materials</span>
          <span className="text-xs text-amber-600">→ Purchase Only</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl text-sm">
          <span>📦</span>
          <span className="font-bold text-violet-700">Finished Products</span>
          <span className="text-xs text-violet-600">→ Sell Only</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <span>🔗</span>
          <span className="text-slate-500 text-xs">Products are linked to raw materials via Bill of Materials</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* LEFT — Raw Materials */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" style={{minHeight:'520px'}}>
          <RawMaterialsPanel/>
        </div>
        {/* RIGHT — Finished Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" style={{minHeight:'520px'}}>
          <FinishedProductsPanel/>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function StockPage() {
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('all'); const [search,setSearch]=useState('')
  const [showModal,setShowModal]=useState(false)
  const [stockModal,setStockModal]=useState(false)
  const [selectedMat,setSelectedMat]=useState(null)
  const [stockQty,setStockQty]=useState(0)
  const [form,setForm]=useState({name:'',sku:'',category:'',unit:'kg',costPrice:0,stock:0,minStock:5})

  useEffect(()=>{ rawMatApi.list().then(d=>{ setList(d); setLoading(false) }).catch(()=>setLoading(false)) },[])

  const adjust=async(id,delta,value)=>{
    const res=await rawMatApi.adjustStock(id,delta!==undefined?{delta}:{value}).catch(()=>null)
    if(res) setList(list.map(p=>p._id===id?res:p))
  }

  const handleSave=async()=>{
    if(!form.name.trim()) return
    await rawMatApi.create(form).then(r=>{ setList([...list,r]); setShowModal(false); setForm({name:'',sku:'',category:'',unit:'kg',costPrice:0,stock:0,minStock:5}) }).catch(()=>null)
  }

  const addStock=async()=>{
    if(!selectedMat || stockQty===0) return
    const res=await rawMatApi.adjustStock(selectedMat._id,{delta:stockQty}).catch(()=>null)
    if(res){ setList(list.map(p=>p._id===selectedMat._id?res:p)); setStockModal(false); setStockQty(0); setSelectedMat(null) }
  }

  const filtered=list.filter(p=>{
    const q=search.toLowerCase(); const m=p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q)
    if(filter==='low') return m&&(p.stock||0)>0&&(p.stock||0)<=(p.minStock||5)
    if(filter==='out') return m&&(p.stock||0)===0
    return m
  })

  const totalVal=list.reduce((a,p)=>a+(p.stock||0)*(p.costPrice||0),0)
  const lowCount=list.filter(p=>(p.stock||0)>0&&(p.stock||0)<=(p.minStock||5)).length
  const outCount=list.filter(p=>(p.stock||0)===0).length

  return (
    <div className="space-y-5">
      <PageHeader title="Raw Material Stock" actions={
        <div className="flex gap-2">
          <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="Search materials…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      }/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{lbl:'Total Materials',val:list.length,c:'text-violet-600'},{lbl:'Stock Value',val:fc(totalVal),c:'text-blue-600'},{lbl:'Low Stock',val:lowCount,c:'text-yellow-600'},{lbl:'Out of Stock',val:outCount,c:'text-red-600'}].map(s=>(
          <Card key={s.lbl} className="p-4 text-center">
            <div className={`text-2xl font-black ${s.c}`}>{s.val}</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{s.lbl}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {[['all','All'],['low','Low Stock'],['out','Out of Stock']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${filter===k?'bg-violet-600 text-white shadow-sm':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {loading ? <Spinner/> : filtered.length===0 ? <EmptyState icon="📦" msg="No materials match this filter."/> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Material','SKU','Category','Stock','Min','Status','Value','Adjust'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((p,i)=>{
                  const stk=p.stock||0,min=p.minStock||5
                  const st=stk===0?'out':stk<=min?'low':'ok'
                  return (
                    <tr key={p._id} className={`border-t border-slate-50 ${st==='out'?'bg-red-50/50':st==='low'?'bg-yellow-50/30':i%2!==0?'bg-slate-50/30':''}`}>
                      <td className="px-4 py-3 font-bold text-slate-700">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{p.sku||'—'}</td>
                      <td className="px-4 py-3"><Bdg c="slate">{p.category||'General'}</Bdg></td>
                      <td className="px-4 py-3"><span className="text-lg font-black text-slate-700">{stk}</span><span className="text-xs text-slate-400 ml-1">{p.unit}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{min}</td>
                      <td className="px-4 py-3"><Bdg c={st==='out'?'red':st==='low'?'yellow':'green'}>{st==='out'?'Out of Stock':st==='low'?'Low Stock':'In Stock'}</Bdg></td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-600">{fc(stk*(p.costPrice||0))}</td>
                      <td className="px-4 py-3">
                        <button onClick={()=>{ setSelectedMat(p); setStockModal(true) }} className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg text-lg font-bold hover:bg-emerald-200 flex items-center justify-center">+</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Add New Material">
        <div className="space-y-4">
          <Inp label="Material Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. HDPE, MS WIRE"/>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Optional"/>
            <Sel label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={UNITS}/>
          </div>
          <Inp label="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Plastic, Metal"/>
          <div className="grid grid-cols-3 gap-4">
            <Inp label="Initial Stock" type="number" value={form.stock} onChange={e=>setForm({...form,stock:parseInt(e.target.value)||0})}/>
            <Inp label="Cost Price" type="number" value={form.costPrice} onChange={e=>setForm({...form,costPrice:parseFloat(e.target.value)||0})}/>
            <Inp label="Min Stock" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:parseInt(e.target.value)||0})}/>
          </div>
          <div className="flex gap-2 pt-2">
            <Btn onClick={handleSave} className="flex-1">Save Material</Btn>
            <Btn onClick={()=>setShowModal(false)} variant="secondary">Cancel</Btn>
          </div>
        </div>
      </Modal>

      {/* Add Stock Modal */}
      <Modal open={stockModal} onClose={()=>{ setStockModal(false); setSelectedMat(null); setStockQty(0) }} title={`Adjust Stock: ${selectedMat?.name||''}`}>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-amber-800">Current Stock</span>
              <span className="text-lg font-black text-amber-700">{selectedMat?.stock||0} {selectedMat?.unit}</span>
            </div>
          </div>
          <Inp label="Quantity (use negative to reduce)" type="number" value={stockQty} onChange={e=>setStockQty(parseInt(e.target.value)||0)}/>
          <div className={`border rounded-xl p-4 ${stockQty<0?'bg-red-50 border-red-200':stockQty>0?'bg-emerald-50 border-emerald-200':'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${stockQty<0?'text-red-800':stockQty>0?'text-emerald-800':'text-slate-600'}`}>New Stock Total</span>
              <span className={`text-lg font-black ${stockQty<0?'text-red-700':stockQty>0?'text-emerald-700':'text-slate-600'}`}>{(selectedMat?.stock||0) + stockQty} {selectedMat?.unit}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Btn onClick={addStock} className="flex-1" disabled={stockQty===0}>{stockQty>0?'Add Stock':stockQty<0?'Reduce Stock':'No Change'}</Btn>
            <Btn onClick={()=>{ setStockModal(false); setSelectedMat(null); setStockQty(0) }} variant="secondary">Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function ReportsPage() {
  const [data,setData]=useState(null); const [period,setPeriod]=useState('month')
  useEffect(()=>{ setData(null); repApi.get(period).then(setData).catch(console.error) },[period])
  if(!data) return <Spinner/>

  const {totSales,totPurch,profit,totCGST=0,totSGST=0,totIGST=0,topProds=[],topCusts=[],months=[],invoiceCount=0}=data

  return (
    <div className="space-y-5">
      <PageHeader title="Reports & Analytics" actions={
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {[['month','This Month'],['quarter','Quarter'],['year','This Year'],['all','All Time']].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period===k?'bg-violet-600 text-white':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
          ))}
        </div>
      }/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {lbl:'Revenue',     val:fc(totSales),bg:'bg-emerald-50',tc:'text-emerald-700',bc:'border-emerald-100'},
          {lbl:'Purchases',   val:fc(totPurch),bg:'bg-blue-50',   tc:'text-blue-700',   bc:'border-blue-100'},
          {lbl:'Gross Profit',val:fc(profit),  bg:profit>=0?'bg-violet-50':'bg-red-50',tc:profit>=0?'text-violet-700':'text-red-600',bc:profit>=0?'border-violet-100':'border-red-100'},
          {lbl:'Tax Collected',val:fc(totCGST+totSGST+totIGST),bg:'bg-orange-50',tc:'text-orange-700',bc:'border-orange-100'},
        ].map(s=>(
          <Card key={s.lbl} className={`p-5 border ${s.bc} ${s.bg}`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${s.tc} opacity-70`}>{s.lbl}</div>
            <div className={`text-2xl font-black ${s.tc}`}>{s.val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <h2 className="font-black text-slate-700 mb-5">Profit & Loss Statement</h2>
          <div className="space-y-2 text-sm">
            {[['Gross Revenue',fc(totSales),'text-emerald-600'],['Cost of Purchases',`— ${fc(totPurch)}`,'text-blue-600'],['CGST Collected',fc(totCGST),'text-slate-500'],['SGST Collected',fc(totSGST),'text-slate-500'],['IGST Collected',fc(totIGST),'text-slate-500']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">{l}</span><span className={`font-bold ${c}`}>{v}</span></div>
            ))}
            <div className="flex justify-between py-3 font-black text-base"><span>Net Profit</span><span className={profit>=0?'text-emerald-600':'text-red-600'}>{fc(profit)}</span></div>
            <div className="flex justify-between py-2 bg-slate-50 rounded-xl px-3 text-xs"><span className="text-slate-500">Profit Margin</span><span className="font-bold">{totSales>0?((profit/totSales)*100).toFixed(1):0}%</span></div>
            <div className="flex justify-between py-2 bg-slate-50 rounded-xl px-3 text-xs mt-1"><span className="text-slate-500">Total Invoices</span><span className="font-bold">{invoiceCount}</span></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-black text-slate-700 mb-5">Top Products by Revenue</h2>
          {topProds.length===0 ? <EmptyState icon="📊" msg="No sales data for this period"/> : (
            <div className="space-y-3">
              {topProds.map(([name,rev],i)=>(
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-violet-100 text-violet-600 rounded-lg text-xs font-black flex items-center justify-center">{i+1}</span>
                      <span className="font-semibold text-slate-600 truncate max-w-[160px]">{name}</span>
                    </div>
                    <span className="font-bold text-violet-600">{fc(rev)}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className="bg-violet-500 rounded-full h-1.5" style={{width:`${(rev/topProds[0][1])*100}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <h2 className="font-black text-slate-700 mb-5">Top Customers</h2>
          {topCusts.length===0 ? <EmptyState icon="👤" msg="No data"/> : (
            <div className="space-y-2">
              {topCusts.map(([name,rev])=>(
                <div key={name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-sm">{name[0]?.toUpperCase()}</div>
                    <span className="font-semibold text-slate-600">{name}</span>
                  </div>
                  <span className="font-bold text-emerald-600">{fc(rev)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-black text-slate-700 mb-5">Monthly Breakdown</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Month','Sales','Purchase','Profit'].map(h=><th key={h} className={`py-2 text-xs font-bold text-slate-400 uppercase ${h==='Month'?'text-left':'text-right'}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {months.map(m=>(
                <tr key={m.lbl} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-600">{m.lbl}</td>
                  <td className="py-2 text-right font-semibold text-violet-600">{fc(m.s)}</td>
                  <td className="py-2 text-right text-orange-500">{fc(m.p)}</td>
                  <td className={`py-2 text-right font-bold ${m.profit>=0?'text-emerald-600':'text-red-500'}`}>{fc(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
// Change Password / Profile Component
function ChangePassword({ user, onUserUpdate }) {
  const [f, setF] = useState({ 
    username: '', 
    email: '',
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  })
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Sync form with user prop when it changes (to get email from database)
  useEffect(() => {
    // Also check localStorage directly for email
    let storedUser = null
    try {
      storedUser = JSON.parse(localStorage.getItem('sf_user'))
    } catch {}
    
    console.log('ChangePassword useEffect:', { user, storedUser })
    
    const email = user?.email || storedUser?.email || ''
    const username = user?.username || storedUser?.username || ''
    
    setF(prev => ({
      ...prev,
      username,
      email
    }))
  }, [user])

  const updateProfile = async () => {
    setErr(''); setSuccess('')
    
    // If changing password, validate password fields
    if (f.newPassword) {
      if (!f.currentPassword) {
        setErr('Current password is required to change password')
        return
      }
      if (f.newPassword.length < 4) {
        setErr('New password must be at least 4 characters')
        return
      }
      if (f.newPassword !== f.confirmPassword) {
        setErr('New password and confirm password do not match')
        return
      }
    }
    
    // Check if username or email changed
    if (!f.username.trim()) {
      setErr('Username is required')
      return
    }
    
    setLoading(true)
    try {
      const res = await auth.updateProfile({ 
        username: f.username.trim(), 
        email: f.email.trim(),
        currentPassword: f.currentPassword || undefined,
        newPassword: f.newPassword || undefined
      })
      setSuccess('Profile updated successfully!')
      setF({ 
        ...f, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      })
      // Update user in parent component if callback provided
      if (onUserUpdate && res.user) {
        onUserUpdate(res.user)
      }
    } catch(e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{err}</div>}
      {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">{success}</div>}
      
      {/* Username & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Inp label="Username" value={f.username} onChange={e=>setF({...f,username:e.target.value})} placeholder="Enter username"/>
        <Inp label="Email" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="your@email.com"/>
      </div>
      
      {/* Password Change (Optional) */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500 mb-3">Change password (optional - leave blank to keep current)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Inp label="Current Password" type="password" toggle value={f.currentPassword} onChange={e=>setF({...f,currentPassword:e.target.value})} placeholder="Enter current password"/>
          <Inp label="New Password" type="password" toggle value={f.newPassword} onChange={e=>setF({...f,newPassword:e.target.value})} placeholder="Enter new password"/>
          <Inp label="Confirm Password" type="password" toggle value={f.confirmPassword} onChange={e=>setF({...f,confirmPassword:e.target.value})} placeholder="Confirm new password"/>
        </div>
      </div>
      
      <div>
        <Btn onClick={updateProfile} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Btn>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export function SettingsPage({ user, onUserUpdate, onCompanyUpdate }) {
  const [f,setF]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('sf_company')||'{}') }catch{ return {} } })
  const [saved,setSaved]=useState(false); const [loading,setLoad]=useState(false)
  const logoRef=useRef()
  const sigRef=useRef()

  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const handleLogo=(e)=>{ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>upd('logo',ev.target.result); r.readAsDataURL(file) }
  const handleSig=(e)=>{ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>upd('signature',ev.target.result); r.readAsDataURL(file) }

  const save=async()=>{
    setLoad(true)
    try {
      const res=await coApi.update(f)
      localStorage.setItem('sf_company',JSON.stringify(res))
      onCompanyUpdate(res); setSaved(true); setTimeout(()=>setSaved(false),2500)
    } catch(e){ alert(e.message) } finally { setLoad(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Company Settings" actions={
        <Btn onClick={save} v={saved?'grn':'pri'} disabled={loading}>{loading?'Saving…':saved?'✓ Saved!':'Save Settings'}</Btn>
      }/>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-1">Company Logo</h2>
        <p className="text-xs text-slate-400 mb-4">Shown on all invoices and estimates</p>
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-violet-400 transition-all" onClick={()=>logoRef.current.click()}>
            {f.logo ? <img src={f.logo} className="w-full h-full object-contain p-2" alt="logo"/> : <div className="text-center text-slate-300"><div className="text-3xl mb-1">🏢</div><div className="text-xs">Click to upload</div></div>}
          </div>
          <div>
            <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={handleLogo}/>
            <Btn v="sec" sz="sm" onClick={()=>logoRef.current.click()}>Upload Logo</Btn>
            {f.logo && <button className="block text-xs text-red-400 mt-2" onClick={()=>upd('logo','')}>Remove</button>}
            <p className="text-xs text-slate-400 mt-2">PNG, JPG, SVG · Max 2MB</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inp label="Company / Business Name *" value={f.name||''} onChange={e=>upd('name',e.target.value)} placeholder="Your Business Name"/>
          <Inp label="Mobile / Phone"             value={f.mobile||''} onChange={e=>upd('mobile',e.target.value)}/>
          <Inp label="Email Address" type="email" value={f.email||''} onChange={e=>upd('email',e.target.value)}/>
          <Inp label="Website"                    value={f.website||''} onChange={e=>upd('website',e.target.value)}/>
          <div className="md:col-span-2"><Inp label="Address" textarea className="h-20" value={f.address||''} onChange={e=>upd('address',e.target.value)}/></div>
          <Sel label="State" value={f.state||''} onChange={e=>upd('state',e.target.value)}>
            <option value="">— Select State —</option>
            {STATES.map(s=><option key={s}>{s}</option>)}
          </Sel>
          <Inp label="Pincode" value={f.pincode||''} onChange={e=>upd('pincode',e.target.value)}/>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">GST & Legal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inp label="GSTIN" placeholder="22AAAAA0000A1Z5" value={f.gstin||''} onChange={e=>upd('gstin',e.target.value)}/>
          <Inp label="PAN"   placeholder="AAAAA0000A"      value={f.pan||''}   onChange={e=>upd('pan',e.target.value)}/>
          <Inp label="CIN"                                  value={f.cin||''}   onChange={e=>upd('cin',e.target.value)}/>
          <Inp label="MSME / Udyam No."                     value={f.msme||''}  onChange={e=>upd('msme',e.target.value)}/>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inp label="Bank Name"       value={f.bank||''}    onChange={e=>upd('bank',e.target.value)}/>
          <Inp label="Account Holder"  value={f.accName||''} onChange={e=>upd('accName',e.target.value)}/>
          <Inp label="Account Number"  value={f.accNo||''}   onChange={e=>upd('accNo',e.target.value)}/>
          <Inp label="IFSC Code"       value={f.ifsc||''}    onChange={e=>upd('ifsc',e.target.value)}/>
          <Inp label="Branch"          value={f.branch||''}  onChange={e=>upd('branch',e.target.value)}/>
          <Inp label="UPI ID"          value={f.upi||''}     onChange={e=>upd('upi',e.target.value)} placeholder="business@upi"/>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">Invoice Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inp label="Invoice Prefix"  value={f.invoicePrefix||'INV'}  onChange={e=>upd('invoicePrefix',e.target.value)}/>
          <Inp label="Estimate Prefix" value={f.estimatePrefix||'EST'} onChange={e=>upd('estimatePrefix',e.target.value)}/>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Bill Template</label>
            <div className="flex gap-2 flex-wrap">
              {[
                {id:'classic-tally',name:'📋 Classic Tally'},
                {id:'modern-itc',name:'💳 Modern ITC'},
                {id:'premium-tata',name:'👑 Premium TATA'},
                {id:'simple-gst',name:'📄 Simple GST'}
              ].map(t=>(
                <button key={t.id} type="button" onClick={()=>upd('defaultTemplate',t.id)} className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${f.defaultTemplate===t.id?'border-violet-500 bg-violet-50 text-violet-700':'border-slate-200 bg-white text-slate-600'}`}>{t.name}</button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2"><Inp label="Default Terms & Conditions" textarea className="h-24" value={f.defaultTerms||''} onChange={e=>upd('defaultTerms',e.target.value)}/></div>
          <div className="md:col-span-2"><Inp label="Declaration Text (shown on invoices)" textarea className="h-20" value={f.declaration||''} onChange={e=>upd('declaration',e.target.value)} placeholder="We declare that this invoice shows the actual price..." /></div>
          <div className="md:col-span-2"><Inp label="Terms & Conditions" textarea className="h-20" value={f.termsConditions||''} onChange={e=>upd('termsConditions',e.target.value)} placeholder="Payment due within 30 days..." /></div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-1">Digital Signature</h2>
        <p className="text-xs text-slate-400 mb-4">Upload your digital signature to appear on invoices</p>
        <div className="flex items-center gap-6">
          <div className="w-32 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-violet-400 transition-all" onClick={()=>sigRef.current.click()}>
            {f.signature ? <img src={f.signature} className="w-full h-full object-contain p-1" alt="signature"/> : <div className="text-center text-slate-300"><div className="text-2xl mb-1">✍️</div><div className="text-xs">Upload</div></div>}
          </div>
          <div>
            <input type="file" ref={sigRef} className="hidden" accept="image/*" onChange={handleSig}/>
            <Btn v="sec" sz="sm" onClick={()=>sigRef.current.click()}>Upload Signature</Btn>
            {f.signature && <button className="block text-xs text-red-400 mt-2" onClick={()=>upd('signature','')}>Remove</button>}
            <p className="text-xs text-slate-400 mt-2">PNG, JPG · Transparent background preferred</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end pb-6">
        <Btn onClick={save} v={saved?'grn':'pri'} sz="lg" disabled={loading}>{loading?'Saving…':saved?'✓ All Settings Saved!':'Save All Settings'}</Btn>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function ProfilePage({ user, onUserUpdate }) {
  const [loading, setLoading] = useState(false)
  
  const refreshProfile = async () => {
    setLoading(true)
    try {
      const { auth } = await import('../utils/api')
      const freshUser = await auth.getProfile()
      onUserUpdate(freshUser)
      localStorage.setItem('sf_user', JSON.stringify(freshUser))
      alert('Profile refreshed!')
    } catch(e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="My Profile" actions={
        <Btn v="sec" onClick={refreshProfile} disabled={loading}>
          {loading ? 'Refreshing...' : '↻ Refresh from Server'}
        </Btn>
      }/>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">👤 User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Username</p>
            <p className="font-semibold text-slate-700 text-lg">{user?.username || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Email</p>
            <p className="font-semibold text-slate-700 text-lg">{user?.email || 'Not set'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Full Name</p>
            <p className="font-semibold text-slate-700 text-lg">{user?.name || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">User ID</p>
            <p className="font-semibold text-slate-600 text-xs font-mono">{user?.id || 'N/A'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">🔐 Change Password</h2>
        <ChangePassword user={user} onUserUpdate={onUserUpdate}/>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-700 mb-4">⏻ Sign Out</h2>
        <p className="text-sm text-slate-500 mb-4">Ready to leave? Click the button below to sign out of your account.</p>
        <Btn v="dan" onClick={() => {
          if (window.confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('sf_token')
            localStorage.removeItem('sf_user')
            localStorage.removeItem('sf_company')
            window.location.href = '/'
          }
        }}>Sign Out</Btn>
      </Card>
    </div>
  )
}
