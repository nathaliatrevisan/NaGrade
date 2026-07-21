import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * DELETE /api/profile — exclui a conta e todos os dados pessoais.
 *
 * O que é apagado:
 *   - foto de perfil (storage)
 *   - registros de shows (user_events)
 *   - ingressos de festival (user_festivals)
 *   - o usuário (auth.users)
 *
 * O que NÃO é apagado (é catálogo compartilhado, de todos):
 *   - events e festivals
 *
 * Exige confirmação explícita no corpo para evitar exclusão acidental.
 */
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== 'APAGAR') {
      return NextResponse.json(
        { error: 'Confirmação inválida.' },
        { status: 422 }
      )
    }

    // 1. Remove a foto de perfil do storage
    const { data: files } = await supabase.storage.from('avatars').list(user.id)
    if (files && files.length > 0) {
      await supabase.storage
        .from('avatars')
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }

    // 2. Apaga os dados pessoais explicitamente.
    //    (As FKs já têm ON DELETE CASCADE, mas apagar aqui garante a limpeza
    //     mesmo que a remoção do usuário falhe no passo seguinte.)
    await supabase.from('user_events').delete().eq('user_id', user.id)
    await supabase.from('user_festivals').delete().eq('user_id', user.id)

    // 3. Remove o usuário — exige service role (nunca exposta ao navegador)
    const admin = await createSupabaseAdminClient()
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    // 4. Encerra a sessão
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/profile DELETE]', err)
    return NextResponse.json({ error: 'Erro ao excluir a conta.' }, { status: 500 })
  }
}
