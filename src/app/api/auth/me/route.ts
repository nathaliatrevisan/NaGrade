import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Retorna os dados do usuário autenticado.
 * O front-end chama este endpoint para saber quem está logado
 * — nunca acessa o Supabase diretamente.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // getUser() valida o token com o servidor do Supabase (mais seguro que getSession)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        emailConfirmed: !!user.email_confirmed_at,
      },
    })
  } catch (err) {
    console.error('[/api/auth/me]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
