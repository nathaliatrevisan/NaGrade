import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    // 1. Valida input com Zod
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // 2. Autentica no servidor — session cookie é setado automaticamente pelo @supabase/ssr
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Mensagem genérica intencional — não informa se o e-mail existe ou não
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }

    console.error('[/api/auth/login]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
