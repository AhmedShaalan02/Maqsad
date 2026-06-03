// Wraps matched portions of text in a yellow highlight mark.
// Falls back to plain text when no query or no match.
export default function Highlight({ text, query, style, className }) {
  if (!query?.trim() || !text) {
    return <span className={className} style={style}>{text}</span>
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  const lq = query.toLowerCase()
  return (
    <span className={className} style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === lq ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#FFF3A3',
              color: '#1C1410',
              borderRadius: '2px',
              padding: '0 1px',
              fontWeight: 'inherit',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}
