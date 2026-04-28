import React, { useState } from 'react'
import { apiUrl } from '../utils/apiBase'

export default function LoginScreen({ loginForm, setLoginForm, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(apiUrl('/api/users/login'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: loginForm.username, password: loginForm.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message ?? 'Identifiant ou mot de passe incorrect.')
        return
      }
      onLogin(data)
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f8fafc', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', padding: '40px', borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        width: '100%', maxWidth: '400px', textAlign: 'center'
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#4b5563', fontStyle: 'italic', marginBottom: '5px' }}>
            LUMIERE <span style={{ color: '#f97316' }}>LOGISTIQUE</span>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '2px' }}>AUTHENTIFICATION</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Error banner */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
              color: '#991b1b', fontSize: '13px', fontWeight: '600',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>❌ {error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '16px' }}>×</button>
            </div>
          )}

          {/* Username */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              IDENTIFIANT / EMAIL
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#fff' }}>
              <span style={{ marginRight: '10px', color: '#94a3b8' }}>👤</span>
              <input
                type="text"
                placeholder="admin@lumiere.fr"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', color: '#475569' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MOT DE PASSE
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#fff' }}>
              <span style={{ marginRight: '10px', color: '#94a3b8' }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', color: '#475569', background: 'transparent' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? 'Masquer' : 'Afficher'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0 2px', color: showPassword ? '#f97316' : '#94a3b8',
                  fontSize: '16px', lineHeight: 1, flexShrink: 0,
                  transition: 'color 0.15s',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#fed7aa' : '#f97316',
              color: 'white', padding: '12px',
              borderRadius: '8px', border: 'none', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(249,115,22,0.2)',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? '⏳ Vérification...' : 'SE CONNECTER'}
          </button>
        </div>
      </div>
    </div>
  )
}