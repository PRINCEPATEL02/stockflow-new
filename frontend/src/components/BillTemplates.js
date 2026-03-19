// ═══════════════════════════════════════════════════════════════
//  BILL TEMPLATES — 5 professional print-ready formats
//  Each template exports: { id, name, emoji, description, css, render(data) }
//  render() returns an HTML string injected into a print window
// ═══════════════════════════════════════════════════════════════

import { fc, fd, numToWords } from '../utils/helpers'

// ── shared helpers ──────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>')
const row = (label, val, bold=false) =>
  `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9">
     <span style="color:#64748b">${esc(label)}</span>
     <span style="${bold?'font-weight:900;font-size:15px':'font-weight:600'}">${esc(val)}</span>
   </div>`

const buildItems = (items=[], isIntra=true) => items.map((item,i) => {
  const taxable = (item.qty||0)*(item.price||0)
  const cg = isIntra ? taxable*(item.gstRate||0)/200 : 0
  const ig = !isIntra ? taxable*(item.gstRate||0)/100 : 0
  const total = taxable + cg*2 + ig
  return { i, item, taxable, cg, ig, total }
})

const totalsBlock = (sub,cgst,sgst,igst,discAmt,total,isIntra,accentColor='#7c3aed') => `
  ${row('Subtotal', fc(sub))}
  ${isIntra ? row('CGST', fc(cgst))+row('SGST', fc(sgst)) : row('IGST', fc(igst))}
  ${(discAmt||0)>0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;color:#ef4444"><span>Discount</span><span>-${fc(discAmt)}</span></div>` : ''}
  <div style="display:flex;justify-content:space-between;padding:10px 0 0;border-top:2px solid ${accentColor};margin-top:6px;font-weight:900;font-size:16px;color:${accentColor}">
    <span>Grand Total</span><span>${fc(total)}</span>
  </div>
