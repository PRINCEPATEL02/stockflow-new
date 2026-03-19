import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBills } from '../context/BillContext';
import { formatCurrency, formatDate, getBillStatus } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bills, markPaid, deleteBill } = useBills();

  const bill = bills.find((b) => b.id === id);
  if (!bill) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-xl">Bill not found.</p>
        <Link to="/bills" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to Bills
        </Link>
      </div>
    );
  }

  const status = getBillStatus(bill);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      deleteBill(bill.id);
      navigate('/bills');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-gray-800">{bill.billNumber}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="text-gray-500">Issued on {formatDate(bill.issueDate)}</p>
        </div>
        <div className="flex gap-2">
          {bill.status !== 'paid' && (
            <button
              onClick={() => markPaid(bill.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              Mark as Paid
            </button>
          )}
          <Link
            to={`/bills/${bill.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors border border-red-200"
          >
            Delete
          </button>
          <Link
            to="/bills"
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Customer</h3>
          <p className="font-medium text-gray-800">{bill.customerName}</p>
          <p className="text-sm text-gray-500 mt-1">{bill.customerEmail}</p>
          {bill.customerPhone && (
            <p className="text-sm text-gray-500">{bill.customerPhone}</p>
          )}
        </div>

        {/* Bill Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Bill Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bill Number</span>
              <span className="font-medium text-gray-800">{bill.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Issue Date</span>
              <span className="text-gray-700">{formatDate(bill.issueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date</span>
              <span className="text-gray-700">{formatDate(bill.dueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Rate</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bill.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3 text-gray-700">{item.description}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-800">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-100">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-gray-500">
                  Subtotal
                </td>
                <td className="px-6 py-3 text-right text-gray-700">
                  {formatCurrency(bill.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-gray-500">
                  Tax (18%)
                </td>
                <td className="px-6 py-3 text-right text-gray-700">
                  {formatCurrency(bill.tax)}
                </td>
              </tr>
              <tr className="bg-indigo-50">
                <td
                  colSpan={3}
                  className="px-6 py-3 text-right font-semibold text-gray-800"
                >
                  Total
                </td>
                <td className="px-6 py-3 text-right font-bold text-indigo-600 text-base">
                  {formatCurrency(bill.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{bill.notes}</p>
        </div>
      )}
    </div>
  );
}
