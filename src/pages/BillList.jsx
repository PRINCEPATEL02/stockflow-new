import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBills } from '../context/BillContext';
import { formatCurrency, getBillStatus } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

const FILTERS = ['all', 'paid', 'unpaid', 'overdue'];

export default function BillList() {
  const { bills, deleteBill, markPaid } = useBills();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const filtered = bills.filter((bill) => {
    const status = getBillStatus(bill);
    const matchFilter = filter === 'all' || status === filter;
    const matchSearch =
      bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const confirmDelete = (id) => setDeleteId(id);
  const handleDelete = () => {
    deleteBill(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Bills</h2>
          <p className="text-gray-500 mt-1">{bills.length} total bills</p>
        </div>
        <Link
          to="/bills/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Bill
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by bill number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-medium">No bills found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Bill #</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Issue Date</th>
                  <th className="px-6 py-3 text-left">Due Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        to={`/bills/${bill.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {bill.billNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-800">{bill.customerName}</div>
                      <div className="text-xs text-gray-400">{bill.customerEmail}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{bill.issueDate}</td>
                    <td className="px-6 py-3 text-gray-500">{bill.dueDate}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                      {formatCurrency(bill.total)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <StatusBadge status={getBillStatus(bill)} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/bills/${bill.id}`}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View"
                        >
                          👁
                        </Link>
                        <Link
                          to={`/bills/${bill.id}/edit`}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </Link>
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => markPaid(bill.id)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Mark as Paid"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(bill.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Bill</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this bill? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
