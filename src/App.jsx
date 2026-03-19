import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BillProvider } from './context/BillContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BillList from './pages/BillList';
import BillForm from './pages/BillForm';
import BillDetail from './pages/BillDetail';

export default function App() {
  return (
    <BillProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/bills/new" element={<BillForm />} />
            <Route path="/bills/:id" element={<BillDetail />} />
            <Route path="/bills/:id/edit" element={<BillForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BillProvider>
  );
}
