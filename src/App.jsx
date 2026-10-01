import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar*/}
      <Navbar />

      {/* Konten Halaman */}
      <main>
        <HomePage />
      </main>

      <Footer />
    </div>
  )
}

export default App