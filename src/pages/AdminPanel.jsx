import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL']

export default function AdminPanel() {
  const navigate = useNavigate()
  const [criteria, setCriteria] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const totalWeights = criteria
    ? Number(criteria.weight_cgpa) + Number(criteria.weight_skills) +
      Number(criteria.weight_experience) + Number(criteria.weight_projects)
    : 0

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) { navigate('/admin'); return }
    supabase.from('criteria').select('*').single().then(({ data }) => {
      if (data) setCriteria(data)
      setLoading(false)
    })
  }, [])

  const save = async e => {
    e.preventDefault()
    if (totalWeights !== 100) {
      setStatus('❌ Weights must add up to exactly 100%')
      return
    }
    const { error } = await supabase.from('criteria').update({
      min_cgpa: parseFloat(criteria.min_cgpa),
      allowed_branches: criteria.allowed_branches,
      required_skills: criteria.required_skills,
      jd_role: criteria.jd_role,
      jd_description: criteria.jd_description,
      jd_required_skills: criteria.jd_required_skills,
      jd_experience_years: parseFloat(criteria.jd_experience_years),
      weight_cgpa: parseFloat(criteria.weight_cgpa),
      weight_skills: parseFloat(criteria.weight_skills),
      weight_experience: parseFloat(criteria.weight_experience),
      weight_projects: parseFloat(criteria.weight_projects),
      ai_shortlist_threshold: parseFloat(criteria.ai_shortlist_threshold),
    }).eq('id', criteria.id)

    setStatus(error ? `❌ ${error.message}` : '✅ Saved! New applicants will use updated criteria.')
  }

  const upd = (k, v) => setCriteria(prev => ({ ...prev, [k]: v }))

  if (loading || !criteria) return <p className="text-center mt-10 text-gray-500">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* JD Section */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Job Description (JD)</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Role / Title</label>
            <input value={criteria.jd_role || ''} onChange={e => upd('jd_role', e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea value={criteria.jd_description || ''} onChange={e => upd('jd_description', e.target.value)}
              rows={3} placeholder="Describe the role, responsibilities..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
            <input value={criteria.jd_required_skills || ''} onChange={e => upd('jd_required_skills', e.target.value)}
              placeholder="React, Node.js, Python, SQL"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Experience (years)</label>
            <input type="number" min="0" step="0.5" value={criteria.jd_experience_years || 0}
              onChange={e => upd('jd_experience_years', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* AI Score Weights */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">AI Scoring Weights</h2>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${totalWeights === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            Total: {totalWeights}% {totalWeights === 100 ? '✓' : '(must = 100)'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Set how much each factor matters for AI scoring. Must add up to 100%.</p>

        {[
          { key: 'weight_skills', label: 'Skills Match', color: 'blue', tip: 'How well resume skills match JD skills' },
          { key: 'weight_cgpa', label: 'CGPA / Academics', color: 'yellow', tip: 'Academic performance weight' },
          { key: 'weight_experience', label: 'Experience', color: 'green', tip: 'Internships, work experience' },
          { key: 'weight_projects', label: 'Projects', color: 'purple', tip: 'Relevant projects in resume' },
        ].map(w => (
          <div key={w.key} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <div>
                <label className="text-sm font-medium text-gray-700">{w.label}</label>
                <p className="text-xs text-gray-400">{w.tip}</p>
              </div>
              <span className="text-lg font-bold text-gray-700">{criteria[w.key]}%</span>
            </div>
            <input type="range" min="0" max="100" value={criteria[w.key]}
              onChange={e => upd(w.key, e.target.value)}
              className="w-full accent-blue-600" />
          </div>
        ))}
      </div>

      {/* Eligibility Filter */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Eligibility Filter (Pre-screen)</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
            <input type="number" step="0.1" min="0" max="10" value={criteria.min_cgpa}
              onChange={e => upd('min_cgpa', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Branches</label>
            <input value={criteria.allowed_branches} onChange={e => upd('allowed_branches', e.target.value)}
              placeholder="CSE,IT,ECE"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">Available: {BRANCHES.join(', ')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Shortlist Threshold (min score to auto-shortlist)
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={criteria.ai_shortlist_threshold}
                onChange={e => upd('ai_shortlist_threshold', e.target.value)}
                className="flex-1 accent-green-600" />
              <span className="text-lg font-bold text-green-600 w-12">{criteria.ai_shortlist_threshold}</span>
            </div>
            <p className="text-xs text-gray-400">Candidates scoring above this are auto-shortlisted by AI</p>
          </div>
        </div>
      </div>

      <form onSubmit={save}>
        <button type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition text-lg">
          Save All Settings
        </button>
      </form>

      {status && (
        <p className={`text-sm font-medium text-center ${status.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {status}
        </p>
      )}

      <button onClick={() => navigate('/rank')}
        className="w-full bg-blue-100 text-blue-700 py-2 rounded-xl font-semibold hover:bg-blue-200 transition">
        View AI Rankings →
      </button>
    </div>
  )
}