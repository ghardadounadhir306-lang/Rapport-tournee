import React, { useState, useEffect } from 'react'
import { apiUrl } from '../utils/apiBase'

const PAGE_OPTIONS = [
  { key: 'TOURNEES', label: '🚚 Tournées' },
  { key: 'DASHBOARD', label: '📊 Dashboard' },
  { key: 'SIMULATEUR', label: '💰 Simulateur' },
  { key: 'PARAMETRAGE', label: '🎛️ Paramétrage' },
  { key: 'OPTIMISATION', label: '📈 Optimisation' },
  { key: 'ADMIN', label: '⚙️ Admin' },
  { key: 'SUPER_ADMIN_TRIPS', label: '👑 Accès super admin' },
]

const ALL_PAGE_KEYS = PAGE_OPTIONS.map((page) => page.key)

function errorMessage(data) {
  if (!data || typeof data !== 'object') return 'Erreur'
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (data.error) return String(data.error)
  return 'Erreur'
}

const ACTION_LABELS = {
  USER_LOGIN: 'Connexion',
  USER_LOGIN_FAILED: 'Échec connexion',
  USER_CREATE: 'Création utilisateur',
  USER_DELETE: 'Suppression utilisateur',
  FORM_SAVE: 'Enregistrement formulaire tournée',
  TMS_EXCEL_IMPORT: 'Import Excel TMS',
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [depots, setDepots] = useState([])  // list of { code, name } from API
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }
  const [activityLogs, setActivityLogs] = useState([])
  const [activityTotal, setActivityTotal] = useState(0)
  const [activityLoading, setActivityLoading] = useState(false)
  /** Set when /api/activity-logs fails (réseau, table manquante, 500…). Null = dernière requête OK. */
  const [activityLogError, setActivityLogError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    matricule: '',
    zone: '',
    allowedPages: ['TOURNEES', 'DASHBOARD'],
  })
  const [logPage, setLogPage] = useState(1)
  const logsPerPage = 10

  // ── Load users ──────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/users'))
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {
      setMessage({ type: 'error', text: 'Erreur chargement utilisateurs' })
    } finally {
      setLoading(false)
    }
  }

  // ── Load depots ─────────────────────────────────────────────
  const loadDepots = async () => {
    try {
      const res = await fetch(apiUrl('/api/clients-poi/depots'))
      if (!res.ok) return
      const data = await res.json()
      const items = Array.isArray(data?.items) ? data.items : []
      const uniqueByCode = new Map()
      items
        .map((d) => ({ code: String(d.code ?? '').trim().toUpperCase(), name: d.nom ?? d.name ?? '' }))
        .filter((d) => d.code)
        .forEach((d) => {
          if (!uniqueByCode.has(d.code)) uniqueByCode.set(d.code, d)
        })
      setDepots(Array.from(uniqueByCode.values()))
    } catch {
      // silent — zone select will just be empty
    }
  }

  const loadActivityLogs = async () => {
    setActivityLoading(true)
    setActivityLogError(null)
    try {
      const res = await fetch(apiUrl('/api/activity-logs?limit=150'))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'Route introuvable (404). Le processus Node sur le port du backend est probablement une ancienne version : arrêtez-le, puis dans le dossier backend exécutez npm run build et npm run start:dev.',
          )
        }
        throw new Error(errorMessage(data))
      }
      if (!Array.isArray(data.logs)) {
        throw new Error('Réponse API invalide')
      }
      setActivityLogs(data.logs)
      setActivityTotal(typeof data.total === 'number' ? data.total : data.logs.length)
    } catch (e) {
      setActivityLogs([])
      setActivityTotal(0)
      setActivityLogError(e?.message || 'Erreur chargement du journal')
    } finally {
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadDepots()
    loadActivityLogs()
  }, [])

  // ── Create user ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.email) {
      setMessage({ type: 'error', text: 'Nom et email sont obligatoires' })
      return
    }
    setSending(true)
    setMessage(null)
    try {
      const res = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          matricule: form.matricule || undefined,
          zone: form.zone || null,
          allowedPages: form.allowedPages,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setForm({
          name: '',
          email: '',
          role: 'user',
          matricule: '',
          zone: '',
          allowedPages: ['TOURNEES', 'DASHBOARD'],
        })
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
          <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', boxShadow: '0 4px 14px rgba(249,115,22,0.12)' }}>
            👥
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: 800, letterSpacing: '-0.01em' }}>GESTION DES UTILISATEURS</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Créer des comptes et envoyer les accès par email</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
            borderLeft: `4px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: '600', fontSize: '13px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <span>{message.type === 'success' ? '✅' : '❌'} {message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
        )}

        {/* Create form */}
        <div style={{ background: 'linear-gradient(180deg, #f8fafc, #fff)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#1e293b', fontWeight: '800', letterSpacing: '-0.01em' }}>
            ➕ CRÉER UN NOUVEAU COMPTE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 130px 160px 140px', gap: '12px', alignItems: 'end' }}>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom complet</label>
              <input
                type="text"
                placeholder="Ex: Ahmed Ben Ali"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' }}
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
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Matricule</label>
              <input
                type="text"
                placeholder="Ex: MAT-001"
                value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Rôle</label>
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    role,
                    allowedPages:
                      role === 'admin'
                        ? prev.allowedPages
                        : role === 'responsable'
                          ? ['DASHBOARD']
                          : ['TOURNEES', 'DASHBOARD'],
                  }))
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', background: '#fff' }}
              >
                <option value="user">👤 User</option>
                <option value="responsable">🛡 Responsable</option>
                <option value="admin">🔐 Admin</option>
              </select>
            </div>

            {/* Zone / Dépôt select */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Zone / Dépôt</label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${form.zone ? '#f97316' : '#d1d5db'}`, fontSize: '13px', outline: 'none', background: form.zone ? '#fff7ed' : '#fff', fontWeight: form.zone ? '700' : '400' }}
              >
                <option value="">🌍 Toutes les zones (admin)</option>
                {depots.length === 0 && <option disabled>Chargement des dépôts…</option>}
                {depots.map(d => (
                  <option key={d.code} value={d.code}>
                    📍 {d.code}{d.name ? ` — ${d.name}` : ''}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                {form.zone ? `Restreint à ${form.zone}` : 'Aucune restriction (voit tout)'}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={sending}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: sending ? 'linear-gradient(135deg, #fdba74, #fed7aa)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white', fontWeight: '800', fontSize: '13px',
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: sending ? 'none' : '0 6px 20px rgba(249,115,22,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {sending ? '⏳ Envoi...' : '📧 CRÉER & ENVOYER'}
            </button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Pages autorisées
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PAGE_OPTIONS.map((page) => {
                const disabled = form.role === 'user'
                  ? page.key !== 'TOURNEES' && page.key !== 'DASHBOARD'
                  : form.role === 'responsable'
                    ? page.key !== 'DASHBOARD'
                    : form.role !== 'admin' && (page.key === 'ADMIN' || page.key === 'SUPER_ADMIN_TRIPS')
                const checked = form.allowedPages.includes(page.key)
                return (
                  <label
                    key={page.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      border: '1px solid #e5e7eb',
                      background: checked ? '#fff7ed' : '#fff',
                      color: checked ? '#c2410c' : '#475569',
                      fontSize: '12px',
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={checked}
                      onChange={(e) => {
                        const isOn = e.target.checked
                        setForm((prev) => {
                          const set = new Set(prev.allowedPages)
                          if (isOn) set.add(page.key)
                          else set.delete(page.key)
                            if (prev.role === 'user') {
                              set.delete('SIMULATEUR')
                              set.delete('PARAMETRAGE')
                              set.delete('OPTIMISATION')
                              set.delete('ADMIN')
                              set.delete('SUPER_ADMIN_TRIPS')
                            } else if (prev.role === 'responsable') {
                              set.delete('TOURNEES')
                              set.delete('SIMULATEUR')
                              set.delete('PARAMETRAGE')
                              set.delete('OPTIMISATION')
                              set.delete('ADMIN')
                              set.delete('SUPER_ADMIN_TRIPS')
                            } else if (prev.role !== 'admin') {
                            set.delete('ADMIN')
                            set.delete('SUPER_ADMIN_TRIPS')
                          }
                          return { ...prev, allowedPages: Array.from(set) }
                        })
                      }}
                    />
                    {page.label}
                  </label>
                )
              })}
            </div>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
            * Un mot de passe aléatoire sera généré et envoyé automatiquement par email (matricule optionnel)
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
                <tr style={{ background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)' }}>
                  {['Nom', 'Email', 'Matricule', 'Zone', 'Pages', 'Rôle', 'Créé le', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '800', color: '#475569', borderBottom: '2px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1e293b' }}>{user.name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{user.email}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>
                      {user.matricule || <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {user.zone
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg,#fff7ed,#fed7aa)', color: '#c2410c', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #fdba74' }}>📍 {user.zone}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '11px' }}>
                      {Array.isArray(user.allowedPages) && user.allowedPages.length > 0
                        ? user.allowedPages.join(', ')
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {(() => {
                        const isAdmin = user.role === 'admin' || user.role === 'super_admin'
                        const isResponsible = user.role === 'responsable'
                        return (
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: isAdmin ? '#fef3c7' : isResponsible ? '#dcfce7' : '#eff6ff',
                        color: isAdmin ? '#92400e' : isResponsible ? '#166534' : '#1e40af',
                      }}>
                        {isAdmin ? '🔐 Admin' : isResponsible ? '🛡 Responsable' : '👤 User'}
                      </span>
                        )
                      })()}
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

        {/* Activity journal */}
        <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>
              📜 Journal d&apos;activité ({activityTotal} en base)
            </h3>
            <button
              type="button"
              onClick={loadActivityLogs}
              disabled={activityLoading}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: '600',
                cursor: activityLoading ? 'wait' : 'pointer',
              }}
            >
              {activityLoading ? '…' : 'Rafraîchir'}
            </button>
          </div>
          {activityLogError ? (
            <div style={{ color: '#b45309', fontSize: '13px', padding: '12px 14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <strong>Impossible de charger le journal.</strong> {activityLogError}
              <div style={{ marginTop: '8px', color: '#92400e', fontSize: '12px' }}>
                Vérifiez que le backend tourne avec le code à jour (build + redémarrage). En cas d’erreur SQL ou de table absente avec{' '}
                <code style={{ fontSize: '11px' }}>DB_SYNCHRONIZE=false</code>, appliquez{' '}
                <code style={{ fontSize: '11px' }}>backend/sql/patches/010_activity_logs.sql</code> sur PostgreSQL.
              </div>
            </div>
          ) : activityLoading && activityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Chargement du journal…</div>
          ) : activityLogs.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Aucune ligne pour l’instant</strong> — c’est normal si personne ne s’est connecté ni n’a enregistré de tournée depuis l’activation du journal.
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Déclenchez une action (connexion, sauvegarde d’un formulaire tournée, import Excel TMS), puis cliquez sur <strong>Rafraîchir</strong>.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)' }}>
                    {['Date / heure', 'Action', 'Acteur', 'Cible', 'IP', 'Détails'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '800', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage).map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(row.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>
                        {ACTION_LABELS[row.action] || row.action}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {row.actor_email || '—'}
                        {row.actor_user_id != null ? <span style={{ color: '#94a3b8', fontSize: '11px' }}> #{row.actor_user_id}</span> : null}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                        {row.target_type ? `${row.target_type}: ` : ''}
                        {row.target_id || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                        {row.ip || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569', maxWidth: '280px', wordBreak: 'break-word' }}>
                        {row.details && Object.keys(row.details).length > 0
                          ? JSON.stringify(row.details)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {activityLogs.length > logsPerPage && (() => {
                const totalLogPages = Math.ceil(activityLogs.length / logsPerPage);
                return (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      Page {logPage} sur {totalLogPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={logPage === 1}
                        onClick={() => setLogPage(p => p - 1)}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#475569', borderRadius: '6px', border: '1px solid #e5e7eb', background: logPage === 1 ? '#f8fafc' : '#fff', cursor: logPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        disabled={logPage === totalLogPages}
                        onClick={() => setLogPage(p => p + 1)}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#475569', borderRadius: '6px', border: '1px solid #e5e7eb', background: logPage === totalLogPages ? '#f8fafc' : '#fff', cursor: logPage === totalLogPages ? 'not-allowed' : 'pointer' }}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}