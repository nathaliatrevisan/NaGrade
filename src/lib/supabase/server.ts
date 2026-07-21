/**
 * ATENÇÃO: Este arquivo só pode ser importado em contextos de servidor
 * (Route Handlers, Server Components, middleware).
 *
 * Nunca importe este arquivo em Client Components ('use client').
 * O compilador Next.js vai lançar erro se tentar.
 */
import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Cliente Supabase para Route Handlers e Server Components.
 * Usa a chave ANON com RLS ativado — seguro para operações do usuário autenticado.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado quando chamado de Server Component (read-only)
          }
        },
      },
    }
  )
}

/**
 * Cliente Supabase com service role — bypassa o RLS.
 * Use APENAS para operações administrativas no servidor.
 * NUNCA exponha a SUPABASE_SERVICE_ROLE_KEY no front-end.
 */
export async function createSupabaseAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
