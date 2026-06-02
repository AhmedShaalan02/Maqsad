const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
  </svg>
)

export default function SupportStrip() {
  return (
    <div className="px-4 pb-10 pt-2">
      <button
        className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl transition-opacity active:opacity-80 cursor-pointer"
        style={{ backgroundColor: '#6B1F2A' }}
      >
        <span style={{ color: '#C4973A' }}>
          <HeartIcon />
        </span>
        <span
          className="text-sm font-medium tracking-wide"
          style={{ color: '#FAF7F2' }}
        >
          Support Maqsad
        </span>
      </button>
    </div>
  )
}
