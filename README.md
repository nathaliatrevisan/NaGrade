# Na Grade 🎫

O diário de shows — como o Letterboxd, mas pra quem guarda ingresso.

Registre os shows e festivais que você já foi, com nota pessoal, preço do
ingresso, tipo e gênero. A partir disso, o app gera suas estatísticas: shows
por ano, gasto total, gênero favorito, retrospectiva anual e muito mais.

## Stack

- **Next.js** (App Router) — front-end e back-end (Route Handlers)
- **Supabase** — Postgres, Auth e Storage
- **Zod** — validação de todo input
- **setlist.fm API** — catálogo de shows (uso não-comercial)
- **Tailwind CSS** — estilos
- **Vercel** — deploy

## Princípio de segurança

O front-end **nunca** acessa o banco diretamente. Toda operação passa pelos
Route Handlers, a única camada com credenciais. Camadas: sessão validada no
back-end, input validado com Zod, e Row Level Security (RLS) do Supabase como
defesa extra. Segredos ficam em variáveis de ambiente, nunca no repositório.

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o exemplo de variáveis de ambiente e preencha com suas chaves:

   ```bash
   cp .env.local.example .env.local
   ```

   Você vai precisar de um projeto no [Supabase](https://supabase.com) e de uma
   chave da [API do setlist.fm](https://api.setlist.fm).

3. Rode as migrations do banco. No SQL Editor do Supabase, execute na ordem os
   arquivos de `supabase/schema.sql` (para um banco novo) ou, se estiver
   evoluindo um banco existente, os arquivos em `supabase/migrations/` em ordem.

4. Configure o Storage e o Auth no painel do Supabase:
   - Habilite a confirmação de e-mail (template em `supabase/email-templates/`)
   - Em Authentication → URL Configuration, adicione `http://localhost:3000/auth/callback`

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/
    api/            Route Handlers (back-end — única porta pro banco)
    (auth)/         Login, cadastro, recuperação de senha
    dashboard/      Lista de shows + filtros
    estatisticas/   Gráficos e retrospectiva
    festivais/      Gestão de festivais
    perfil/         Conta, foto e exclusão
  components/       UI reutilizável
  lib/              Supabase, setlist.fm, validações, agregações
supabase/
  schema.sql        Estrutura completa (banco novo)
  migrations/       Evolução incremental do banco
  email-templates/  Template do e-mail de confirmação
```

## Créditos

Dados de shows fornecidos pela [setlist.fm](https://www.setlist.fm) — uso
não-comercial.
