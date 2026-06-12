import React, { useState, useRef, useEffect, useCallback } from 'react'
import { apiUrl } from '../utils/apiBase'

const STORAGE_KEY = 'ai_chat_history'

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(history) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50))) } catch {}
}

/* ── Data Table renderer ──────────────────────────────────────────── */
function DataTable({ data }) {
  if (!data || data.length === 0) return null
  const cols = Object.keys(data[0])
  return (
    <div className="ai-chat-table-wrap">
      <table className="ai-chat-table">
        <thead>
          <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr key={i}>{cols.map(c => <td key={c}>{row[c] == null ? '—' : String(row[c])}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {data.length > 20 && <div className="ai-chat-table-more">+{data.length - 20} lignes supplémentaires</div>}
    </div>
  )
}

/* ── Quick suggestion chips ───────────────────────────────────────── */
const SUGGESTIONS = {
  fr: [
    'Combien de tournées non conformes ?',
    'Quel chauffeur a le plus d\'anomalies ?',
    'Résumé des livraisons du mois',
    'Qu\'est-ce que la logistique ?',
    'Donne-moi des conseils de sécurité routière',
  ],
  en: [
    'How many non-conforme tours?',
    'Which driver has the most anomalies?',
    'Monthly delivery summary',
    'What is supply chain management?',
    'Give me road safety tips',
  ],
  ar: [
    'قداش تورنة غير مطابقة؟',
    'شكون الشوفير عندو أكثر مشاكل؟',
    'ملخص التوصيلات متع الشهر',
    'شنوة اللوجستيك؟',
    'أعطيني نصائح للسلامة على الطريق',
  ],
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('fr')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { saveHistory(messages) }, [messages])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      })
      const data = await res.json()

      if (!res.ok) {
        const errMsg = data?.message || data?.reply || (res.status === 429
          ? '⏳ Quota IA épuisé. Patientez 1-2 minutes et réessayez.'
          : 'Erreur serveur IA.')
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg, ts: Date.now() }])
      } else {
        const assistantMsg = {
          role: 'assistant',
          content: data.reply || 'Pas de réponse.',
          data: data.data,
          chartType: data.chartType,
          language: data.language,
          ts: Date.now(),
        }
        setMessages(prev => [...prev, assistantMsg])
        if (data.language) setLang(data.language)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Impossible de joindre le serveur. Vérifiez que le backend est démarré.',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const langLabel = { fr: '🇫🇷', en: '🇬🇧', ar: '🇹🇳' }
  const placeholders = {
    fr: 'Posez votre question...',
    en: 'Ask your question...',
    ar: '...اسأل سؤالك',
  }

  return (
    <>
      {/* ── Floating Action Button ────────────────────────────────── */}
      <button
        className={`ai-fab ${isOpen ? 'ai-fab--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Assistant IA"
      >
        <span className="ai-fab-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="ai-fab-pulse" />}
      </button>

      {/* ── Chat Window ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-chat-avatar">🤖</div>
              <div>
                <div className="ai-chat-title">LUMIÈRE IA</div>
                <div className="ai-chat-subtitle">Assistant Intelligent & Polyvalent</div>
              </div>
            </div>
            <div className="ai-chat-header-right">
              <div className="ai-chat-lang-switcher">
                {['fr', 'en', 'ar'].map(l => (
                  <button
                    key={l}
                    className={`ai-chat-lang-btn ${lang === l ? 'active' : ''}`}
                    onClick={() => setLang(l)}
                    title={l.toUpperCase()}
                  >
                    {langLabel[l]}
                  </button>
                ))}
              </div>
              <button className="ai-chat-clear-btn" onClick={clearChat} title="Effacer">🗑️</button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">🤖</div>
                <h3 className="ai-chat-welcome-title">
                  {lang === 'fr' ? 'Bienvenue !' : lang === 'en' ? 'Welcome!' : 'مرحبا!'}
                </h3>
                <p className="ai-chat-welcome-sub">
                  {lang === 'fr' ? 'Posez-moi vos questions sur les tournées ou sur n\'importe quel sujet général !' :
                   lang === 'en' ? 'Ask me about your delivery tours or any general topic!' :
                   'اسألني على التورنات ولا أي سؤال عام!'}
                </p>
                <div className="ai-chat-suggestions">
                  {(SUGGESTIONS[lang] || SUGGESTIONS.fr).map((s, i) => (
                    <button key={i} className="ai-chat-suggestion" onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ai-chat-msg ai-chat-msg--${msg.role}`}>
                {msg.role === 'assistant' && <div className="ai-chat-msg-avatar">🤖</div>}
                <div className="ai-chat-msg-bubble">
                  <div className="ai-chat-msg-text">{msg.content}</div>
                  {msg.data && <DataTable data={msg.data} />}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-chat-msg ai-chat-msg--assistant">
                <div className="ai-chat-msg-avatar">🤖</div>
                <div className="ai-chat-msg-bubble">
                  <div className="ai-chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              placeholder={placeholders[lang] || placeholders.fr}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <button
              className="ai-chat-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
