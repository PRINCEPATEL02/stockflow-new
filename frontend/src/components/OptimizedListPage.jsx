import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  useSales, usePurchases, useEstimates,
  useDeleteSale, useUpdateSaleStatus,
  useDeletePurchase,
  useDeleteEstimate, useUpdateEstimateStatus
} from '../hooks/useQueries'
import { useDebounce } from '../lib/debounce'
import { fc, fd } from '../utils/helpers'
import { Inp, Sel, Btn, Card, Bdg, Modal, PageHeader, EmptyState, Spinner, ErrBanner } from './ui'
import BillPreview from './BillPreview'
import { checkWarrantyByBill } from '../utils/warrantyApi'
import WarrantyModal from './WarrantyModal'
import { SkeletonTable } from './Skeleton'

// List configuration
const LIST_CFG = {
  sales: {
    api: 'sales',
    title: 'All Invoices',
    newPage: 'new-sale',
    numKey: 'invoiceNo',
    noMsg: 'No invoices yet',
    noIco: '📄',
    useHook: useSales,
    deleteHook: useDeleteSale,
    statusHook: useUpdateSaleStatus,
  },
  purchases: {
    api: 'purchases',
    title: 'All Purchases',
    newPage: 'new-purchase',
    numKey: 'purchaseNo',
    noMsg: 'No purchases yet',
    noIco: '🛒',
    useHook: usePurchases,
    deleteHook: useDeletePurchase,
    statusHook: null,
  },
  estimates: {
    api: 'estimates',
    title: 'All Estimates',
    newPage: 'new-estimate',
    numKey: 'estimateNo',
    noMsg: 'No estimates yet',
    noIco: '📝',
    useHook: useEstimates,
    deleteHook: useDeleteEstimate,
    statusHook: useUpdateEstimateStatus,
  },
}

export default function OptimizedListPage({ type, setPage, company }) {
  const cfg = LIST_CFG[type]
  if (!cfg) return null
  
  return <OptimizedListPageInner type={type} cfg={cfg} setPage={setPage} company={company} />
}

