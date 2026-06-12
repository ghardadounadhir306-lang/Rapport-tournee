import React, { useState } from 'react'
import { apiUrl } from '../utils/apiBase'

export default function LoginScreen({ loginForm, setLoginForm, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.username, password: loginForm.password }),
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
      background: 'linear-gradient(135deg, #fff7ed 0%, #f8fafc 50%, #fff7ed 100%)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      {/* Login Container — split layout inspired by logistics-platform */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        backgroundColor: 'white', borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12), 0 0 40px rgba(249, 115, 22, 0.06)',
        width: '100%', maxWidth: '860px', minHeight: '520px', overflow: 'hidden',
      }}>

        {/* Left: Branding Panel */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
          color: '#fff', padding: '60px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '-30px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '64px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>🚚</div>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              LUMIERE
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.15em', opacity: 0.9 }}>
              LOGISTIQUE
            </div>
            <div style={{
              marginTop: '24px', padding: '12px 20px',
              background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              fontSize: '13px', fontWeight: '500', lineHeight: '1.6',
            }}>
              Plateforme de gestion logistique professionnelle
            </div>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div style={{
          padding: '50px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: '320px' }}>
            <h1 style={{
              fontSize: '24px', fontWeight: '800', color: '#1e293b',
              marginBottom: '6px', letterSpacing: '-0.02em',
            }}>
              Bienvenue
            </h1>
            <p style={{
              fontSize: '14px', color: '#94a3b8', marginBottom: '28px',
              fontWeight: '500',
            }}>
              Connectez-vous pour accéder à votre espace
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Error banner */}
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  color: '#991b1b', fontSize: '13px', fontWeight: '600',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: '4px solid #ef4444',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <span>❌ {error}</span>
                  <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '16px' }}>×</button>
                </div>
              )}

              {/* Username */}
              <div style={{ textAlign: 'left' }}>
                <label style={{
                  fontSize: '11px', fontWeight: '700', color: '#64748b',
                  display: 'block', marginBottom: '8px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  IDENTIFIANT / EMAIL
                </label>
                <div style={{
                  position: 'relative', display: 'flex', alignItems: 'center',
                  border: '1px solid #e2e8f0', borderRadius: '10px',
                  padding: '12px 14px', backgroundColor: '#fff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <span style={{ marginRight: '10px', color: '#94a3b8', fontSize: '16px' }}>👤</span>
                  <input
                    type="text"
                    placeholder="admin@lumiere.fr"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    style={{
                      border: 'none', outline: 'none', fontSize: '14px',
                      width: '100%', color: '#1e293b', fontWeight: '500',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ textAlign: 'left' }}>
                <label style={{
                  fontSize: '11px', fontWeight: '700', color: '#64748b',
                  display: 'block', marginBottom: '8px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  MOT DE PASSE
                </label>
                <div style={{
                  position: 'relative', display: 'flex', alignItems: 'center',
                  border: '1px solid #e2e8f0', borderRadius: '10px',
                  padding: '12px 14px', backgroundColor: '#fff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <span style={{ marginRight: '10px', color: '#94a3b8', fontSize: '16px' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    style={{
                      border: 'none', outline: 'none', fontSize: '14px',
                      width: '100%', color: '#1e293b', background: 'transparent',
                      fontWeight: '500', fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    title={showPassword ? 'Masquer' : 'Afficher'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 2px', color: showPassword ? '#f97316' : '#94a3b8',
                      fontSize: '16px', lineHeight: 1, flexShrink: 0,
                      transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  background: loading
                    ? 'linear-gradient(135deg, #fdba74, #fed7aa)'
                    : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white', padding: '14px',
                  borderRadius: '12px', border: 'none', fontWeight: '800',
                  fontSize: '14px', letterSpacing: '0.04em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '6px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: loading ? 'none' : undefined,
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(249,115,22,0.4)' } }}
                onMouseLeave={(e) => { if (!loading) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(249,115,22,0.3)' } }}
              >
                {loading ? '⏳ Vérification...' : 'SE CONNECTER'}
              </button>
            </div>

            {/* Footer text */}
            <p style={{
              marginTop: '24px', textAlign: 'center',
              fontSize: '12px', color: '#cbd5e1', fontWeight: '500',
            }}>
              © 2024 Lumiere Logistique. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* CSS for float animation (used by truck icon) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          /* Stack vertically on mobile */
        }
      `}</style>
    </div>
  )
}