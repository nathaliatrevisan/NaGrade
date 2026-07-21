import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    // 1. Parse e valida o body com Zod — rejeita qualquer input malformado
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // 2. Acessa o Supabase APENAS no servidor
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      // Não expõe detalhes internos do Supabase para o cliente
      return NextResponse.json(
        { error: 'Não foi possível criar a conta. Verifique os dados e tente novamente.' },
        { status: 400 }
      )
    }

    // 3. Retorna apenas o necessário — nunca retorna tokens ou dados sensíveis desnecessários
    return NextResponse.json(
      {
        message: 'Conta criada com sucesso. Verifique seu e-mail para confirmar.',
        user: { id: data.user?.id, email: data.user?.email },
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.flatten().fieldErrors },
        { status: 422 }
      )
    }

    console.error('[/api/auth/register]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
