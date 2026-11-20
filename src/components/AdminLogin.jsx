import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { adminApi, session } from '../lib/adminApi'
import { AuthShell, Field, Icon, PrimaryBtn } from './AdminUi'

export default function AdminLogin() {
    const nav = useNavigate()
    const [u, setU] = useState('')
    const [p, setP] = useState('')
    const [show, setShow] = useState(false)
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)
    if (session.get()) return <Navigate to="/admin/dasbor" replace />

    const submit = async (e) => {
        e.preventDefault()
        if (!u.trim() || !p) return setErr('Isi username dan kata sandi.')
        setBusy(true); setErr('')
        try { session.set(await adminApi.login(u.trim(), p)); nav('/admin/dasbor', { replace: true }) }
        catch (x) { setErr(x.message) } finally { setBusy(false) }
    }
    return (
        <AuthShell>
            <p className="mb-6 mt-2 text-sm leading-6 text-gray-600">Masuk dengan akun pengelola untuk membuka dasbor dan data trayek.</p>
            <form onSubmit={submit} className="space-y-5">
                <Field label="Username" icon="user" value={u} onChange={setU} placeholder="Masukkan nama pengguna" autoComplete="username" />
                <Field label="Kata Sandi" icon="lock" type={show ? 'text' : 'password'} value={p} onChange={setP} placeholder="Masukkan kata sandi" autoComplete="current-password"
                    right={<button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="text-gray-400 transition-colors hover:text-[#1B3A8C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><Icon name="eye" /></button>} />
                <div className="flex items-center justify-between gap-3">
                    <Link to="/admin/lupa-sandi" className="text-xs font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Lupa kata sandi?</Link>
                    <span className="text-[11px] text-gray-400">Akses khusus admin</span>
                </div>
                {err && <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700">{err}</p>}
                <PrimaryBtn disabled={busy}>{busy ? 'Memproses…' : <>Masuk ke dasbor <Icon name="arrow" /></>}</PrimaryBtn>
            </form>
        </AuthShell>
    )
}
