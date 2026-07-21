'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setSent(true) // resposta neutra mesmo em erro
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="flex justify-center mb-10">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-xl font-semibold text-papel mb-2">Verifique seu e-mail</h1>
            <p className="text-sm text-papel/50 mb-8 max-w-[300px] mx-auto leading-relaxed">
              Se <strong className="text-papel/70">{email}</strong> tiver uma conta, enviamos
              um link para você redefinir a senha.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-roxo-luz hover:text-papel font-medium transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-papel">Esqueceu a senha?</h1>
              <p className="text-sm text-papel/45 mt-1.5">
                Informe seu e-mail e enviamos um link para redefinir.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-papel/45 mb-1.5">E-mail</label>
                <input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="seu@email.com"
                  className={inputCls}
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-roxo hover:bg-roxo-hover disabled:opacity-40 text-papel font-medium text-sm py-3.5 rounded-xl transition-colors mt-2"
              >
                {loading ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-sm text-papel/45 mt-6">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-roxo-luz hover:text-papel font-medium transition-colors">
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}

const inputCls = 'w-full bg-surface border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
