import { Link } from 'react-router-dom';
import { useBills } from '../context/BillContext';
import { formatCurrency, getBillStatus } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-gray-100">
    <div className={`text-3xl p-3 rounded-full ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { bills } = useBills();

  const statusCounts = bills.reduce(
    (acc, bill) => {
      const s = getBillStatus(bill);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { paid: 0, unpaid: 0, overdue: 0 }
  );

  const totalRevenue = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.total, 0);

  const outstanding = bills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.total, 0);

  const recentBills = [...bills].slice(0, 5);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 mt-1">Overview of your billing activity</p>
        </div>
        <Link
          to="/bills/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Bill
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Bills"
          value={bills.length}
          icon="📄"
          color="bg-blue-50"
        />
        <StatCard
          label="Paid"
          value={statusCounts.paid}
          icon="✅"
          color="bg-green-50"
        />
        <StatCard
          label="Unpaid"
          value={statusCounts.unpaid}
          icon="⏳"
          color="bg-yellow-50"
        />
        <StatCard
          label="Overdue"
          value={statusCounts.overdue}
          icon="⚠️"
          color="bg-red-50"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-600 text-white rounded-xl p-6 shadow">
          <p className="text-sm text-indigo-200">Total Revenue Collected</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-6 shadow">
          <p className="text-sm text-orange-100">Total Outstanding Amount</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(outstanding)}</p>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Recent Bills</h3>
          <Link to="/bills" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Bill #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Due Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      to={`/bills/${bill.id}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {bill.billNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{bill.customerName}</td>
                  <td className="px-6 py-3 text-gray-500">{bill.dueDate}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-800">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <StatusBadge status={getBillStatus(bill)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
