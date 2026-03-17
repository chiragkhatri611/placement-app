import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const login = async e => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('criteria')
      .select('admin_password')
      .single()

    if (error || !data) {
      setError('Could not verify. Try again.')
      return
    }

    if (password === data.admin_password) {
      sessionStorage.setItem('admin', 'true')
      navigate('/panel')
    } else {
      setError('❌ Wrong password.')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-8 max-w-sm mx-auto mt-16">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Admin Login</h2>
      <form onSubmit={login} className="space-y-4">
        <input
          type="password" placeholder="password:admin123"
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Login
        </button>
      </form>
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    </div>
  )
}