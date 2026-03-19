# TASK: Add 5 Bill/Estimate Template Selector to StockFlow Pro

## Overview
Add a feature that lets users choose from **5 different visual templates** when printing or downloading any bill or estimate. The template selector appears inside the existing BillPreview modal. No backend changes needed — this is a pure frontend feature.

---

## What to Do (2 files only)

### Step 1 — Add the new file
Create this file at:
```
frontend/src/components/BillTemplates.js
```
Use the **exact content** from `BillTemplates.js` provided in this zip. Do not modify it.

### Step 2 — Replace the existing file
Replace:
```
frontend/src/components/BillPreview.jsx
```
With the **exact content** from `BillPreview.jsx` provided in this zip. Do not modify it.

---

## What the Feature Does

The `BillPreview` modal now shows a template picker at the top with 5 buttons:

| # | Template | Style |
|---|----------|-------|
| 1 | 💜 Modern Violet | Purple gradient header, card layout (was the default look) |
| 2 | 🥇 Classic Gold | Black & gold letterhead, traditional formal look |
| 3 | 🤍 Minimal Clean | Ultra white space, thin lines, typography-focused |
| 4 | 💼 Corporate Blue | Navy sidebar layout, enterprise/formal |
| 5 | 💚 Bold Emerald | Green accent, startup-modern, rounded cards |

- User clicks a template button → live preview updates instantly
- User clicks **🖨 Print / Save as PDF** → print window opens in the selected template's design
- Each template has its own CSS + HTML renderer — fully self-contained, no external dependencies
- All 5 templates support: company logo, GST (CGST/SGST intra-state and IGST inter-state), bank details, notes, terms, digital signature line, amount in words

---

## How It Works (Technical)

### `BillTemplates.js`
- Exports `TEMPLATES` (array of 5 template objects) and `getTemplate(id)`
- Each template object: `{ id, name, emoji, description, css, render(data) }`
- `render(data)` returns a complete HTML string (injected into a `window.open()` print page)
- `css` is a self-contained CSS string (includes Google Fonts import, full reset, all styles)
- Uses `fc`, `fd`, `numToWords` from `../utils/helpers` — already exist in the project

### `BillPreview.jsx`
- Imports `TEMPLATES` and `getTemplate` from `./BillTemplates`
- Adds `useState('modern-violet')` for selected template
- Renders 5 template buttons above the live preview
- `doPrint()` calls `getTemplate(selectedTemplate).render(data)` for pixel-perfect print output
- `LivePreview` component renders a React JSX preview inside the modal (responds to template selection with matching accent colors)
- The `Modal`, `Btn` imports from `./ui` and all helper imports from `../utils/helpers` are unchanged

---

## Data Shape (already passed by the app — no changes needed)

```js
data = {
  company: { name, logo, address, state, gstin, mobile, email, bank, accNo, ifsc, upi },
  customer: { name, customerName, address, state, gstin, mobile },
  items: [{ productName, qty, unit, price, gstRate }],
  sub, cgst, sgst, igst, discAmt, total,
  isIntra,           // boolean — intra-state uses CGST+SGST, inter uses IGST
  invoiceNo,         // for bills
  estimateNo,        // for estimates
  date, dueDate, validTill,
  notes, terms,
  type               // 'invoice' | 'estimate'
}
```

---

## Files NOT to Touch
- `frontend/src/utils/helpers.js` — no changes
- `frontend/src/components/ui.jsx` — no changes
- `frontend/src/pages/index.jsx` — no changes
- `frontend/src/utils/api.js` — no changes
- All backend files — no changes

---

## Test After Adding
1. Go to Sales → open any invoice → click Preview
2. You should see 5 template buttons at the top of the modal
3. Click each template — live preview accent colors should change
4. Click **Print / Save as PDF** — print dialog opens with the selected template's full design
5. Repeat with Estimates page

That's the entire feature. Only 2 frontend files need to be created/replaced.
