import { FIFA_TO_ISO2 } from '@/lib/constants'

export function TeamFlag({ code }: { code: string }) {
  const iso2 = FIFA_TO_ISO2[code]
  if (!iso2) return null
  return (
    <span
      className={`fi fi-${iso2}`}
      style={{
        width: '1.25em',
        height: '0.9em',
        backgroundSize: 'cover',
        borderRadius: 2,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  )
}
