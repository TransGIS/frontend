import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Maps from './pages/Maps'
import AdminLogin from './components/AdminLogin'
import AdminForgot from './components/AdminForgot'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './components/AdminDashboard'
import AdminTrayek from './components/AdminTrayek'
import AdminTrayekForm from './components/AdminTrayekForm'

function Shell() {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/lupa-sandi" element={<AdminForgot />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="trayek/:kind" element={<AdminTrayek />} />
            <Route path="trayek/:kind/baru" element={<AdminTrayekForm />} />
            <Route path="trayek/:kind/:id/ubah" element={<AdminTrayekForm />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  )
}

export default function App() {
  return <Router><Shell /></Router>
}