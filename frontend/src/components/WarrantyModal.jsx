import { useState, useEffect } from 'react'
import { createWarranty, checkWarrantyByBill } from '../utils/warrantyApi'

export default function WarrantyModal({ isOpen, onClose, sale, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warrantyEnabled, setWarrantyEnabled] = useState(false)
  const [warrantyDuration, setWarrantyDuration] = useState('')
  const [warrantyType, setWarrantyType] = useState('days')
  const [existingWarranty, setExistingWarranty] = useState(null)

  useEffect(() => {
    if (isOpen && sale) {
      // Check if warranty already exists for this bill
      checkWarrantyByBill(sale.invoiceNo)
        .then(res => {
          if (res.exists) {
            setExistingWarranty(res.warranty)
            setWarrantyEnabled(res.warranty.warrantyEnabled)
            setWarrantyDuration(res.warranty.warrantyDuration || '')
            setWarrantyType(res.warranty.warrantyType || 'days')
          } else {
            setExistingWarranty(null)
            setWarrantyEnabled(false)
            setWarrantyDuration('')
            setWarrantyType('days')
          }
        })
        .catch(() => {
          setExistingWarranty(null)
        })
      setError('')
    }
  }, [isOpen, sale])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!sale) return

    // Validation
    if (warrantyEnabled && !warrantyDuration) {
      setError('Please enter warranty duration')
      return
    }

    if (warrantyEnabled && parseInt(warrantyDuration) <= 0) {
      setError('Warranty duration must be greater than 0')
      return
    }

    setLoading(true)

    try {
      const warrantyData = {
        customerName: sale.customerName || '',
        contactNumber: sale.customer?.phone || sale.customer?.mobile || '',
        billNumber: sale.invoiceNo,
        billDate: sale.date,
        saleId: sale._id,
        products: sale.items?.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.qty
        })) || [],
        warrantyEnabled,
        warrantyDuration: warrantyEnabled ? parseInt(warrantyDuration) : 0,
        warrantyType: warrantyEnabled ? warrantyType : 'days',
        startDate: warrantyEnabled ? sale.date : null
      }

      if (existingWarranty) {
        // Update existing warranty - use PATCH logic via the same endpoint
        await createWarranty({ ...warrantyData, _id: existingWarranty._id })
      } else {
        await createWarranty(warrantyData)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Calculate total amount
  const totalAmount = sale?.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {existingWarranty ? 'Update Warranty' : 'Add Warranty'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">Manage warranty for this bill</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Bill Details */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Bill Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Customer Name</span>
                <p className="font-medium text-slate-800">{sale?.customerName || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Bill Number</span>
                <p className="font-medium text-slate-800">{sale?.invoiceNo || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Bill Date</span>
                <p className="font-medium text-slate-800">{formatDate(sale?.date)}</p>
              </div>
              <div>
                <span className="text-slate-500">Contact Number</span>
                <p className="font-medium text-slate-800">{sale?.customer?.phone || sale?.customer?.mobile || '-'}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Products in this Bill
            </h3>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Product</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Price</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale?.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.productName || 'Unknown'}</td>
                      <td className="text-right px-4 py-2">₹{item.price?.toFixed(2) || '0.00'}</td>
                      <td className="text-right px-4 py-2">{item.qty || 0}</td>
                      <td className="text-right px-4 py-2 font-medium">₹{((item.price || 0) * (item.qty || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-2 text-right font-medium">Total:</td>
                    <td className="px-4 py-2 text-right font-bold text-green-600">₹{totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Warranty Toggle */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700">Warranty Coverage</h3>
                <p className="text-sm text-slate-500 mt-1">Enable warranty for this bill</p>
              </div>
              <button
                type="button"
                onClick={() => setWarrantyEnabled(!warrantyEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  warrantyEnabled ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                    warrantyEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Warranty Input - Show when enabled */}
          {warrantyEnabled && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200 animate-fadeIn">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Warranty Duration
              </h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-1">Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={warrantyDuration}
                    onChange={(e) => setWarrantyDuration(e.target.value)}
                    placeholder="Enter duration"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-sm text-slate-600 mb-1">Type</label>
                  <select
                    value={warrantyType}
                    onChange={(e) => setWarrantyType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              {warrantyDuration && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  ✓ Warranty will be valid for {warrantyDuration} {warrantyType} from bill date
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : existingWarranty ? 'Update Warranty' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