`

// ════════════════════════════════════════════════════════════════
//  TEMPLATE 1 — MODERN VIOLET (Default Premium)
// ════════════════════════════════════════════════════════════════
const Template1 = {
  id: 'modern-violet',
  name: 'Modern Violet',
  emoji: '💜',
  description: 'Clean purple gradient header, card layout',
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',Arial,sans-serif;background:#fff;color:#1e293b;font-size:11px}
    .page{max-width:820px;margin:0 auto;padding:0}
    .header{background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#fff;padding:32px;border-radius:0 0 24px 24px;margin-bottom:24px}
    .header-inner{display:flex;justify-content:space-between;align-items:flex-start}
    .logo{height:52px;object-fit:contain;margin-bottom:8px;filter:brightness(0) invert(1)}
    .co-name{font-size:20px;font-weight:900;margin-bottom:4px}
    .co-meta{font-size:10px;opacity:.85;line-height:1.9}
    .inv-label{font-size:32px;font-weight:900;letter-spacing:-1px;text-align:right;opacity:.95}
    .inv-num{font-size:14px;font-weight:700;text-align:right;opacity:.9;margin-top:4px}
    .inv-date{font-size:10px;text-align:right;opacity:.75;line-height:1.8;margin-top:2px}
    .body{padding:0 24px 24px}
    .bill-to{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start}
    .bill-name{font-size:15px;font-weight:900;color:#1e293b}
    .bill-meta{font-size:10px;color:#64748b;line-height:1.9;margin-top:3px}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:700;background:#ede9fe;color:#7c3aed;margin-top:6px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
    th{background:#7c3aed;color:#fff;padding:10px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-align:right}
    th:first-child,th:nth-child(2){text-align:left}
    td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:10px;text-align:right}
    td:first-child,td:nth-child(2){text-align:left}
    tr:last-child td{border-bottom:none}
    tr:nth-child(even){background:#fafbff}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:16px}
    .totals{width:240px}
    .words{background:#f5f3ff;border-radius:10px;padding:10px 14px;font-size:10px;margin-bottom:12px;color:#4c1d95}
    .bank{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;font-size:10px;margin-bottom:14px}
    .bank-title{font-weight:900;color:#166534;margin-bottom:4px}
    .bank-row{color:#166534;line-height:1.8}
    .footer{display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:8px;font-size:10px;color:#64748b}
    .sign-line{border-top:1px solid #cbd5e1;width:160px;padding-top:5px;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-top:48px}
    .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:4px}
  `,
  render(data) {
    const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data
    const invNo = invoiceNo || estimateNo || 'PREVIEW'
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstCols = isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'
    const gstCells = (r) => isIntra ? `<td>${fc(r.cg)}</td><td>${fc(r.cg)}</td>` : `<td>${fc(r.ig)}</td>`
    return `
      <div class="page">
        <div class="header">
          <div class="header-inner">
            <div>${company.logo ? `<img src="${esc(company.logo)}" class="logo"/>` : ''}
              <div class="co-name">${esc(company.name||'Your Company')}</div>
              <div class="co-meta">
                ${company.address ? `<div>${esc(company.address)}</div>`:''}
                ${company.gstin ? `<div>GSTIN: ${esc(company.gstin)}</div>`:''}
                ${company.mobile ? `<div>📱 ${esc(company.mobile)}</div>`:''}
                ${company.email  ? `<div>✉ ${esc(company.email)}</div>`:''}
              </div>
            </div>
            <div>
              <div class="inv-label">${isEst ? 'ESTIMATE' : 'INVOICE'}</div>
              <div class="inv-num">#${esc(invNo)}</div>
              <div class="inv-date">
                Date: ${fd(date)}<br>
                ${dueDate ? `Due: ${fd(dueDate)}<br>`:''}
                ${validTill ? `Valid Till: ${fd(validTill)}<br>`:''}
              </div>
            </div>
          </div>
        </div>
        <div class="body">
          ${customer?.name || customer?.customerName ? `
          <div class="bill-to">
            <div>
              <div class="lbl">Bill To</div>
              <div class="bill-name">${esc(customer.name||customer.customerName)}</div>
              <div class="bill-meta">
                ${customer.address ? `<div>${esc(customer.address)}</div>`:''}
                ${customer.state   ? `<div>${esc(customer.state)}</div>`:''}
                ${customer.gstin   ? `<div>GSTIN: ${esc(customer.gstin)}</div>`:''}
                ${customer.mobile  ? `<div>📱 ${esc(customer.mobile)}</div>`:''}
              </div>
              <div class="badge">${isIntra ? '⚡ Intra-State (CGST+SGST)' : '🌐 Inter-State (IGST)'}</div>
            </div>
          </div>` : ''}
          <table>
            <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST%</th><th>Taxable</th>${gstCols}<th>Total</th></tr></thead>
            <tbody>
              ${rows.map(r=>`<tr>
                <td>${r.i+1}</td><td style="font-weight:600">${esc(r.item.productName||'—')}</td>
                <td>${r.item.qty}</td><td>${esc(r.item.unit||'')}</td><td>${fc(r.item.price)}</td>
                <td>${r.item.gstRate||0}%</td><td>${fc(r.taxable)}</td>${gstCells(r)}
                <td style="font-weight:700">${fc(r.total)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div class="totals-wrap"><div class="totals">${totalsBlock(sub,cgst,sgst,igst,discAmt,total,isIntra,'#7c3aed')}</div></div>
          <div class="words"><strong>Amount in Words:</strong> ${numToWords(Math.round(total||0))}</div>
          ${company.bank||company.accNo ? `<div class="bank"><div class="bank-title">🏦 Bank Details</div><div class="bank-row">
            ${company.bank  ? `Bank: <strong>${esc(company.bank)}</strong><br>`:''}
            ${company.accNo ? `A/C: <strong>${esc(company.accNo)}</strong><br>`:''}
            ${company.ifsc  ? `IFSC: <strong>${esc(company.ifsc)}</strong><br>`:''}
            ${company.upi   ? `UPI: <strong>${esc(company.upi)}</strong>`:''}
          </div></div>` : ''}
          <div class="footer">
            <div>${notes ? `<div style="font-weight:700;color:#1e293b;margin-bottom:4px">Notes</div><div>${esc(notes)}</div>` : ''}
            ${terms ? `<div style="font-weight:700;color:#1e293b;margin-bottom:4px;margin-top:8px">Terms</div><div>${esc(terms)}</div>` : ''}</div>
            <div style="text-align:right"><div class="sign-line">Authorised Signatory — ${esc(company.name||'')}</div></div>
          </div>
        </div>
      </div>`
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 2 — CLASSIC PROFESSIONAL (Black & Gold)
// ═══════════════════════════════════════════════════════════════
const Template2 = {
  id: 'classic-gold',
  name: 'Classic Gold',
  emoji: '🥇',
  description: 'Traditional black & gold, formal letterhead',
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Source Sans 3',Georgia,sans-serif;background:#fff;color:#1a1a1a;font-size:11px}
    .page{max-width:820px;margin:0 auto;padding:36px}
    .top-bar{height:6px;background:linear-gradient(90deg,#b8860b,#ffd700,#b8860b);margin-bottom:0;border-radius:4px 4px 0 0}
    .header-box{border:2px solid #1a1a1a;border-top:none;padding:24px 28px;margin-bottom:0}
    .header-inner{display:flex;justify-content:space-between;align-items:center}
    .co-name{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:900;letter-spacing:-.5px}
    .co-meta{font-size:10px;color:#555;line-height:1.8;margin-top:4px}
    .inv-label{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#b8860b;text-align:right}
    .inv-detail{text-align:right;font-size:10px;color:#555;margin-top:4px;line-height:1.8}
    .divider{height:2px;background:#1a1a1a;margin:20px 0 16px}
    .gold-divider{height:3px;background:linear-gradient(90deg,#b8860b,#ffd700,#b8860b);margin:12px 0}
    .bill-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;padding:14px;background:#fafafa;border:1px solid #e0e0e0}
    .section-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b8860b;margin-bottom:5px}
    .name{font-size:14px;font-weight:700}
    .meta{font-size:10px;color:#555;line-height:1.8;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th{background:#1a1a1a;color:#ffd700;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-align:right}
    th:first-child,th:nth-child(2){text-align:left}
    td{padding:8px 10px;border-bottom:1px solid #e8e8e8;font-size:10px;text-align:right}
    td:first-child,td:nth-child(2){text-align:left}
    tr:nth-child(even) td{background:#fafafa}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
    .totals{width:240px;border:1px solid #e0e0e0;padding:12px}
    .words{border-left:4px solid #b8860b;padding:8px 12px;background:#fffbf0;font-size:10px;margin-bottom:12px;font-style:italic}
    .bank{border:1px solid #c8e6c9;background:#f9fbe7;padding:10px 14px;margin-bottom:14px;font-size:10px}
    .footer-row{display:flex;justify-content:space-between;border-top:2px solid #1a1a1a;padding-top:14px;margin-top:10px;font-size:10px;color:#555}
    .bottom-bar{height:6px;background:linear-gradient(90deg,#b8860b,#ffd700,#b8860b);border-radius:0 0 4px 4px;margin-top:20px}
  `,
  render(data) {
    const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data
    const invNo = invoiceNo || estimateNo || 'PREVIEW'
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstCols = isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'
    const gstCells = (r) => isIntra ? `<td>${fc(r.cg)}</td><td>${fc(r.cg)}</td>` : `<td>${fc(r.ig)}</td>`
    return `
      <div class="page">
        <div class="top-bar"></div>
        <div class="header-box">
          <div class="header-inner">
            <div>${company.logo ? `<img src="${esc(company.logo)}" style="height:50px;object-fit:contain;margin-bottom:6px;display:block"/>`:``}
              <div class="co-name">${esc(company.name||'Your Company')}</div>
              <div class="co-meta">
                ${company.address ? esc(company.address)+'<br>':''}
                ${company.gstin ? `GSTIN: <strong>${esc(company.gstin)}</strong><br>`:''}
                ${company.mobile ? `Tel: ${esc(company.mobile)}<br>`:''}
                ${company.email  ? esc(company.email):''}
              </div>
            </div>
            <div>
              <div class="inv-label">${isEst ? 'ESTIMATE' : 'TAX INVOICE'}</div>
              <div class="inv-detail">
                No: <strong>#${esc(invNo)}</strong><br>
                Date: <strong>${fd(date)}</strong><br>
                ${dueDate ? `Due: <strong>${fd(dueDate)}</strong><br>`:''}
                ${validTill ? `Valid: <strong>${fd(validTill)}</strong>`:''}
              </div>
            </div>
          </div>
        </div>
        <div class="gold-divider"></div>
        ${customer?.name||customer?.customerName ? `
        <div class="bill-section">
          <div>
            <div class="section-label">Bill To</div>
            <div class="name">${esc(customer.name||customer.customerName)}</div>
            <div class="meta">
              ${customer.address ? esc(customer.address)+'<br>':''} ${customer.state ? esc(customer.state)+'<br>':''}
              ${customer.gstin ? `GSTIN: ${esc(customer.gstin)}<br>`:''}
              ${customer.mobile ? `📱 ${esc(customer.mobile)}`:''}
            </div>
          </div>
          <div style="text-align:right">
            <div class="section-label">Transaction Type</div>
            <div style="font-weight:700;margin-top:4px">${isIntra ? 'Intra-State Transaction' : 'Inter-State Transaction'}</div>
            <div style="font-size:10px;color:#555;margin-top:2px">${isIntra ? 'CGST + SGST Applicable' : 'IGST Applicable'}</div>
          </div>
        </div>` : ''}
        <table>
          <thead><tr><th>#</th><th>Item Description</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>GST%</th><th>Taxable</th>${gstCols}<th>Amount</th></tr></thead>
          <tbody>${rows.map(r=>`<tr>
            <td>${r.i+1}</td><td style="font-weight:600">${esc(r.item.productName||'—')}</td>
            <td>${r.item.qty}</td><td>${esc(r.item.unit||'')}</td><td>${fc(r.item.price)}</td>
            <td>${r.item.gstRate||0}%</td><td>${fc(r.taxable)}</td>${gstCells(r)}
            <td style="font-weight:700">${fc(r.total)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="totals-wrap"><div class="totals">${totalsBlock(sub,cgst,sgst,igst,discAmt,total,isIntra,'#b8860b')}</div></div>
        <div class="words"><em><strong>Amount in Words:</strong> ${numToWords(Math.round(total||0))}</em></div>
        ${company.bank||company.accNo ? `<div class="bank"><strong>Bank Details:</strong> &nbsp;
          ${company.bank?`Bank: ${esc(company.bank)}`:''}
          ${company.accNo?` | A/C: ${esc(company.accNo)}`:''}
          ${company.ifsc?` | IFSC: ${esc(company.ifsc)}`:''}
          ${company.upi?` | UPI: ${esc(company.upi)}`:''}
        </div>` : ''}
        <div class="footer-row">
          <div>${notes ? `<strong>Notes:</strong> ${esc(notes)}`:''}${terms ? `<br><strong>Terms:</strong> ${esc(terms)}`:''}
            ${!notes && !terms ? `Subject to local jurisdiction.` : ''}</div>
          <div style="text-align:right">
            <div style="border-top:1px solid #1a1a1a;padding-top:5px;width:160px;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-top:48px;margin-left:auto">Authorised Signatory</div>
            <div style="font-weight:700;font-size:11px">${esc(company.name||'')}</div>
          </div>
        </div>
        <div class="bottom-bar"></div>
      </div>`
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 3 — MINIMAL CLEAN (White Space Focus)
// ═══════════════════════════════════════════════════════════════
const Template3 = {
  id: 'minimal-clean',
  name: 'Minimal Clean',
  emoji: '🤍',
  description: 'Ultra-clean, maximalist white space, thin lines',
  css: `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#fff;color:#111;font-size:11px;padding:48px}
    .page{max-width:760px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .co-name{font-size:24px;font-weight:700;letter-spacing:-.5px}
    .co-meta{font-size:10px;color:#888;line-height:2;margin-top:6px}
    .inv-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#888;text-align:right}
    .inv-num{font-size:26px;font-weight:700;text-align:right;letter-spacing:-.5px}
    .inv-date{font-size:10px;color:#888;text-align:right;margin-top:4px;line-height:1.8}
    .line{height:1px;background:#e8e8e8;margin:20px 0}
    .thick-line{height:2px;background:#111;margin:20px 0}
    .bill-to{margin-bottom:36px}
    .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#aaa;margin-bottom:6px}
    .bill-name{font-size:14px;font-weight:700}
    .bill-meta{font-size:10px;color:#888;line-height:1.9;margin-top:3px}
    table{width:100%;border-collapse:collapse;margin-bottom:36px}
    th{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#aaa;padding:8px 6px;text-align:right;border-bottom:2px solid #111}
    th:first-child,th:nth-child(2){text-align:left}
    td{padding:10px 6px;border-bottom:1px solid #f0f0f0;font-size:10.5px;text-align:right;color:#333}
    td:first-child{text-align:left;color:#888;width:28px}
    td:nth-child(2){text-align:left;font-weight:600;color:#111}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:24px}
    .totals{width:220px}
    .tot-row{display:flex;justify-content:space-between;padding:5px 0;color:#666;font-size:10px}
    .tot-grand{display:flex;justify-content:space-between;padding:10px 0 0;border-top:1px solid #111;margin-top:6px;font-weight:700;font-size:15px}
    .words{border-left:2px solid #e8e8e8;padding:8px 12px;color:#888;font-size:10px;margin-bottom:24px;font-style:italic}
    .bank{margin-bottom:24px;font-size:10px;color:#666;line-height:1.9}
    .footer{display:flex;justify-content:space-between;margin-top:48px;font-size:10px;color:#888}
    .sign-line{border-top:1px solid #ccc;padding-top:6px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:48px;width:150px;text-align:center}
  `,
  render(data) {
    const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data
    const invNo = invoiceNo || estimateNo || 'PREVIEW'
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstCols = isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'
    const gstCells = (r) => isIntra ? `<td>${fc(r.cg)}</td><td>${fc(r.cg)}</td>` : `<td>${fc(r.ig)}</td>`
    return `
      <div class="page">
        <div class="header">
          <div>${company.logo?`<img src="${esc(company.logo)}" style="height:40px;object-fit:contain;margin-bottom:8px;display:block"/>`:''}
            <div class="co-name">${esc(company.name||'Your Company')}</div>
            <div class="co-meta">
              ${company.address?`${esc(company.address)}<br>`:''}
              ${company.gstin?`GSTIN: ${esc(company.gstin)}<br>`:''}
              ${company.mobile?`${esc(company.mobile)}<br>`:''}
              ${company.email?esc(company.email):''}
            </div>
          </div>
          <div>
            <div class="inv-label">${isEst?'Estimate':'Invoice'}</div>
            <div class="inv-num">#${esc(invNo)}</div>
            <div class="inv-date">
              ${fd(date)}<br>
              ${dueDate?`Due ${fd(dueDate)}<br>`:''}
              ${validTill?`Valid till ${fd(validTill)}`:''}
            </div>
          </div>
        </div>
        <div class="thick-line"></div>
        ${customer?.name||customer?.customerName?`
        <div class="bill-to">
          <div class="lbl">Bill To</div>
          <div class="bill-name">${esc(customer.name||customer.customerName)}</div>
          <div class="bill-meta">
            ${customer.address?`${esc(customer.address)}<br>`:''}
            ${customer.state?`${esc(customer.state)}<br>`:''}
            ${customer.gstin?`GSTIN: ${esc(customer.gstin)}<br>`:''}
            ${customer.mobile?`${esc(customer.mobile)}`:''}
          </div>
        </div>
        <div class="line"></div>`:''}
        <table>
          <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST%</th><th>Taxable</th>${gstCols}<th>Total</th></tr></thead>
          <tbody>${rows.map(r=>`<tr>
            <td>${r.i+1}</td><td>${esc(r.item.productName||'—')}</td>
            <td>${r.item.qty}</td><td>${esc(r.item.unit||'')}</td><td>${fc(r.item.price)}</td>
            <td>${r.item.gstRate||0}%</td><td>${fc(r.taxable)}</td>${gstCells(r)}
            <td style="font-weight:700">${fc(r.total)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="totals-wrap"><div class="totals">
          <div class="tot-row"><span>Subtotal</span><span>${fc(sub)}</span></div>
          ${isIntra?`<div class="tot-row"><span>CGST</span><span>${fc(cgst)}</span></div><div class="tot-row"><span>SGST</span><span>${fc(sgst)}</span></div>`:`<div class="tot-row"><span>IGST</span><span>${fc(igst)}</span></div>`}
          ${(discAmt||0)>0?`<div class="tot-row" style="color:#e55"><span>Discount</span><span>-${fc(discAmt)}</span></div>`:''}
          <div class="tot-grand"><span>Total</span><span>${fc(total)}</span></div>
        </div></div>
        <div class="words">Amount in Words: ${numToWords(Math.round(total||0))}</div>
        ${company.bank||company.accNo?`<div class="bank">
          <div class="lbl">Bank Details</div>
          ${company.bank?`${esc(company.bank)}<br>`:''}
          ${company.accNo?`A/C: ${esc(company.accNo)}<br>`:''}
          ${company.ifsc?`IFSC: ${esc(company.ifsc)}<br>`:''}
          ${company.upi?`UPI: ${esc(company.upi)}`:''}
        </div>`:''}
        <div class="footer">
          <div style="max-width:300px">
            ${notes?`<div style="margin-bottom:8px"><strong style="color:#111">Notes</strong><br>${esc(notes)}</div>`:''}
            ${terms?`<div><strong style="color:#111">Terms</strong><br>${esc(terms)}</div>`:''}
          </div>
          <div><div class="sign-line">Authorised Signatory<br><strong style="color:#111">${esc(company.name||'')}</strong></div></div>
        </div>
      </div>`
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 4 — CORPORATE BLUE (Formal Enterprise)
// ═══════════════════════════════════════════════════════════════
const Template4 = {
  id: 'corporate-blue',
  name: 'Corporate Blue',
  emoji: '💼',
  description: 'Navy blue enterprise style, two-tone sidebar',
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Roboto',sans-serif;background:#fff;font-size:11px}
    .page{max-width:820px;margin:0 auto;display:grid;grid-template-columns:220px 1fr;min-height:100vh}
    .sidebar{background:#1e3a5f;color:#fff;padding:28px 20px}
    .main{padding:28px 24px}
    .logo{height:50px;object-fit:contain;margin-bottom:14px;display:block;filter:brightness(0) invert(1)}
    .co-name{font-size:15px;font-weight:900;margin-bottom:6px;line-height:1.3}
    .co-meta{font-size:9.5px;color:#93c5fd;line-height:1.9}
    .side-section{margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,.15)}
    .side-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#60a5fa;margin-bottom:6px}
    .side-name{font-size:13px;font-weight:700;margin-bottom:4px}
    .side-meta{font-size:9.5px;color:#93c5fd;line-height:1.8}
    .badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:8.5px;font-weight:700;background:rgba(255,255,255,.15);margin-top:8px}
    .inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:16px;border-bottom:2px solid #1e3a5f}
    .inv-label{font-size:26px;font-weight:900;color:#1e3a5f;letter-spacing:-1px}
    .inv-detail{text-align:right;font-size:10px;color:#555;line-height:1.9}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th{background:#1e3a5f;color:#fff;padding:9px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:right}
    th:first-child,th:nth-child(2){text-align:left}
    td{padding:9px 10px;border-bottom:1px solid #e8edf2;font-size:10px;color:#374151;text-align:right}
    td:first-child,td:nth-child(2){text-align:left}
    tr:nth-child(even) td{background:#f8fafc}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
    .totals{width:240px;background:#f0f4f8;padding:14px;border-radius:8px}
    .words{background:#eff6ff;border:1px solid #bfdbfe;padding:10px 14px;font-size:10px;margin-bottom:12px;border-radius:6px;color:#1e3a5f}
    .bank{background:#f0fdf4;border:1px solid #bbf7d0;padding:10px 14px;font-size:10px;margin-bottom:12px;border-radius:6px;color:#166534}
    .footer-bar{margin-top:20px;padding-top:14px;border-top:2px solid #1e3a5f;display:flex;justify-content:space-between;font-size:10px;color:#6b7280}
    .sign-block{text-align:right}
    .sign-line{border-top:1px solid #9ca3af;padding-top:5px;font-size:8.5px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-top:44px;min-width:150px;display:inline-block}
  `,
  render(data) {
    const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data
    const invNo = invoiceNo || estimateNo || 'PREVIEW'
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstCols = isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'
    const gstCells = (r) => isIntra ? `<td>${fc(r.cg)}</td><td>${fc(r.cg)}</td>` : `<td>${fc(r.ig)}</td>`
    return `
      <div class="page">
        <div class="sidebar">
          ${company.logo?`<img src="${esc(company.logo)}" class="logo"/>`:''}
          <div class="co-name">${esc(company.name||'Your Company')}</div>
          <div class="co-meta">
            ${company.address?`${esc(company.address)}<br>`:''}
            ${company.gstin?`GSTIN: ${esc(company.gstin)}<br>`:''}
            ${company.mobile?`${esc(company.mobile)}<br>`:''}
            ${company.email?esc(company.email):''}
          </div>
          ${customer?.name||customer?.customerName?`
          <div class="side-section">
            <div class="side-lbl">Bill To</div>
            <div class="side-name">${esc(customer.name||customer.customerName)}</div>
            <div class="side-meta">
              ${customer.address?`${esc(customer.address)}<br>`:''}
              ${customer.state?`${esc(customer.state)}<br>`:''}
              ${customer.gstin?`GSTIN: ${esc(customer.gstin)}<br>`:''}
              ${customer.mobile?esc(customer.mobile):''}
            </div>
            <div class="badge">${isIntra?'⚡ Intra-State':'🌐 Inter-State'}</div>
          </div>`:''}
          ${company.bank||company.accNo?`
          <div class="side-section">
            <div class="side-lbl">Bank Details</div>
            <div class="side-meta">
              ${company.bank?`${esc(company.bank)}<br>`:''}
              ${company.accNo?`A/C: ${esc(company.accNo)}<br>`:''}
              ${company.ifsc?`IFSC: ${esc(company.ifsc)}<br>`:''}
              ${company.upi?`UPI: ${esc(company.upi)}`:''}
            </div>
          </div>`:''}
        </div>
        <div class="main">
          <div class="inv-header">
            <div class="inv-label">${isEst?'ESTIMATE':'TAX INVOICE'}</div>
            <div class="inv-detail">
              <strong style="font-size:13px;color:#1e3a5f">#${esc(invNo)}</strong><br>
              Date: ${fd(date)}<br>
              ${dueDate?`Due: ${fd(dueDate)}<br>`:''}
              ${validTill?`Valid: ${fd(validTill)}`:''}
            </div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST%</th><th>Taxable</th>${gstCols}<th>Total</th></tr></thead>
            <tbody>${rows.map(r=>`<tr>
              <td>${r.i+1}</td><td style="font-weight:500">${esc(r.item.productName||'—')}</td>
              <td>${r.item.qty}</td><td>${esc(r.item.unit||'')}</td><td>${fc(r.item.price)}</td>
              <td>${r.item.gstRate||0}%</td><td>${fc(r.taxable)}</td>${gstCells(r)}
              <td style="font-weight:700">${fc(r.total)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="totals-wrap"><div class="totals">${totalsBlock(sub,cgst,sgst,igst,discAmt,total,isIntra,'#1e3a5f')}</div></div>
          <div class="words"><strong>Amount in Words:</strong> ${numToWords(Math.round(total||0))}</div>
          <div class="footer-bar">
            <div style="max-width:280px">
              ${notes?`<strong>Notes:</strong> ${esc(notes)}<br>`:''}
              ${terms?`<strong>Terms:</strong> ${esc(terms)}`:''}
            </div>
            <div class="sign-block"><div class="sign-line">Authorised Signatory — ${esc(company.name||'')}</div></div>
          </div>
        </div>
      </div>`
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 5 — BOLD EMERALD (Startup / Modern Business)
// ═══════════════════════════════════════════════════════════════
const Template5 = {
  id: 'bold-emerald',
  name: 'Bold Emerald',
  emoji: '💚',
  description: 'Vibrant green accent, bold typography, modern startup feel',
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Nunito',sans-serif;background:#f0fdf4;color:#1a1a1a;font-size:11px;padding:24px}
    .page{max-width:820px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .accent-bar{height:8px;background:linear-gradient(90deg,#059669,#10b981,#34d399)}
    .header{padding:28px 32px;background:#fff;display:flex;justify-content:space-between;align-items:flex-start}
    .co-name{font-size:20px;font-weight:900;color:#064e3b}
    .co-meta{font-size:10px;color:#6b7280;line-height:1.9;margin-top:4px}
    .inv-bubble{background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-radius:16px;padding:16px 20px;text-align:right;min-width:160px}
    .inv-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;opacity:.85}
    .inv-num{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-top:2px}
    .inv-date{font-size:9.5px;opacity:.8;margin-top:4px;line-height:1.8}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px 32px;margin-bottom:4px}
    .info-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px}
    .card-lbl{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#059669;margin-bottom:5px}
    .card-name{font-size:13px;font-weight:800;color:#064e3b}
    .card-meta{font-size:10px;color:#6b7280;line-height:1.8;margin-top:2px}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:800;background:#d1fae5;color:#059669;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin:0 0 16px}
    thead tr{background:#064e3b}
    th{color:#fff;padding:10px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;text-align:right}
    th:first-child,th:nth-child(2){text-align:left}
    td{padding:10px 14px;border-bottom:1px solid #f0fdf4;font-size:10px;text-align:right;color:#374151}
    td:first-child{text-align:left;color:#9ca3af}
    td:nth-child(2){text-align:left;font-weight:700;color:#1a1a1a}
    tr:nth-child(even) td{background:#f9fefb}
    .bottom-section{padding:16px 32px 28px}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
    .totals{width:250px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px}
    .words{background:#ecfdf5;border-left:4px solid #10b981;padding:10px 14px;font-size:10px;margin-bottom:12px;border-radius:0 8px 8px 0;color:#064e3b;font-weight:600}
    .bank{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;font-size:10px;margin-bottom:12px}
    .footer{display:flex;justify-content:space-between;font-size:10px;color:#6b7280;border-top:1px solid #d1fae5;padding-top:14px;margin-top:6px}
    .sign-line{border-top:1px solid #10b981;padding-top:5px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#10b981;margin-top:48px;text-align:center}
    .bottom-bar{height:6px;background:linear-gradient(90deg,#059669,#10b981,#34d399)}
  `,
  render(data) {
    const { company={}, customer, items=[], sub=0, cgst=0, sgst=0, igst=0, discAmt=0, total=0, isIntra, invoiceNo, estimateNo, date, dueDate, validTill, notes, terms, type } = data
    const invNo = invoiceNo || estimateNo || 'PREVIEW'
    const isEst = type === 'estimate'
    const rows = buildItems(items, isIntra)
    const gstCols = isIntra ? '<th>CGST</th><th>SGST</th>' : '<th>IGST</th>'
    const gstCells = (r) => isIntra ? `<td>${fc(r.cg)}</td><td>${fc(r.cg)}</td>` : `<td>${fc(r.ig)}</td>`
    return `
      <div class="page">
        <div class="accent-bar"></div>
        <div class="header">
          <div>${company.logo?`<img src="${esc(company.logo)}" style="height:44px;object-fit:contain;margin-bottom:8px;display:block"/>`:''}
            <div class="co-name">${esc(company.name||'Your Company')}</div>
            <div class="co-meta">
              ${company.address?`${esc(company.address)}<br>`:''}
              ${company.gstin?`GSTIN: <strong>${esc(company.gstin)}</strong><br>`:''}
              ${company.mobile?`📱 ${esc(company.mobile)}<br>`:''}
              ${company.email?`✉ ${esc(company.email)}`:''}
            </div>
          </div>
          <div class="inv-bubble">
            <div class="inv-label">${isEst?'Estimate':'Invoice'}</div>
            <div class="inv-num">#${esc(invNo)}</div>
            <div class="inv-date">
              ${fd(date)}<br>
              ${dueDate?`Due: ${fd(dueDate)}<br>`:''}
              ${validTill?`Valid: ${fd(validTill)}`:''}
            </div>
          </div>
        </div>
        ${customer?.name||customer?.customerName?`
        <div class="cards">
          <div class="info-card">
            <div class="card-lbl">Bill To</div>
            <div class="card-name">${esc(customer.name||customer.customerName)}</div>
            <div class="card-meta">
              ${customer.address?`${esc(customer.address)}<br>`:''}
              ${customer.state?`${esc(customer.state)}<br>`:''}
              ${customer.gstin?`GSTIN: ${esc(customer.gstin)}<br>`:''}
              ${customer.mobile?`📱 ${esc(customer.mobile)}`:''}
            </div>
          </div>
          <div class="info-card">
            <div class="card-lbl">GST Type</div>
            <div class="card-name" style="font-size:12px">${isIntra?'Intra-State':'Inter-State'}</div>
            <div class="card-meta">${isIntra?'CGST + SGST Applicable':'IGST Applicable'}</div>
            <div class="badge">${isIntra?'⚡ Same State':'🌐 Different State'}</div>
          </div>
        </div>`:''}
        <table>
          <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST%</th><th>Taxable</th>${gstCols}<th>Total</th></tr></thead>
          <tbody>${rows.map(r=>`<tr>
            <td>${r.i+1}</td><td>${esc(r.item.productName||'—')}</td>
            <td>${r.item.qty}</td><td>${esc(r.item.unit||'')}</td><td>${fc(r.item.price)}</td>
            <td>${r.item.gstRate||0}%</td><td>${fc(r.taxable)}</td>${gstCells(r)}
            <td style="font-weight:800;color:#059669">${fc(r.total)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="bottom-section">
          <div class="totals-wrap"><div class="totals">${totalsBlock(sub,cgst,sgst,igst,discAmt,total,isIntra,'#059669')}</div></div>
          <div class="words">💰 <strong>Amount in Words:</strong> ${numToWords(Math.round(total||0))}</div>
          ${company.bank||company.accNo?`<div class="bank">
            <strong style="color:#064e3b">🏦 Bank Details</strong><br>
            <div style="color:#6b7280;margin-top:4px;line-height:1.8">
              ${company.bank?`${esc(company.bank)} `:''}
              ${company.accNo?`| A/C: ${esc(company.accNo)} `:''}
              ${company.ifsc?`| IFSC: ${esc(company.ifsc)} `:''}
              ${company.upi?`| UPI: ${esc(company.upi)}`:''}
            </div>
          </div>`:''}
          <div class="footer">
            <div>
              ${notes?`<strong style="color:#064e3b">Notes:</strong> ${esc(notes)}<br>`:''}
              ${terms?`<strong style="color:#064e3b">Terms:</strong> ${esc(terms)}`:''}
            </div>
            <div style="text-align:right">
              <div class="sign-line">Authorised Signatory<br><strong style="color:#064e3b">${esc(company.name||'')}</strong></div>
            </div>
          </div>
        </div>
        <div class="bottom-bar"></div>
      </div>`
  }
}

// ── Export all templates ─────────────────────────────────────────
export const TEMPLATES = [Template1, Template2, Template3, Template4, Template5]
export const getTemplate = (id) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
