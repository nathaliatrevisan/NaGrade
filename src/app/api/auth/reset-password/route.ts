import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(72, 'Senha muito longa')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()

  // Só atualiza a senha se houver sessão válida (criada pelo link de recuperação)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Link expirado. Solicite a recuperação de senha novamente.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { password } = schema.parse(body)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return NextResponse.json(
        { error: 'Não foi possível atualizar a senha. Tente novamente.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Senha atualizada com sucesso.' })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[/api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
