import { z } from 'zod'
import { TICKET_TYPE_VALUES } from '@/lib/ticketTypes'

const ticketTypeEnum = z.enum(
  TICKET_TYPE_VALUES as [string, ...string[]]
)

/** Campos comuns de "detalhe pessoal" — compartilhados pelos dois fluxos */
const userEventDetails = {
  rating: z.number().int().min(1).max(10).optional(),
  ticketPrice: z.number().min(0).max(99999).optional(),
  ticketType: ticketTypeEnum.optional(),
  genre: z.string().max(60).trim().optional(),
  notes: z.string().max(1000).trim().optional(),
  festivalName: z.string().max(120).trim().optional(),
  /** Vincula o show a um festival já cadastrado (o ingresso fica no festival) */
  userFestivalId: z.string().uuid().optional(),
}

/**
 * Registra o ingresso do usuário num festival.
 * `festivalId` aponta para um festival já existente no catálogo compartilhado;
 * quando ausente, `name` cria (ou reaproveita) um festival no catálogo.
 */
export const festivalSchema = z.object({
  festivalId: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome do festival é obrigatório').max(120).trim().optional(),
  city: z.string().max(100).trim().nullable().optional(),
  ticketPrice: z.number().min(0).max(99999).nullable().optional(),
  ticketType: ticketTypeEnum.nullable().optional(),
  festivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').nullable().optional(),
}).refine((v) => !!v.festivalId || !!v.name, {
  message: 'Informe um festival do catálogo ou o nome de um novo.',
  path: ['name'],
})

export type FestivalInput = z.infer<typeof festivalSchema>

/**
 * Edição do MEU ingresso num festival.
 * O nome não entra aqui: ele pertence ao catálogo compartilhado.
 */
export const updateFestivalTicketSchema = z.object({
  ticketPrice: z.number().min(0).max(99999).nullable().optional(),
  ticketType: ticketTypeEnum.nullable().optional(),
  festivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').nullable().optional(),
})

/**
 * Edição dos detalhes pessoais de um show já registrado.
 * Todos os campos são opcionais; usamos `nullable` para permitir limpar valores.
 */
export const updateUserEventSchema = z.object({
  rating: z.number().int().min(1).max(10).nullable().optional(),
  ticketPrice: z.number().min(0).max(99999).nullable().optional(),
  ticketType: ticketTypeEnum.nullable().optional(),
  genre: z.string().max(60).trim().nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
  festival: z.boolean().optional(),
  festivalName: z.string().max(120).trim().nullable().optional(),
  userFestivalId: z.string().uuid().nullable().optional(),
})

export type UpdateUserEventInput = z.infer<typeof updateUserEventSchema>

/**
 * Vincula um evento do setlist.fm ao usuário.
 * Os dados do evento vêm da busca — o backend confirma que o evento existe antes de salvar.
 */
export const linkSetlistEventSchema = z.object({
  setlistfmId: z.string().min(1).max(50),
  artist: z.string().min(1).max(200).trim(),
  venue: z.string().min(1).max(200).trim(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().max(60).trim().optional(),
  country: z.string().length(2).toUpperCase(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  festival: z.boolean().default(false),
  ...userEventDetails,
})

/**
 * Cria um evento manual (fallback quando não encontra no setlist.fm).
 */
export const createManualEventSchema = z.object({
  artist: z.string().min(1, 'Artista obrigatório').max(200).trim(),
  venue: z.string().min(1, 'Local obrigatório').max(200).trim(),
  city: z.string().min(1, 'Cidade obrigatória').max(100).trim(),
  state: z.string().max(60).trim().optional(),
  country: z.string().length(2).toUpperCase().default('BR'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  festival: z.boolean().default(false),
  ...userEventDetails,
})

export type LinkSetlistEventInput = z.infer<typeof linkSetlistEventSchema>
export type CreateManualEventInput = z.infer<typeof createManualEventSchema>
