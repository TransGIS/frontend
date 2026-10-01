import { useEffect, useState } from 'react'


const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [status, setStatus] = useState('Checking API…')

  useEffect(() => {
    fetch(`${apiUrl}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json()
      })
      .then((data) => setStatus(data.message))
      .catch(() => setStatus('API belum terhubung'))
  }, [])

  return (
    <main className="shell">
      <span className="eyebrow">React + Express + MongoDB</span>
      <h1>Project siap dikembangkan.</h1>
      <p className="intro">
        Frontend dan backend terpisah. Isi environment variable, jalankan, lalu deploy masing-masing ke Vercel.
      </p>
      <div className="status-card">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>Backend status</strong>
          <p>{status}</p>
        </div>
        <h1 class="text-3xl font-bold text-blue-600 underline">
          Tailwind Berhasil Dipasang!
        </h1>
      </div>
    </main>
  )
}

export default App
