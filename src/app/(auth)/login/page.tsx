import { Suspense } from 'react'
import LoginForm from './LoginForm'

// Server Component: só assim o Next consegue gerar a casca estática da página
// e adiar a parte que usa useSearchParams (em LoginForm, um Client Component
// à parte) pro Suspense abaixo. Ter tudo num único arquivo 'use client' não
// resolve — o boundary de prerender precisa vir de um componente de servidor.
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg" />}>
      <LoginForm />
    </Suspense>
  )
}
