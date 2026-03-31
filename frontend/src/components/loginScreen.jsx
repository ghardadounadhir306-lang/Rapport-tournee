import React, { useState } from 'react'

const VALID_CREDENTIALS = {
  'lumiere.logistique@gmail.com': { password: 'admin123', role: 'admin' },
  
}

export default function LoginScreen({ loginForm, setLoginForm, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    const cred = VALID_CREDENTIALS[loginForm.username]
    if (cred && loginForm.password === cred.password) {
      onLogin(cred.role)
    } else {
      alert('Identifiant ou mot de passe incorrect.')
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
          {/* Role quick-select */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            {[
              { label: 'ADMIN', icon: '🔐', email: 'lumiere.logistique@gmail.com' },
              { label: 'USER',  icon: '👤', email: ''  },
            ].map(({ label, icon, email }) => (
              <button
                key={label}
                onClick={() => setLoginForm({ ...loginForm, username: email })}
                style={{
                  padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${loginForm.username === email ? '#f97316' : '#e5e7eb'}`,
                  backgroundColor: loginForm.username === email ? '#fff7ed' : 'white',
                  color: loginForm.username === email ? '#f97316' : '#64748b',
                  fontWeight: '700',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

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
            style={{
              backgroundColor: '#f97316', color: 'white', padding: '12px',
              borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer',
              marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(249,115,22,0.2)'
            }}
          >
            SE CONNECTER
          </button>
        </div>
      </div>
    </div>
  )
}