function OptimizedListPageInner({ type, cfg, setPage, company }) {
  const isEst = type === 'estimates'
  const isSale = type === 'sales'
  const isPurchase = type === 'purchases'
  
  // State
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPageNum] = useState(1)
  const [preview, setPreview] = useState(null)
  const [del, setDel] = useState(null)
  const [warrantyModal, setWarrantyModal] = useState({ show: false, sale: null })
  const [warrantyStatus, setWarrantyStatus] = useState({})
  
  // Debounced search - wait 300ms after user stops typing
  const debouncedSearch = useDebounce(search, 300)
  
  // Fetch data using React Query
  const { data, isLoading, error, refetch } = cfg.useHook({
    q: debouncedSearch,
    status: isPurchase || isSale ? status : '',
    page,
    limit: 50,
  })
  
  // Extract items from response
  const items = useMemo(() => {
    if (!data) return []
    return data.data || data || []
  }, [data])
  
  const pagination = useMemo(() => {
    if (!data || !data.pagination) return null
    return data.pagination
  }, [data])
  
  // Refetch when filters change
  useEffect(() => {
    setPageNum(1)
  }, [debouncedSearch, status])
  
  // Delete mutation with optimistic update
  const deleteMutation = cfg.deleteHook()
  
  // Status mutation
  const statusMutation = cfg.statusHook?.()
  
  const handleDelete = useCallback(async (id) => {
    await deleteMutation.mutateAsync(id)
    setDel(null)
  }, [deleteMutation])
  
  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    if (statusMutation) {
      await statusMutation.mutateAsync({ id, status: newStatus })
    }
  }, [statusMutation])
  
  const openPreview = useCallback((item) => setPreview({
    ...item, 
    items: item.items || [], 
    customer: item.customer || {}, 
    billTo: item.billTo || {}, 
    shipTo: item.shipTo || {},
    company: company || {}, 
    type: isEst ? 'estimate' : 'sale',
    templateId: item.templateId || company?.defaultTemplate || 'classic-tally'
  }), [company, isEst])
  
  // Check warranty status for sales
  const checkWarrantyStatus = useCallback(async (item) => {
    if (!isSale) return
    try {
      const res = await checkWarrantyByBill(item.invoiceNo)
      setWarrantyStatus(prev => ({ ...prev, [item._id]: res.exists ? 'active' : 'none' }))
    } catch {
      setWarrantyStatus(prev => ({ ...prev, [item._id]: 'none' }))
    }
  }, [isSale])
  
  // Load warranty status when items change
  useEffect(() => {
    if (isSale && items.length > 0) {
      items.forEach(item => {
        if (!warrantyStatus[item._id]) {
          checkWarrantyStatus(item)
        }
      })
    }
  }, [items, isSale, warrantyStatus, checkWarrantyStatus])
  
  const openWarrantyModal = useCallback((sale) => {
    setWarrantyModal({ show: true, sale })
  }, [])
  
  const handleWarrantySuccess = useCallback((saleId) => {
    setWarrantyStatus(prev => ({ ...prev, [saleId]: 'active' }))
    setWarrantyModal({ show: false, sale: null })
  }, [])
  
  // Calculate totals
  const total = useMemo(() => items.reduce((a, i) => a + (i.total || 0), 0), [items])
  
  const totalPages = pagination?.pages || 1
  
  return (
    <div className="space-y-5">
      <PageHeader title={`${cfg.title}${pagination ? ` (${pagination.total})` : ''}`} actions={<>
        <div className="flex gap-2">
          <input 
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-48" 
            placeholder="Search…" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
          {(isSale || isPurchase) && (
            <select 
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {isSale && (
                <>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </>
              )}
              {isPurchase && (
                <>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </>
              )}
            </select>
          )}
        </div>
        <Btn sz="sm" onClick={() => refetch()}>Refresh</Btn>
        <Btn sz="sm" onClick={() => setPage(cfg.newPage)}>+ New</Btn>
      </>}/>
      
      {items.length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-3 flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">{items.length} records shown</span>
          <span className="font-black text-violet-700">{fc(total)} total</span>
        </div>
      )}
      
      {isLoading ? (
        <Card>
          <SkeletonTable rows={8} />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState icon={cfg.noIco} msg={cfg.noMsg} />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Number', 'Date', isPurchase ? 'Supplier' : 'Customer', 'Amount', 'GST', 'Paid', 'Pending', 'Status', isSale ? 'Warranty' : '', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const tax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)
                    return (
                      <tr key={item._id} className={`border-t border-slate-50 hover:bg-slate-50/70 transition-all ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                        <td className="px-4 py-3 font-bold text-slate-700 text-sm">{item[cfg.numKey]}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{fd(item.date)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.customerName || item.supplierName || '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-violet-600">{fc(item.total)}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{fc(tax)}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600">{fc(item.amountPaid || 0)}</td>
                        <td className="px-4 py-3 text-sm text-orange-600">{fc((item.total || 0) - (item.amountPaid || 0))}</td>
                        <td className="px-4 py-3">
                          {type === 'sales' ? (
                            <select 
                              className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white" 
                              value={item.status || 'unpaid'} 
                              onChange={e => handleStatusUpdate(item._id, e.target.value)}
                              disabled={statusMutation?.isPending}
                            >
                              {['unpaid', 'paid', 'partial', 'overdue'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          ) : (
                            <Bdg c={item.status === 'paid' || item.status === 'converted' ? 'green' : 'yellow'}>{item.status || '—'}</Bdg>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isSale && (
                            <button
                              onClick={() => openWarrantyModal(item)}
                              className={`mb-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                warrantyStatus[item._id] === 'active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              {warrantyStatus[item._id] === 'active' ? '✓ Warranty' : '+ Warranty'}
                            </button>
                          )}
                          <div className="flex gap-1.5">
                            {!isPurchase && (
                              <>
                                <Btn v="sec" sz="sm" onClick={() => openPreview(item)}>View</Btn>
                              </>
                            )}
                            <Btn v="gst" sz="sm" className="text-red-400 hover:bg-red-50" onClick={() => setDel(item._id)}>Del</Btn>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Btn 
                v="sec" 
                sz="sm" 
                onClick={() => setPageNum(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </Btn>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Btn 
                v="sec" 
                sz="sm" 
                onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </Btn>
            </div>
          )}
        </>
      )}
      
      {preview && <BillPreview data={preview} onClose={() => setPreview(null)} />}
      
      {/* Delete Confirmation Modal */}
      <Modal show={!!del} onClose={() => setDel(null)} title="Confirm Delete">
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete this record?</p>
          <div className="flex gap-2 justify-end">
            <Btn v="sec" onClick={() => setDel(null)}>Cancel</Btn>
            <Btn onClick={() => handleDelete(del)}>Delete</Btn>
          </div>
        </div>
      </Modal>
      
      {/* Warranty Modal */}
      {warrantyModal.show && (
        <WarrantyModal 
          sale={warrantyModal.sale} 
          onClose={() => setWarrantyModal({ show: false, sale: null })}
          onSuccess={handleWarrantySuccess}
        />
      )}
    </div>
  )
}
