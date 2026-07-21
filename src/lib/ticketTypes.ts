/**
 * Tipos de ingresso — fonte única usada no cadastro, edição e exibição.
 * O valor (com underscore) é o que vai pro banco; o label é o que aparece.
 */
export const TICKET_TYPES = [
  { value: 'pista', label: 'Pista' },
  { value: 'pista_premium', label: 'Pista Premium' },
  { value: 'cadeira', label: 'Cadeira' },
  { value: 'cadeira_inferior', label: 'Cadeira Inferior' },
  { value: 'cadeira_superior', label: 'Cadeira Superior' },
  { value: 'vip', label: 'VIP' },
  { value: 'camarote', label: 'Camarote' },
  { value: 'outro', label: 'Outro' },
] as const

export type TicketTypeValue = (typeof TICKET_TYPES)[number]['value']

export const TICKET_TYPE_VALUES = TICKET_TYPES.map((t) => t.value)

const LABELS: Record<string, string> = Object.fromEntries(
  TICKET_TYPES.map((t) => [t.value, t.label])
)

/** Converte o valor salvo para um label legível (ex: 'cadeira_inferior' → 'Cadeira Inferior') */
export function ticketTypeLabel(value: string | null | undefined): string {
  if (!value) return ''
  return LABELS[value] ?? value.replace(/_/g, ' ')
}
