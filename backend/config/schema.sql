-- StockFlow Pro PostgreSQL Schema
-- This file contains the SQL commands to create all necessary tables
-- Run these commands in your PostgreSQL database to set up the schema

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Companies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT '',
    logo TEXT DEFAULT '',
    address TEXT DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    pincode VARCHAR(20) DEFAULT '',
    gstin VARCHAR(50) DEFAULT '',
    pan VARCHAR(50) DEFAULT '',
    cin VARCHAR(50) DEFAULT '',
    msme VARCHAR(50) DEFAULT '',
    mobile VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    website VARCHAR(255) DEFAULT '',
    bank VARCHAR(255) DEFAULT '',
    acc_name VARCHAR(255) DEFAULT '',
    acc_no VARCHAR(50) DEFAULT '',
    ifsc VARCHAR(50) DEFAULT '',
    branch VARCHAR(255) DEFAULT '',
    upi VARCHAR(100) DEFAULT '',
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    estimate_prefix VARCHAR(20) DEFAULT 'EST',
    default_template VARCHAR(100) DEFAULT 'classic-tally',
    default_terms TEXT DEFAULT '',
    footer TEXT DEFAULT '',
    declaration TEXT DEFAULT '',
    signature TEXT DEFAULT '',
    terms_conditions TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Customers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    gstin VARCHAR(50) DEFAULT '',
    type VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    unit VARCHAR(20) DEFAULT 'pcs',
    price DECIMAL(12, 2) DEFAULT 0,
    cost_price DECIMAL(12, 2) DEFAULT 0,
    gst_rate DECIMAL(5, 2) DEFAULT 18,
    stock DECIMAL(12, 2) DEFAULT 0,
    min_stock DECIMAL(12, 2) DEFAULT 5,
    description TEXT DEFAULT '',
    raw_materials JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Raw Materials Table
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    unit VARCHAR(20) DEFAULT 'kg',
    cost_price DECIMAL(12, 2) DEFAULT 0,
    gst_rate DECIMAL(5, 2) DEFAULT 18,
    stock DECIMAL(12, 2) DEFAULT 0,
    min_stock DECIMAL(12, 2) DEFAULT 5,
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Sales Table
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_no VARCHAR(50) NOT NULL,
    date VARCHAR(20) NOT NULL,
    due_date VARCHAR(20) DEFAULT '',
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT '',
    customer JSONB DEFAULT '{}',
    bill_to JSONB DEFAULT '{}',
    ship_to JSONB DEFAULT '{}',
    items JSONB DEFAULT '[]',
    sub DECIMAL(12, 2) DEFAULT 0,
    cgst DECIMAL(12, 2) DEFAULT 0,
    sgst DECIMAL(12, 2) DEFAULT 0,
    igst DECIMAL(12, 2) DEFAULT 0,
    disc_pct DECIMAL(5, 2) DEFAULT 0,
    disc_amt DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    is_intra BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'unpaid',
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    payment_date VARCHAR(20) DEFAULT '',
    payment_method VARCHAR(50) DEFAULT '',
    notes TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    declaration TEXT DEFAULT '',
    template_id VARCHAR(100) DEFAULT 'classic-tally',
    signature TEXT DEFAULT '',
    place_of_supply VARCHAR(100) DEFAULT '',
    hsn_code VARCHAR(20) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Purchases Table
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_no VARCHAR(50) NOT NULL,
    date VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(255) DEFAULT '',
    supplier_gstin VARCHAR(50) DEFAULT '',
    bill_no VARCHAR(50) DEFAULT '',
    items JSONB DEFAULT '[]',
    sub DECIMAL(12, 2) DEFAULT 0,
    cgst DECIMAL(12, 2) DEFAULT 0,
    sgst DECIMAL(12, 2) DEFAULT 0,
    igst DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'paid',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Estimates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estimate_no VARCHAR(50) NOT NULL,
    date VARCHAR(20) NOT NULL,
    valid_till VARCHAR(20) DEFAULT '',
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT '',
    customer JSONB DEFAULT '{}',
    items JSONB DEFAULT '[]',
    sub DECIMAL(12, 2) DEFAULT 0,
    cgst DECIMAL(12, 2) DEFAULT 0,
    sgst DECIMAL(12, 2) DEFAULT 0,
    igst DECIMAL(12, 2) DEFAULT 0,
    disc_pct DECIMAL(5, 2) DEFAULT 0,
    disc_amt DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    is_intra BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Warranties Table
-- =====================================================
CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) DEFAULT '',
    bill_number VARCHAR(100) NOT NULL,
    bill_date VARCHAR(20) NOT NULL,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    products JSONB DEFAULT '[]',
    warranty_enabled BOOLEAN DEFAULT false,
    warranty_duration INTEGER DEFAULT 0,
    warranty_type VARCHAR(20) DEFAULT 'days',
    start_date TIMESTAMP,
    expiry_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bill_number)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

CREATE INDEX IF NOT EXISTS idx_raw_materials_user_id ON raw_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON raw_materials(name);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_customer_name ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_total ON sales(total);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_no ON purchases(purchase_no);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_no ON estimates(estimate_no);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

CREATE INDEX IF NOT EXISTS idx_warranties_user_id ON warranties(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_bill_number ON warranties(bill_number);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties(status);
CREATE INDEX IF NOT EXISTS idx_warranties_expiry_date ON warranties(expiry_date);
