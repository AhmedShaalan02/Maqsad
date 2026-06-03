export function gradeStyle(grade) {
  const g = (grade || '').toLowerCase()
  if (g.includes('sahih'))
    return { bg: 'rgba(74,103,65,0.14)', color: '#2D6A4F', border: 'rgba(74,103,65,0.28)' }
  if (g.includes('hasan'))
    return { bg: 'rgba(196,151,58,0.14)', color: '#9A7020', border: 'rgba(196,151,58,0.3)' }
  if (g.includes('da') || g.includes('weak'))
    return { bg: 'rgba(139,32,32,0.1)', color: '#8B2020', border: 'rgba(139,32,32,0.22)' }
  return { bg: 'rgba(28,20,16,0.07)', color: 'rgba(28,20,16,0.5)', border: 'rgba(28,20,16,0.12)' }
}
