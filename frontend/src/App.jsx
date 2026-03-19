import { useState, useEffect } from 'react'
import { auth as authApi, company as coApi } from './utils/api'
import LoginPage from './components/LoginPage'
import Sidebar   from './components/Sidebar'
import {
  Dashboard, BillForm, PurchaseForm, ListPage,
  CustomersPage, ProductsPage, StockPage, ReportsPage, SettingsPage
} from './pages/index.jsx'

export default function App() {
  const [user,    setUser]    = useState(() => authApi.getStoredUser())
  const [company, setCompany] = useState(() => { try { return JSON.parse(localStorage.getItem('sf_company') || 'null') } catch { return null } })
  const [page,    setPage]    = useState('dashboard')

  // Load company whenever user logs in
  useEffect(() => {
    if (!user) return
    coApi.get()
      .then(c => { setCompany(c); localStorage.setItem('sf_company', JSON.stringify(c)) })
      .catch(() => {})
  }, [user])

  const handleLogin = (u) => { authApi.setStoredUser(u); setUser(u) }

  const handleLogout = () => {
    authApi.logout()
    authApi.clearStoredUser()
    localStorage.removeItem('sf_company')
    setUser(null); setCompany(null); setPage('dashboard')
  }

  const handleCompanyUpdate = (c) => {
    setCompany(c)
    localStorage.setItem('sf_company', JSON.stringify(c))
  }

  if (!user || !authApi.isLoggedIn()) return <LoginPage onLogin={handleLogin}/>

  const renderPage = () => {
    switch (page) {
      case 'dashboard':     return <Dashboard     setPage={setPage}/>
      case 'new-sale':      return <BillForm       type="sale"      setPage={setPage} company={company}/>
      case 'all-sales':     return <ListPage       type="sales"     setPage={setPage} company={company}/>
      case 'new-purchase':  return <PurchaseForm   setPage={setPage}/>
      case 'all-purchases': return <ListPage       type="purchases" setPage={setPage} company={company}/>
      case 'new-estimate':  return <BillForm       type="estimate"  setPage={setPage} company={company}/>
      case 'all-estimates': return <ListPage       type="estimates" setPage={setPage} company={company}/>
      case 'customers':     return <CustomersPage/>
      case 'add-product':
      case 'all-products':  return <ProductsPage/>
      case 'stock':         return <StockPage/>
      case 'reports':       return <ReportsPage/>
      case 'settings':      return <SettingsPage   onCompanyUpdate={handleCompanyUpdate}/>
      default:              return <Dashboard     setPage={setPage}/>
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        company={company}
        onLogout={handleLogout}
      />
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
