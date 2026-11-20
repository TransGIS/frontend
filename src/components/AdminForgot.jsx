import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../lib/adminApi'
import { AuthShell, Field, Icon, PrimaryBtn } from './AdminUi'

export default function AdminForgot() {
    const [u, setU] = useState('')
    const [email, setEmail] = useState('')
    const [err, setErr] = useState('')
    const [done, setDone] = useState(false)
    const [busy, setBusy] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Masukkan alamat email yang valid.')
        setBusy(true); setErr('')
        try { await adminApi.forgot(email.trim()); setDone(true) } catch (x) { setErr(x.message) } finally { setBusy(false) }
    }
    return (
        <AuthShell title="Atur ulang kata sandi">
            <p className="mb-6 mt-2 text-sm leading-6 text-gray-600">Masukkan email akun untuk menerima tautan pengaturan ulang kata sandi.</p>
            {done ? (
                <div role="status" className="space-y-5">
                    <p className="border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">Jika <b>{email}</b> terdaftar, tautan pengaturan ulang sudah dikirim. Periksa kotak masuk Anda.</p>
                    <Link to="/admin/login" className="inline-block text-xs font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316]">Kembali ke login</Link>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-5">
                    <Field label="Username" icon="user" value={u} onChange={setU} placeholder="Masukkan nama pengguna" />
                    <Field label="Email" icon="mail" type="email" value={email} onChange={setEmail} placeholder="Masukkan email pengguna" autoComplete="email" />
                    <Link to="/admin/login" className="inline-block text-xs font-extrabold text-[#1B3A8C] transition-colors hover:text-[#F97316]">Kembali ke login</Link>
                    {err && <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700">{err}</p>}
                    <PrimaryBtn disabled={busy}>{busy ? 'Mengirim…' : <>Kirim tautan <Icon name="arrow" /></>}</PrimaryBtn>
                </form>
            )}
        </AuthShell>
    )
}
