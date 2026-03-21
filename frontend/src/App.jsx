import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { auth as authApi } from './utils/api'
import LoginPage from './components/LoginPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import Sidebar from './components/Sidebar'
import { SkeletonStatsGrid } from './components/Skeleton'

// Lazy load pages for code splitting and faster initial load
const Dashboard = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.Dashboard })))
const WarrantyPage = lazy(() => import('./pages/WarrantyPage'))
const BillForm = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.BillForm })))
const PurchaseForm = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.PurchaseForm })))
const ListPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.ListPage })))
const CustomersPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.CustomersPage })))
const ProductsPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.ProductsPage })))
const StockPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.StockPage })))
const ReportsPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.SettingsPage })))
const ProfilePage = lazy(() => import('./pages/index.jsx').then(module => ({ default: module.ProfilePage })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-slate-200 rounded"></div>
        <div className="h-10 w-24 bg-slate-200 rounded"></div>
      </div>
      <SkeletonStatsGrid />
    </div>
  )
}

// Auth guard wrapper
function ProtectedRoute({ children, user }) {
  if (!user || !authApi.isLoggedIn()) {
    return <Navigate to="/" replace />
  }
  return children
}

// Main app content with routing
function AppContent() {
  const navigate = useNavigate()
  const { page: urlPage } = useParams()
  
  // Initialize from URL or default to dashboard
  const [user, setUser] = useState(() => authApi.getStoredUser())
  const [company, setCompany] = useState(() => { 
    try { return JSON.parse(localStorage.getItem('sf_company') || 'null') } 
    catch { return null } 
  })
  const [currentPage, setCurrentPage] = useState(() => urlPage || 'dashboard')
  const [initialized, setInitialized] = useState(false)

  // Sync state with URL on mount
  useEffect(() => {
    if (urlPage && urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
    setInitialized(true)
  }, [urlPage])

  // Check for reset token in URL
  const resetToken = new URLSearchParams(window.location.search).get('reset_token')
  if (resetToken) {
    return <ResetPasswordPage />
  }

  // Load company and user profile whenever user logs in
  useEffect(() => {
    if (!user) return
    import('./utils/api').then(({ company: coApi, auth }) => {
      coApi.get()
        .then(c => { setCompany(c); localStorage.setItem('sf_company', JSON.stringify(c)) })
        .catch(() => {})
      auth.getProfile()
        .then(u => { setUser(u); localStorage.setItem('sf_user', JSON.stringify(u)) })
        .catch(() => {})
    })
  }, [user])

  const handleLogin = (u) => { 
    authApi.setStoredUser(u); 
    setUser(u) 
  }

  const handleLogout = () => {
    authApi.logout()
    authApi.clearStoredUser()
    localStorage.removeItem('sf_company')
    setUser(null); setCompany(null); setCurrentPage('dashboard')
    navigate('/')
  }

  const handleCompanyUpdate = (c) => {
    setCompany(c)
    localStorage.setItem('sf_company', JSON.stringify(c))
  }

  // Page change handler that updates both state and URL
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    if (page === 'dashboard') {
      navigate('/')
    } else {
      navigate(`/${page}`)
    }
  }, [navigate])

  if (!user || !authApi.isLoggedIn()) {
    return <LoginPage onLogin={handleLogin} />
  }
  
  // Redirect to dashboard if on login page but already logged in
  if (currentPage === 'login') {
    navigate('/')
  }

  // Don't render until initialized to prevent flash
  if (!initialized) {
    return <PageLoader />
  }

  const renderPage = () => {
    const page = currentPage
    switch (page) {
      case 'dashboard':     return <Dashboard setPage={handlePageChange}/>
      case 'new-sale':      return <BillForm type="sale" setPage={handlePageChange} company={company}/>
      case 'all-sales':     return <ListPage type="sales" setPage={handlePageChange} company={company}/>
      case 'new-purchase':  return <PurchaseForm setPage={handlePageChange}/>
      case 'all-purchases': return <ListPage type="purchases" setPage={handlePageChange} company={company}/>
      case 'new-estimate':  return <BillForm type="estimate" setPage={handlePageChange} company={company}/>
      case 'all-estimates': return <ListPage type="estimates" setPage={handlePageChange} company={company}/>
      case 'customers':     return <CustomersPage/>
      case 'add-product':
      case 'all-products':  return <ProductsPage/>
      case 'stock':         return <StockPage/>
      case 'reports':       return <ReportsPage/>
      case 'warranty':      return <WarrantyPage/>
      case 'settings':      return <SettingsPage user={user} onUserUpdate={setUser} onCompanyUpdate={handleCompanyUpdate}/>
      case 'profile':       return <ProfilePage user={user} onUserUpdate={setUser}/>
      default:              return <Dashboard setPage={handlePageChange}/>
    }
  }

  return (
    <ProtectedRoute user={user}>
      <div className="bg-slate-50 min-h-screen">
        <Sidebar
          page={currentPage}
          setPage={handlePageChange}
          user={user}
          company={company}
          onLogout={handleLogout}
        />
        <main className="ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <Suspense fallback={<PageLoader />}>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// Root app with browser router
export default function App() {
  // Set browser tab title
  useEffect(() => {
    document.title = 'StockFlow Pro'
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/:page" element={<AppContent />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  )
}
