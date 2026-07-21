'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Navegação inferior estilo app.
 * Fixa no rodapé, respeita safe-area do iOS.
 * O botão central (Adicionar) tem destaque.
 */

const tabs = [
  { href: '/dashboard', label: 'Início', icon: HomeIcon },
  { href: '/shows/adicionar', label: 'Adicionar', icon: PlusIcon, center: true },
  { href: '/perfil', label: 'Perfil', icon: UserIcon },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-lg border-t border-white/[0.07]">
      <div className="max-w-md mx-auto flex items-stretch justify-around h-[68px] px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 flex-1"
                aria-label={tab.label}
              >
                <span className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-colors ${
                  active ? 'bg-roxo text-papel' : 'bg-roxo/90 text-papel hover:bg-roxo'
                }`}>
                  <Icon className="w-6 h-6" />
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 group"
              aria-label={tab.label}
            >
              <Icon className={`w-6 h-6 transition-colors ${active ? 'text-roxo-luz' : 'text-papel/40 group-hover:text-papel/70'}`} />
              <span className={`text-[11px] transition-colors ${active ? 'text-roxo-luz font-medium' : 'text-papel/40 group-hover:text-papel/70'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Ícones (inline, sem dependência externa) ────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  )
}
