import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBills } from '../context/BillContext';

const TAX_RATE = 0.18;

const emptyItem = () => ({
  id: Date.now(),
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
});

const today = new Date().toISOString().split('T')[0];
const thirtyDaysLater = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const emptyForm = () => ({
  billNumber:
    'INV-' +
    Date.now().toString().slice(-6) +
    '-' +
    Math.random().toString(36).slice(2, 5).toUpperCase(),
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  issueDate: today,
  dueDate: thirtyDaysLater(),
  status: 'unpaid',
  items: [emptyItem()],
  notes: '',
});

export default function BillForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bills, addBill, updateBill } = useBills();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(() => {
    if (isEdit) {
      const existing = bills.find((b) => b.id === id);
      return existing ?? emptyForm();
    }
    return emptyForm();
  });
  const [errors, setErrors] = useState({});

  const updateItem = (idx, field, value) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.amount = parseFloat(updated.quantity || 0) * parseFloat(updated.rate || 0);
      }
      return updated;
    });
    setForm((f) => ({ ...f, items }));
  };

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));

  const removeItem = (idx) =>
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.customerEmail.trim()) e.customerEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      e.customerEmail = 'Invalid email address';
    if (!form.billNumber.trim()) e.billNumber = 'Bill number is required';
    if (!form.issueDate) e.issueDate = 'Issue date is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (form.items.every((i) => !i.description.trim()))
      e.items = 'At least one item with a description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form, subtotal, tax, total };
    if (isEdit) {
      updateBill(payload);
    } else {
      addBill(payload);
    }
    navigate('/bills');
  };

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Bill' : 'New Bill'}
        </h2>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update the bill details below.' : 'Fill in the details to create a new bill.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bill Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Bill Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bill Number *</label>
              <input
                className={inputClass}
                value={form.billNumber}
                onChange={(e) => setForm((f) => ({ ...f, billNumber: e.target.value }))}
              />
              {errors.billNumber && <p className={errorClass}>{errors.billNumber}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Issue Date *</label>
              <input
                type="date"
                className={inputClass}
                value={form.issueDate}
                onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
              />
              {errors.issueDate && <p className={errorClass}>{errors.issueDate}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Due Date *</label>
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
              {errors.dueDate && <p className={errorClass}>{errors.dueDate}</p>}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Customer Name *</label>
              <input
                className={inputClass}
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              />
              {errors.customerName && <p className={errorClass}>{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                className={inputClass}
                placeholder="customer@example.com"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              />
              {errors.customerEmail && <p className={errorClass}>{errors.customerEmail}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                className={inputClass}
                placeholder="Phone number"
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Items</h3>
          {errors.items && <p className={`${errorClass} mb-2`}>{errors.items}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="pb-2 text-left pr-3">Description</th>
                  <th className="pb-2 text-right w-20 pr-3">Qty</th>
                  <th className="pb-2 text-right w-28 pr-3">Rate (₹)</th>
                  <th className="pb-2 text-right w-28 pr-3">Amount (₹)</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {form.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3">
                      <input
                        className={inputClass}
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="1"
                        className={`${inputClass} text-right`}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        className={`${inputClass} text-right`}
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-700 font-medium">
                      ₹{(parseFloat(item.amount) || 0).toFixed(2)}
                    </td>
                    <td className="py-2">
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-400 hover:text-red-600 text-lg"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            + Add Item
          </button>

          {/* Totals */}
          <div className="mt-4 border-t pt-4 space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-base border-t pt-2">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Notes</h3>
          <textarea
            className={`${inputClass} h-24 resize-none`}
            placeholder="Additional notes for the customer..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {isEdit ? 'Update Bill' : 'Create Bill'}
          </button>
        </div>
      </form>
    </div>
  );
}
