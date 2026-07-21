'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from './Logo'

/** Lugares onde o usuário navega */
const NAV = [
  { href: '/dashboard', label: 'Início' },
  { href: '/festivais', label: 'Festivais' },
  { href: '/estatisticas', label: 'Estatísticas' },
]

/**
 * Header em três blocos:
 *   navegação (onde vou) · ação principal (o que faço) · conta (quem sou)
 */
export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)     // menu mobile
  const [accountOpen, setAccountOpen] = useState(false) // dropdown da conta
  const [user, setUser] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.user) {
          setUser({
            name: data.user.name || data.user.email || '?',
            email: data.user.email || '',
            avatarUrl: data.user.avatarUrl ?? null,
          })
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [pathname])

  useEffect(() => { setMenuOpen(false); setAccountOpen(false) }, [pathname])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const initial = user?.name?.charAt(0).toUpperCase() ?? ''
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-lg border-b border-white/[0.06] pt-safe">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">

        {/* Marca */}
        <Link href="/dashboard" aria-label="Início" className="shrink-0">
          <Logo size="sm" />
        </Link>

        {/* Navegação (desktop) */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-papel bg-white/[0.06]'
                  : 'text-papel/50 hover:text-papel hover:bg-white/[0.03]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Ação principal (desktop) */}
        <Link
          href="/shows/adicionar"
          className="hidden md:inline-flex items-center gap-1.5 bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Registrar show
        </Link>

        {/* Conta (desktop) */}
        <div ref={accountRef} className="hidden md:block relative shrink-0">
          <button
            onClick={() => setAccountOpen((v) => !v)}
            aria-label="Conta"
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/[0.04] transition-colors"
          >
            <Avatar initial={initial} url={user?.avatarUrl ?? null} />
            <svg className="w-3.5 h-3.5 text-papel/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-12 w-56 bg-surface-2 border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-papel truncate">{user?.name}</p>
                <p className="text-xs text-papel/40 truncate">{user?.email}</p>
              </div>
              <Link href="/perfil" className="block px-4 py-2.5 text-sm text-papel/80 hover:bg-white/[0.05] transition-colors">
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400/90 hover:bg-red-500/5 transition-colors"
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>

        {/* Mobile: avatar + menu */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <Link href="/perfil" aria-label="Perfil">
            <Avatar initial={initial} url={user?.avatarUrl ?? null} />
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-papel/70 hover:text-papel hover:bg-white/[0.04] transition-colors"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-bg/95 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-5 py-3 flex flex-col gap-1">
            <Link
              href="/shows/adicionar"
              className="flex items-center justify-center gap-1.5 bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm py-3 rounded-xl transition-colors mb-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Registrar show
            </Link>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href) ? 'text-papel bg-white/[0.06]' : 'text-papel/60 hover:text-papel'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="h-px bg-white/[0.06] my-1.5" />

            <Link href="/perfil" className="px-3 py-3 rounded-lg text-sm font-medium text-papel/60 hover:text-papel transition-colors">
              Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-3 rounded-lg text-sm font-medium text-red-400/90 text-left hover:bg-red-500/5 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

function Avatar({ initial, url }: { initial: string; url: string | null }) {
  if (url) {
    return (
      <span className="w-9 h-9 rounded-full overflow-hidden border border-roxo/30 block relative">
        <Image src={url} alt="" fill sizes="36px" className="object-cover" unoptimized />
      </span>
    )
  }
  return (
    <span className="w-9 h-9 rounded-full bg-roxo/20 border border-roxo/30 flex items-center justify-center">
      <span className="font-title text-lg text-roxo-luz leading-none">{initial}</span>
    </span>
  )
}
