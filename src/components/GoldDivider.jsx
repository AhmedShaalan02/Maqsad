export default function GoldDivider({ mx = 4 }) {
  return (
    <div className={`flex items-center gap-2 mx-${mx} my-1`}>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(196,151,58,0.25)' }} />
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C4973A' }} />
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(196,151,58,0.25)' }} />
    </div>
  )
}
