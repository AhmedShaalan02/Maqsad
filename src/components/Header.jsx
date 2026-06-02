// 8-pointed Islamic star polygon in a 40×40 tile, pre-encoded for use as a CSS background
const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><polygon fill="white" points="20,6 22.3,14.46 29.9,10.1 25.54,17.7 34,20 25.54,22.3 29.9,29.9 22.3,25.54 20,34 17.7,25.54 10.1,29.9 14.46,22.3 6,20 14.46,17.7 10.1,10.1 17.7,14.46"/></svg>`
const PATTERN_URL = `data:image/svg+xml,${encodeURIComponent(STAR_SVG)}`

export default function Header() {
  return (
    <header style={{ backgroundColor: '#6B1F2A' }} className="relative overflow-hidden">
      {/* Islamic geometric star overlay at 10% opacity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("${PATTERN_URL}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '44px 44px',
          opacity: 0.1,
        }}
      />

      <div className="relative z-10 flex flex-col items-center pt-14 pb-12 px-6 text-center">
        <h1
          className="text-5xl font-bold"
          style={{ color: '#FAF7F2', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.04em' }}
        >
          Maqsad
        </h1>
        <p
          className="mt-2 text-3xl font-medium"
          style={{ color: '#C4973A', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          مقصد
        </p>
        <p
          className="mt-3 text-xs tracking-widest uppercase"
          style={{ color: 'rgba(250, 247, 242, 0.5)', letterSpacing: '0.18em' }}
        >
          Islamic learning · purpose driven
        </p>
      </div>
    </header>
  )
}
