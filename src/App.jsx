import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuranPage from './pages/QuranPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quran" element={<QuranPage />} />
      </Routes>
    </BrowserRouter>
  )
}
