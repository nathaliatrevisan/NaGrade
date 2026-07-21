'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.status === 422 && data.details?.password) {
        setFieldError(data.details.password[0])
        return
      }
      if (!res.ok) { setError(data.error || 'Erro ao atualizar a senha.'); return }

      setDone(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
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

        {done ? (
          <div className="text-center">
            <div className="text-4xl mb-4">🎸</div>
            <h1 className="text-xl font-semibold text-papel mb-2">Senha atualizada</h1>
            <p className="text-sm text-papel/50 mb-8">Já pode entrar com a nova senha.</p>
            <button
              onClick={() => { router.push('/dashboard'); router.refresh() }}
              className="w-full bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm py-3.5 rounded-xl transition-colors"
            >
              Ir para o app
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-papel">Nova senha</h1>
              <p className="text-sm text-papel/45 mt-1.5">Escolha uma senha nova para sua conta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs text-papel/45 mb-1.5">Nova senha</label>
                <input
                  id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                  className={inputCls}
                />
                {fieldError && <p className="text-red-400 text-xs mt-1.5">{fieldError}</p>}
              </div>

              <div>
                <label htmlFor="confirm" className="block text-xs text-papel/45 mb-1.5">Confirmar senha</label>
                <input
                  id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required autoComplete="new-password" placeholder="••••••••"
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
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

const inputCls = 'w-full bg-surface border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-papel placeholder:text-papel/25 focus:outline-none focus:border-roxo/50 focus:ring-1 focus:ring-roxo/20 transition-colors'
