import { useRef, useState } from 'react'
import { Modal, Btn } from './ui'
import { fc, fd, numToWords } from '../utils/helpers'
import { TEMPLATES, getTemplate } from './BillTemplates'

// ── Preview renderer (React JSX) — mirrors Template 1 for live preview
// The actual print uses each template's own CSS + render() for perfect output
function LivePreview({ data, templateId }) {
  const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0,
    isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data

  const invNo    = invoiceNo || estimateNo || 'PREVIEW'
  const isEst    = type === 'estimate'
  const tpl      = getTemplate(templateId)

  // Accent colors per template
  const accents = {
    'modern-violet':  { bg:'linear-gradient(135deg,#7c3aed,#4f46e5)', text:'#7c3aed', light:'#f5f3ff', badge:'#ede9fe' },
    'classic-gold':   { bg:'linear-gradient(90deg,#b8860b,#ffd700,#b8860b)', text:'#b8860b', light:'#fffbf0', badge:'#fef9c3' },
    'minimal-clean':  { bg:'#111', text:'#111', light:'#fafafa', badge:'#f1f5f9' },
    'corporate-blue': { bg:'linear-gradient(135deg,#1e3a5f,#2563eb)', text:'#1e3a5f', light:'#eff6ff', badge:'#dbeafe' },
    'bold-emerald':   { bg:'linear-gradient(135deg,#059669,#10b981)', text:'#059669', light:'#f0fdf4', badge:'#d1fae5' },
  }
  const ac = accents[templateId] || accents['modern-violet']

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'12px', background:'#fff' }}>
      {/* Header */}
      <div style={{ background:ac.bg, color:'#fff', padding:'24px 28px', borderRadius:'0 0 16px 16px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          {company.logo && <img src={company.logo} style={{ height:44, objectFit:'contain', marginBottom:6, display:'block', filter:'brightness(0) invert(1)' }} alt="logo"/>}
          <div style={{ fontSize:18, fontWeight:900 }}>{company.name || 'Your Company'}</div>
          <div style={{ fontSize:10, opacity:.8, marginTop:4, lineHeight:'1.8' }}>
            {company.address && <div>{company.address}</div>}
            {company.gstin   && <div>GSTIN: {company.gstin}</div>}
            {company.mobile  && <div>📱 {company.mobile}</div>}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-1px' }}>{isEst ? 'ESTIMATE' : 'INVOICE'}</div>
          <div style={{ fontSize:14, fontWeight:700, opacity:.9, marginTop:4 }}>#{invNo}</div>
          <div style={{ fontSize:10, opacity:.75, marginTop:3, lineHeight:'1.8' }}>
            <div>Date: {fd(date)}</div>
            {dueDate   && <div>Due: {fd(dueDate)}</div>}
            {validTill && <div>Valid: {fd(validTill)}</div>}
          </div>
        </div>
      </div>

      {/* Bill to */}
      {customer && (customer.name || customer.customerName) && (
        <div style={{ background:ac.light, border:`1px solid ${ac.badge}`, borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'#94a3b8', marginBottom:4 }}>Bill To</div>
          <div style={{ fontSize:14, fontWeight:900 }}>{customer.name || customer.customerName}</div>
          <div style={{ fontSize:10, color:'#64748b', marginTop:3, lineHeight:'1.8' }}>
            {customer.address && <div>{customer.address}</div>}
            {customer.state   && <div>{customer.state}</div>}
            {customer.gstin   && <div>GSTIN: {customer.gstin}</div>}
          </div>
          <span style={{ display:'inline-block', marginTop:5, padding:'2px 10px', borderRadius:20, fontSize:9, fontWeight:700, background:ac.badge, color:ac.text }}>
            {isIntra ? '⚡ Intra-State (CGST+SGST)' : '🌐 Inter-State (IGST)'}
          </span>
        </div>
      )}

      {/* Items table */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16, border:'1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ background:ac.text === '#111' ? '#111' : ac.text }}>
            {['#','Description','Qty','Unit','Rate','GST%','Taxable',...(isIntra?['CGST','SGST']:['IGST']),'Total'].map(h=>(
              <th key={h} style={{ color:'#fff', padding:'8px 10px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', textAlign:h==='#'||h==='Description'?'left':'right' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const taxable = (item.qty||0)*(item.price||0)
            const cg = isIntra ? taxable*(item.gstRate||0)/200 : 0
            const ig = !isIntra ? taxable*(item.gstRate||0)/100 : 0
            const rt = taxable + cg*2 + ig
            const td  = { border:'1px solid #e2e8f0', padding:'7px 10px', fontSize:10, textAlign:'right' }
            const tdL = { ...td, textAlign:'left' }
            return (
              <tr key={i} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                <td style={tdL}>{i+1}</td>
                <td style={{ ...tdL, fontWeight:600 }}>{item.productName||'—'}</td>
                <td style={td}>{item.qty}</td>
                <td style={td}>{item.unit}</td>
                <td style={td}>{fc(item.price)}</td>
                <td style={td}>{item.gstRate||0}%</td>
                <td style={td}>{fc(taxable)}</td>
                {isIntra ? <><td style={td}>{fc(cg)}</td><td style={td}>{fc(cg)}</td></> : <td style={td}>{fc(ig)}</td>}
                <td style={{ ...td, fontWeight:700, color:ac.text }}>{fc(rt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <div style={{ width:230 }}>
          {[
            ['Subtotal', fc(sub)],
            ...(isIntra ? [['CGST', fc(cgst)],['SGST', fc(sgst)]] : [['IGST', fc(igst)]]),
            ...((discAmt||0)>0 ? [['Discount', `-${fc(discAmt)}`]] : []),
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #f1f5f9', color:'#475569', fontSize:11 }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 0', fontWeight:900, fontSize:15, borderTop:`2px solid ${ac.text}`, marginTop:5, color:ac.text }}>
            <span>Grand Total</span><span>{fc(total)}</span>
          </div>
        </div>
      </div>

      {/* Words */}
      <div style={{ background:ac.light, borderRadius:8, padding:'8px 12px', fontSize:10, marginBottom:12 }}>
        <strong style={{ color:'#475569' }}>Amount in Words: </strong>
        <span style={{ color:'#1e293b' }}>{numToWords(Math.round(total||0))}</span>
      </div>

      {/* Bank */}
      {(company.bank || company.accNo) && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', fontSize:10, marginBottom:12 }}>
          <div style={{ fontWeight:700, color:'#166534', marginBottom:4 }}>🏦 Bank Details</div>
          <div style={{ color:'#166534', lineHeight:'1.8' }}>
            {company.bank   && <div>Bank: <strong>{company.bank}</strong></div>}
            {company.accNo  && <div>A/C No: <strong>{company.accNo}</strong></div>}
            {company.ifsc   && <div>IFSC: <strong>{company.ifsc}</strong></div>}
            {company.upi    && <div>UPI: <strong>{company.upi}</strong></div>}
          </div>
        </div>
      )}

      {/* Notes/Terms */}
      {(notes || terms) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, borderTop:'1px solid #f1f5f9', paddingTop:14, marginTop:8, fontSize:10, color:'#64748b' }}>
          {notes && <div><strong style={{ color:'#374151', display:'block', marginBottom:3 }}>Notes</strong>{notes}</div>}
          {terms && <div><strong style={{ color:'#374151', display:'block', marginBottom:3 }}>Terms & Conditions</strong>{terms}</div>}
        </div>
      )}

      {/* Signature */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
        <div style={{ textAlign:'center', color:'#94a3b8', fontSize:10 }}>
          <div style={{ borderTop:'1px solid #cbd5e1', width:160, marginBottom:4, marginTop:44 }}></div>
          <div>Authorised Signatory</div>
          <strong style={{ color:'#475569' }}>{company.name}</strong>
        </div>
      </div>
    </div>
  )
}

// ── Main BillPreview Component ──────────────────────────────────
export default function BillPreview({ data, onClose }) {
  const printRef = useRef()
  const [selectedTemplate, setSelectedTemplate] = useState(data?.company?.defaultTemplate || 'modern-violet')

  const { invoiceNo, estimateNo, type } = data
  const invNo = invoiceNo || estimateNo || 'PREVIEW'
  const isEst = type === 'estimate'

  const doPrint = () => {
    const tpl = getTemplate(selectedTemplate)
    const html = tpl.render(data)
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>${isEst ? 'Estimate' : 'Invoice'} #${invNo} — ${tpl.name}</title>
      <style>${tpl.css}</style>
    </head><body>${html}</body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 400)
  }

  return (
    <Modal title={`${isEst ? 'Estimate' : 'Invoice'} Preview — #${invNo}`} onClose={onClose} w="max-w-5xl">
      {/* Template Selector */}
      <div className="mb-5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          🎨 Choose Template
        </div>
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedTemplate === tpl.id
                  ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{tpl.emoji}</span>
              <div className="text-left">
                <div>{tpl.name}</div>
                <div className="text-xs font-normal opacity-70 leading-tight">{tpl.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-5 pb-4 border-b border-slate-100">
        <Btn onClick={doPrint}>🖨 Print / Save as PDF</Btn>
        <Btn v="sec" onClick={onClose}>Close</Btn>
        <span className="ml-auto text-xs text-slate-400 flex items-center">
          Template: <strong className="ml-1 text-slate-600">{getTemplate(selectedTemplate).name}</strong>
        </span>
      </div>

      {/* Live Preview */}
      <div ref={printRef} className="border border-slate-200 rounded-2xl p-6 bg-white overflow-hidden">
        <LivePreview data={data} templateId={selectedTemplate} />
      </div>
    </Modal>
  )
}
