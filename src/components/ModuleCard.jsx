function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ModuleCard({ name, description, accent, icon }) {
  return (
    <button
      className="w-full text-left rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 active:scale-95 cursor-pointer"
      style={{
        backgroundColor: hexToRgba(accent, 0.07),
        border: `1px solid ${hexToRgba(accent, 0.18)}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: hexToRgba(accent, 0.14),
          color: accent,
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col gap-0.5">
        <p
          className="font-semibold text-sm leading-snug"
          style={{ color: '#1C1410' }}
        >
          {name}
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'rgba(28, 20, 16, 0.5)' }}
        >
          {description}
        </p>
      </div>
    </button>
  )
}
