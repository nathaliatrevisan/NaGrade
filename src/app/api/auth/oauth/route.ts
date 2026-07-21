import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const ALLOWED_PROVIDERS = ['google'] as const
type Provider = (typeof ALLOWED_PROVIDERS)[number]

/**
 * Inicia o login social.
 * Gera a URL do provedor no servidor (o code verifier PKCE fica nos cookies
 * desta origem) e redireciona o navegador. O retorno cai em /auth/callback.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get('provider') as Provider | null

  if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${origin}/login?error=Provedor inválido.`)
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
      // Precisamos da URL para redirecionar manualmente (server-side)
      skipBrowserRedirect: true,
    },
  })

  if (error || !data?.url) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Não foi possível iniciar o login social.')}`
    )
  }

  return NextResponse.redirect(data.url)
}
