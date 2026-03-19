export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const generateBillId = () =>
  'BILL-' + Date.now().toString(36).toUpperCase();

export const isOverdue = (dueDate, status) => {
  if (status === 'paid') return false;
  return new Date(dueDate) < new Date();
};

export const getBillStatus = (bill) => {
  if (bill.status === 'paid') return 'paid';
  if (isOverdue(bill.dueDate, bill.status)) return 'overdue';
  return bill.status;
};
