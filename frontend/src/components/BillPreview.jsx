import { useRef, useState, useEffect } from 'react'
import { Modal, Btn } from './ui'
import { fc, fd, numToWords } from '../utils/helpers'
import { TEMPLATES, getTemplate } from './BillTemplates'

// ── Live Preview Renderer (React JSX) — mirrors selected template for live preview
function LivePreview({ data, templateId }) {
  const { company={}, customer={}, billTo={}, shipTo={}, items=[], 
          sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0,
          isIntra=true, invoiceNo, estimateNo, date, dueDate, validTill, 
          notes, terms, declaration, type, placeOfSupply='', status='unpaid' } = data

  const invNo = invoiceNo || estimateNo || 'PREVIEW'
  const isEst = type === 'estimate'
  const tpl = getTemplate(templateId)
  
  // Accent colors per template
  const accents = {
    'classic-tally':  { bg:'#1a1a1a', text:'#333', header:'#333', accent:'#e94560', light:'#f5f5f5' },
    'modern-itc':     { bg:'#2563eb', text:'#2563eb', header:'#2563eb', accent:'#2563eb', light:'#eff6ff' },
    'premium-tata':   { bg:'linear-gradient(135deg,#1a1a2e,#16213e)', text:'#1a1a2e', header:'#1a1a2e', accent:'#e94560', light:'#f8f9fa' },
    'simple-gst':     { bg:'#4a90d9', text:'#4a90d9', header:'#4a90d9', accent:'#4a90d9', light:'#f0f7ff' },
  }
  const ac = accents[templateId] || accents['classic-tally']
  
  // Build items with GST calculation
  const buildItems = () => items.map((item,i) => {
    const taxable = (item.qty||0)*(item.price||0)
    const cg = isIntra ? taxable*(item.gstRate||0)/200 : 0
    const sg = isIntra ? taxable*(item.gstRate||0)/200 : 0
    const ig = !isIntra ? taxable*(item.gstRate||0)/100 : 0
    const rt = taxable + cg + sg + ig
    return { i, item, taxable, cg, sg, ig, total: rt }
  })
  const rows = buildItems()
  
  const custName = customer.name || customer.customerName || billTo.name || ''
  const custAddr = customer.address || billTo.address || ''
  const custState = customer.state || billTo.state || ''
  const custGstin = customer.gstin || billTo.gstin || ''
  
  const shipName = customer.shipTo?.name || shipTo.name || custName
  const shipAddr = customer.shipTo?.address || shipTo.address || custAddr
  const shipState = customer.shipTo?.state || shipTo.state || custState
  const shipGstin = customer.shipTo?.gstin || shipTo.gstin || custGstin

  // Template-specific rendering
  if (templateId === 'simple-gst') {
    return (
      <div style={{ fontFamily:"'Open Sans',sans-serif", fontSize:'10px', background:'#fff' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, paddingBottom:15, borderBottom:'2px solid #4a90d9' }}>
          <div style={{ flex:1 }}>
            {company.logo && <img src={company.logo} style={{ height:40, objectFit:'contain', marginBottom:8 }} alt="logo"/>}
            <div style={{ fontSize:18, fontWeight:700, color:'#2c3e50' }}>{company.name || 'Your Company'}</div>
            <div style={{ fontSize:9, color:'#666', lineHeight:1.6, marginTop:4 }}>
              {company.address && <div>{company.address}</div>}
              {company.state && <div>{company.state} - {company.pincode || ''}</div>}
              {company.gstin && <div>GSTIN: {company.gstin}</div>}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:700, color:'#4a90d9', textTransform:'uppercase' }}>{isEst ? 'QUOTATION' : 'TAX INVOICE'}</div>
            <div style={{ fontSize:10, marginTop:8, lineHeight:1.8 }}>
              <strong>#{invNo}</strong><br/>
              <strong>Date:</strong> {fd(date)}<br/>
              {dueDate && <><strong>Due:</strong> {fd(dueDate)}<br/></>}
              {placeOfSupply && <><strong>Place:</strong> {placeOfSupply}</>}
            </div>
          </div>
        </div>

        {/* Customer */}
        {custName && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            <div style={{ border:'1px solid #ddd', borderRadius:6, padding:12 }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#4a90d9', marginBottom:6, paddingBottom:4, borderBottom:'1px solid #eee' }}>Bill To</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#2c3e50' }}>{custName}</div>
              <div style={{ fontSize:9, color:'#666', lineHeight:1.5, marginTop:3 }}>
                {custAddr && <div>{custAddr}</div>}
                {custState && <div>{custState}</div>}
                {custGstin && <div>GSTIN: {custGstin}</div>}
              </div>
            </div>
            <div style={{ border:'1px solid #ddd', borderRadius:6, padding:12 }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#2c3e50', marginBottom:6, paddingBottom:4, borderBottom:'1px solid #eee' }}>Ship To</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#2c3e50' }}>{shipName}</div>
              <div style={{ fontSize:9, color:'#666', lineHeight:1.5, marginTop:3 }}>
                {shipAddr && <div>{shipAddr}</div>}
                {shipState && <div>{shipState}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
          <thead>
            <tr style={{ background:'#4a90d9', color:'#fff' }}>
              {['#','Description','HSN','Qty','Rate','Taxable',...(isIntra?['CGST','SGST']:['IGST']),'Total'].map((h,i) => (
                <th key={h} style={{ padding:'8px 6px', fontSize:9, fontWeight:600, textTransform:'uppercase', textAlign:i===0||i===1?'left':'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.i}>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'center' }}>{r.i + 1}</td>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'left', fontWeight:600 }}>{r.item.productName || '—'}</td>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'center' }}>{r.item.hsnCode || 'N/A'}</td>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{r.item.qty}</td>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{fc(r.item.price)}</td>
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{fc(r.taxable)}</td>
                {isIntra ? (
                  <>
                    <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{fc(r.cg)}</td>
                    <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{fc(r.sg)}</td>
                  </>
                ) : (
                  <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right' }}>{fc(r.ig)}</td>
                )}
                <td style={{ borderBottom:'1px solid #eee', padding:7, textAlign:'right', fontWeight:700, color:'#4a90d9' }}>{fc(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
          <table style={{ width:200, borderCollapse:'collapse' }}>
            <tbody>
              <tr><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>Taxable</td><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>{fc(sub)}</td></tr>
              {isIntra && <><tr><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>CGST</td><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>{fc(cgst)}</td></tr>
              <tr><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>SGST</td><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>{fc(sgst)}</td></tr></>}
              {!isIntra && <tr><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>IGST</td><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>{fc(igst)}</td></tr>}
              {(discAmt||0) > 0 && <tr><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>Discount</td><td style={{ border:'1px solid #ddd', padding:'6px 10px', textAlign:'right' }}>-{fc(discAmt)}</td></tr>}
              <tr style={{ background:'#4a90d9', color:'#fff' }}><td style={{ border:'1px solid #4a90d9', padding:'6px 10px', textAlign:'right', fontWeight:700 }}>Total</td><td style={{ border:'1px solid #4a90d9', padding:'6px 10px', textAlign:'right', fontWeight:700, fontSize:12 }}>{fc(total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Words */}
        <div style={{ border:'1px solid #ddd', padding:'10px 15px', marginBottom:20, background:'#f9f9f9', borderRadius:4 }}>
          <div style={{ fontWeight:700, color:'#2c3e50', fontSize:10 }}>Amount in Words:</div>
          <div style={{ fontSize:10, color:'#555', marginTop:3 }}>{numToWords(Math.round(total||0))}</div>
        </div>

        {/* Bank & Declaration */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <div style={{ border:'1px solid #ddd', borderRadius:6, padding:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#2c3e50', marginBottom:8, paddingBottom:6, borderBottom:'1px solid #eee' }}>Bank Details</div>
            <div style={{ fontSize:9, color:'#555', lineHeight:1.8 }}>
              {company.bank && <div><strong>Bank:</strong> {company.bank}</div>}
              {company.accNo && <div><strong>A/C:</strong> {company.accNo}</div>}
              {company.ifsc && <div><strong>IFSC:</strong> {company.ifsc}</div>}
              {company.upi && <div><strong>UPI:</strong> {company.upi}</div>}
            </div>
          </div>
          <div style={{ border:'1px solid #ddd', borderRadius:6, padding:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#2c3e50', marginBottom:8, paddingBottom:6, borderBottom:'1px solid #eee' }}>Declaration</div>
            <div style={{ fontSize:9, color:'#555', lineHeight:1.5 }}>
              {declaration || company.declaration || 'We declare that this invoice shows the actual price.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:15, borderTop:'1px solid #ddd', marginTop:10 }}>
          <div style={{ maxWidth:350 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#999', marginBottom:4 }}>Notes</div>
            <div style={{ fontSize:9, color:'#666' }}>{notes || 'Thank you for your business!'}</div>
            {terms && <><div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#999', marginTop:10 }}>Terms</div><div style={{ fontSize:9, color:'#666' }}>{terms}</div></>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ borderTop:'1px solid #333', width:150, marginLeft:'auto', paddingTop:4, fontSize:8, textTransform:'uppercase', color:'#999', marginTop:40 }}>Authorised Signatory</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#2c3e50', marginTop:4 }}>{company.name}</div>
          </div>
        </div>
      </div>
    )
  }

  if (templateId === 'classic-tally') {
    return (
      <div style={{ fontFamily:"'Roboto',sans-serif", fontSize:'10px', background:'#fff' }}>
        {/* Header */}
        <div style={{ border:'2px solid #333', padding:'15px', marginBottom:'15px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'1px solid #ddd', paddingBottom:'10px', marginBottom:'10px' }}>
            <div style={{ flex:1 }}>
              {company.logo && <img src={company.logo} style={{ height:45, objectFit:'contain', marginBottom:5 }} alt="logo"/>}
              <div style={{ fontSize:18, fontWeight:900 }}>{company.name || 'Your Company'}</div>
              <div style={{ fontSize:9, color:'#555', lineHeight:1.5, marginTop:4 }}>
                {company.address && <div>{company.address}</div>}
                {company.state && <div>{company.state} - {company.pincode || ''}</div>}
                {company.gstin && <div>GSTIN/UIN: {company.gstin}</div>}
                {company.mobile && <div>Ph: {company.mobile}</div>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:22, fontWeight:900, textTransform:'uppercase' }}>{isEst ? 'ESTIMATE' : 'TAX INVOICE'}</div>
              <div style={{ fontSize:11, marginTop:5 }}>
                <strong>Invoice No:</strong> {invNo}<br/>
                <strong>Date:</strong> {fd(date)}<br/>
                {dueDate && <><strong>Due Date:</strong> {fd(dueDate)}<br/></>}
                {placeOfSupply && <><strong>Place of Supply:</strong> {placeOfSupply}</>}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        {custName && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:15 }}>
            <div style={{ border:'1px solid #ddd', padding:10 }}>
              <div style={{ fontWeight:700, fontSize:9, textTransform:'uppercase', background:'#f5f5f5', padding:'3px 8px', margin:-10, marginBottom:8, borderBottom:'1px solid #ddd' }}>Bill To (Buyer)</div>
              <div style={{ fontSize:13, fontWeight:700 }}>{custName}</div>
              <div style={{ fontSize:9, color:'#555', lineHeight:1.5 }}>
                {custAddr && <div>{custAddr}</div>}
                {custState && <div>{custState}</div>}
                {custGstin && <div>GSTIN: {custGstin}</div>}
              </div>
              <span style={{ display:'inline-block', padding:'2px 8px', fontSize:8, fontWeight:700, marginTop:5, background:isIntra?'#e3f2fd':'#fff3e0', color:isIntra?'#1565c0':'#e65100' }}>
                {isIntra ? 'Intra-State' : 'Inter-State'}
              </span>
            </div>
            <div style={{ border:'1px solid #ddd', padding:10 }}>
              <div style={{ fontWeight:700, fontSize:9, textTransform:'uppercase', background:'#f5f5f5', padding:'3px 8px', margin:-10, marginBottom:8, borderBottom:'1px solid #ddd' }}>Ship To (Consignee)</div>
              <div style={{ fontSize:13, fontWeight:700 }}>{shipName}</div>
              <div style={{ fontSize:9, color:'#555', lineHeight:1.5 }}>
                {shipAddr && <div>{shipAddr}</div>}
                {shipState && <div>{shipState}</div>}
                {shipGstin && <div>GSTIN: {shipGstin}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:15 }}>
          <thead>
            <tr style={{ background:ac.header, color:'#fff' }}>
              {['#','Description','HSN','Qty','Unit','Rate','Taxable',...(isIntra?['CGST','SGST']:['IGST']),'Total'].map((h,i) => (
                <th key={h} style={{ padding:'6px 5px', fontSize:9, fontWeight:700, textTransform:'uppercase', textAlign:i===0||i===1?'left':'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.i}>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'center' }}>{r.i + 1}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'left', fontWeight:600 }}>{r.item.productName || '—'}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'center' }}>{r.item.hsnCode || 'N/A'}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{r.item.qty}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{r.item.unit || ''}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{fc(r.item.price)}</td>
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{fc(r.taxable)}</td>
                {isIntra ? (
                  <>
                    <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{fc(r.cg)}</td>
                    <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{fc(r.sg)}</td>
                  </>
                ) : (
                  <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right' }}>{fc(r.ig)}</td>
                )}
                <td style={{ border:'1px solid #ddd', padding:5, textAlign:'right', fontWeight:700 }}>{fc(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:15 }}>
          <table style={{ width:250, borderCollapse:'collapse' }}>
            <tbody>
              <tr><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>Taxable Value</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>{fc(sub)}</td></tr>
              {isIntra && <><tr><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>CGST</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>{fc(cgst)}</td></tr>
              <tr><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>SGST</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>{fc(sgst)}</td></tr></>}
              {!isIntra && <tr><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>IGST</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>{fc(igst)}</td></tr>}
              {(discAmt||0) > 0 && <tr><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>Discount</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right' }}>-{fc(discAmt)}</td></tr>}
              <tr style={{ background:'#333', color:'#fff' }}><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right', fontWeight:700 }}>Total</td><td style={{ border:'1px solid #333', padding:'5px 8px', textAlign:'right', fontWeight:700, fontSize:12 }}>{fc(total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Words */}
        <div style={{ border:'1px solid #ddd', padding:'8px 12px', marginBottom:15, background:'#f9f9f9', fontSize:10 }}>
          <strong>Amount in Words:</strong> {numToWords(Math.round(total||0))}
        </div>

        {/* Bank Details */}
        {(company.bank || company.accNo) && (
          <div style={{ border:'1px solid #ddd', padding:10, marginBottom:15, fontSize:9 }}>
            <div style={{ fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Bank Details</div>
            <div style={{ lineHeight:1.8 }}>
              {company.bank && <><strong>Bank:</strong> {company.bank} | </>}
              {company.accNo && <><strong>A/C:</strong> {company.accNo} | </>}
              {company.ifsc && <><strong>IFSC:</strong> {company.ifsc} | </>}
              {company.upi && <><strong>UPI:</strong> {company.upi}</>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:20, fontSize:9 }}>
          <div style={{ border:'1px solid #ddd', padding:10 }}>
            <div style={{ fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Declaration</div>
            <div>{declaration || company.declaration || 'Goods once sold will not be taken back.'}</div>
            {terms && <><br/><strong>Terms:</strong> {terms}</>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ borderTop:'1px solid #333', width:180, marginLeft:'auto', paddingTop:5, marginTop:45, textTransform:'uppercase', fontSize:8 }}>Authorised Signatory</div>
            <div style={{ fontWeight:700, marginTop:5 }}>{company.name}</div>
          </div>
        </div>
      </div>
    )
  }

  if (templateId === 'modern-itc') {
    return (
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', background:'#fff' }}>
        {/* Header */}
        <div style={{ borderBottom:'3px solid #2563eb', paddingBottom:15, marginBottom:20, display:'flex', justifyContent:'space-between' }}>
          <div style={{ flex:1 }}>
            {company.logo && <img src={company.logo} style={{ height:40, objectFit:'contain', marginBottom:8 }} alt="logo"/>}
            <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>{company.name || 'Your Company'}</div>
            <div style={{ fontSize:9, color:'#64748b', lineHeight:1.6, marginTop:4 }}>
              {company.address && <div>{company.address}</div>}
              {company.state && <div>{company.state} - {company.pincode || ''}</div>}
              {company.gstin && <div>GSTIN: {company.gstin}</div>}
            </div>
          </div>
          <div style={{ textAlign:'right', background:'#f8fafc', padding:'12px 15px', borderRadius:8, border:'1px solid #e2e8f0' }}>
            <div style={{ display:'inline-block', background:'#2563eb', color:'#fff', padding:'3px 10px', fontSize:9, fontWeight:700, borderRadius:4, marginBottom:6 }}>{isEst ? 'ESTIMATE' : 'TAX INVOICE'}</div>
            <div style={{ fontSize:10, lineHeight:1.8 }}>
              <strong>#{invNo}</strong><br/>
              Date: {fd(date)}<br/>
              {dueDate && <>Due: {fd(dueDate)}<br/></>}
              {placeOfSupply && <>Place: {placeOfSupply}</>}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            ['Invoice No', invNo],
            ['Date', fd(date)],
            ['Due Date', dueDate ? fd(dueDate) : '—'],
            ['Place of Supply', placeOfSupply || custState || '—']
          ].map(([l,v]) => (
            <div key={l} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:8, background:'#f8fafc' }}>
              <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', color:'#94a3b8' }}>{l}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'#1e293b', marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Customer Cards */}
        {custName && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#2563eb', marginBottom:5 }}>Bill To</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>{custName}</div>
              <div style={{ fontSize:9, color:'#64748b', lineHeight:1.6, marginTop:4 }}>
                {custAddr && <div>{custAddr}</div>}
                {custState && <div>{custState}</div>}
                {custGstin && <div>GSTIN: {custGstin}</div>}
              </div>
              <span style={{ display:'inline-block', padding:'2px 8px', fontSize:8, fontWeight:700, marginTop:5, borderRadius:4, background:isIntra?'#dbeafe':'#ffedd5', color:isIntra?'#2563eb':'#c2410c' }}>
                {isIntra ? 'Intra (CGST+SGST)' : 'Inter (IGST)'}
              </span>
            </div>
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:'#1e293b', marginBottom:5 }}>Ship To</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>{shipName}</div>
              <div style={{ fontSize:9, color:'#64748b', lineHeight:1.6, marginTop:4 }}>
                {shipAddr && <div>{shipAddr}</div>}
                {shipState && <div>{shipState}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20, borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0' }}>
          <thead>
            <tr style={{ background:'#2563eb', color:'#fff' }}>
              {['#','Description','HSN','Qty','Rate','Taxable',...(isIntra?['CGST','SGST']:['IGST']),'Amount'].map((h,i) => (
                <th key={h} style={{ padding:'8px 6px', fontSize:9, fontWeight:700, textTransform:'uppercase', textAlign:i===0||i===1?'left':'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.i} style={r.i%2===0?{}:{background:'#f8fafc'}}>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'center' }}>{r.i + 1}</td>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'left', fontWeight:600 }}>{r.item.productName || '—'}</td>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'center' }}>{r.item.hsnCode || 'N/A'}</td>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{r.item.qty}</td>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{fc(r.item.price)}</td>
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{fc(r.taxable)}</td>
                {isIntra ? (
                  <>
                    <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{fc(r.cg)}</td>
                    <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{fc(r.sg)}</td>
                  </>
                ) : (
                  <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right' }}>{fc(r.ig)}</td>
                )}
                <td style={{ borderBottom:'1px solid #f1f5f9', padding:6, textAlign:'right', fontWeight:700, color:'#2563eb' }}>{fc(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary & Notes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 250px', gap:20, marginBottom:20 }}>
          <div style={{ fontSize:9, color:'#64748b' }}>
            {notes && <><strong>Notes:</strong><br/>{notes}<br/></>}
            {terms && <><strong>Terms:</strong><br/>{terms}</>}
          </div>
          <div style={{ background:'#f8fafc', border:'2px solid #2563eb', borderRadius:12, padding:15 }}>
            {[['Taxable', sub], ...(isIntra ? [['CGST', cgst], ['SGST', sgst]] : [['IGST', igst]]), ...((discAmt||0) > 0 ? [['Discount', -discAmt]] : [])].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #e2e8f0', fontSize:10 }}>
                <span style={{ color:'#64748b' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{l==='Discount'?'':'₹'}{(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span>
              </div>
            ))}
            <div style={{ background:'#2563eb', color:'#fff', padding:10, borderRadius:6, marginTop:8, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:600 }}>Total</span>
              <span style={{ fontWeight:800, fontSize:14 }}>{fc(total)}</span>
            </div>
          </div>
        </div>

        {/* Words */}
        <div style={{ background:'#ecfccb', borderLeft:'4px solid #65a30d', padding:'10px 14px', marginBottom:20, borderRadius:'0 8px 8px 0', fontSize:10 }}>
          <strong style={{ color:'#365314' }}>Amount in Words:</strong> {numToWords(Math.round(total||0))}
        </div>

        {/* Bank & QR */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 180px', gap:20, marginBottom:20 }}>
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:14 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#166534', marginBottom:8 }}>🏦 Bank & Payment</div>
            <div style={{ fontSize:9, color:'#166534', lineHeight:1.8 }}>
              {company.bank && <><strong>Bank:</strong> {company.bank}<br/></>}
              {company.accNo && <><strong>A/C:</strong> {company.accNo}<br/></>}
              {company.ifsc && <><strong>IFSC:</strong> {company.ifsc}<br/></>}
              {company.upi && <><strong>UPI:</strong> {company.upi}</>}
            </div>
          </div>
          <div style={{ background:'#f8f9fa', border:'1px solid #e2e8f0', borderRadius:10, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#64748b', marginBottom:8 }}>📱 Scan to Pay</div>
            <div style={{ width:100, height:100, background:'#f1f5f9', margin:'0 auto', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:8 }}>QR Code</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:'2px solid #e2e8f0', paddingTop:15, display:'flex', justifyContent:'space-between', fontSize:9, color:'#64748b' }}>
          <div style={{ maxWidth:350 }}>
            <strong style={{ color:'#1e293b' }}>Declaration:</strong> {declaration || company.declaration || 'We declare that this invoice shows the actual price.'}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ borderTop:'1px solid #94a3b8', width:160, paddingTop:6, marginTop:45, marginLeft:'auto', textTransform:'uppercase', fontSize:8 }}>Authorised Signatory</div>
            <div style={{ fontWeight:700, color:'#1e293b', marginTop:5 }}>{company.name}</div>
          </div>
        </div>
      </div>
    )
  }

  // Premium TATA Style
  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:'10px', background:'#fff' }}>
      {/* Top Banner */}
      <div style={{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', height:8 }}></div>
      
      {/* Header */}
      <div style={{ background:'#fff', padding:'20px 25px', borderBottom:'3px solid #e94560', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          {company.logo && <img src={company.logo} style={{ height:50, objectFit:'contain', marginBottom:8 }} alt="logo"/>}
          <div style={{ fontSize:22, fontWeight:900, color:'#1a1a2e', letterSpacing:'-0.5px' }}>{company.name || 'Your Company'}</div>
          <div style={{ fontSize:10, color:'#555', lineHeight:1.7, marginTop:4 }}>
            {company.address && <div>{company.address}{company.state ? `, ${company.state}` : ''}{company.pincode ? ` - ${company.pincode}` : ''}</div>}
            {company.gstin && <div>GSTIN: {company.gstin} | PAN: {company.pan || '—'}</div>}
            {company.mobile && <div>Ph: {company.mobile} | Email: {company.email}</div>}
          </div>
        </div>
        <div style={{ textAlign:'right', background:'#f8f9fa', padding:'12px 18px', borderRadius:10, border:'1px solid #e9ecef' }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#e94560', letterSpacing:'-1px' }}>{isEst ? 'QUOTATION' : 'INVOICE'}</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', margin:'4px 0' }}>#{invNo}</div>
          <div style={{ fontSize:10, color:'#666', lineHeight:1.8 }}>
            <strong>Date:</strong> {fd(date)}<br/>
            {dueDate && <><strong>Due:</strong> {fd(dueDate)}<br/></>}
            {placeOfSupply && <><strong>Place:</strong> {placeOfSupply}</>}
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div style={{ background:'#f8f9fa', padding:'10px 25px', display:'flex', justifyContent:'space-between', fontSize:9, color:'#555', borderBottom:'1px solid #e9ecef' }}>
        <span><strong>PAN:</strong> {company.pan || '—'}</span>
        <span><strong>GSTIN:</strong> {company.gstin || '—'}</span>
        <span><strong>CIN:</strong> {company.cin || '—'}</span>
        <span><strong>State:</strong> {company.state || '—'}</span>
      </div>

      {/* Customer Cards */}
      {custName && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, padding:'18px 25px' }}>
          <div style={{ background:'#fff', border:'2px solid #e94560', borderRadius:12, padding:14, position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'#e94560', borderRadius:'10px 10px 0 0' }}></div>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6, color:'#e94560' }}>Bill To</div>
            <div style={{ fontSize:14, fontWeight:800, color:'#1a1a2e' }}>{custName}</div>
            <div style={{ fontSize:10, color:'#555', lineHeight:1.7, marginTop:4 }}>
              {custAddr && <div>{custAddr}</div>}
              {custState && <div>{custState}</div>}
              {custGstin && <div>GSTIN: {custGstin}</div>}
            </div>
          </div>
          <div style={{ background:'#fff', border:'2px solid #1a1a2e', borderRadius:12, padding:14, position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'#1a1a2e', borderRadius:'10px 10px 0 0' }}></div>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6, color:'#1a1a2e' }}>Ship To</div>
            <div style={{ fontSize:14, fontWeight:800, color:'#1a1a2e' }}>{shipName}</div>
            <div style={{ fontSize:10, color:'#555', lineHeight:1.7, marginTop:4 }}>
              {shipAddr && <div>{shipAddr}</div>}
              {shipState && <div>{shipState}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div style={{ padding:'0 25px 18px' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', color:'#fff' }}>
              {['#','Product / Service','HSN/SAC','Qty','Rate','Taxable',...(isIntra?['CGST','SGST']:['IGST']),'Total'].map((h,i) => (
                <th key={h} style={{ padding:'10px 8px', fontSize:10, fontWeight:600, textTransform:'uppercase', textAlign:i===0||i===1?'left':'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.i} style={r.i%2===0?{}:{background:'#fafbfc'}}>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'center', color:'#888' }}>{r.i + 1}</td>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'left', fontWeight:600, color:'#1a1a2e' }}>{r.item.productName || '—'}</td>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'center' }}>{r.item.hsnCode || 'N/A'}</td>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{r.item.qty} {r.item.unit || ''}</td>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{fc(r.item.price)}</td>
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{fc(r.taxable)}</td>
                {isIntra ? (
                  <>
                    <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{fc(r.cg)}</td>
                    <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{fc(r.sg)}</td>
                  </>
                ) : (
                  <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right' }}>{fc(r.ig)}</td>
                )}
                <td style={{ borderBottom:'1px solid #f0f0f0', padding:8, textAlign:'right', fontWeight:700, color:'#e94560' }}>{fc(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Highlight */}
      <div style={{ padding:'0 25px 18px', display:'flex', justifyContent:'flex-end' }}>
        <div style={{ background:'linear-gradient(135deg,#e94560,#ff6b6b)', color:'#fff', padding:'16px 24px', borderRadius:12, boxShadow:'0 4px 15px rgba(233,69,96,0.3)' }}>
          <div style={{ fontSize:11, fontWeight:600, opacity:0.9, marginBottom:4 }}>{isEst ? 'Quotation Amount' : 'Total Amount'}</div>
          <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-1px' }}>{fc(total)}</div>
          <div style={{ fontSize:10, opacity:0.9, marginTop:6, fontStyle:'italic' }}>{numToWords(Math.round(total||0))}</div>
        </div>
      </div>

      {/* Bank Details */}
      <div style={{ padding:'0 25px 18px' }}>
        <div style={{ background:'#f8f9fa', borderRadius:12, padding:16, border:'1px solid #e9ecef' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#1a1a2e', marginBottom:10, paddingBottom:8, borderBottom:'2px solid #e94560' }}>🏦 Bank Details</div>
          <div style={{ fontSize:10, color:'#555', lineHeight:2 }}>
            {company.bank && <div><strong>Bank:</strong> {company.bank}</div>}
            {company.accName && <div><strong>A/C Name:</strong> {company.accName}</div>}
            {company.accNo && <div><strong>A/C No:</strong> {company.accNo}</div>}
            {company.ifsc && <div><strong>IFSC:</strong> {company.ifsc}</div>}
            {company.branch && <div><strong>Branch:</strong> {company.branch}</div>}
            {company.upi && <div><strong>UPI:</strong> {company.upi}</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'18px 25px', background:'#1a1a2e', color:'#fff', display:'flex', justifyContent:'space-between' }}>
        <div style={{ maxWidth:350 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8, color:'#e94560' }}>Declaration</div>
          <div style={{ fontSize:9, lineHeight:1.7, opacity:0.85 }}>
            {declaration || company.declaration || 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.'}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ borderTop:'2px solid rgba(255,255,255,0.3)', paddingTop:10, marginTop:45 }}>
            <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, opacity:0.7 }}>Authorised Signatory</div>
            <div style={{ fontSize:12, fontWeight:700, marginTop:5 }}>{company.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main BillPreview Component ────────────────────────────────────────────────
export default function BillPreview({ data, onClose, defaultTemplate }) {
  const printRef = useRef()
  const [selectedTemplate, setSelectedTemplate] = useState(data?.templateId || defaultTemplate || 'classic-tally')
  const [saving, setSaving] = useState(false)

  const { invoiceNo, estimateNo, type } = data
  const invNo = invoiceNo || estimateNo || 'PREVIEW'
  const isEst = type === 'estimate'

  const doPrint = () => {
    const tpl = getTemplate(selectedTemplate)
    const html = tpl.render(data)
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>${isEst ? 'Estimate' : 'Invoice'} #${invNo} — ${tpl.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Poppins:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
      <style>${tpl.css}</style>
    </head><body>${html}</body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 400)
  }

  const doDownloadPDF = async () => {
    setSaving(true)
    try {
      const tpl = getTemplate(selectedTemplate)
      const html = tpl.render(data)
      
      // Create a new window for PDF generation
      const w = window.open('', '_blank')
      w.document.write(`<!DOCTYPE html><html><head>
        <title>Invoice #${invNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Poppins:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
        <style>${tpl.css} @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head><body>${html}</body></html>`)
      w.document.close()
      
      // Wait for content to load then print/save
      setTimeout(() => {
        w.focus()
        w.print()
        setSaving(false)
      }, 500)
    } catch (err) {
      console.error('PDF generation error:', err)
      setSaving(false)
    }
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
        <Btn onClick={doPrint}>🖨 Print / Save PDF</Btn>
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
