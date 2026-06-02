import Header from './components/Header'
import ModuleCard from './components/ModuleCard'
import SupportStrip from './components/SupportStrip'
import { modules } from './modules/moduleData'

export default function App() {
  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>
      <Header />

      <main className="px-4 pt-6 pb-2">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(28, 20, 16, 0.35)', letterSpacing: '0.16em' }}
        >
          Modules
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {modules.map(mod => (
            <ModuleCard key={mod.id} {...mod} />
          ))}
        </div>
      </main>

      <SupportStrip />
    </div>
  )
}
