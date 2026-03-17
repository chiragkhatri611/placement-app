import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { extractTextFromPDF } from '../lib/pdfExtract'
import { scoreResumeWithAI } from '../lib/aiScore'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL']

const initialForm = {
  name: '', email: '', branch: 'CSE'
}

const initialErrors = {
  name: '', email: '', resume: ''
}

export default function StudentForm() {
  const [form, setForm]       = useState(initialForm)
  const [errors, setErrors]   = useState(initialErrors)
  const [pdfFile, setPdfFile] = useState(null)
  const [status, setStatus]   = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [touched, setTouched] = useState({})

  // ── Validators ───────────────────────────────────────────────
  function validateField(name, value) {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required.'
        if (value.trim().length < 3) return 'Name must be at least 3 characters.'
        if (value.trim().length > 60) return 'Name must be under 60 characters.'
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, or . \' -'
        return ''

      case 'email':
        if (!value.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.'
        return ''

      case 'cgpa':
        if (value === '' || value === null) return 'CGPA is required.'
        const num = parseFloat(value)
        if (isNaN(num)) return 'CGPA must be a number.'
        if (num < 0 || num > 10) return 'CGPA must be between 0 and 10.'
        if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'CGPA can have at most 2 decimal places.'
        return ''
        
        case 'skills': {
            if (!value.trim()) return 'Please enter at least one skill.'
            const skillList = value.split(',').map(s => s.trim()).filter(Boolean)
            if (skillList.length < 1) return 'Enter at least 1 skill.'
            if (skillList.length > 15) return 'Maximum 15 skills allowed.'
            return ''
        }

      default:
        return ''
    }
  }

  function validateResume(file) {
    if (!file) return 'Please upload your resume.'
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (file.size > 5 * 1024 * 1024) return 'File size must be under 5MB.'
    return ''
  }

function validateAll() {
  const newErrors = {
    name:   validateField('name',  form.name),
    email:  validateField('email', form.email),
    resume: validateResume(pdfFile),
  }
  setErrors(newErrors)
  setTouched({ name: true, email: true, resume: true })
  return Object.values(newErrors).every(e => e === '')
}

  // ── Handlers ─────────────────────────────────────────────────
  const handle = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = e => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleFile = e => {
    const file = e.target.files[0] || null
    setPdfFile(file)
    setTouched(prev => ({ ...prev, resume: true }))
    setErrors(prev => ({ ...prev, resume: validateResume(file) }))
  }

  // ── Submit ────────────────────────────────────────────────────
const submit = async e => {
  e.preventDefault()
  setTouched({ name: true, email: true, resume: true })
  if (!validateAll()) return

  setLoading(true)
  setStatus('')

  try {
    // Step 1: Extract PDF
    setProgress('📄 Extracting resume text...')
    const resumeText = await extractTextFromPDF(pdfFile)
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Could not extract text from PDF. Make sure it is not a scanned image.')
    }

    // Step 2: Fetch criteria
    setProgress('🔍 Fetching job criteria...')
    const { data: criteria, error: cErr } = await supabase.from('criteria').select('*').single()
    if (cErr) throw new Error('Could not load criteria. Contact admin.')

    // Step 3: AI Score + extract CGPA & Skills from resume
    setProgress('🤖 AI is reading and scoring your resume...')
    const aiResult = await scoreResumeWithAI({ resumeText, criteria })

    // ── Extract CGPA from resume text ─────────────────────────
    // Find all CGPA/GPA patterns in resume
    const cgpaMatches = [...resumeText.matchAll(
        /(?:cgpa|gpa|c\.g\.p\.a|grade point)[^\d]{0,10}(\d+\.?\d*)/gi
    )]
        const allCGPAs = cgpaMatches
        .map(m => parseFloat(m[1]))
        .filter(n => n >= 4.0 && n <= 10.0)

    // Use regex result, fallback to AI-extracted latest_cgpa
    const resumeCGPA = allCGPAs.length > 0
        ? allCGPAs[allCGPAs.length - 1]
        : aiResult.latest_cgpa || null

    if (!resumeCGPA) {
      throw new Error('Could not find CGPA in your resume. Please make sure your resume clearly mentions your CGPA.')
    }

    // ── Extract Skills from AI result ─────────────────────────
    const finalSkills = aiResult.extracted_skills || ''
    if (!finalSkills || finalSkills.trim().length < 2) {
      throw new Error('Could not extract skills from your resume. Please make sure your resume has a skills section.')
    }

    // ── Check eligibility ─────────────────────────────────────
    const minCGPA = parseFloat(criteria.min_cgpa)
    const allowedBranches = criteria.allowed_branches.split(',').map(b => b.trim().toUpperCase())

    if (resumeCGPA < minCGPA) {
      throw new Error(`Your resume CGPA (${resumeCGPA}) does not meet the minimum requirement of ${minCGPA}.`)
    }
    if (!allowedBranches.includes(form.branch.toUpperCase())) {
      throw new Error(`Branch ${form.branch} is not eligible for this role.`)
    }

    // Step 4: Save
    setProgress('💾 Saving your application...')
    const { error: dbErr } = await supabase.from('students').insert([{
      name:                 form.name.trim(),
      email:                form.email.trim().toLowerCase(),
      branch:               form.branch,
      cgpa:                 resumeCGPA,
      skills:               finalSkills,
      resume_link:          '',
      resume_text:          resumeText.slice(0, 5000),
      extracted_skills:     finalSkills,
      extracted_experience: aiResult.extracted_experience || '',
      extracted_education:  aiResult.extracted_education  || '',
      ai_score:             aiResult.total_score          || 0,
      ai_explanation:       aiResult.shortlist_reason     || '',
      ai_shortlisted:       (aiResult.total_score || 0) >= (criteria?.ai_shortlist_threshold || 60),
    }])

    if (dbErr) {
      if (dbErr.code === '23505') throw new Error('This email is already registered.')
      throw new Error(dbErr.message)
    }

    setStatus(
      `✅ Application submitted! Resume CGPA: ${resumeCGPA} | AI Score: ${aiResult.total_score}/100`
    )
    setForm(initialForm)
    setPdfFile(null)
    setTouched({})
    setErrors(initialErrors)
    document.getElementById('resume-input').value = ''

  } catch (err) {
    setStatus(`❌ ${err.message}`)
  }

  setProgress('')
  setLoading(false)
}

  // ── Field config ──────────────────────────────────────────────
  const fields = [
    {
        label: 'Full Name',
        name: 'name',
        type: 'text',
        placeholder: 'e.g. John Doe',
        hint: "Letters, spaces, or . ' - only"
    },
    {
        label: 'Email Address',
        name: 'email',
        type: 'email',
        placeholder: 'e.g. john@college.edu',
        hint: 'Use your official college email'
    },
    ]

  // ── UI helpers ────────────────────────────────────────────────
  const inputClass = (name) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition
     ${errors[name] && touched[name]
       ? 'border-red-400 focus:ring-red-300 bg-red-50'
       : touched[name] && !errors[name]
         ? 'border-green-400 focus:ring-green-300 bg-green-50'
         : 'border-gray-300 focus:ring-blue-500'}`

  const FieldIcon = ({ name }) => {
    if (!touched[name]) return null
    return errors[name]
      ? <span className="absolute right-3 top-2.5 text-red-400 text-sm">✗</span>
      : <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>
  }

  return (
    <div className="bg-white rounded-2xl shadow p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-700 mb-1">Student Registration</h2>
      <p className="text-gray-400 text-sm mb-6">Fill all fields carefully. Your resume will be scored by AI.</p>

      <form onSubmit={submit} noValidate className="space-y-5">

        {/* Text fields */}
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                name={f.name}
                type={f.type}
                value={form[f.name]}
                placeholder={f.placeholder}
                onChange={handle}
                onBlur={handleBlur}
                step={f.step} min={f.min} max={f.max}
                className={inputClass(f.name)}
              />
              <FieldIcon name={f.name} />
            </div>
            {errors[f.name] && touched[f.name] ? (
              <p className="text-red-500 text-xs mt-1">⚠ {errors[f.name]}</p>
            ) : (
              <p className="text-gray-400 text-xs mt-1">{f.hint}</p>
            )}
          </div>
        ))}

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch <span className="text-red-400">*</span>
          </label>
          <select
            name="branch" value={form.branch} onChange={handle}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        {/* Resume Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume <span className="text-red-400">*</span>
          </label>
          <div className={`border-2 border-dashed rounded-lg p-4 text-center transition
            ${errors.resume && touched.resume
              ? 'border-red-400 bg-red-50'
              : pdfFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400'}`}>
            <input
              id="resume-input"
              type="file"
              accept=".pdf"
              onChange={handleFile}
              className="hidden"
            />
            <label htmlFor="resume-input" className="cursor-pointer">
              {pdfFile ? (
                <div>
                  <p className="text-green-600 font-medium text-sm">✓ {pdfFile.name}</p>
                  <p className="text-green-500 text-xs mt-1">
                    {(pdfFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-2">📄</p>
                  <p className="text-blue-600 font-medium text-sm">Click to upload PDF</p>
                  <p className="text-gray-400 text-xs mt-1">PDF only, max 5MB</p>
                </div>
              )}
            </label>
          </div>
          {errors.resume && touched.resume && (
            <p className="text-red-500 text-xs mt-1">⚠ {errors.resume}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 text-sm"
        >
          {loading ? (progress || 'Processing...') : 'Submit Application'}
        </button>


        {/* {loading && progress && (
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700 text-center animate-pulse">
            {progress}
          </div>
        )} */}
      </form>

      {/* Final status */}
      {status && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium
          ${status.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {status}
        </div>
      )}
    </div>
  )
}