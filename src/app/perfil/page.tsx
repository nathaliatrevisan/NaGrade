import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { DeleteAccount } from '@/components/DeleteAccount'

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: showCount }, { count: festivalCount }] = await Promise.all([
    supabase.from('user_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_festivals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'você'
  const avatarUrl = (user.user_metadata?.avatar_url as string) ?? null
  const initial = name.charAt(0).toUpperCase()
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-bg text-papel">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-5 py-8 md:py-12">

        {/* Identidade */}
        <div className="flex flex-col items-center text-center mb-8">
          <ProfileAvatar initial={initial} avatarUrl={avatarUrl} />
          <h1 className="text-2xl md:text-3xl font-semibold text-papel mt-5">{name}</h1>
          <p className="text-sm text-papel/45 mt-1">{user.email}</p>
          {memberSince && (
            <p className="text-xs text-papel/30 mt-2">no Na Grade desde {memberSince}</p>
          )}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface border border-white/[0.06] rounded-2xl px-5 py-4">
            <span className="font-title text-3xl text-roxo-luz leading-none">{showCount ?? 0}</span>
            <p className="text-xs text-papel/40 mt-1.5">shows registrados</p>
          </div>
          <div className="bg-surface border border-white/[0.06] rounded-2xl px-5 py-4">
            <span className="font-title text-3xl text-roxo-luz leading-none">{festivalCount ?? 0}</span>
            <p className="text-xs text-papel/40 mt-1.5">festivais</p>
          </div>
        </div>

        {/* Conta */}
        <div className="bg-surface border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-xs text-papel/35 mb-3">Conta</p>
            <Row label="Nome" value={name} />
            <Row label="E-mail" value={user.email ?? '—'} />
            <Row label="E-mail confirmado" value={user.email_confirmed_at ? 'Sim' : 'Pendente'} />
          </div>
          <LogoutButton />
        </div>

        {/* Zona de perigo */}
        <DeleteAccount showCount={showCount ?? 0} />

        <p className="text-center text-xs text-papel/25 mt-8">
          Na Grade · Dados de shows via setlist.fm
        </p>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-papel/45">{label}</span>
      <span className="text-sm text-papel/80 truncate max-w-[60%] text-right">{value}</span>
    </div>
  )
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        const { createSupabaseServerClient } = await import('@/lib/supabase/server')
        const supabase = await createSupabaseServerClient()
        await supabase.auth.signOut()
        const { redirect } = await import('next/navigation')
        redirect('/login')
      }}
    >
      <button
        type="submit"
        className="w-full px-5 py-4 text-left text-sm font-medium text-papel/60 hover:text-papel hover:bg-white/[0.03] transition-colors"
      >
        Sair da conta
      </button>
    </form>
  )
}
