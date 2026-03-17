import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 🧠 SHORTLISTING ENGINE
function runShortlist(students, criteria) {
  const allowedBranches = criteria.allowed_branches
    .split(',').map(b => b.trim().toUpperCase())

  const requiredSkills = criteria.required_skills
    .split(',').map(s => s.trim().toLowerCase())

  return students.filter(student => {
    // Rule 1: CGPA check
    if (student.cgpa < criteria.min_cgpa) return false

    // Rule 2: Branch check
    if (!allowedBranches.includes(student.branch.toUpperCase())) return false

    // Rule 3: At least 1 skill must match
    const studentSkills = student.skills.split(',').map(s => s.trim().toLowerCase())
    const hasSkill = requiredSkills.some(req =>
      studentSkills.some(sk => sk.includes(req) || req.includes(sk))
    )
    if (!hasSkill) return false

    return true
  })
}

export default function Shortlist() {
  const [shortlisted, setShortlisted] = useState([])
  const [allCount, setAllCount] = useState(0)
  const [criteria, setCriteria] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: students }, { data: crit }] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('criteria').select('*').single()
      ])

      if (students && crit) {
        setAllCount(students.length)
        setCriteria(crit)
        setShortlisted(runShortlist(students, crit))
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="text-center mt-16 text-gray-500 text-lg">Running shortlisting engine...</div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-1">Shortlisted Candidates</h2>
        <p className="text-gray-500 text-sm">
          Showing <span className="font-bold text-green-600">{shortlisted.length}</span> shortlisted
          out of <span className="font-bold">{allCount}</span> total applicants
        </p>

        {criteria && (
          <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
            <p>📊 <strong>Min CGPA:</strong> {criteria.min_cgpa}</p>
            <p>🏫 <strong>Branches:</strong> {criteria.allowed_branches}</p>
            <p>💡 <strong>Skills (any 1):</strong> {criteria.required_skills}</p>
          </div>
        )}
      </div>

      {/* Candidate Cards */}
      {shortlisted.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
          No candidates match the current criteria yet.
        </div>
      ) : (
        shortlisted.map((s, i) => (
          <div key={s.id} className="bg-white rounded-2xl shadow p-6 flex items-start gap-4">
            <div className="bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{s.name}</h3>
                  <p className="text-gray-500 text-sm">{s.email}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  ✓ Shortlisted
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="bg-gray-100 px-3 py-1 rounded-full">🎓 {s.branch}</span>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">⭐ CGPA: {s.cgpa}</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">💼 {s.skills}</span>
              </div>
              
                <a href={s.resume_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-blue-600 text-sm hover:underline"
                >
                📄 View Resume →
            </a>
            </div>
          </div>
        ))
      )}
    </div>
  )
}