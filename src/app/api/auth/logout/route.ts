import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    // Verifica se há sessão antes de tentar fazer logout
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      await supabase.auth.signOut()
    }

    return NextResponse.json({ message: 'Logout realizado com sucesso.' })
  } catch (err) {
    console.error('[/api/auth/logout]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
