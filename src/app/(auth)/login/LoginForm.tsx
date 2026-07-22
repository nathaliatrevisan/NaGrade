'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { SocialAuth, SOCIAL_AUTH_ENABLED } from '@/components/SocialAuth'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const callbackError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(callbackError)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao fazer login.'); return }
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-papel">Bem-vinda de volta</h1>
          <p className="text-sm text-papel/45 mt-1.5">Entre pra ver seu diário de shows.</p>
        </div>

        {SOCIAL_AUTH_ENABLED && (
          <div className="mb-6">
            <SocialAuth label="Entrar" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-papel/45 mb-1.5">E-mail</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" placeholder="seu@email.com"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs text-papel/45">Senha</label>
              <Link href="/esqueci-senha" className="text-xs text-roxo-luz hover:text-papel transition-colors">
                Esqueci a senha
              </Link>
            </div>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel font-medium text-sm py-3.5 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-papel/45 mt-6">
          Não tem conta?{' '}
          <Link href="/register" className="text-roxo-luz hover:text-papel font-medium transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}

const inputCls = 'w-full bg-surface border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
