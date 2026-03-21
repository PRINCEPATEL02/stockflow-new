# MongoDB Performance Optimization for StockFlow

## 1. INDEXES - Copy-Paste Ready Commands

Run these in MongoDB shell or Compass:

```javascript
// === PRODUCTS COLLECTION ===
db.products.createIndex({ userId: 1, name: 1 }); // Product list + search
db.products.createIndex({ userId: 1, category: 1 }); // Filter by category
db.products.createIndex({ userId: 1, stock: 1, minStock: 1 }); // Low stock alerts
db.products.createIndex({ sku: 1 }, { sparse: true }); // SKU lookup

// === SALES COLLECTION ===
db.sales.createIndex({ userId: 1, createdAt: -1 }); // Sales list (already exists)
db.sales.createIndex({ userId: 1, status: 1 }); // Filter by payment status
db.sales.createIndex({ userId: 1, customerName: 1 }); // Customer sales history
db.sales.createIndex({ userId: 1, date: -1 }); // Date range queries
db.sales.createIndex({ invoiceNo: 1 }, { unique: 1 }); // Unique invoice numbers
db.sales.createIndex({ "items.productId": 1 }); // Product sales history

// === PURCHASES COLLECTION ===
db.purchases.createIndex({ userId: 1, createdAt: -1 }); // Purchase list
db.purchases.createIndex({ userId: 1, supplierName: 1 }); // Supplier filter
db.purchases.createIndex({ userId: 1, status: 1 }); // Payment status
db.purchases.createIndex({ purchaseNo: 1 }, { unique: 1 }); // Unique purchase numbers

// === CUSTOMERS COLLECTION ===
db.customers.createIndex({ userId: 1, name: 1 }); // Customer list (already exists)
db.customers.createIndex({ userId: 1, mobile: 1 }); // Mobile lookup
db.customers.createIndex({ userId: 1, state: 1 }); // State-wise customers

// === RAW MATERIALS COLLECTION ===
db.rawmaterials.createIndex({ userId: 1, name: 1 }); // Material list
db.rawmaterials.createIndex({ userId: 1, category: 1 }); // Category filter
db.rawmaterials.createIndex({ userId: 1, stock: 1 }); // Low stock alerts

// === USERS COLLECTION ===
db.users.createIndex({ email: 1 }, { unique: 1 }); // Login lookup
```

## 2. SLOW QUERY FIXES

### Product Search - Add Text Index

```javascript
// Add text index for full-text search (replaces regex)
db.products.createIndex({ name: "text", sku: "text", category: "text" });
```

### In routes/products.js - Replace regex with text search:

```javascript
// BEFORE (slow - scans all documents)
if (q) filter.$or = [{ name: new RegExp(q, "i") }, { sku: new RegExp(q, "i") }];

// AFTER (uses index)
if (q) filter.$text = { $search: q };
```

### Sales Dashboard - Use covered query:

```javascript
// Add covered index
db.sales.createIndex({ userId: 1, status: 1, createdAt: -1, total: 1 });

// Query only needed fields
const list = await Sale.find(
  filter,
  "invoiceNo date customerName total status createdAt",
)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNum)
  .lean();
```

## 3. SCHEMA IMPROVEMENTS

### Current Schema Analysis:

- Products have embedded `rawMaterials` array - ✅ GOOD (small array, always needed together)
- Customer data embedded in Sale - ✅ GOOD (denormalized for invoice speed)
- But could add:

  ```javascript
  // Add frequently accessed computed fields
  saleSchema.add({
    lastPaymentDate: { type: String, default: "" },
    itemsCount: { type: Number, default: 0 },
  });

  // Pre-calculate on save
  saleSchema.pre("save", function () {
    this.itemsCount = this.items.length;
  });
  ```

## 4. CACHING STRATEGY (Redis)

