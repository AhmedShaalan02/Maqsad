import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuranPage from './pages/QuranPage'
import QuranSessionPage from './pages/QuranSessionPage'
import HadithPage from './pages/HadithPage'
import HadithBrowsePage from './pages/HadithBrowsePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quran" element={<QuranPage />} />
        <Route path="/quran/session" element={<QuranSessionPage />} />
        <Route path="/hadith" element={<HadithPage />} />
        <Route path="/hadith/browse" element={<HadithBrowsePage />} />
      </Routes>
    </BrowserRouter>
  )
}
