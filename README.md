# 🎓 PlaceAuto — Campus Placement Automation System

> An AI-powered web application that automates the end-to-end campus placement process — from student registration to intelligent shortlisting — built for a hackathon in under 2 hours.

---


---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [AI Models Used](#ai-models-used)
- [Screenshots](#screenshots)

---

## 📖 Overview

PlaceAuto eliminates manual HR effort in campus placements by automating:
- Student registration with PDF resume upload
- AI-based resume parsing (CGPA + Skills extracted automatically)
- Resume scoring against a Job Description (1–100 score)
- Eligibility filtering based on HR-defined criteria
- Intelligent candidate shortlisting with AI reasoning

The **only thing not automated** is the interview itself.

---

## ✨ Features

### 👨‍🎓 Student Side
| Feature | Description |
|---|---|
| **Smart Registration Form** | Students fill Name, Email, Branch and upload PDF resume |
| **Auto CGPA Extraction** | CGPA is automatically extracted from the resume — students cannot fake it |
| **Auto Skills Extraction** | Skills are extracted by AI from resume content |
| **Real-time Validation** | All fields validated on blur with inline error messages |
| **PDF Upload UI** | Drag-style upload box with file size and type validation (PDF only, max 5MB) |
| **AI Score Display** | After submission, student sees their AI score out of 100 |

### 🤖 AI Engine
| Feature | Description |
|---|---|
| **Resume Scoring (1–100)** | AI scores each resume against the Job Description |
| **Skill Match Analysis** | Semantic matching of resume skills vs JD required skills |
| **Experience Evaluation** | Evaluates internships and work experience from resume |
| **Project Relevance** | Scores projects based on relevance to the role |
| **AI Reasoning** | Generates a 2–3 sentence explanation for every score |
| **Missing Skills Detection** | Lists skills from JD not found in the resume |

### 👔 HR / Admin Side
| Feature | Description |
|---|---|
| **Secure Admin Login** | Password-protected admin panel |
| **Job Description Builder** | HR fills role, description, required skills, experience |
| **AI Scoring Weight Sliders** | HR sets importance of Skills / CGPA / Experience / Projects (must total 100%) |
| **Eligibility Pre-screen** | Set minimum CGPA, allowed branches |
| **AI Shortlist Threshold** | HR sets minimum score (e.g. 60/100) for auto-shortlisting |

### 📊 Rankings Page
| Feature | Description |
|---|---|
| **AI Resume Rankings** | All candidates ranked by AI score (highest first) |
| **Score Progress Bar** | Visual bar colored green/yellow/red based on score |
| **Filter Tabs** | Filter by All / Shortlisted / Not Shortlisted / Ineligible |
| **Expandable AI Analysis** | Click to see education, experience, AI reasoning per candidate |
| **Ineligibility Reason** | Shows exactly why a candidate is ineligible (low CGPA, wrong branch) |
| **Stats Dashboard** | Total applicants, shortlisted count, average score |
| **Delete All Records** | Admin can delete all student records with confirm/cancel popup |

---

## 🛠 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Fast development, instant HMR |
| Styling | Tailwind CSS v3 | Rapid UI without custom CSS |
| Database | Supabase (PostgreSQL) | Free tier, REST API, no backend needed |
| AI Scoring | Groq API (LLaMA 3.3 70B) | Free tier, extremely fast inference |
| PDF Parsing | pdfjs-dist v3.11.174 | Client-side PDF text extraction |
| Serverless | Netlify Functions | Proxy for Groq API (CORS fix) |
| Routing | React Router DOM | SPA routing |
| Deployment | Netlify | Free hosting, Git-based deploy |

---

## 🗄 Database Schema

### `students` table
```sql
id                  uuid PRIMARY KEY
name                text
email               text
branch              text
cgpa                numeric          -- extracted from resume by AI
skills              text             -- extracted from resume by AI
resume_link         text
resume_text         text             -- first 5000 chars of PDF
extracted_skills    text             -- AI parsed skills
extracted_experience text            -- AI parsed experience summary
extracted_education  text            -- AI parsed education
ai_score            numeric          -- score out of 100
ai_explanation      text             -- AI reasoning text
ai_shortlisted      boolean          -- true if score >= threshold
applied_at          timestamp
```

### `criteria` table
```sql
id                      serial PRIMARY KEY
min_cgpa                numeric          -- minimum CGPA filter
allowed_branches        text             -- e.g. "CSE,IT,ECE"
required_skills         text             -- legacy keyword filter
admin_password          text             -- admin login password
jd_role                 text             -- job title
jd_description          text             -- job description
jd_required_skills      text             -- skills for AI matching
jd_experience_years     numeric          -- min experience required
weight_cgpa             numeric          -- scoring weight %
weight_skills           numeric          -- scoring weight %
weight_experience       numeric          -- scoring weight %
weight_projects         numeric          -- scoring weight %
ai_shortlist_threshold  numeric          -- min score to shortlist
```

---

## 📁 Project Structure

```
placement-app/
├── netlify/
│   └── functions/
│       └── score-resume.js       ← Serverless function (Groq API proxy)
├── src/
│   ├── lib/
│   │   ├── supabase.js           ← Supabase client
│   │   ├── pdfExtract.js         ← PDF text extraction using pdfjs
│   │   └── aiScore.js            ← Calls Netlify function for AI scoring
│   ├── pages/
│   │   ├── StudentForm.jsx       ← Student registration + PDF upload
│   │   ├── AdminLogin.jsx        ← Password-protected admin gate
│   │   ├── AdminPanel.jsx        ← JD builder + weight sliders
│   │   └── Rank.jsx              ← AI Rankings dashboard
│   ├── components/
│   │   └── Navbar.jsx            ← Navigation bar
│   ├── App.jsx                   ← Routes
│   ├── main.jsx                  ← Entry point
│   └── index.css                 ← Tailwind imports
├── .env                          ← Local env vars (never commit)
├── .gitignore
├── netlify.toml                  ← Netlify build + functions config
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## ⚙️ How It Works

```
Student uploads PDF resume
        ↓
pdfjs extracts raw text from PDF
        ↓
Text sent to Netlify serverless function
        ↓
Groq API (LLaMA 3.3 70B) analyzes resume vs JD
        ↓
AI returns: score, skills, CGPA, experience, reasoning
        ↓
CGPA cross-verified from resume text using regex
        ↓
Data saved to Supabase students table
        ↓
HR views /rank → candidates sorted by AI score
        ↓
Eligibility filter applied (CGPA + branch + threshold)
        ↓
Shortlisted / Not Shortlisted / Ineligible labels assigned
```

---

## 💻 Running Locally

### Prerequisites
- Node.js v18+
- Netlify CLI
- Supabase account (free)
- Groq API key (free at console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/placement-app.git
cd placement-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file in project root
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
GROQ_API_KEY=your-groq-api-key
```

### 4. Set up Supabase

Run this SQL in **Supabase → SQL Editor**:

```sql
-- Students table
create table students (
  id uuid default gen_random_uuid() primary key,
  name text, email text, branch text, cgpa numeric,
  skills text, resume_link text, resume_text text,
  extracted_skills text, extracted_experience text,
  extracted_education text, ai_score numeric default 0,
  ai_explanation text, ai_shortlisted boolean default false,
  applied_at timestamp default now()
);

-- Criteria table
create table criteria (
  id serial primary key,
  min_cgpa numeric default 7.0,
  allowed_branches text default 'CSE,IT,ECE',
  required_skills text default 'JavaScript,Python,React',
  admin_password text default 'admin123',
  jd_role text default 'Software Engineer',
  jd_description text default '',
  jd_required_skills text default 'JavaScript,Python,React',
  jd_experience_years numeric default 0,
  weight_cgpa numeric default 20,
  weight_skills numeric default 40,
  weight_experience numeric default 25,
  weight_projects numeric default 15,
  ai_shortlist_threshold numeric default 60
);

-- Insert default criteria
insert into criteria (min_cgpa, allowed_branches, required_skills)
values (7.0, 'CSE,IT,ECE', 'JavaScript,Python,React');

-- RLS Policies
alter table students enable row level security;
alter table criteria enable row level security;
create policy "allow insert students" on students for insert to anon with check (true);
create policy "allow read students"  on students for select to anon using (true);
create policy "allow delete students" on students for delete to anon using (true);
create policy "allow read criteria"  on criteria for select to anon using (true);
create policy "allow update criteria" on criteria for update to anon using (true);
```

### 5. Run with Netlify Dev (required for AI scoring)
```bash
netlify dev
```

App runs at `http://localhost:8888`

> ⚠️ Do NOT use `npm run dev` — Netlify functions won't work without `netlify dev`

---

## 🚀 Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "deploy"
git push origin main
```

### 2. Deploy on Netlify
1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from GitHub**
2. Select your repo
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**

### 3. Add Environment Variables in Netlify
> Site Settings → Environment Variables

```
VITE_SUPABASE_URL       = your supabase url
VITE_SUPABASE_ANON_KEY  = your supabase anon key
GROQ_API_KEY            = your groq api key
```

### 4. Trigger Redeploy
> Deploys → Trigger deploy → Deploy site

---

## 🔐 Environment Variables

| Variable | Where to get |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |

---

## 🤖 AI Models Used

| Model | Provider | Used For |
|---|---|---|
| **LLaMA 3.3 70B Versatile** | Groq Cloud | Resume scoring, skill extraction, CGPA extraction, AI reasoning |

### Why Groq + LLaMA?
- **Free tier** available — perfect for hackathon
- **Ultra-fast inference** — scores a resume in ~1–2 seconds
- **JSON mode** (`response_format: json_object`) — structured output without parsing issues
- **70B parameter model** — strong reasoning for HR evaluation tasks

### AI Scoring Breakdown
The model evaluates resumes across 4 weighted dimensions:

```
Total Score (1-100) =
  Skills Match     × weight_skills%     (default 40%)
  + CGPA/Academics × weight_cgpa%       (default 20%)
  + Experience     × weight_experience% (default 25%)
  + Projects       × weight_projects%   (default 15%)
```

HR can adjust all weights from the Admin Panel. Weights must sum to 100%.

---

## 🛡️ Key Design Decisions

| Decision | Reason |
|---|---|
| CGPA extracted from resume, not typed by student | Prevents students from inflating their CGPA |
| Skills extracted by AI, not typed by student | More accurate than self-reported skills |
| Netlify Function as API proxy | Anthropic/Groq APIs block direct browser requests (CORS) |
| Supabase over MongoDB | No backend server needed — direct REST API from frontend |
| Tailwind CSS v3 | v4 broke `npx tailwindcss init` — v3 is stable for Vite |

---

## 👤 Admin Credentials

```
Password: admin123
```

Change this anytime in **Supabase → Table Editor → criteria → admin_password**

---

## 📝 Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Student Registration Form | Public |
| `/admin` | Admin Login | Public |
| `/panel` | Admin Panel (JD + Weights) | Admin only |
| `/rank` | AI Resume Rankings | Public |

---

Built with ❤️ for Hackathon — Campus Placement Automation
