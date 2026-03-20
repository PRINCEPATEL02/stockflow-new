// ═══════════════════════════════════════════════════════════════════════════
//  BILL TEMPLATES — 3 Professional GST Invoice Formats
//  Template 1: Classic (Tally Style)
//  Template 2: Modern GST Invoice (ITC Style)  
//  Template 3: Premium Corporate (TATA Style)
// ═══════════════════════════════════════════════════════════════════════════

import { fc, fd, numToWords } from '../utils/helpers'

// ── Shared helpers ─────────────────────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>')

// Build items with GST calculation
const buildItems = (items=[], isIntra=true) => items.map((item,i) => {
  const taxable = (item.qty||0)*(item.price||0)
  const cg = isIntra ? taxable*(item.gstRate||0)/200 : 0
  const sg = isIntra ? taxable*(item.gstRate||0)/200 : 0
  const ig = !isIntra ? taxable*(item.gstRate||0)/100 : 0
  const total = taxable + cg + sg + ig
  return { i, item, taxable, cg, sg, ig, total }
})

// Generate QR Code URL for payment
const generatePaymentQR = (company, total, invoiceNo) => {
  if (!company?.upi && !company?.upiId) return ''
  const upi = company.upi || company.upiId
  // UPI payment link format
  const qrData = `upi://pay?pa=${upi}&pn=${encodeURIComponent(company.name||'Merchant')}&am=${total}&tn=Invoice-${invoiceNo}`
  return qrData
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 1 — CLASSIC GST INVOICE (Tally Style)
//  Simple table layout, CGST + SGST breakup, Bill To & Ship To, HSN/SAC
// ═══════════════════════════════════════════════════════════════════════════
const TemplateClassicTally = {
  id: 'classic-tally',
  name: 'Classic Tally',
  emoji: '📋',
  description: 'Traditional Tally-style with HSN/SAC table, Bill To & Ship To',
  
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Roboto',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:10px;padding:15px}
    .page{max-width:800px;margin:0 auto}
    
    /* Header */
    .header{border:2px solid #333;padding:15px;margin-bottom:15px}
    .header-top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:10px}
    .logo-section{flex:1}
    .logo{max-height:50px;object-fit:contain}
    .co-name{font-size:18px;font-weight:900;margin:5px 0}
    .co-address{font-size:9px;line-height:1.5;color:#555}
    
    .invoice-title{text-align:right}
    .inv-label{font-size:22px;font-weight:900;color:#333;text-transform:uppercase}
    .inv-meta{font-size:10px;margin-top:5px;text-align:right}
    
    /* Company Details Grid */
    .co-details{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:15px;font-size:9px}
    .detail-box{border:1px solid #ddd;padding:8px}
    .detail-label{font-weight:700;text-transform:uppercase;margin-bottom:3px;font-size:8px;color:#666}
    .detail-value{line-height:1.4}
    
    /* Bill To / Ship To */
    .party-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:15px}
    .party-box{border:1px solid #ddd;padding:10px}
    .party-label{font-weight:700;font-size:9px;text-transform:uppercase;background:#f5f5f5;padding:3px 8px;margin:-10px -10px 8px -10px;border-bottom:1px solid #ddd}
    .party-name{font-size:12px;font-weight:700}
    .party-detail{font-size:9px;line-height:1.5;color:#555}
    
    /* GST Type Badge */
    .gst-badge{display:inline-block;padding:2px 8px;font-size:8px;font-weight:700;margin-top:5px}
    .intra{background:#e3f2fd;color:#1565c0}
    .inter{background:#fff3e0;color:#e65100}
    
    /* Items Table */
    table{width:100%;border-collapse:collapse;margin-bottom:15px}
    th{border:1px solid #333;background:#f5f5f5;padding:6px 5px;font-size:9px;font-weight:700;text-transform:uppercase;text-align:center}
    th:first-child{text-align:left;width:30px}
    th:nth-child(2){text-align:left}
    td{border:1px solid #ddd;padding:5px;font-size:9px;text-align:right}
    td:first-child{text-align:center}
    td:nth-child(2){text-align:left}
    tr:nth-child(even) td{background:#fafafa}
    
    /* Totals */
    .totals-section{display:flex;justify-content:flex-end;margin-bottom:15px}
    .totals-table{width:280px;border-collapse:collapse}
    .totals-table th,.totals-table td{border:1px solid #333;padding:5px 8px;text-align:right;font-size:10px}
    .totals-table th{background:#f5f5f5;text-transform:uppercase}
    .grand-total{background:#333;color:#fff;font-weight:700;font-size:12px}
    
    /* Amount in Words */
    .words{border:1px solid #ddd;padding:8px 12px;margin-bottom:15px;font-size:10px;background:#f9f9f9}
    .words-label{font-weight:700}
    
    /* Bank Details */
    .bank-section{border:1px solid #ddd;padding:10px;margin-bottom:15px;font-size:9px}
    .bank-title{font-weight:700;margin-bottom:5px;text-transform:uppercase;font-size:9px}
    .bank-details{line-height:1.6}
    
    /* Declaration & Signature */
    .footer-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;font-size:9px}
    .declaration{border:1px solid #ddd;padding:10px}
    .declaration-title{font-weight:700;margin-bottom:5px;text-transform:uppercase}
    .signature{text-align:right}
    .sign-line{border-top:1px solid #333;width:180px;margin-left:auto;padding-top:5px;margin-top:40px;text-transform:uppercase;font-size:8px}
    .sign-company{font-weight:700;margin-top:5px}
    
    /* HSN Row */
    .hsn-row td{background:#f5f5f5;font-weight:600;text-align:left}
  `,
  
  render(data) {
    const { company={}, customer={}, billTo={}, shipTo={}, items=[], 
            sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, 
            isIntra=true, invoiceNo, date, dueDate, notes='', terms='', 
            declaration='', type, placeOfSupply='' } = data
    
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstLabel = isIntra ? 'CGST + SGST' : 'IGST'
    const custName = customer.name || customer.customerName || billTo.name || ''
    const custAddr = customer.address || billTo.address || ''
    const custState = customer.state || billTo.state || ''
    const custGstin = customer.gstin || billTo.gstin || ''
    const shipName = shipTo.name || custName
    const shipAddr = shipTo.address || custAddr
    const shipState = shipTo.state || custState
    const shipGstin = shipTo.gstin || custGstin
    
    // Calculate HSN totals
    const hsnGroups = {}
    items.forEach(item => {
      const hsn = item.hsnCode || 'N/A'
      if (!hsnGroups[hsn]) hsnGroups[hsn] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      const amt = (item.qty||0)*(item.price||0)
      hsnGroups[hsn].taxable += amt
      if (isIntra) {
        hsnGroups[hsn].cgst += amt * (item.gstRate||0) / 200
        hsnGroups[hsn].sgst += amt * (item.gstRate||0) / 200
      } else {
        hsnGroups[hsn].igst += amt * (item.gstRate||0) / 100
      }
      hsnGroups[hsn].total += isIntra ? amt * (1 + (item.gstRate||0)/100) : amt * (1 + (item.gstRate||0)/100)
    })
    
    return `
      <div class="page">
        <div class="header">
          <div class="header-top">
            <div class="logo-section">
              ${company.logo ? `<img src="${esc(company.logo)}" class="logo"/>` : ''}
              <div class="co-name">${esc(company.name || 'Your Company')}</div>
              <div class="co-address">
                ${company.address ? `${esc(company.address)}<br>` : ''}
                ${company.state ? `${esc(company.state)} - ${company.pincode || ''}<br>` : ''}
                ${company.gstin ? `GSTIN/UIN: ${esc(company.gstin)}<br>` : ''}
                ${company.mobile ? `Ph: ${esc(company.mobile)}<br>` : ''}
                ${company.email ? `Email: ${esc(company.email)}` : ''}
              </div>
            </div>
            <div class="invoice-title">
              <div class="inv-label">${isEst ? 'ESTIMATE' : 'TAX INVOICE'}</div>
              <div class="inv-meta">
                <strong>Invoice No:</strong> ${esc(invoiceNo || 'PREVIEW')}<br>
                <strong>Date:</strong> ${fd(date)}<br>
                ${dueDate ? `<strong>Due Date:</strong> ${fd(dueDate)}<br>` : ''}
                ${placeOfSupply ? `<strong>Place of Supply:</strong> ${esc(placeOfSupply)}` : ''}
              </div>
            </div>
          </div>
          
          <div class="co-details">
            <div class="detail-box">
              <div class="detail-label">Company Details</div>
              <div class="detail-value">
                ${company.pan ? `PAN: ${esc(company.pan)}<br>` : ''}
                ${company.cin ? `CIN: ${esc(company.cin)}<br>` : ''}
                ${company.msme ? `MSME: ${esc(company.msme)}` : ''}
              </div>
            </div>
            <div class="detail-box">
              <div class="detail-label">Bank Details</div>
              <div class="detail-value">
                ${company.bank ? `Bank: ${esc(company.bank)}<br>` : ''}
                ${company.accNo ? `A/C: ${esc(company.accNo)}<br>` : ''}
                ${company.ifsc ? `IFSC: ${esc(company.ifsc)}<br>` : ''}
                ${company.branch ? `Branch: ${esc(company.branch)}<br>` : ''}
                ${company.upi ? `UPI: ${esc(company.upi)}` : ''}
              </div>
            </div>
          </div>
        </div>
        
        ${custName ? `
        <div class="party-section">
          <div class="party-box">
            <div class="party-label">Bill To (Buyer)</div>
            <div class="party-name">${esc(custName)}</div>
            <div class="party-detail">
              ${custAddr ? `${esc(custAddr)}<br>` : ''}
              ${custState ? `${esc(custState)}<br>` : ''}
              ${custGstin ? `GSTIN: ${esc(custGstin)}` : ''}
            </div>
            ${custGstin ? `<span class="gst-badge ${isIntra?'intra':'inter'}">${isIntra?'Intra-State':'Inter-State'}</span>` : ''}
          </div>
          <div class="party-box">
            <div class="party-label">Ship To (Consignee)</div>
            <div class="party-name">${esc(shipName)}</div>
            <div class="party-detail">
              ${shipAddr ? `${esc(shipAddr)}<br>` : ''}
              ${shipState ? `${esc(shipState)}<br>` : ''}
              ${shipGstin ? `GSTIN: ${esc(shipGstin)}` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Taxable</th>
              ${isIntra ? '<th>CGST%</th><th>CGST₹</th><th>SGST%</th><th>SGST₹</th>' : '<th>IGST%</th><th>IGST₹</th>'}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.i + 1}</td>
                <td>${esc(r.item.productName || '—')}</td>
                <td>${esc(r.item.hsnCode || 'N/A')}</td>
                <td>${r.item.qty}</td>
                <td>${esc(r.item.unit || '')}</td>
                <td>${fc(r.item.price)}</td>
                <td>${fc(r.taxable)}</td>
                ${isIntra 
                  ? `<td>${(r.item.gstRate||0)/2}%</td><td>${fc(r.cg)}</td><td>${(r.item.gstRate||0)/2}%</td><td>${fc(r.sg)}</td>`
                  : `<td>${r.item.gstRate||0}%</td><td>${fc(r.ig)}</td>`
                }
                <td>${fc(r.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-section">
          <table class="totals-table">
            <tr><th>Taxable Value</th><td>${fc(sub)}</td></tr>
            ${isIntra 
              ? `<tr><th>CGST</th><td>${fc(cgst)}</td></tr><tr><th>SGST</th><td>${fc(sgst)}</td></tr>`
              : `<tr><th>IGST</th><td>${fc(igst)}</td></tr>`
            }
            ${(discAmt||0) > 0 ? `<tr><th>Discount</th><td>-${fc(discAmt)}</td></tr>` : ''}
            <tr class="grand-total"><th>Total</th><td>${fc(total)}</td></tr>
          </table>
        </div>
        
        <div class="words">
          <span class="words-label">Amount in Words:</span> 
          ${numToWords(Math.round(total || 0))}
        </div>
        
        ${(company.bank || company.accNo) ? `
        <div class="bank-section">
          <div class="bank-title">Bank Details</div>
          <div class="bank-details">
            ${company.bank ? `Bank: <strong>${esc(company.bank)}</strong> | ` : ''}
            ${company.accNo ? `A/C No: <strong>${esc(company.accNo)}</strong> | ` : ''}
            ${company.ifsc ? `IFSC: <strong>${esc(company.ifsc)}</strong> | ` : ''}
            ${company.branch ? `Branch: <strong>${esc(company.branch)}</strong><br>` : ''}
            ${company.upi ? `UPI: <strong>${esc(company.upi)}</strong>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="footer-section">
          <div class="declaration">
            <div class="declaration-title">Declaration</div>
            <div>${declaration || company.declaration || 'Goods once sold will not be taken back. Subject to local jurisdiction.'}</div>
            ${terms ? `<br><strong>Terms & Conditions:</strong><br>${esc(terms)}` : ''}
            ${notes ? `<br><strong>Notes:</strong><br>${esc(notes)}` : ''}
          </div>
          <div class="signature">
            <div class="sign-line">Authorised Signatory</div>
            <div class="sign-company">${esc(company.name || '')}</div>
            ${company.signature ? `<img src="${esc(company.signature)}" style="max-width:120px;max-height:50px;margin-top:10px"/>` : ''}
          </div>
        </div>
      </div>
    `
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 2 — MODERN GST INVOICE (ITC Style)
//  Clean UI with sections, QR Code, Place of Supply, Total summary box
// ═══════════════════════════════════════════════════════════════════════════
const TemplateModernITC = {
  id: 'modern-itc',
  name: 'Modern ITC',
  emoji: '💳',
  description: 'Clean ITC-style with QR payment, Place of Supply, summary box',
  
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#fff;color:#1e293b;font-size:10px}
    .page{max-width:820px;margin:0 auto;padding:20px}
    
    /* Header */
    .header{border-bottom:3px solid #2563eb;padding-bottom:15px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start}
    .co-info{flex:1}
    .logo{max-height:45px;object-fit:contain;margin-bottom:8px}
    .co-name{font-size:20px;font-weight:900;color:#1e293b;margin-bottom:4px}
    .co-meta{font-size:9px;color:#64748b;line-height:1.6}
    
    .inv-info{text-align:right}
    .inv-badge{display:inline-block;background:#2563eb;color:#fff;padding:4px 12px;font-size:10px;font-weight:700;border-radius:4px;margin-bottom:8px}
    .inv-details{font-size:10px;line-height:1.8}
    .inv-details strong{color:#1e293b}
    
    /* Quick Info Cards */
    .info-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .info-card{border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc}
    .info-label{font-size:8px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}
    .info-value{font-size:11px;font-weight:700;color:#1e293b}
    
    /* Customer Section */
    .customer-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .customer-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px}
    .customer-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#2563eb;margin-bottom:6px}
    .customer-name{font-size:14px;font-weight:800;color:#1e293b;margin-bottom:4px}
    .customer-detail{font-size:9px;color:#64748b;line-height:1.6}
    .gst-type{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:700;margin-top:6px}
    .gst-intra{background:#dbeafe;color:#2563eb}
    .gst-inter{background:#ffedd5;color:#c2410c}
    
    /* Items Table */
    .items-table{width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}
    .items-table th{background:#2563eb;color:#fff;padding:10px 8px;font-size:9px;font-weight:700;text-transform:uppercase;text-align:right}
    .items-table th:first-child{text-align:center;width:40px}
    .items-table th:nth-child(2){text-align:left}
    .items-table td{padding:8px;border-bottom:1px solid #f1f5f9;font-size:9px;text-align:right}
    .items-table td:first-child{text-align:center}
    .items-table td:nth-child(2){text-align:left}
    .items-table tr:nth-child(even) td{background:#f8fafc}
    .items-table tr:last-child td{border-bottom:none}
    
    /* Summary Box */
    .summary-section{display:grid;grid-template-columns:1fr 280px;gap:20px;margin-bottom:20px}
    .notes-terms{font-size:9px;color:#64748b;line-height:1.6}
    .notes-title,.terms-title{font-weight:700;color:#1e293b;margin-bottom:4px;margin-top:8px}
    
    .summary-box{background:#f8fafc;border:2px solid #2563eb;border-radius:12px;padding:15px}
    .summary-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:10px}
    .summary-row:last-child{border-bottom:none}
    .summary-label{color:#64748b}
    .summary-value{font-weight:700;color:#1e293b}
    .summary-total{background:#2563eb;color:#fff;padding:12px;border-radius:8px;margin-top:8px}
    .summary-total .summary-label,.summary-total .summary-value{color:#fff}
    .summary-total .summary-value{font-size:14px;font-weight:900}
    
    /* Words */
    .words{background:#ecfccb;border-left:4px solid #65a30d;padding:10px 14px;font-size:10px;margin-bottom:20px;border-radius:0 8px 8px 0}
    .words-label{font-weight:700;color:#365314}
    
    /* Bank & QR */
    .payment-section{display:grid;grid-template-columns:1fr 200px;gap:20px;margin-bottom:20px}
    .bank-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px}
    .bank-title{font-size:10px;font-weight:800;color:#166534;margin-bottom:8px}
    .bank-row{font-size:9px;color:#166534;line-height:1.8}
    .qr-box{text-align:center;padding:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px}
    .qr-title{font-size:9px;font-weight:700;color:#64748b;margin-bottom:8px}
    .qr-placeholder{width:120px;height:120px;background:#f1f5f9;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8px}
    .qr-img{max-width:120px;max-height:120px}
    
    /* Footer */
    .footer{border-top:2px solid #e2e8f0;padding-top:15px;display:flex;justify-content:space-between;font-size:9px;color:#64748b}
    .declaration-box{max-width:400px}
    .declaration-title{font-weight:700;color:#1e293b;margin-bottom:4px}
    .signature-section{text-align:right}
    .sign-line{border-top:1px solid #94a3b8;width:180px;padding-top:6px;margin-left:auto;margin-top:50px;text-transform:uppercase;font-size:8px}
    .sign-name{font-weight:700;color:#1e293b;margin-top:6px}
  `,
  
  render(data) {
    const { company={}, customer={}, billTo={}, items=[], 
            sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0,
            isIntra=true, invoiceNo, date, dueDate, notes='', terms='',
            declaration='', type, placeOfSupply='' } = data
    
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const custName = customer.name || customer.customerName || billTo.name || ''
    const custAddr = customer.address || billTo.address || ''
    const custState = customer.state || billTo.state || ''
    const custGstin = customer.gstin || billTo.gstin || ''
    
    // Generate QR code data URL
    const qrData = generatePaymentQR(company, total, invoiceNo)
    
    return `
      <div class="page">
        <div class="header">
          <div class="co-info">
            ${company.logo ? `<img src="${esc(company.logo)}" class="logo"/>` : ''}
            <div class="co-name">${esc(company.name || 'Your Company')}</div>
            <div class="co-meta">
              ${company.address ? `${esc(company.address)}<br>` : ''}
              ${company.state ? `${esc(company.state)} - ${company.pincode || ''}<br>` : ''}
              ${company.gstin ? `GSTIN: ${esc(company.gstin)} | ` : ''}
              ${company.mobile ? `Ph: ${esc(company.mobile)} | ` : ''}
              ${company.email ? esc(company.email) : ''}
            </div>
          </div>
          <div class="inv-info">
            <div class="inv-badge">${isEst ? 'ESTIMATE' : 'TAX INVOICE'}</div>
            <div class="inv-details">
              <strong>Invoice No:</strong> ${esc(invoiceNo || 'PREVIEW')}<br>
              <strong>Date:</strong> ${fd(date)}<br>
              ${dueDate ? `<strong>Due Date:</strong> ${fd(dueDate)}<br>` : ''}
              ${placeOfSupply ? `<strong>Place of Supply:</strong> ${esc(placeOfSupply)}` : ''}
            </div>
          </div>
        </div>
        
        <div class="info-cards">
          <div class="info-card">
            <div class="info-label">Invoice No</div>
            <div class="info-value">${esc(invoiceNo || '—')}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Date</div>
            <div class="info-value">${fd(date)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Due Date</div>
            <div class="info-value">${dueDate ? fd(dueDate) : '—'}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Place of Supply</div>
            <div class="info-value">${placeOfSupply || custState || '—'}</div>
          </div>
        </div>
        
        ${custName ? `
        <div class="customer-section">
          <div class="customer-box">
            <div class="customer-label">Bill To</div>
            <div class="customer-name">${esc(custName)}</div>
            <div class="customer-detail">
              ${custAddr ? `${esc(custAddr)}<br>` : ''}
              ${custState ? `${esc(custState)}<br>` : ''}
              ${custGstin ? `GSTIN: ${esc(custGstin)}` : ''}
            </div>
            ${custGstin ? `<span class="gst-type ${isIntra?'gst-intra':'gst-inter'}">${isIntra?'Intra-State (CGST+SGST)':'Inter-State (IGST)'}</span>` : ''}
          </div>
          <div class="customer-box">
            <div class="customer-label">Ship To</div>
            <div class="customer-name">${esc(customer.shipTo?.name || custName)}</div>
            <div class="customer-detail">
              ${customer.shipTo?.address || custAddr ? `${esc(customer.shipTo?.address || custAddr)}<br>` : ''}
              ${customer.shipTo?.state || custState ? `${esc(customer.shipTo?.state || custState)}` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Taxable</th>
              ${isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'}
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.i + 1}</td>
                <td>${esc(r.item.productName || '—')}</td>
                <td>${esc(r.item.hsnCode || 'N/A')}</td>
                <td>${r.item.qty} ${esc(r.item.unit || '')}</td>
                <td>${fc(r.item.price)}</td>
                <td>${fc(r.taxable)}</td>
                ${isIntra 
                  ? `<td>${fc(r.cg)}</td><td>${fc(r.sg)}</td>`
                  : `<td>${fc(r.ig)}</td>`
                }
                <td style="font-weight:700">${fc(r.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="notes-terms">
            ${notes ? `<div class="notes-title">Notes</div><div>${esc(notes)}</div>` : ''}
            ${terms ? `<div class="terms-title">Terms & Conditions</div><div>${esc(terms)}</div>` : ''}
          </div>
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">Taxable Amount</span>
              <span class="summary-value">${fc(sub)}</span>
            </div>
            ${isIntra ? `
              <div class="summary-row">
                <span class="summary-label">CGST (${(sub>0 ? (cgst/sub)*100 : 0).toFixed(1)}%)</span>
                <span class="summary-value">${fc(cgst)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">SGST (${(sub>0 ? (sgst/sub)*100 : 0).toFixed(1)}%)</span>
                <span class="summary-value">${fc(sgst)}</span>
              </div>
            ` : `
              <div class="summary-row">
                <span class="summary-label">IGST (${(sub>0 ? (igst/sub)*100 : 0).toFixed(1)}%)</span>
                <span class="summary-value">${fc(igst)}</span>
              </div>
            `}
            ${(discAmt||0) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Discount</span>
                <span class="summary-value">-${fc(discAmt)}</span>
              </div>
            ` : ''}
            <div class="summary-total">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">${fc(total)}</div>
            </div>
          </div>
        </div>
        
        <div class="words">
          <span class="words-label">Amount in Words:</span> 
          ${numToWords(Math.round(total || 0))}
        </div>
        
        <div class="payment-section">
          <div class="bank-box">
            <div class="bank-title">🏦 Bank & Payment Details</div>
            <div class="bank-row">
              ${company.bank ? `Bank: <strong>${esc(company.bank)}</strong><br>` : ''}
              ${company.accName ? `A/C Name: <strong>${esc(company.accName)}</strong><br>` : ''}
              ${company.accNo ? `A/C No: <strong>${esc(company.accNo)}</strong><br>` : ''}
              ${company.ifsc ? `IFSC: <strong>${esc(company.ifsc)}</strong><br>` : ''}
              ${company.branch ? `Branch: <strong>${esc(company.branch)}</strong><br>` : ''}
              ${company.upi ? `UPI: <strong>${esc(company.upi)}</strong>` : ''}
            </div>
          </div>
          <div class="qr-box">
            <div class="qr-title">📱 Scan to Pay</div>
            ${qrData ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}" class="qr-img"/>` : `
              <div class="qr-placeholder">QR Code<br>Available</div>
            `}
          </div>
        </div>
        
        <div class="footer">
          <div class="declaration-box">
            <div class="declaration-title">Declaration</div>
            <div>${declaration || company.declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}</div>
          </div>
          <div class="signature-section">
            <div class="sign-line">Authorised Signatory</div>
            <div class="sign-name">${esc(company.name || '')}</div>
            ${company.signature ? `<img src="${esc(company.signature)}" style="max-width:100px;max-height:40px;margin-top:8px"/>` : ''}
          </div>
        </div>
      </div>
    `
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 3 — PREMIUM CORPORATE (TATA Style)
//  Professional layout, large header, highlighted total, QR payment
// ═══════════════════════════════════════════════════════════════════════════
const TemplatePremiumTata = {
  id: 'premium-tata',
  name: 'Premium TATA',
  emoji: '👑',
  description: 'Corporate TATA-style with branding, large header, signature',
  
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Poppins',sans-serif;background:#fff;color:#1a1a1a;font-size:10px}
    .page{max-width:850px;margin:0 auto}
    
    /* Top Banner */
    .top-banner{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);height:8px}
    
    /* Header */
    .header{background:#fff;padding:25px 30px;border-bottom:3px solid #e94560;display:flex;justify-content:space-between;align-items:center}
    .co-left{flex:1}
    .logo{max-height:60px;object-fit:contain;margin-bottom:10px}
    .co-name{font-size:24px;font-weight:900;color:#1a1a2e;letter-spacing:-0.5px}
    .co-address{font-size:10px;color:#555;line-height:1.7;margin-top:5px}
    
    .inv-right{text-align:right;background:#f8f9fa;padding:15px 20px;border-radius:10px;border:1px solid #e9ecef}
    .inv-label{font-size:28px;font-weight:800;color:#e94560;letter-spacing:-1px}
    .inv-no{font-size:14px;font-weight:700;color:#1a1a2e;margin:5px 0}
    .inv-date{font-size:10px;color:#666;line-height:1.8}
    
    /* Company Info Bar */
    .info-bar{background:#f8f9fa;padding:12px 30px;display:flex;justify-content:space-between;font-size:9px;color:#555;border-bottom:1px solid #e9ecef}
    .info-item{display:flex;align-items:center;gap:5px}
    .info-item strong{color:#1a1a2e}
    
    /* Customer Cards */
    .customer-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 30px}
    .cust-card{background:#fff;border:2px solid #e9ecef;border-radius:12px;padding:15px;position:relative}
    .cust-card.bill-to{border-color:#e94560}
    .cust-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;border-radius:10px 10px 0 0}
    .bill-to::before{background:#e94560}
    .ship-to::before{background:#1a1a2e}
    .cust-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .bill-to .cust-label{color:#e94560}
    .ship-to .cust-label{color:#1a1a2e}
    .cust-name{font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:5px}
    .cust-details{font-size:10px;color:#555;line-height:1.7}
    
    /* Items Table */
    .items-wrapper{padding:0 30px 20px}
    .items-table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
    .items-table th{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:12px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center}
    .items-table th:first-child{text-align:left;width:40px}
    .items-table th:nth-child(2){text-align:left}
    .items-table td{padding:10px;border-bottom:1px solid #f0f0f0;font-size:10px;text-align:right}
    .items-table td:first-child{text-align:left;color:#888}
    .items-table td:nth-child(2){text-align:left;font-weight:600;color:#1a1a2e}
    .items-table tr:nth-child(even) td{background:#fafbfc}
    .items-table tr:last-child td{border-bottom:none}
    
    /* Total Highlight */
    .total-section{padding:0 30px 20px;display:flex;justify-content:flex-end}
    .total-box{background:linear-gradient(135deg,#e94560,#ff6b6b);color:#fff;padding:20px 30px;border-radius:12px;box-shadow:0 4px 15px rgba(233,69,96,0.3)}
    .total-label{font-size:12px;font-weight:600;opacity:0.9;margin-bottom:5px}
    .total-amount{font-size:32px;font-weight:900;letter-spacing:-1px}
    .total-words{font-size:10px;opacity:0.9;margin-top:8px;font-style:italic}
    
    /* Bank & QR Section */
    .payment-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:0 30px 20px}
    .bank-card{background:#f8f9fa;border-radius:12px;padding:18px;border:1px solid #e9ecef}
    .bank-header{font-size:11px;font-weight:800;color:#1a1a2e;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e94560;display:flex;align-items:center;gap:8px}
    .bank-row{font-size:10px;color:#555;line-height:2}
    .bank-row strong{color:#1a1a2e}
    
    .qr-card{background:#f8f9fa;border-radius:12px;padding:18px;text-align:center;border:1px solid #e9ecef}
    .qr-header{font-size:11px;font-weight:800;color:#1a1a2e;margin-bottom:12px}
    .qr-img{max-width:130px;max-height:130px;border-radius:8px}
    .qr-sub{font-size:9px;color:#888;margin-top:8px}
    
    /* Footer */
    .footer{padding:20px 30px;background:#1a1a2e;color:#fff;display:flex;justify-content:space-between;align-items:flex-start}
    .footer-left{max-width:350px}
    .footer-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;color:#e94560}
    .footer-text{font-size:9px;line-height:1.7;opacity:0.85}
    .footer-right{text-align:right}
    .sign-box{border-top:2px solid rgba(255,255,255,0.3);padding-top:10px;margin-top:50px}
    .sign-line{font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.7}
    .sign-name{font-size:12px;font-weight:700;margin-top:5px}
    .sign-img{max-width:120px;max-height:45px;margin-top:8px}
    
    /* Status Badge */
    .status-badge{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:20px;font-size:8px;font-weight:700;text-transform:uppercase}
    .status-paid{background:#d4edda;color:#155724}
    .status-unpaid{background:#f8d7da;color:#721c24}
    .status-partial{background:#fff3cd;color:#856404}
  `,
  
  render(data) {
    const { company={}, customer={}, billTo={}, items=[], 
            sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0,
            isIntra=true, invoiceNo, date, dueDate, notes='', terms='',
            declaration='', type, placeOfSupply='', status='unpaid' } = data
    
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const custName = customer.name || customer.customerName || billTo.name || ''
    const custAddr = customer.address || billTo.address || ''
    const custState = customer.state || billTo.state || ''
    const custGstin = customer.gstin || billTo.gstin || ''
    
    const shipName = customer.shipTo?.name || custName
    const shipAddr = customer.shipTo?.address || custAddr
    const shipState = customer.shipTo?.state || custState
    const shipGstin = customer.shipTo?.gstin || custGstin
    
    // Generate QR code
    const qrData = generatePaymentQR(company, total, invoiceNo)
    
    const statusColors = { paid:'status-paid', unpaid:'status-unpaid', partial:'status-partial', overdue:'status-unpaid' }
    
    return `
      <div class="page">
        <div class="top-banner"></div>
        
        <div class="header">
          <div class="co-left">
            ${company.logo ? `<img src="${esc(company.logo)}" class="logo"/>` : ''}
            <div class="co-name">${esc(company.name || 'Your Company')}</div>
            <div class="co-address">
              ${company.address ? `${esc(company.address)}` : ''}
              ${company.state ? `, ${esc(company.state)}` : ''}
              ${company.pincode ? ` - ${esc(company.pincode)}` : ''}<br>
              ${company.gstin ? `GSTIN: ${esc(company.gstin)} | ` : ''}
              ${company.pan ? `PAN: ${esc(company.pan)} | ` : ''}
              ${company.cin ? `CIN: ${esc(company.cin)}` : ''}<br>
              ${company.mobile ? `Ph: ${esc(company.mobile)} | ` : ''}
              ${company.email ? `Email: ${esc(company.email)}` : ''}
              ${company.website ? ` | Web: ${esc(company.website)}` : ''}
            </div>
          </div>
          <div class="inv-right">
            <div class="inv-label">${isEst ? 'QUOTATION' : 'INVOICE'}</div>
            <div class="inv-no">#${esc(invoiceNo || 'PREVIEW')}</div>
            <div class="inv-date">
              <strong>Date:</strong> ${fd(date)}<br>
              ${dueDate ? `<strong>Due Date:</strong> ${fd(dueDate)}<br>` : ''}
              ${placeOfSupply ? `<strong>Place:</strong> ${esc(placeOfSupply)}` : ''}
            </div>
          </div>
        </div>
        
        <div class="info-bar">
          <div class="info-item"><strong>PAN:</strong> ${company.pan || '—'}</div>
          <div class="info-item"><strong>GSTIN:</strong> ${company.gstin || '—'}</div>
          <div class="info-item"><strong>CIN:</strong> ${company.cin || '—'}</div>
          <div class="info-item"><strong>HSN:</strong> ${company.hsnCode || '—'}</div>
          <div class="info-item"><strong>State:</strong> ${company.state || '—'}</div>
        </div>
        
        ${custName ? `
        <div class="customer-grid">
          <div class="cust-card bill-to">
            ${!isEst ? `<span class="status-badge ${statusColors[status]||'status-unpaid'}">${status || 'Unpaid'}</span>` : ''}
            <div class="cust-label">Bill To</div>
            <div class="cust-name">${esc(custName)}</div>
            <div class="cust-details">
              ${custAddr ? `${esc(custAddr)}<br>` : ''}
              ${custState ? `${esc(custState)}<br>` : ''}
              ${custGstin ? `GSTIN: ${esc(custGstin)}` : ''}
            </div>
          </div>
          <div class="cust-card ship-to">
            <div class="cust-label">Ship To</div>
            <div class="cust-name">${esc(shipName)}</div>
            <div class="cust-details">
              ${shipAddr ? `${esc(shipAddr)}<br>` : ''}
              ${shipState ? `${esc(shipState)}<br>` : ''}
              ${shipGstin ? `GSTIN: ${esc(shipGstin)}` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <div class="items-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product / Service</th>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Taxable</th>
                ${isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.i + 1}</td>
                  <td>${esc(r.item.productName || '—')}</td>
                  <td>${esc(r.item.hsnCode || 'N/A')}</td>
                  <td>${r.item.qty} ${esc(r.item.unit || '')}</td>
                  <td>${fc(r.item.price)}</td>
                  <td>${fc(r.taxable)}</td>
                  ${isIntra 
                    ? `<td>${fc(r.cg)}</td><td>${fc(r.sg)}</td>`
                    : `<td>${fc(r.ig)}</td>`
                  }
                  <td style="font-weight:700;color:#e94560">${fc(r.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="total-section">
          <div class="total-box">
            <div class="total-label">${isEst ? 'Quotation Amount' : 'Total Amount'}</div>
            <div class="total-amount">${fc(total)}</div>
            <div class="total-words">${numToWords(Math.round(total || 0))}</div>
          </div>
        </div>
        
        <div class="payment-grid" style="grid-template-columns:1fr">
          <div class="bank-card">
            <div class="bank-header">🏦 Bank Details</div>
            <div class="bank-row">
              ${company.bank ? `<div><strong>Bank:</strong> ${esc(company.bank)}</div>` : ''}
              ${company.accName ? `<div><strong>A/C Name:</strong> ${esc(company.accName)}</div>` : ''}
              ${company.accNo ? `<div><strong>A/C No:</strong> ${esc(company.accNo)}</div>` : ''}
              ${company.ifsc ? `<div><strong>IFSC:</strong> ${esc(company.ifsc)}</div>` : ''}
              ${company.branch ? `<div><strong>Branch:</strong> ${esc(company.branch)}</div>` : ''}
              ${company.upi ? `<div><strong>UPI:</strong> ${esc(company.upi)}</div>` : ''}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <div class="footer-title">Declaration</div>
            <div class="footer-text">
              ${declaration || company.declaration || 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct. Goods/Services sold are non-returnable.'}
            </div>
            ${terms ? `<br><div class="footer-title">Terms & Conditions</div><div class="footer-text">${esc(terms)}</div>` : ''}
            ${notes ? `<br><div class="footer-title">Notes</div><div class="footer-text">${esc(notes)}</div>` : ''}
          </div>
          <div class="footer-right">
            <div class="sign-box">
              <div class="sign-line">Authorised Signatory</div>
              <div class="sign-name">${esc(company.name || '')}</div>
              ${company.signature ? `<img src="${esc(company.signature)}" class="sign-img"/>` : ''}
            </div>
          </div>
        </div>
      </div>
    `
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEMPLATE 4 — SIMPLE GST (Basic/Minimal)
//  Clean minimalist design, perfect for small businesses
// ═══════════════════════════════════════════════════════════════════════════
const TemplateSimpleGST = {
  id: 'simple-gst',
  name: 'Simple GST',
  emoji: '📄',
  description: 'Clean minimalist design for small businesses',
  
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Open Sans',Arial,sans-serif;background:#fff;color:#333;font-size:10px}
    .page{max-width:780px;margin:0 auto;padding:20px}
    
    /* Header */
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid #4a90d9}
    .co-section{flex:1}
    .logo{max-height:45px;object-fit:contain;margin-bottom:8px}
    .co-name{font-size:20px;font-weight:700;color:#2c3e50;margin-bottom:4px}
    .co-details{font-size:9px;color:#666;line-height:1.6}
    
    .inv-section{text-align:right}
    .inv-title{font-size:24px;font-weight:700;color:#4a90d9;text-transform:uppercase}
    .inv-meta{font-size:10px;margin-top:8px;line-height:1.8}
    .inv-meta strong{color:#2c3e50}
    
    /* Info Row */
    .info-row{display:flex;justify-content:space-between;margin-bottom:20px}
    .info-box{flex:1;margin-right:15px}
    .info-box:last-child{margin-right:0}
    .info-label{font-size:8px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:4px;letter-spacing:0.5px}
    .info-value{font-size:11px;color:#333;line-height:1.5}
    .info-value strong{color:#2c3e50}
    
    /* Customer Boxes */
    .customer-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .cust-box{border:1px solid #ddd;border-radius:6px;padding:12px}
    .cust-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#4a90d9;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eee}
    .cust-name{font-size:13px;font-weight:700;color:#2c3e50;margin-bottom:3px}
    .cust-detail{font-size:9px;color:#666;line-height:1.5}
    
    /* Table */
    .items-table{width:100%;border-collapse:collapse;margin-bottom:20px}
    .items-table th{background:#4a90d9;color:#fff;padding:8px 6px;font-size:9px;font-weight:600;text-transform:uppercase;text-align:center}
    .items-table th:first-child{text-align:left}
    .items-table th:nth-child(2){text-align:left}
    .items-table td{padding:7px 6px;border-bottom:1px solid #eee;font-size:9px;text-align:right;border-bottom:1px solid #eee}
    .items-table td:first-child{text-align:center}
    .items-table td:nth-child(2){text-align:left}
    .items-table tr:nth-child(even) td{background:#f9f9f9}
    .items-table tr:last-child td{border-bottom:2px solid #4a90d9}
    
    /* Totals */
    .totals-row{display:flex;justify-content:flex-end;margin-bottom:20px}
    .totals-table{width:220px}
    .totals-row th,.totals-row td{padding:6px 10px;border:1px solid #ddd;font-size:10px;text-align:right}
    .totals-row th{background:#f5f5f5;text-transform:uppercase;font-size:9px}
    .totals-total{background:#4a90d9 !important;color:#fff !important;font-weight:700;font-size:12px}
    .totals-total th,.totals-total td{background:#4a90d9;color:#fff;border-color:#4a90d9}
    
    /* Amount Words */
    .words-box{border:1px solid #ddd;padding:10px 15px;margin-bottom:20px;background:#f9f9f9;border-radius:4px}
    .words-label{font-weight:700;color:#2c3e50;font-size:10px}
    .words-value{font-size:10px;color:#555;margin-top:3px}
    
    /* Bank */
    .bank-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
    .bank-box{border:1px solid #ddd;border-radius:6px;padding:12px}
    .bank-title{font-size:10px;font-weight:700;color:#2c3e50;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #eee}
    .bank-row{font-size:9px;color:#555;line-height:1.8}
    
    /* Footer */
    .footer{display:flex;justify-content:space-between;padding-top:15px;border-top:1px solid #ddd;margin-top:10px}
    .footer-left{max-width:350px}
    .footer-title{font-size:9px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:4px}
    .footer-text{font-size:9px;color:#666;line-height:1.5}
    .footer-right{text-align:right}
    .sign-line{border-top:1px solid #333;width:150px;margin-left:auto;padding-top:4px;font-size:8px;text-transform:uppercase;color:#999;margin-top:40px}
    .sign-name{font-size:10px;font-weight:700;color:#2c3e50;margin-top:4px}
  `,
  
  render(data) {
    const { company={}, customer={}, billTo={}, items=[], 
            sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0,
            isIntra=true, invoiceNo, date, dueDate, notes='', terms='',
            declaration='', type, placeOfSupply='' } = data
    
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const custName = customer.name || customer.customerName || billTo.name || ''
    const custAddr = customer.address || billTo.address || ''
    const custState = customer.state || billTo.state || ''
    const custGstin = customer.gstin || billTo.gstin || ''
    
    return `
      <div class="page">
        <div class="header">
          <div class="co-section">
            ${company.logo ? `<img src="${esc(company.logo)}" class="logo"/>` : ''}
            <div class="co-name">${esc(company.name || 'Your Company')}</div>
            <div class="co-details">
              ${company.address ? `${esc(company.address)}<br>` : ''}
              ${company.state ? `${esc(company.state)} - ${company.pincode || ''}<br>` : ''}
              ${company.gstin ? `GSTIN: ${esc(company.gstin)}<br>` : ''}
              ${company.mobile ? `Ph: ${esc(company.mobile)} | ` : ''}
              ${company.email ? esc(company.email) : ''}
            </div>
          </div>
          <div class="inv-section">
            <div class="inv-title">${isEst ? 'QUOTATION' : 'TAX INVOICE'}</div>
            <div class="inv-meta">
              <strong>Invoice No:</strong> ${esc(invoiceNo || 'PREVIEW')}<br>
              <strong>Date:</strong> ${fd(date)}<br>
              ${dueDate ? `<strong>Due Date:</strong> ${fd(dueDate)}<br>` : ''}
              ${placeOfSupply ? `<strong>Place of Supply:</strong> ${esc(placeOfSupply)}` : ''}
            </div>
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-box">
            <div class="info-label">Invoice Number</div>
            <div class="info-value"><strong>${esc(invoiceNo || 'PREVIEW')}</strong></div>
          </div>
          <div class="info-box">
            <div class="info-label">Invoice Date</div>
            <div class="info-value"><strong>${fd(date)}</strong></div>
          </div>
          <div class="info-box">
            <div class="info-label">Due Date</div>
            <div class="info-value"><strong>${dueDate ? fd(dueDate) : '—'}</strong></div>
          </div>
          <div class="info-box">
            <div class="info-label">Place of Supply</div>
            <div class="info-value"><strong>${placeOfSupply || custState || '—'}</strong></div>
          </div>
        </div>
        
        ${custName ? `
        <div class="customer-grid">
          <div class="cust-box">
            <div class="cust-label">Bill To</div>
            <div class="cust-name">${esc(custName)}</div>
            <div class="cust-detail">
              ${custAddr ? `${esc(custAddr)}<br>` : ''}
              ${custState ? `${esc(custState)}<br>` : ''}
              ${custGstin ? `GSTIN: ${esc(custGstin)}` : ''}
            </div>
          </div>
          <div class="cust-box">
            <div class="cust-label">Ship To</div>
            <div class="cust-name">${esc(customer.shipTo?.name || custName)}</div>
            <div class="cust-detail">
              ${customer.shipTo?.address || custAddr ? `${esc(customer.shipTo?.address || custAddr)}<br>` : ''}
              ${customer.shipTo?.state || custState ? `${esc(customer.shipTo?.state || custState)}` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Taxable</th>
              ${isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.i + 1}</td>
                <td>${esc(r.item.productName || '—')}</td>
                <td>${esc(r.item.hsnCode || 'N/A')}</td>
                <td>${r.item.qty}</td>
                <td>${fc(r.item.price)}</td>
                <td>${fc(r.taxable)}</td>
                ${isIntra 
                  ? `<td>${fc(r.cg)}</td><td>${fc(r.sg)}</td>`
                  : `<td>${fc(r.ig)}</td>`
                }
                <td>${fc(r.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-row">
          <table class="totals-table">
            <tr><th>Taxable Value</th><td>${fc(sub)}</td></tr>
            ${isIntra 
              ? `<tr><th>CGST</th><td>${fc(cgst)}</td></tr><tr><th>SGST</th><td>${fc(sgst)}</td></tr>`
              : `<tr><th>IGST</th><td>${fc(igst)}</td></tr>`
            }
            ${(discAmt||0) > 0 ? `<tr><th>Discount</th><td>-${fc(discAmt)}</td></tr>` : ''}
            <tr class="totals-total"><th>Grand Total</th><td>${fc(total)}</td></tr>
          </table>
        </div>
        
        <div class="words-box">
          <div class="words-label">Amount in Words:</div>
          <div class="words-value">${numToWords(Math.round(total || 0))}</div>
        </div>
        
        <div class="bank-grid">
          <div class="bank-box">
            <div class="bank-title">Bank Details</div>
            <div class="bank-row">
              ${company.bank ? `<div><strong>Bank:</strong> ${esc(company.bank)}</div>` : ''}
              ${company.accNo ? `<div><strong>A/C:</strong> ${esc(company.accNo)}</div>` : ''}
              ${company.ifsc ? `<div><strong>IFSC:</strong> ${esc(company.ifsc)}</div>` : ''}
              ${company.upi ? `<div><strong>UPI:</strong> ${esc(company.upi)}</div>` : ''}
            </div>
          </div>
          <div class="bank-box">
            <div class="bank-title">Declaration</div>
            <div class="bank-row">
              ${declaration || company.declaration || 'We declare that this invoice shows the actual price of goods.'}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <div class="footer-title">Notes</div>
            <div class="footer-text">${notes || 'Thank you for your business!'}</div>
            ${terms ? `<div class="footer-title" style="margin-top:10px">Terms</div><div class="footer-text">${esc(terms)}</div>` : ''}
          </div>
          <div class="footer-right">
            <div class="sign-line">Authorised Signatory</div>
            <div class="sign-name">${esc(company.name || '')}</div>
            ${company.signature ? `<img src="${esc(company.signature)}" style="max-width:80px;max-height:30px;margin-top:5px"/>` : ''}
          </div>
        </div>
      </div>
    `
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Export templates array and helper functions
// ═══════════════════════════════════════════════════════════════════════════

export const TEMPLATES = [TemplateClassicTally, TemplateModernITC, TemplatePremiumTata, TemplateSimpleGST]

export const getTemplate = (id) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0]

export const TEMPLATE_OPTIONS = TEMPLATES.map(t => ({ 
  value: t.id, 
  label: `${t.emoji} ${t.name}`, 
  description: t.description 
}))

export default TEMPLATES
