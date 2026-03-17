import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex gap-6 items-center shadow-md">
      <span className="font-bold text-lg mr-auto">PlaceAuto</span>
      <Link to="/"      className="hover:underline text-sm">Apply</Link>
      <Link to="/rank"  className="hover:underline text-sm">AI Rankings</Link>
      <Link to="/admin" className="hover:underline text-sm">Admin</Link>
    </nav>
  )
}