export default function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  };
  const labels = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    draft: 'Draft',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}
