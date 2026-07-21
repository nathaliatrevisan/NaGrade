/**
 * Lista de países (código ISO 3166-1 alpha-2 + nome em português).
 * Usada na busca do setlist.fm (countryCode) e no cadastro manual.
 * Brasil no topo por ser o público principal.
 */
export interface Country {
  code: string
  name: string
}

export const COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'ES', name: 'Espanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'NL', name: 'Holanda' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'CH', name: 'Suíça' },
  { code: 'AT', name: 'Áustria' },
  { code: 'SE', name: 'Suécia' },
  { code: 'NO', name: 'Noruega' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'PL', name: 'Polônia' },
  { code: 'CZ', name: 'República Tcheca' },
  { code: 'CA', name: 'Canadá' },
  { code: 'MX', name: 'México' },
  { code: 'CL', name: 'Chile' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'PE', name: 'Peru' },
  { code: 'JP', name: 'Japão' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'AU', name: 'Austrália' },
  { code: 'NZ', name: 'Nova Zelândia' },
]

/** Mapa código → nome para exibição rápida */
export const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name])
)

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code
}
