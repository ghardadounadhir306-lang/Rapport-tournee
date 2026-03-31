import React, { useState, useEffect } from 'react'
import { apiUrl } from '../utils/apiBase'

function errorMessage(data) {
  if (!data || typeof data !== 'object') return 'Erreur'
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (data.error) return String(data.error)
  return 'Erreur'
}

export default function AdminPage() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [sending, setSending]   = useState(false)
  const [message, setMessage]   = useState(null) // { type: 'success'|'error', text }
  const [form, setForm]         = useState({ name: '', email: '', role: 'user' })

  // ── Load users ──────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    try {
      const res  = await fetch(apiUrl('/api/users'))
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {
      setMessage({ type: 'error', text: 'Erreur chargement utilisateurs' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  // ── Create user ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.email) {
      setMessage({ type: 'error', text: 'Nom et email sont obligatoires' })
      return
    }
    setSending(true)
    setMessage(null)
    try {
      const res  = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setForm({ name: '', email: '', role: 'user' })
        loadUsers()
      } else {
        setMessage({ type: 'error', text: errorMessage(data) })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' })
    } finally {
      setSending(false)
    }
  }

  // ── Delete user ─────────────────────────────────────────────
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Supprimer l'utilisateur ${email}?`)) return
    try {
      const del = await fetch(apiUrl(`/api/users/${id}`), { method: 'DELETE' })
      if (!del.ok) {
        const err = await del.json().catch(() => ({}))
        throw new Error(errorMessage(err))
      }
      setUsers(prev => prev.filter(u => u.id !== id))
      setMessage({ type: 'success', text: 'Utilisateur supprimé' })
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Erreur suppression' })
    }
  }

  return (
    <section className="content">
      <div className="card" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
            👥
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>GESTION DES UTILISATEURS</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Créer des comptes et envoyer les accès par email</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: '600', fontSize: '13px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{message.type === 'success' ? '✅' : '❌'} {message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
        )}

        {/* Create form */}
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>
            ➕ CRÉER UN NOUVEAU COMPTE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 140px', gap: '12px', alignItems: 'end' }}>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Nom complet</label>
              <input
                type="text"
                placeholder="Ex: Ahmed Ben Ali"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Email</label>
              <input
                type="email"
                placeholder="Ex: ahmed@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', background: '#fff' }}
              >
                <option value="user">👤 User</option>
                <option value="admin">🔐 Admin</option>
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={sending}
              style={{
                padding: '10px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: sending ? '#fed7aa' : '#f97316',
                color: 'white', fontWeight: '800', fontSize: '13px',
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              {sending ? '⏳ Envoi...' : '📧 CRÉER & ENVOYER'}
            </button>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
            * Un mot de passe aléatoire sera généré et envoyé automatiquement par email
          </p>
        </div>

        {/* Users list */}
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>
            📋 UTILISATEURS ({users.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>⏳ Chargement...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>Aucun utilisateur</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Nom', 'Email', 'Rôle', 'Créé le', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1e293b' }}>{user.name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{user.email}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: user.role === 'admin' ? '#fef3c7' : '#eff6ff',
                        color: user.role === 'admin' ? '#92400e' : '#1e40af',
                      }}>
                        {user.role === 'admin' ? '🔐 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '12px' }}>
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}