```javascript
// Recommended TTLs (Time To Live):
const CACHE_TTL = {
  DASHBOARD_STATS: 60, // 1 minute - sales/purchase totals
  LOW_STOCK_ALERTS: 300, // 5 minutes - low stock items
  CUSTOMER_LIST: 600, // 10 minutes - customer dropdown
  PRODUCT_LIST: 300, // 5 minutes - product dropdown
  DAILY_SALES_SUMMARY: 3600, // 1 hour - daily totals
  MONTHLY_REPORT: 3600, // 1 hour - monthly aggregations
};

// Cache keys pattern:
const cacheKey = {
  dashboard: (userId) => `dash:${userId}`,
  products: (userId, page) => `prod:${userId}:${page}`,
  lowStock: (userId) => `low:${userId}`,
};
```

## 5. REAL-TIME PERFORMANCE

### Current Issue: Page reload is slow

### Solution Options:

**Option A: Change Streams (Best for real-time)**

```javascript
// Server-side change stream
const changeStream = Sale.watch([
  { $match: { "fullDocument.userId": userId } },
]);
changeStream.on("change", (data) => {
  // Emit to client via WebSocket
  io.to(userId).emit("saleUpdate", data);
});
```

**Option B: Polling with ETags (Simple, effective)**

```javascript
// Add ETag to responses
app.use((req, res, next) => {
  res.set(
    "ETag",
    crypto
      .createHash("md5")
      .update(JSON.stringify(res.locals.data))
      .digest("hex"),
  );
});

// Client sends If-None-Match header
```

**Option C: Optimistic UI (Best perceived performance)**

- Update UI immediately on submit
- Roll back on error
- Already partially implemented with `await` in routes

## 6. AGGREGATION PIPELINES

### Dashboard Stats (already optimized):

```javascript
// Sales by status - use compound index
db.sales.aggregate([
  { $match: { userId: userId } },
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      total: { $sum: "$total" },
    },
  },
]);

// Add index: db.sales.createIndex({ userId: 1, status: 1 })
```

### Monthly Sales Trend:

```javascript
db.sales.aggregate([
  {
    $match: {
      userId: userId,
      date: { $gte: "2024-01-01", $lte: "2024-12-31" },
    },
  },
  {
    $group: {
      _id: { $substr: ["$date", 0, 7] }, // Group by month
      sales: { $sum: 1 },
      revenue: { $sum: "$total" },
    },
  },
  { $sort: { _id: 1 } },
]);

// Add index: db.sales.createIndex({ userId: 1, date: 1 })
```

### Top Selling Products:

```javascript
db.sales.aggregate([
  { $match: { userId: userId } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.productId",
      name: { $first: "$items.productName" },
      qtySold: { $sum: "$items.qty" },
      revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
    },
  },
  { $sort: { qtySold: -1 } },
  { $limit: 10 },
]);
```

## 7. QUICK WINS - Do Today

### 1. Add lean() to all read queries ✅ (Already done in routes)

- Changed `.find()` to `.find().lean()` - **~30% faster**

### 2. Add compound indexes

```javascript
// Run in MongoDB shell
db.products.createIndex({ userId: 1, category: 1, name: 1 });
db.sales.createIndex({ userId: 1, status: 1, createdAt: -1 });
db.purchases.createIndex({ userId: 1, status: 1, createdAt: -1 });
```

### 3. Select only needed fields

```javascript
// INSTEAD OF:
const sales = await Sale.find({ userId });

// DO:
const sales = await Sale.find(
  { userId },
  "invoiceNo date total status customerName",
);
```

### 4. Add pagination limits

- Already implemented (max 100 items per page) ✅

### 5. Enable MongoDB query caching

```javascript
// In connection options
mongoose.connect(uri, {
  cache: true,
  max: 500, // Cache 500 queries
  ttl: 600, // Cache for 10 minutes
});
```

## Performance Impact Summary

| Optimization             | Impact | Effort       |
| ------------------------ | ------ | ------------ |
| Add indexes              | HIGH   | Low          |
| Use lean()               | MEDIUM | Low          |
| Field selection          | MEDIUM | Medium       |
| Redis caching            | HIGH   | Medium       |
| Pagination               | HIGH   | Already done |
| Aggregation optimization | MEDIUM | Medium       |

Run `db.collection.explain('executionStats')` to verify indexes are being used.
