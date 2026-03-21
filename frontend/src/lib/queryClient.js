import { QueryClient } from '@tanstack/react-query'

// Create a QueryClient with optimized default settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Don't refetch on window focus for most queries (reduces server load)
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Don't show error toast immediately
      throwOnError: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  profile: ['profile'],
  
  // Company
  company: ['company'],
  
  // Dashboard
  dashboard: ['dashboard'],
  dashboardStats: (period) => ['dashboard', 'stats', period],
  
  // Sales
  sales: (filters) => ['sales', filters],
  sale: (id) => ['sales', id],
  
  // Purchases
  purchases: (filters) => ['purchases', filters],
  purchase: (id) => ['purchases', id],
  
  // Customers
  customers: (filters) => ['customers', filters],
  customer: (id) => ['customers', id],
  
  // Products
  products: (filters) => ['products', filters],
  product: (id) => ['products', id],
  
  // Estimates
  estimates: (filters) => ['estimates', filters],
  estimate: (id) => ['estimates', id],
  
  // Warranty
  warranties: (filters) => ['warranties', filters],
  warranty: (id) => ['warranties', id],
  
  // Reports
  reports: (period) => ['reports', period],
}

