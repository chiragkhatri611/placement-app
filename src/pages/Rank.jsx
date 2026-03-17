import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ScoreBar({ score }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
  return <span className={`${color} font-bold px-3 py-1 rounded-full text-sm`}>{score}/100</span>
}

// Eligibility filter — same logic as shortlist page
function passesEligibility(student, criteria) {
  if (!criteria) return true
  const allowedBranches = criteria.allowed_branches.split(',').map(b => b.trim().toUpperCase())
  const requiredSkills = criteria.required_skills.split(',').map(s => s.trim().toLowerCase())
  if (student.cgpa < criteria.min_cgpa) return false
  if (!allowedBranches.includes(student.branch.toUpperCase())) return false
  const studentSkills = (student.extracted_skills || student.skills || '').split(',').map(s => s.trim().toLowerCase())
  const hasSkill = requiredSkills.some(req => studentSkills.some(sk => sk.includes(req) || req.includes(sk)))
  if (!hasSkill) return false
  return true
}

export default function Rank() {
  const [students, setStudents] = useState([])
  const [criteria, setCriteria] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('students').select('*').order('ai_score', { ascending: false }),
      supabase.from('criteria').select('*').single()
    ])
    setStudents(s || [])
    setCriteria(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Apply eligibility filter + AI threshold together
  const eligible = students.filter(s => passesEligibility(s, criteria))
  const shortlisted = eligible.filter(s => s.ai_score >= (criteria?.ai_shortlist_threshold || 60))
  const rejected = eligible.filter(s => s.ai_score < (criteria?.ai_shortlist_threshold || 60))
  const ineligible = students.filter(s => !passesEligibility(s, criteria))

  const filtered =
    filter === 'shortlisted' ? shortlisted :
    filter === 'rejected'    ? rejected :
    filter === 'ineligible'  ? ineligible :
    students

  const handleDeleteAll = async () => {
    setDeleting(true)
    await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setStudents([])
    setDeleting(false)
    setShowDeleteModal(false)
  }

  if (loading) return <div className="text-center mt-16 text-gray-500 text-lg">Loading AI Rankings...</div>

  return (
    <div className="space-y-4">

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete All Records?</h3>
              <p className="text-gray-500 text-sm mb-6">
                This will permanently delete all <strong>{students.length}</strong> student records.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-1">AI Resume Rankings</h2>
            {criteria && (
              <p className="text-gray-500 text-sm">
                Role: <strong>{criteria.jd_role}</strong> &nbsp;|&nbsp;
                Min CGPA: <strong>{criteria.min_cgpa}</strong> &nbsp;|&nbsp;
                Threshold: <strong className="text-green-600">{criteria.ai_shortlist_threshold}/100</strong>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={students.length === 0}
            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition disabled:opacity-40"
          >
            Delete All
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-600">{shortlisted.length}</p>
            <p className="text-xs text-gray-500">Shortlisted</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-red-500">{ineligible.length}</p>
            <p className="text-xs text-gray-500">Ineligible</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-yellow-600">
              {students.length ? Math.round(students.reduce((a, s) => a + (s.ai_score || 0), 0) / students.length) : 0}
            </p>
            <p className="text-xs text-gray-500">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',         label: 'All',        count: students.length },
          { key: 'shortlisted', label: 'Shortlisted', count: shortlisted.length },
          { key: 'rejected',    label: 'Not Shortlisted', count: rejected.length },
          { key: 'ineligible',  label: 'Ineligible', count: ineligible.length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f.key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Rank Cards */}
      {filtered.map((s, i) => {
        const eligible = passesEligibility(s, criteria)
        const isShortlisted = eligible && s.ai_score >= (criteria?.ai_shortlist_threshold || 60)

        return (
          <div key={s.id} className={`bg-white rounded-2xl shadow p-5 ${!eligible ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0
                ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-blue-100 text-blue-700'}`}>
                #{i + 1}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{s.name}</h3>
                    <p className="text-gray-400 text-sm">{s.email} | {s.branch} | CGPA: {s.cgpa}</p>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <ScoreBadge score={s.ai_score || 0} />
                    {!eligible ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
                        Ineligible
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isShortlisted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                        {isShortlisted ? 'Shortlisted' : 'Not Shortlisted'}
                      </span>
                    )}
                  </div>
                </div>

                <ScoreBar score={s.ai_score || 0} />

                {s.extracted_skills && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.extracted_skills.split(',').slice(0, 5).map(sk => (
                      <span key={sk} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{sk.trim()}</span>
                    ))}
                  </div>
                )}

                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="mt-2 text-blue-600 text-xs hover:underline">
                  {expanded === s.id ? 'Hide Details ▲' : 'View AI Analysis ▼'}
                </button>

                {expanded === s.id && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Education', value: s.extracted_education },
                        { label: 'Experience', value: s.extracted_experience },
                      ].map(r => r.value && (
                        <div key={r.label} className="bg-white rounded-lg p-3 border">
                          <p className="text-xs text-gray-400 font-medium">{r.label}</p>
                          <p className="text-gray-700 mt-0.5">{r.value}</p>
                        </div>
                      ))}
                    </div>
                    {!eligible && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <p className="text-xs text-red-400 font-medium mb-1">Ineligibility Reason</p>
                        <p className="text-red-600 text-xs">
                          {s.cgpa < criteria.min_cgpa ? `CGPA ${s.cgpa} is below minimum ${criteria.min_cgpa}. ` : ''}
                          {!criteria.allowed_branches.toUpperCase().includes(s.branch.toUpperCase()) ? `Branch ${s.branch} not in allowed list. ` : ''}
                        </p>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-400 font-medium mb-1">AI Reasoning</p>
                      <p className="text-gray-700">{s.ai_explanation || 'No explanation available.'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
          No candidates found.
        </div>
      )}
    </div>
  )
}