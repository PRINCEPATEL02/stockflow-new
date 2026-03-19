<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# StockFlow Pro 🚀 — MongoDB Edition

**Full-Stack SaaS Billing & Stock Management**  
React + Vite + Tailwind CSS · Express.js · MongoDB + Mongoose · JWT Auth · PWA

---

## ✨ Full Feature List

| Feature | Details |
|---|---|
| 🔐 Multi-User Auth | JWT tokens · bcrypt passwords · each user sees ONLY their data |
| 🧾 GST Invoicing | Auto CGST+SGST (intra-state) / IGST (inter-state) · Print/PDF |
| 📋 Estimates | Quotations with valid-till · same print layout as invoices |
| 📦 Purchases | Supplier bills · auto-increments stock in MongoDB |
| 👥 Customers | Full CRUD · GSTIN · state · type (Customer/Supplier/Both) |
| 🏷 Products | SKU · category · sell/cost price · GST rate · stock alerts |
| 📦 Stock Mgmt | Live stock view · color alerts · +/− adjust · synced to DB |
| 📊 Reports | P&L · monthly chart · top products · top customers |
| ⚙️ Settings | Logo · company info · GSTIN · bank details · invoice prefix |
| 📱 PWA | Installable · offline-first · works on mobile |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** → https://nodejs.org
- **MongoDB** (one of these):
  - Local: Install from https://www.mongodb.com/try/download/community
  - Cloud: Free cluster at https://www.mongodb.com/atlas (recommended)

### 1. Install dependencies
```bash
# From project root
npm install
npm run install:all
```

### 2. Configure environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000

# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/stockflowpro

# OR MongoDB Atlas (cloud):
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/stockflowpro?retryWrites=true&w=majority

JWT_SECRET=your_very_long_random_secret_here_change_this
JWT_EXPIRES_IN=30d
NODE_ENV=development
```

### 3. Start development servers
```bash
# From project root — starts API + React simultaneously
npm run dev
```

- 🔵 **Backend API** → http://localhost:5000
- 🟣 **Frontend**    → http://localhost:5173

### 4. Open the app
Go to **http://localhost:5173**, register an account, and start billing!

---

## 🏭 Production Build

```bash
# 1. Build React frontend
npm run build

# 2. Start backend (serves API + built frontend)
npm start
```

Open **http://localhost:5000** — everything runs from one port.

---

## 📁 Project Structure

```
stockflow-pro-mongodb/
│
├── backend/                        ← Express + MongoDB API
│   ├── server.js                   ← Entry point, mounts all routes
│   ├── config/
│   │   └── db.js                   ← Mongoose connection
│   ├── models/
│   │   ├── User.js                 ← username, password (bcrypt), name
│   │   ├── Company.js              ← logo, address, GSTIN, bank details
│   │   ├── Customer.js             ← name, mobile, gstin, state, type
│   │   ├── Product.js              ← name, SKU, price, stock, gstRate
│   │   ├── Sale.js                 ← invoice, items[], GST totals
│   │   ├── Purchase.js             ← supplier bill, items[], stock ↑
│   │   └── Estimate.js             ← quotation, validTill
│   ├── middleware/
│   │   └── auth.js                 ← JWT verification
│   ├── routes/
│   │   ├── auth.js                 ← POST /register  POST /login  GET /me
│   │   ├── company.js              ← GET/PUT /company
│   │   ├── customers.js            ← CRUD /customers
│   │   ├── products.js             ← CRUD + stock /products
│   │   ├── sales.js                ← Create/list/status /sales
│   │   ├── purchases.js            ← Create/list /purchases
│   │   ├── estimates.js            ← Create/list /estimates
│   │   ├── dashboard.js            ← Aggregated stats
│   │   └── reports.js              ← P&L analytics
│   ├── .env                        ← Your secrets (not committed)
│   └── .env.example                ← Template
│
├── frontend/                       ← React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx                 ← Router + auth state
│   │   ├── main.jsx                ← React entry
│   │   ├── index.css               ← Tailwind directives
│   │   ├── components/
│   │   │   ├── ui.jsx              ← Btn, Card, Modal, Inp, Bdg, Spinner…
│   │   │   ├── LoginPage.jsx       ← Register / Login screen
│   │   │   ├── Sidebar.jsx         ← Left navigation
│   │   │   └── BillPreview.jsx     ← Printable invoice/estimate
│   │   ├── pages/
│   │   │   └── index.jsx           ← All 9 pages (Dashboard→Settings)
│   │   └── utils/
│   │       ├── api.js              ← All API calls with JWT headers
│   │       └── helpers.js          ← GST calc, formatters, constants
│   ├── index.html
│   ├── vite.config.js              ← Vite + PWA + proxy to :5000
│   └── tailwind.config.js
│
├── package.json                    ← Root scripts
├── .gitignore
└── README.md
```

---

## 🌐 API Reference

All endpoints except `/api/auth/*` require:  
`Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account → returns JWT |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/company` | Get company profile |
| PUT | `/api/company` | Update company profile + logo |
| GET | `/api/customers?q=` | List customers (search optional) |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/products?q=` | List products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| PATCH | `/api/products/:id/stock` | Adjust stock `{delta}` or `{value}` |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/sales?q=&status=` | List invoices |
| POST | `/api/sales` | Create invoice → deducts stock |
| PATCH | `/api/sales/:id/status` | Update payment status |
| DELETE | `/api/sales/:id` | Delete invoice |
| GET | `/api/purchases?q=` | List purchases |
| POST | `/api/purchases` | Create purchase → adds stock |
| DELETE | `/api/purchases/:id` | Delete purchase |
| GET | `/api/estimates?q=` | List estimates |
| POST | `/api/estimates` | Create estimate |
| PATCH | `/api/estimates/:id/status` | Update estimate status |
| DELETE | `/api/estimates/:id` | Delete estimate |
| GET | `/api/dashboard` | All dashboard stats in one call |
| GET | `/api/reports?period=month\|quarter\|year\|all` | P&L analytics |

---

## 🔧 MongoDB Atlas Setup (Recommended for Production)

1. Go to https://www.mongodb.com/atlas and create a free account
2. Create a **free M0 cluster**
3. Create a **database user** (username + password)
4. Whitelist your IP (or `0.0.0.0/0` for all IPs)
5. Click **Connect → Drivers** and copy the connection string
6. Paste into `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://myuser:mypass@cluster0.abc12.mongodb.net/stockflowpro
   ```
7. Run `npm start` — the schema auto-creates on first connection

---

## 🚢 Deploy to Render (Free)

1. Push your code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set **Build Command**: `npm install && npm run install:all && npm run build`
5. Set **Start Command**: `npm start`
6. Add Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string
   - `NODE_ENV` = `production`
7. Deploy!

---

## 📄 License

MIT — Free to use, modify, and deploy commercially.

---
Built with ❤️ using React · Vite · Tailwind CSS · Express · MongoDB · Mongoose · JWT
>>>>>>> e888600 (Initial commit)
