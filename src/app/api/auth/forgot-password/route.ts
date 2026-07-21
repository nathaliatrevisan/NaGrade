import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().min(1).email('E-mail inválido').max(255),
})

export async function POST(request: Request) {
  try {
    const { origin } = new URL(request.url)
    const body = await request.json()
    const { email } = schema.parse(body)

    const supabase = await createSupabaseServerClient()

    // O link do e-mail volta pelo callback, que estabelece a sessão e leva
    // à tela de definir a nova senha.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
    })

    // Resposta sempre igual — não revela se o e-mail existe ou não
    return NextResponse.json({
      message: 'Se este e-mail tiver conta, enviamos um link para redefinir a senha.',
    })
  } catch {
    // Mesmo em erro de validação, mantém resposta neutra para não vazar dados
    return NextResponse.json({
      message: 'Se este e-mail tiver conta, enviamos um link para redefinir a senha.',
    })
  }
}
