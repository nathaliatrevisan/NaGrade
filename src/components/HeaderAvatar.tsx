'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Avatar do usuário no header.
 * Busca o nome via /api/auth/me e mostra a inicial num círculo,
 * servindo de atalho para o perfil. Client-side pra funcionar em
 * qualquer tela (inclusive as que não são Server Components).
 */
export function HeaderAvatar() {
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.user) return
        const name: string = data.user.name || data.user.email || '?'
        setInitial(name.charAt(0).toUpperCase())
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <Link
      href="/perfil"
      aria-label="Perfil"
      className="w-9 h-9 rounded-full bg-roxo/20 border border-roxo/30 flex items-center justify-center hover:bg-roxo/30 transition-colors"
    >
      <span className="font-title text-lg text-roxo-luz leading-none">
        {initial ?? ''}
      </span>
    </Link>
  )
}
