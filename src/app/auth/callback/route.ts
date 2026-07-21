import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Callback de autenticação.
 * Finaliza o login vindo de: confirmação de e-mail, recuperação de senha e
 * login social (OAuth). Troca o `code` por uma sessão (cookies) e redireciona.
 *
 * O fluxo é PKCE: o code verifier já está nos cookies desta origem, então a
 * troca acontece com segurança no servidor — nada sensível chega ao navegador.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'
  const errorDescription = searchParams.get('error_description')

  // O provedor pode devolver erro (ex: usuário cancelou o Google)
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Link inválido ou expirado.`)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Não foi possível concluir o acesso. Tente novamente.')}`
    )
  }

  // `next` só pode ser um caminho interno — evita open redirect
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
