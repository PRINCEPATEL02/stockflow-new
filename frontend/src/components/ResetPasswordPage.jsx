import { useState, useEffect } from 'react'
import { auth as authApi } from '../utils/api'
import { Inp, Btn, Card } from './ui'

export default function ResetPasswordPage() {
  // Set browser tab title
  useEffect(() => {
    document.title = 'StockFlow'
  }, [])
  const token = new URLSearchParams(window.location.search).get('reset_token')
  
  // Redirect to login if no token
  if (!token) {
    window.location.href = '/'
    return null
  }
  const [f, setF] = useState({ password: '', confirmPassword: '' })
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const resetPassword = async () => {
    setErr('')
    if (!f.password || !f.confirmPassword) {
      setErr('Please fill all fields')
      return
    }
    if (f.password.length < 4) {
      setErr('Password must be at least 4 characters')
      return
    }
    if (f.password !== f.confirmPassword) {
      setErr('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, { password: f.password })
      setSuccess(true)
    } catch(e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif"}} className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="p-7 shadow-2xl shadow-black/30 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Password Reset!</h2>
          <p className="text-slate-500 mb-6">Your password has been reset successfully.</p>
          <Btn onClick={() => window.location.href = '/'}>Go to Login</Btn>
        </Card>
      </div>
    )
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
          <h1 className="text-3xl font-black text-white mb-2" style={{fontFamily:"'Syne',sans-serif"}}>
            Reset Password
          </h1>
          <p className="text-slate-400 text-sm">
            Enter your new password below
          </p>
        </div>

        {/* Card */}
        <Card className="p-7 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4">
            {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{err}</div>}
            <Inp label="New Password" type="password" placeholder="Enter new password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
            <Inp label="Confirm Password" type="password" placeholder="Confirm new password" value={f.confirmPassword} onChange={e=>setF({...f,confirmPassword:e.target.value})} onKeyDown={e=>e.key==='Enter'&&resetPassword()}/>
            <Btn onClick={resetPassword} sz="lg" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  )
}
