/**
 * StockFlow Pro - Real-time Data Hook
 * Automatically updates React Query cache when database changes
 * No page refresh needed!
 */

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  subscribeToUserTable, 
  subscribeToInserts, 
  subscribeToUpdates, 
  subscribeToDeletes,
  REALTIME_TABLES
} from '../lib/supabase'

/**
 * Hook to enable real-time updates for a specific table
 * @param {string} table - Table name from REALTIME_TABLES
 * @param {number} userId - Current user ID
 * @param {string} queryKey - React Query key to invalidate on changes
 */
export function useRealtimeTable(table, userId, queryKey) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !table) return

    // Subscribe to all changes (insert, update, delete)
    const subscription = subscribeToUserTable(table, userId, (payload) => {
      // Invalidate the related query to trigger refetch
      queryClient.invalidateQueries({ queryKey })
      console.log(`🔄 Invalidated ${queryKey} due to ${table} ${payload.eventType}`)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [table, userId, queryKey, queryClient])
}

/**
 * Hook for real-time sales updates
 */
export function useRealtimeSales(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.SALES, userId, (newSale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.SALES, userId, (updated) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.SALES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook for real-time products updates
 */
export function useRealtimeProducts(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.PRODUCTS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.PRODUCTS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.PRODUCTS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook for real-time customers updates
 */
export function useRealtimeCustomers(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.CUSTOMERS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.CUSTOMERS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.CUSTOMERS, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook for real-time purchases updates
 */
export function useRealtimePurchases(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.PURCHASES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.PURCHASES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.PURCHASES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook for real-time estimates updates
 */
export function useRealtimeEstimates(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.ESTIMATES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.ESTIMATES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.ESTIMATES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook for real-time warranty updates
 */
export function useRealtimeWarranties(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const insertSub = subscribeToInserts(REALTIME_TABLES.WARRANTIES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] })
    })

    const updateSub = subscribeToUpdates(REALTIME_TABLES.WARRANTIES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] })
    })

    const deleteSub = subscribeToDeletes(REALTIME_TABLES.WARRANTIES, userId, () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] })
    })

    return () => {
      insertSub.unsubscribe()
      updateSub.unsubscribe()
      deleteSub.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Hook to enable all real-time subscriptions for a user
 * Call this once in the main App component
 */
export function useRealtimeSubscription(userId) {
  useRealtimeSales(userId)
  useRealtimeProducts(userId)
  useRealtimeCustomers(userId)
  useRealtimePurchases(userId)
  useRealtimeEstimates(userId)
  useRealtimeWarranties(userId)
}

export default useRealtimeSubscription