import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const BUCKET = 'avatars'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// ─── POST /api/profile/avatar ──────────────────────────────────────────────
// Envia a foto de perfil. Valida tipo e tamanho no servidor —
// nunca confia no que o navegador informa.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Envie um arquivo de imagem.' }, { status: 422 })
    }
    if (!ALLOWED.includes(file.type as typeof ALLOWED[number])) {
      return NextResponse.json(
        { error: 'Formato inválido. Use JPG, PNG ou WebP.' },
        { status: 422 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Imagem muito grande. O limite é 2 MB.' },
        { status: 422 }
      )
    }

    // Caminho sempre dentro da pasta do usuário — é o que a policy exige.
    // O timestamp evita cache de imagem antiga no navegador.
    const path = `${user.id}/avatar-${Date.now()}.${EXT[file.type]}`

    // Remove fotos anteriores para não acumular arquivos órfãos
    const { data: oldFiles } = await supabase.storage.from(BUCKET).list(user.id)
    if (oldFiles && oldFiles.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(oldFiles.map((f) => `${user.id}/${f.name}`))
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })
    if (metaError) throw metaError

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (err) {
    console.error('[/api/profile/avatar POST]', err)
    return NextResponse.json({ error: 'Erro ao enviar a foto.' }, { status: 500 })
  }
}

// ─── DELETE /api/profile/avatar ────────────────────────────────────────────
export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(user.id)
    if (files && files.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }

    await supabase.auth.updateUser({ data: { avatar_url: null } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/profile/avatar DELETE]', err)
    return NextResponse.json({ error: 'Erro ao remover a foto.' }, { status: 500 })
  }
}
