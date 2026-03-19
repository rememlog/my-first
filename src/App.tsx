import { RaceResultPage } from './pages/RaceResultPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>경마 승부예측</h1>
        <p>공공데이터 기반 경마 분석 미니앱</p>
      </header>

      <main className="main">
        <RaceResultPage />
      </main>
    </div>
  )
}

export default App
