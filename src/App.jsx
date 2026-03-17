import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import StudentForm from './pages/StudentForm'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import Rank from './pages/Rank'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/"      element={<StudentForm />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/panel" element={<AdminPanel />} />
          <Route path="/rank"  element={<Rank />} />
        </Routes>
      </div>
    </div>
  )
}