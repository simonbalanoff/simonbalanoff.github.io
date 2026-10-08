import { useEffect, useMemo, useState } from 'react'
import { DeskScene } from './components/DeskScene'

type SceneFocus = 'overview' | 'monitor' | 'acm' | 'uta'

const REQUIRED_SIGNALS = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'acm', 'uta'] as const

export default function App() {
  const [focus, setFocus] = useState<SceneFocus>('overview')
  const [visited, setVisited] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('simon-portfolio-signals')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem('simon-portfolio-signals', JSON.stringify(visited))
  }, [visited])

  const markVisited = (id: string) => {
    setVisited((current) => current.includes(id) ? current : [...current, id])
  }

  const changeFocus = (next: SceneFocus) => {
    setFocus(next)
    if (next === 'acm' || next === 'uta') markVisited(next)
  }

  const questComplete = useMemo(() => REQUIRED_SIGNALS.every((item) => visited.includes(item)), [visited])

  return (
    <main className="portfolio-shell">
      <DeskScene focus={focus} onFocus={changeFocus} visited={visited} onVisit={markVisited} questComplete={questComplete} />
      <header className="site-chrome">
        <button type="button" className="site-brand" onClick={() => changeFocus('overview')}>
          <strong>SIMON BALANOFF</strong>
          <span>interactive workspace</span>
        </button>
        <nav aria-label="Workspace shortcuts">
          <button type="button" className={focus === 'monitor' ? 'active' : ''} onClick={() => changeFocus('monitor')}>Computer</button>
          <button type="button" className={focus === 'acm' ? 'active' : ''} onClick={() => changeFocus('acm')}>ACM</button>
          <button type="button" className={focus === 'uta' ? 'active' : ''} onClick={() => changeFocus('uta')}>UTA</button>
        </nav>
      </header>
      {focus === 'overview' && (
        <div className="room-hint">
          <strong>Start with the monitor.</strong>
          <span>The portfolio lives there. A few things on the desk are worth poking too.</span>
        </div>
      )}
      {focus !== 'overview' && (
        <button type="button" className="back-to-room" onClick={() => changeFocus('overview')}>← Back to room</button>
      )}
    </main>
  )
}
