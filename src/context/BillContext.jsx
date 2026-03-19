/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from 'react';
import { initialBills } from '../utils/sampleData';
import { generateBillId } from '../utils/helpers';

export const BillContext = createContext(null);

const billReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_BILL':
      return { ...state, bills: [action.payload, ...state.bills] };
    case 'UPDATE_BILL':
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BILL':
      return {
        ...state,
        bills: state.bills.filter((b) => b.id !== action.payload),
      };
    case 'MARK_PAID':
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload ? { ...b, status: 'paid' } : b
        ),
      };
    default:
      return state;
  }
};

export const BillProvider = ({ children }) => {
  const [state, dispatch] = useReducer(billReducer, { bills: initialBills });

  const addBill = (billData) => {
    const bill = { ...billData, id: generateBillId() };
    dispatch({ type: 'ADD_BILL', payload: bill });
    return bill.id;
  };

  const updateBill = (bill) => {
    dispatch({ type: 'UPDATE_BILL', payload: bill });
  };

  const deleteBill = (id) => {
    dispatch({ type: 'DELETE_BILL', payload: id });
  };

  const markPaid = (id) => {
    dispatch({ type: 'MARK_PAID', payload: id });
  };

  return (
    <BillContext.Provider
      value={{ bills: state.bills, addBill, updateBill, deleteBill, markPaid }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBills = () => {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBills must be used within BillProvider');
  return ctx;
};
