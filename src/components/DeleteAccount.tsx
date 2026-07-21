'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Exclusão de conta.
 * Exige digitar APAGAR — tanto na UI quanto no corpo da requisição —
 * para tornar impossível apagar tudo por engano ou com um clique acidental.
 */
export function DeleteAccount({ showCount }: { showCount: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'APAGAR' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Erro ao excluir a conta.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/15">
          <h2 className="text-sm font-medium text-red-400/90">Zona de perigo</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-papel/55 leading-relaxed mb-4">
            Excluir a conta apaga permanentemente seu perfil, sua foto e todos os
            seus registros de shows e ingressos. Não é possível desfazer.
          </p>
          <button
            onClick={() => { setOpen(true); setConfirm(''); setError(null) }}
            className="text-sm font-medium text-red-400/90 hover:text-red-400 transition-colors"
          >
            Excluir minha conta
          </button>
        </div>
      </div>

      {open && (
        <div
          onClick={busy ? undefined : () => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-medium text-papel mb-2">Excluir conta permanentemente?</h3>

            <p className="text-sm text-papel/55 leading-relaxed mb-4">
              Você vai perder {showCount > 0 ? `os ${showCount} shows registrados, ` : ''}
              seus ingressos de festival, sua foto e seu perfil. Essa ação não pode ser desfeita.
            </p>

            <p className="text-xs text-papel/45 mb-2">
              Digite <strong className="text-papel/70">APAGAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="APAGAR"
              autoComplete="off"
              className="w-full bg-surface-2 border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-papel placeholder:text-papel/20 focus:outline-none focus:border-red-500/50 transition-colors mb-4"
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="flex gap-2.5">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 py-3 rounded-xl border border-white/[0.1] text-papel/60 hover:text-papel text-sm font-medium transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={busy || confirm !== 'APAGAR'}
                className="flex-1 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {busy ? 'Excluindo…' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
