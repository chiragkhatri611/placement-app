export default async (req) => {
  try {
    const body = await req.json()
    const { resumeText, criteria } = body

    if (!resumeText || !criteria) {
      return new Response(JSON.stringify({ error: 'Missing resumeText or criteria' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const prompt = `You are an expert HR recruiter. Analyze this resume against the job description and return a JSON score.

JOB DESCRIPTION:
- Role: ${criteria.jd_role}
- Description: ${criteria.jd_description}
- Required Skills: ${criteria.jd_required_skills}
- Experience Required: ${criteria.jd_experience_years} years

SCORING WEIGHTS:
- Skills Match: ${criteria.weight_skills}%
- CGPA/Academics: ${criteria.weight_cgpa}%
- Experience: ${criteria.weight_experience}%
- Projects: ${criteria.weight_projects}%

RESUME TEXT:
${resumeText.slice(0, 3000)}

Return ONLY a raw JSON object with no markdown formatting:
{
  "total_score": <number 1-100>,
  "skills_score": <number>,
  "experience_score": <number>,
  "academics_score": <number>,
  "projects_score": <number>,
  "extracted_skills": "<comma-separated skills found in resume>",
  "extracted_experience": "<brief experience summary>",
  "extracted_education": "<most recent degree, college, and CGPA only>",
  "latest_cgpa": <extract the most recent/latest CGPA as a number, e.g. 8.5>,
  "shortlist_reason": "<2-3 sentence explanation of score>",
  "missing_skills": "<skills from JD not found in resume>"
}`

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are an HR recruiter. Always respond with valid raw JSON only. No markdown, no explanation outside JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return new Response(JSON.stringify({ error: `Groq API error: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const aiData = await aiResponse.json()
    const text = aiData.choices?.[0]?.message?.content || '{}'
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/score-resume' }