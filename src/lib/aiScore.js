export async function scoreResumeWithAI({ resumeText, criteria }) {
  try {
    const response = await fetch('/api/score-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, criteria })
    })

    const raw = await response.text()
    console.log('AI Function raw response:', raw) // 👈 see exact error

    if (!response.ok) throw new Error(`Function error: ${raw}`)

    const parsed = JSON.parse(raw)
    if (!parsed.total_score) throw new Error('No score in response')

    return parsed

  } catch (err) {
    console.error('AI scoring error:', err)
    throw new Error(err.message) // 👈 bubble up so user sees real error
  }
}