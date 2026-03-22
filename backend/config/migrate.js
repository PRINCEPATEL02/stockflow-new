/**
 * MongoDB to PostgreSQL Migration Script
 * 
 * This script helps migrate existing data from MongoDB to PostgreSQL.
 * It requires both MongoDB and PostgreSQL connections to be configured.
 * 
 * Usage:
 * 1. First, set up PostgreSQL and update .env with PG* variables
 * 2. Run: node config/migrate.js
 * 
 * Note: This is a template/starting point. You may need to adjust
 * based on your specific MongoDB data structure.
 */

require('dotenv').config()

// MongoDB connection (for reading existing data)
const mongoose = require('mongoose')

// PostgreSQL connection
const { pool } = require('./db')

// MongoDB Models
const User = require('../models/User')
const Company = require('../models/Company')
const Customer = require('../models/Customer')
const Product = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const Sale = require('../models/Sale')
const Purchase = require('../models/Purchase')
const Estimate = require('../models/Estimate')
const Warranty = require('../models/Warranty')

const migrate = async () => {
  try {
    console.log('Starting migration from MongoDB to PostgreSQL...')
    console.log('')

    // Connect to MongoDB
    if (process.env.MONGO_URI) {
      console.log('Connecting to MongoDB...')
      await mongoose.connect(process.env.MONGO_URI)
      console.log('MongoDB connected')
    } else {
      console.log('No MONGO_URI found, skipping MongoDB connection')
    }

    // Connect to PostgreSQL (handled by db.js)
    console.log('PostgreSQL connection ready')

    // Note: Since we've already converted the models to PostgreSQL,
    // the actual migration would require keeping MongoDB models
    // temporarily or exporting/importing data directly.
    
    // This is a placeholder - actual migration would involve:
    // 1. Reading from MongoDB collections
    // 2. Transforming data to PostgreSQL format
    // 3. Inserting into PostgreSQL tables

    console.log('')
    console.log('Migration template ready.')
    console.log('')
    console.log('To perform actual migration:')
    console.log('1. Ensure PostgreSQL database is set up with tables (handled by connectDB)')
    console.log('2. Export MongoDB data to JSON/CSV')
    console.log('3. Import data into PostgreSQL using psql or programmatic approach')
    console.log('')
    console.log('Alternatively, you can use tools like:')
    console.log('- pgloader (https://pgloader.io/)')
    console.log('- mongosharp (MongoDB to PostgreSQL converter)')
    console.log('')

    // Close connections
    if (mongoose.connection.readyState) {
      await mongoose.disconnect()
    }
    await pool.end()

    console.log('Migration check complete.')
    process.exit(0)
  } catch (err) {
    console.error('Migration error:', err)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
}

module.exports = { migrate }
