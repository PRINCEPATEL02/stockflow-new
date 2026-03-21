require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const path      = require('path')
const fs        = require('fs')
const compression = require('compression')
const NodeCache = require('node-cache')
const connectDB = require('./config/db')

// Initialize cache with 5-minute TTL for API responses
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

// Make cache available to routes
global.apiCache = apiCache

// Connect to MongoDB
connectDB()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────────

// Compression middleware for faster response
app.use(compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'https://stockflow-new-frontend.onrender.com',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))      // 10 MB for base64 logo uploads
app.use(express.urlencoded({ extended: true }))

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'))
app.use('/api/company',   require('./routes/company'))
app.use('/api/customers', require('./routes/customers'))
app.use('/api/products',      require('./routes/products'))
app.use('/api/rawmaterials',  require('./routes/rawmaterials'))
app.use('/api/sales',     require('./routes/sales'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/estimates', require('./routes/estimates'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/reports',   require('./routes/reports'))
app.use('/api/warranty',  require('./routes/warranty'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', db: 'mongodb', time: new Date().toISOString() })
)

// ── Serve built React frontend in production ──────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (_, res) => res.sendFile(path.join(frontendDist, 'index.html')))
} else {
  app.get('/', (_, res) => res.json({ message: 'StockFlow Pro API running. Build frontend for full app.' }))
}

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 StockFlow Pro (MongoDB) running → http://localhost:${PORT}`)
  console.log(`   Database : ${process.env.MONGO_URI}`)
  console.log(`   Mode     : ${process.env.NODE_ENV || 'development'}\n`)
})
