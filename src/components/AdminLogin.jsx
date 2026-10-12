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
    if (session.get()) return <Navigate to="/admin" replace />

    const submit = async (e) => {
        e.preventDefault()
        if (!u.trim() || !p) return setErr('Isi username dan kata sandi.')
        setBusy(true); setErr('')
        try { session.set(await adminApi.login(u.trim(), p)); nav('/admin', { replace: true }) }
        catch (x) { setErr(x.message) } finally { setBusy(false) }
    }
    return (
        <AuthShell>
            <p className="text-center text-xs text-slate-500 mt-3 mb-7">Masuk untuk mengakses dasbor spasial dinas dan analisis rute</p>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Username" icon="user" value={u} onChange={setU} placeholder="Masukkan nama pengguna" autoComplete="username" />
                <Field label="Kata Sandi" icon="lock" type={show ? 'text' : 'password'} value={p} onChange={setP} placeholder="Masukkan kata sandi" autoComplete="current-password"
                    right={<button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan kata sandi" className="text-slate-400 hover:text-slate-700"><Icon name="eye" /></button>} />
                <Link to="/admin/lupa-sandi" className="inline-block text-xs font-bold text-[#1D4ED8] hover:underline">Lupa Kata Sandi?</Link>
                {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
                <PrimaryBtn disabled={busy}>{busy ? 'Memproses…' : <>Login <Icon name="arrow" /></>}</PrimaryBtn>
            </form>
        </AuthShell>
    )
}