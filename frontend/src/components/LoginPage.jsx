import { useState } from 'react'
import { auth as authApi } from '../utils/api'
import { Inp, Btn, Card } from './ui'

export default function LoginPage({ onLogin }) {
  const [mode,    setMode]    = useState('login')
  const [f,       setF]       = useState({ username:'', password:'', name:'' })
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const upd = (k,v) => setF(x=>({...x,[k]:v}))

  const submit = async () => {
    setErr(''); setLoading(true)
    try {
      const res = mode === 'register'
        ? await authApi.register({ username: f.username.trim(), password: f.password, name: f.name || f.username })
        : await authApi.login({ username: f.username.trim(), password: f.password })
      authApi.setStoredUser(res.user)
      onLogin(res.user)
    } catch(e) { setErr(e.message) }
    finally    { setLoading(false) }
  }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif"}} className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-violet-500/30">S</div>
            <span className="text-white font-black text-2xl" style={{fontFamily:"'Syne',sans-serif"}}>StockFlow Pro</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{fontFamily:"'Syne',sans-serif"}}>
            {mode==='login' ? 'Welcome back' : 'Get started free'}
          </h1>
          <p className="text-slate-400 text-sm">
            {mode==='login' ? 'Sign in to your private workspace' : 'Create your business account'}
          </p>
        </div>

        {/* Card */}
        <Card className="p-7 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4">
            {mode==='register' && (
              <Inp label="Business / Your Name" placeholder="e.g. Patel Traders" value={f.name} onChange={e=>upd('name',e.target.value)}/>
            )}
            <Inp label="Username" placeholder="Enter username" value={f.username} onChange={e=>upd('username',e.target.value)} autoFocus/>
            <Inp label="Password" type="password" placeholder="Enter password" value={f.password} onChange={e=>upd('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{err}</div>}
            <Btn onClick={submit} sz="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </Btn>
            <p className="text-center text-sm text-slate-500">
              {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="text-violet-600 font-bold hover:underline" onClick={()=>{ setMode(mode==='login'?'register':'login'); setErr('') }}>
                {mode==='login' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          🔒 JWT Auth · MongoDB · Each user sees only their own data
        </p>
      </div>
    </div>
  )
}
