import { useState, useEffect } from 'react'
import { auth as authApi } from '../utils/api'
import { Inp, Btn, Card } from './ui'

export default function LoginPage({ onLogin }) {
  // Set browser tab title
  useEffect(() => {
    document.title = 'StockFlow Pro - Login'
  }, [])
  const [mode,    setMode]    = useState('login')  // login, register, forgot
  const [f,       setF]       = useState({ username:'', password:'', name:'', email:'' })
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const upd = (k,v) => setF(x=>({...x,[k]:v}))

  const submit = async () => {
    if (mode === 'register') {
      if (!f.name?.trim()) return setErr('Business/Your Name is required')
      if (!f.username.trim()) return setErr('Username is required')
      if (!f.password.trim()) return setErr('Password is required')
      if (!f.email?.trim()) return setErr('Email is required')
    }
    setErr(''); setLoading(true)
    try {
      const res = mode === 'register'
        ? await authApi.register({ username: f.username.trim(), password: f.password, name: f.name || f.username, email: f.email?.trim() })
        : await authApi.login({ username: f.username.trim(), password: f.password })
      authApi.setStoredUser(res.user)
      onLogin(res.user)
    } catch(e) { setErr(e.message) }
    finally    { setLoading(false) }
  }

  // const [resetUrl, setResetUrl] = useState('')  // Not needed anymore

  const [resetData, setResetData] = useState(null)

  const sendResetLink = async () => {
    setErr(''); setResetData(null); setLoading(true)
    try {
      // Check if input looks like email
      const input = f.username.trim()
      const isEmail = input.includes('@')
      const payload = isEmail ? { email: input } : { username: input }
      
      const res = await authApi.forgotPassword(payload)
      setSent(true)
      // Store reset data (username + new password) if returned
      if (res.username && res.newPassword) {
        setResetData({ username: res.username, password: res.newPassword })
      }
    } catch(e) { setErr(e.message) }
    finally    { setLoading(false) }
  }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif"}} className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/30">S</div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2" style={{fontFamily:"'Syne',sans-serif"}}>
            StockFlow Pro
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {mode==='login' ? 'Sign in to your account' : mode==='register' ? 'Create your account' : 'Enter your username to reset password'}
          </p>
        </div>

        {/* Card */}
        <Card className="p-7 shadow-xl">
          <div className="flex flex-col gap-4">
            {mode==='register' && (
              <>
                <Inp label="Business / Your Name *" placeholder="e.g. Patel Traders" value={f.name} onChange={e=>upd('name',e.target.value)}/>
                <Inp label="Email *" type="email" placeholder="your@email.com" value={f.email || ''} onChange={e=>upd('email',e.target.value)}/>
              </>
            )}
            
            {mode === 'forgot' ? (
              // Forgot Password Mode
              <>
                {sent ? (
                  <div className="text-center">
                    {resetData ? (
                      // Show username and password directly
                      <div className="bg-violet-50 border border-violet-200 text-violet-800 text-sm px-4 py-4 rounded-xl">
                        <div className="text-lg font-bold mb-3">✅ New Password Generated!</div>
                        <div className="text-left bg-white p-3 rounded-lg border border-violet-100 mb-3">
                          <p className="mb-1"><strong>Username:</strong> <span className="font-mono">{resetData.username}</span></p>
                          <p><strong>Password:</strong> <span className="font-mono font-bold text-lg">{resetData.password}</span></p>
                        </div>
                        <p className="text-xs text-violet-600">Login with these credentials and change password in Settings after login.</p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-4 rounded-xl">
                        ✅ New password has been sent to your email! Check your inbox.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Inp label="Username or Email" placeholder="Enter username or email" value={f.username} onChange={e=>upd('username',e.target.value)} autoFocus/>
                    {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{err}</div>}
                    <Btn onClick={sendResetLink} sz="lg" className="w-full" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Btn>
                  </>
                )}
              </>
            ) : (
              // Login / Register Mode
              <>
                <Inp label="Username" placeholder="Enter username" value={f.username} onChange={e=>upd('username',e.target.value)} autoFocus/>
                <Inp label="Password" type="password" toggle placeholder="Enter password" value={f.password} onChange={e=>upd('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
                {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{err}</div>}
                <Btn onClick={submit} sz="lg" className="w-full" disabled={loading}>
                  {loading ? 'Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
                </Btn>
              </>
            )}

            {/* Toggle Modes */}
            <p className="text-center text-sm text-slate-500">
              {mode==='login' ? "Don't have an account? " : mode==='register' ? 'Already have an account? ' : 'Remember your password? '}
              <button className="text-violet-600 font-bold hover:text-violet-800" onClick={()=>{ setMode(mode==='login'?'register':mode==='register'?'login':'login'); setErr(''); setSent(false) }}>
                {mode==='login' ? 'Create Account' : mode==='register' ? 'Sign In' : 'Sign In'}
              </button>
            </p>

            {/* Forgot Password Link (only in login mode) */}
            {mode==='login' && (
              <p className="text-center text-sm text-slate-400">
                Forgot password? 
                <button className="text-violet-500 font-bold hover:text-violet-700 ml-1" onClick={()=>{ setMode('forgot'); setErr(''); setSent(false) }}>
                  Reset it
                </button>
              </p>
            )}
          </div>
        </Card>

      
      </div>
    </div>
  )
}
