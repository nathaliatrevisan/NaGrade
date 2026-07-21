'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

/**
 * Foto de perfil com upload e remoção.
 * A validação real (tipo e tamanho) acontece no servidor;
 * aqui só damos retorno rápido ao usuário.
 */
export function ProfileAvatar({
  initial,
  avatarUrl,
}: {
  initial: string
  avatarUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setBusy(true)

    // Prévia imediata enquanto envia
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar a foto.')
        setPreview(avatarUrl)
        return
      }

      setPreview(data.avatarUrl)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setPreview(avatarUrl)
    } finally {
      setBusy(false)
      URL.revokeObjectURL(localUrl)
    }
  }

  async function handleRemove() {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
      if (!res.ok) { setError('Erro ao remover a foto.'); return }
      setPreview(null)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {preview ? (
          <span className="w-24 h-24 rounded-full overflow-hidden border border-roxo/30 block relative">
            <Image src={preview} alt="Foto de perfil" fill sizes="96px" className="object-cover" unoptimized />
          </span>
        ) : (
          <span className="w-24 h-24 rounded-full bg-roxo/20 border border-roxo/30 flex items-center justify-center">
            <span className="font-title text-5xl text-roxo-luz leading-none">{initial}</span>
          </span>
        )}

        {/* Botão de trocar foto */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Trocar foto"
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-roxo hover:bg-roxo-hover disabled:opacity-50 border-2 border-bg flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-papel" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8h3l1.5-2h9L18 8h3v12H3V8Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs text-roxo-luz hover:text-papel transition-colors disabled:opacity-50"
        >
          {busy ? 'Enviando…' : preview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {preview && !busy && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-papel/35 hover:text-papel/60 transition-colors"
          >
            Remover
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
      <p className="text-[11px] text-papel/25 mt-1">JPG, PNG ou WebP · até 2 MB</p>
    </div>
  )
}
