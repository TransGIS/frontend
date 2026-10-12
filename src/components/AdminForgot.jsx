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
        <AuthShell>
            <p className="text-center text-xs text-slate-500 mt-3 mb-7">Masukkan email akun untuk menerima tautan pengaturan ulang kata sandi</p>
            {done ? (
                <div role="status" className="text-center space-y-5">
                    <p className="text-sm text-gray-700 bg-emerald-50 rounded-xl p-4">Jika <b>{email}</b> terdaftar, tautan pengaturan ulang sudah dikirim. Periksa kotak masuk Anda.</p>
                    <Link to="/admin/login" className="text-xs font-bold text-[#1D4ED8] hover:underline">Kembali ke login</Link>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Username" icon="user" value={u} onChange={setU} placeholder="Masukkan nama pengguna" />
                    <Field label="Email" icon="mail" type="email" value={email} onChange={setEmail} placeholder="Masukkan email pengguna" autoComplete="email" />
                    <Link to="/admin/login" className="inline-block text-xs font-bold text-[#1D4ED8] hover:underline">Kembali ke login</Link>
                    {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
                    <PrimaryBtn disabled={busy}>{busy ? 'Mengirim…' : <>Kirim tautan <Icon name="arrow" /></>}</PrimaryBtn>
                </form>
            )}
        </AuthShell>
    )
}