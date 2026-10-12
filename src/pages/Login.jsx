import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('connexion') // 'connexion' ou 'inscription'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)

    const action = mode === 'connexion'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })

    const { error } = await action

    if (error) {
      setErreur(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <h1 style={{ color: '#0D1B3D' }}>
        {mode === 'connexion' ? 'Connexion' : 'Créer un compte'}
      </h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
        />

        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: '#D4A017', color: '#101010', padding: 10, width: '100%', border: 'none' }}
        >
          {loading ? 'Chargement...' : mode === 'connexion' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        {mode === 'connexion' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'connexion' ? 'inscription' : 'connexion')}
          style={{ background: 'none', border: 'none', color: '#0D1B3D', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {mode === 'connexion' ? "S'inscrire" : 'Se connecter'}
        </button>
      </p>
    </div>
  )
}
