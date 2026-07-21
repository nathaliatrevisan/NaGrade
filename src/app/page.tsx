import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Logo } from '@/components/Logo'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg text-papel">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-bg/85 backdrop-blur-lg pt-safe">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/login" className="text-sm font-medium text-papel/60 hover:text-papel transition-colors">
            Entrar
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative hero-glow overflow-hidden pt-28 pb-16 px-5">
        <div className="max-w-3xl mx-auto text-center sm:text-left">
          <p className="text-sm text-roxo-luz font-medium mb-4">O diário dos seus shows</p>

          <h1 className="text-papel font-semibold leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(34px, 8vw, 60px)' }}>
            Tudo que você já viveu,
            <span className="text-roxo-luz"> em um só lugar.</span>
          </h1>

          <p className="text-papel/55 text-base sm:text-lg max-w-xl mb-8 mx-auto sm:mx-0 leading-relaxed">
            Registre shows e festivais, dê sua nota, acompanhe quanto gastou e
            descubra seus padrões. Como o Letterboxd, mas pra quem guarda ingresso.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-start justify-center">
            <Link href="/register" className="bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-7 py-3.5 rounded-xl transition-colors text-center">
              Criar conta grátis
            </Link>
            <Link href="/login" className="border border-white/[0.12] text-papel/70 hover:text-papel hover:border-white/25 font-medium text-sm px-7 py-3.5 rounded-xl transition-colors text-center">
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* App preview */}
        <div className="max-w-sm mx-auto mt-14">
          <div className="bg-surface rounded-3xl border border-white/[0.07] overflow-hidden shadow-2xl">
            <div className="border-b border-white/[0.06] px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-medium text-papel/70">Seus shows</span>
              <span className="w-8 h-8 rounded-xl bg-roxo/90 flex items-center justify-center">
                <svg className="w-4 h-4 text-papel" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                  { val: '47', lbl: 'shows' },
                  { val: '23', lbl: 'artistas' },
                  { val: 'R$2.8k', lbl: 'gasto total' },
                  { val: '8.4', lbl: 'nota média' },
                ].map((s) => (
                  <div key={s.lbl} className="bg-surface-2 rounded-2xl px-4 py-4">
                    <div className="font-title text-2xl text-roxo-luz leading-none">{s.val}</div>
                    <div className="text-xs text-papel/40 mt-1.5">{s.lbl}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { artist: 'Metallica', info: 'Rock in Rio', score: '9.5' },
                  { artist: 'Billie Eilish', info: 'Lollapalooza', score: '8.0' },
                  { artist: 'Sepultura', info: 'Circo Voador', score: '10' },
                ].map((show) => (
                  <div key={show.artist} className="bg-surface-2 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-papel text-sm truncate">{show.artist}</div>
                      <div className="text-xs text-papel/40 mt-0.5">{show.info}</div>
                    </div>
                    <span className="font-title text-xl text-roxo-luz">{show.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-5 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-papel font-semibold mb-3 text-center sm:text-left" style={{ fontSize: 'clamp(26px, 5vw, 38px)' }}>
            Mais do que um histórico
          </h2>
          <p className="text-papel/50 text-base mb-10 text-center sm:text-left max-w-lg">
            Cada show que você registra vira memória organizada e estatística pessoal.
          </p>

          <div className="space-y-3">
            {[
              { title: 'Registre tudo', desc: 'Shows e festivais, nota de 1 a 10, preço do ingresso, tipo e gênero. Tudo no lugar, pra sempre.' },
              { title: 'Veja suas métricas', desc: 'Quantos shows por ano, gasto total, artistas mais vistos e gênero favorito.' },
              { title: 'Em breve: social', desc: 'Descubra quais amigos foram aos mesmos shows que você.', soon: true },
            ].map((f) => (
              <div key={f.title} className={`bg-surface rounded-2xl border p-5 sm:p-6 ${f.soon ? 'border-roxo/25' : 'border-white/[0.06]'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-semibold text-papel">{f.title}</h3>
                  {f.soon && <span className="text-[10px] px-2 py-0.5 rounded-full bg-roxo/15 text-roxo-luz">em breve</span>}
                </div>
                <p className="text-papel/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-16 px-5 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-papel font-semibold leading-tight mb-6" style={{ fontSize: 'clamp(28px, 6vw, 48px)' }}>
            Sua história de shows<br />começa aqui.
          </h2>
          <Link href="/register" className="inline-flex items-center bg-roxo hover:bg-roxo-hover text-papel font-medium text-sm px-8 py-4 rounded-xl transition-colors">
            Criar conta grátis
          </Link>
          <p className="text-papel/30 text-xs mt-3">Gratuito. Sem cartão.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 px-5 pb-safe">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
          <Logo size="sm" />
          <p className="text-papel/25 text-xs text-center">Dados de shows via setlist.fm — uso não-comercial</p>
        </div>
      </footer>
    </div>
  )
}
