const today = new Date();
const addDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const subDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const initialBills = [
  {
    id: 'BILL-001',
    billNumber: 'INV-2024-001',
    customerName: 'Rajesh Kumar',
    customerEmail: 'rajesh@example.com',
    customerPhone: '9876543210',
    issueDate: subDays(30),
    dueDate: subDays(5),
    status: 'unpaid',
    items: [
      { id: 1, description: 'Web Development Services', quantity: 1, rate: 50000, amount: 50000 },
      { id: 2, description: 'UI/UX Design', quantity: 1, rate: 20000, amount: 20000 },
    ],
    subtotal: 70000,
    tax: 12600,
    total: 82600,
    notes: 'Payment due within 30 days.',
  },
  {
    id: 'BILL-002',
    billNumber: 'INV-2024-002',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@techcorp.in',
    customerPhone: '9123456789',
    issueDate: subDays(15),
    dueDate: addDays(15),
    status: 'unpaid',
    items: [
      { id: 1, description: 'Server Maintenance', quantity: 3, rate: 5000, amount: 15000 },
      { id: 2, description: 'SSL Certificate', quantity: 1, rate: 8000, amount: 8000 },
    ],
    subtotal: 23000,
    tax: 4140,
    total: 27140,
    notes: '',
  },
  {
    id: 'BILL-003',
    billNumber: 'INV-2024-003',
    customerName: 'Amit Patel',
    customerEmail: 'amit.patel@gmail.com',
    customerPhone: '9988776655',
    issueDate: subDays(45),
    dueDate: subDays(15),
    status: 'paid',
    items: [
      { id: 1, description: 'Mobile App Development', quantity: 1, rate: 120000, amount: 120000 },
    ],
    subtotal: 120000,
    tax: 21600,
    total: 141600,
    notes: 'Thank you for your business!',
  },
  {
    id: 'BILL-004',
    billNumber: 'INV-2024-004',
    customerName: 'Sunita Verma',
    customerEmail: 'sunita.v@enterprise.com',
    customerPhone: '8765432109',
    issueDate: subDays(10),
    dueDate: addDays(20),
    status: 'unpaid',
    items: [
      { id: 1, description: 'Cloud Setup & Migration', quantity: 1, rate: 35000, amount: 35000 },
      { id: 2, description: 'Training Sessions', quantity: 5, rate: 3000, amount: 15000 },
    ],
    subtotal: 50000,
    tax: 9000,
    total: 59000,
    notes: 'Inclusive of all applicable taxes.',
  },
  {
    id: 'BILL-005',
    billNumber: 'INV-2024-005',
    customerName: 'Vikram Singh',
    customerEmail: 'vikram.s@startup.io',
    customerPhone: '7654321098',
    issueDate: subDays(60),
    dueDate: subDays(30),
    status: 'paid',
    items: [
      { id: 1, description: 'SEO & Marketing Package', quantity: 1, rate: 25000, amount: 25000 },
      { id: 2, description: 'Content Writing (10 articles)', quantity: 10, rate: 1500, amount: 15000 },
    ],
    subtotal: 40000,
    tax: 7200,
    total: 47200,
    notes: '',
  },
];
