'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { SocialAuth, SOCIAL_AUTH_ENABLED } from '@/components/SocialAuth'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (res.status === 422 && data.details) { setFieldErrors(data.details); return }
      if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); return }
      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-bg flex flex-col justify-center px-6 py-10">
        <div className="max-w-sm w-full mx-auto text-center">
          {/* Ingresso de confirmação */}
          <div className="inline-flex items-stretch rounded-md overflow-hidden mb-6 shadow-lg">
            <div className="bg-roxo px-3 flex items-center">
              <span className="font-title text-papel text-[10px] tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                CONFIRMADO
              </span>
            </div>
            <div className="bg-papel ticket-perforation px-6 py-4 flex items-center">
              <span className="font-display text-[#100F0D] text-2xl leading-none">CONTA CRIADA</span>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-papel mb-2">Só falta confirmar</h1>
          <p className="text-sm text-papel/50 mb-8 max-w-[280px] mx-auto">
            Enviamos um e-mail de confirmação. Confirme sua conta pra entrar no Na Grade.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm py-3.5 rounded-xl transition-colors"
          >
            Ir para o login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">

        <div className="flex justify-center mb-10">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-papel">Criar conta</h1>
          <p className="text-sm text-papel/45 mt-1.5">Comece a montar seu diário de shows.</p>
        </div>

        {SOCIAL_AUTH_ENABLED && (
          <div className="mb-6">
            <SocialAuth label="Cadastrar" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs text-papel/45 mb-1.5">Nome</label>
            <input
              id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              required autoComplete="name" placeholder="Seu nome"
              className={inputCls}
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs text-papel/45 mb-1.5">E-mail</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" placeholder="seu@email.com"
              className={inputCls}
            />
            {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.email[0]}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs text-papel/45 mb-1.5">Senha</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
              className={inputCls}
            />
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password[0]}</p>}
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
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-sm text-papel/45 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-roxo-luz hover:text-papel font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}

const inputCls = 'w-full bg-surface border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
