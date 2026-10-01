import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar tampil paling atas */}
      <Navbar />

      {/* Konten Halaman */}
      <main>
        <HomePage />
      </main>
    </div>
  )
}

export default App