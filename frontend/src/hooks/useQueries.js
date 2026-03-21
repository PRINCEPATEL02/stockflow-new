import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { sales as salesApi, customers as customersApi, products as productsApi, purchases as purchasesApi, estimates as estimatesApi, dashboard as dashboardApi, reports as reportsApi, company as companyApi, auth } from '../utils/api'

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.stats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useSales(filters = {}) {
  const { q = '', status = '', page = 1, limit = 50 } = filters
  return useQuery({
    queryKey: queryKeys.sales({ q, status, page, limit }),
    queryFn: () => salesApi.list(q, status, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useSale(id) {
  return useQuery({
    queryKey: queryKeys.sale(id),
    queryFn: () => salesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => salesApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.setQueryData(queryKeys.sale(variables.id), data)
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: salesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateSaleStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => salesApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sales'] })
      
      // Snapshot previous value
      const previousSales = queryClient.getQueryData(queryKeys.sales({}))
      
      // Optimistically update
      if (previousSales?.data) {
        queryClient.setQueryData(queryKeys.sales({}), (old) => ({
          ...old,
          data: old.data.map(sale => 
            sale._id === id ? { ...sale, status } : sale
          )
        }))
      }
      
      return { previousSales }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSales) {
        queryClient.setQueryData(queryKeys.sales({}), context.previousSales)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useCustomers(filters = {}) {
  const { q = '', type = '', page = 1, limit = 100 } = filters
  return useQuery({
    queryKey: queryKeys.customers({ q, type, page, limit }),
    queryFn: () => customersApi.list(q, type, page, limit),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.setQueryData(queryKeys.customer(variables.id), data)
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Products Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useProducts(filters = {}) {
  const { q = '', category = '', page = 1, limit = 100 } = filters
  return useQuery({
    queryKey: queryKeys.products({ q, category, page, limit }),
    queryFn: () => productsApi.list(q, category, page, limit),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.setQueryData(queryKeys.product(variables.id), data)
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchases Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function usePurchases(filters = {}) {
  const { q = '', status = '', page = 1, limit = 50 } = filters
  return useQuery({
    queryKey: queryKeys.purchases({ q, status, page, limit }),
    queryFn: () => purchasesApi.list(q, status, page, limit),
    staleTime: 2 * 60 * 1000,
  })
}

export function usePurchase(id) {
  return useQuery({
    queryKey: queryKeys.purchase(id),
    queryFn: () => purchasesApi.get(id),
    enabled: !!id,
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeletePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: purchasesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Estimates Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useEstimates(filters = {}) {
  const { q = '', page = 1, limit = 50 } = filters
  return useQuery({
    queryKey: queryKeys.estimates({ q, page, limit }),
    queryFn: () => estimatesApi.list(q, page, limit),
    staleTime: 2 * 60 * 1000,
  })
}

export function useEstimate(id) {
  return useQuery({
    queryKey: queryKeys.estimate(id),
    queryFn: () => estimatesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateEstimate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: estimatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: estimatesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Company Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useCompany() {
  return useQuery({
    queryKey: queryKeys.company,
    queryFn: companyApi.get,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: companyApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.company, data)
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// User/Auth Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: auth.getProfile,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: auth.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data)
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports Hooks
// ─────────────────────────────────────────────────────────────────────────────
export function useReports(period = 'month') {
  return useQuery({
    queryKey: queryKeys.reports(period),
    queryFn: () => reportsApi.get(period),
    staleTime: 5 * 60 * 1000,
  })
}
