/**
 * Logo Na Grade — formato ingresso.
 * Canhoto roxo vertical + picote tracejado + nome em Anton.
 */

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<LogoSize, {
  stub: string
  stubText: string
  body: string
  name: string
}> = {
  sm: {
    stub: 'px-2',
    stubText: 'text-[9px]',
    body: 'px-3 py-2',
    name: 'text-xl',
  },
  md: {
    stub: 'px-3',
    stubText: 'text-[11px]',
    body: 'px-5 py-3',
    name: 'text-3xl',
  },
  lg: {
    stub: 'px-4',
    stubText: 'text-sm',
    body: 'px-7 py-4',
    name: 'text-5xl',
  },
  xl: {
    stub: 'px-5',
    stubText: 'text-base',
    body: 'px-9 py-5',
    name: 'text-7xl',
  },
}

export function Logo({ size = 'md' }: { size?: LogoSize }) {
  const s = sizes[size]

  return (
    <div className="inline-flex items-stretch rounded-[7px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {/* Canhoto */}
      <div className={`bg-roxo ${s.stub} flex items-center`}>
        <span
          className={`font-title text-papel ${s.stubText} tracking-[0.12em] leading-none select-none`}
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          NA GRADE
        </span>
      </div>

      {/* Picote + corpo */}
      <div className={`bg-papel ticket-perforation ${s.body} flex items-center`}>
        <span className={`font-display ${s.name} text-[#100F0D] leading-none select-none`}>
          NA&nbsp;GRADE
        </span>
      </div>
    </div>
  )
}
