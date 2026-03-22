/**
 * StockFlow Pro - Supabase Real-time Client
 * Enables live database updates without page refresh
 * 
 * Based on your Supabase project:
 * - URL: https://fkslvnixkyvexygaclyz.supabase.co
 * -anon key provided below (public, safe to expose)
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration - replace with your actual credentials
const supabaseUrl = 'https://fkslvnixkyvexygaclyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc2x2bml4a3ZleHlnY2x5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MTgyMDAwLCJleHAiOjE5NjA3NTgwMDB9.zEH-OFnOdK0W5K5vL1V55M3NhJkZ7r8v2v3hV3p2V68'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// ==================== REALTIME TABLES ====================
// Tables that support real-time updates
export const REALTIME_TABLES = {
  SALES: 'sales',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  PURCHASES: 'purchases',
  ESTIMATES: 'estimates',
  WARRANTIES: 'warranties',
  RAW_MATERIALS: 'raw_materials',
  USERS: 'users',
  COMPANIES: 'companies'
}

// ==================== CHANNEL HELPERS ====================

/**
 * Subscribe to table changes for a specific user
 * @param {string} table - Table name
 * @param {number} userId - User ID to filter by
 * @param {Function} callback - Callback function for changes
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const subscribeToUserTable = (table, userId, callback) => {
  const channel = supabase
    .channel(`${table}-changes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log(`📡 ${table} change:`, payload.eventType, payload.new || payload.old)
        callback(payload)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

/**
 * Subscribe to any insert on a table for a user
 */
export const subscribeToInserts = (table, userId, callback) => {
  const channel = supabase
    .channel(`${table}-insert-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log(`➕ ${table} inserted:`, payload.new)
        callback(payload.new)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to any update on a table for a user
 */
export const subscribeToUpdates = (table, userId, callback) => {
  const channel = supabase
    .channel(`${table}-update-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log(`✏️ ${table} updated:`, payload.new)
        callback(payload.new, payload.old)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to any delete on a table for a user
 */
export const subscribeToDeletes = (table, userId, callback) => {
  const channel = supabase
    .channel(`${table}-delete-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log(`🗑️ ${table} deleted:`, payload.old)
        callback(payload.old)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  }
}

export default supabase