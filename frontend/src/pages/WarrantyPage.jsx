import { useState, useEffect } from 'react'
import { getWarranties, deleteWarranty, getWarrantyStats } from '../utils/warrantyApi'

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0 })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('') // '', 'active', 'expired'
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null })

  // Fetch warranties
  const fetchWarranties = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.q = search
      if (filter) params.status = filter
      
      const data = await getWarranties(params)
      setWarranties(data.warranties || [])
    } catch (err) {
      console.error('Failed to fetch warranties:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await getWarrantyStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchWarranties()
    fetchStats()
  }, [search, filter])

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteWarranty(deleteModal.id)
      setDeleteModal({ show: false, id: null })
      fetchWarranties()
      fetchStats()
    } catch (err) {
      alert(err.message)
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Get status badge
  const getStatusBadge = (warranty) => {
    if (!warranty.warrantyEnabled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">No Warranty</span>
    }
    if (warranty.isExpired || warranty.status === 'expired') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Expired</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
  }

  // Get remaining days display
  const getRemainingDays = (warranty) => {
    if (!warranty.warrantyEnabled) return '-'
    if (warranty.isExpired || warranty.status === 'expired') {
      return <span className="text-red-600 font-semibold">Expired</span>
    }
    if (warranty.remainingDays === 0) {
      return <span className="text-red-500 font-semibold">Expires Today</span>
    }
    if (warranty.remainingDays <= 30) {
      return <span className="text-orange-500 font-semibold">{warranty.remainingDays} days</span>
    }
    return <span className="text-green-600 font-semibold">{warranty.remainingDays} days</span>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Warranty Management</h1>
        <p className="text-slate-500 mt-1">Track and manage product warranties</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total Warranties</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Expired</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">{stats.expiringSoon}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search by customer name or bill number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'expired' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Loading warranties...</p>
          </div>
        ) : warranties.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No warranties found</h3>
            <p className="text-slate-500 mt-1">
              {search || filter ? 'Try adjusting your filters' : 'Add warranties from the Bills page'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Bill Number</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Products</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Start Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Expiry Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Remaining</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warranties.map((warranty) => (
                  <tr key={warranty._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{warranty.customerName}</p>
                        <p className="text-sm text-slate-500">{warranty.contactNumber || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{warranty.billNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-48">
                        {warranty.products?.slice(0, 2).map((p, idx) => (
                          <p key={idx} className="text-sm text-slate-600 truncate">{p.productName}</p>
                        ))}
                        {warranty.products?.length > 2 && (
                          <p className="text-xs text-slate-400">+{warranty.products.length - 2} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(warranty.startDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(warranty.expiryDate)}
                    </td>
                    <td className="px-6 py-4">
                      {getRemainingDays(warranty)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(warranty)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteModal({ show: true, id: warranty._id })}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete warranty"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Delete Warranty?</h3>
              <p className="text-slate-500 mt-2">This action cannot be undone. The warranty record will be permanently deleted.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
