import { useEffect, useState } from 'react'
import { WorkspaceCanvas } from './components/WorkspaceCanvas'
import { DirectPortfolio } from './components/DirectPortfolio'
import { FocusPanel } from './components/FocusPanel'
import { SystemOS } from './components/SystemOS'
import type { FocusTarget } from './types'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [focus, setFocus] = useState<FocusTarget>('room')
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [direct, setDirect] = useState(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [monitorReady, setMonitorReady] = useState(false)

  useEffect(() => {
    const move = (event: PointerEvent) => {
      setPointer({ x: (event.clientX / window.innerWidth - 0.5) * 2, y: (event.clientY / window.innerHeight - 0.5) * 2 })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useEffect(() => {
    if (focus !== 'monitor') {
      setMonitorReady(false)
      return
    }
    const timer = window.setTimeout(() => setMonitorReady(true), 560)
    return () => window.clearTimeout(timer)
  }, [focus])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focus !== 'room') setFocus('room')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setEntered(true)
        setFocus('monitor')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [focus])

  if (direct) return <DirectPortfolio onClose={() => setDirect(false)} />

  return (
    <div className="app-shell">
      <div className="canvas-layer"><WorkspaceCanvas focus={focus} pointer={pointer} onFocus={setFocus} onHover={setHoverLabel} /></div>

      {!entered && (
        <div className="entry-screen">
          <div className="entry-copy">
            <span className="entry-kicker">SIMON BALANOFF / WORKSPACE</span>
            <h1>Build. Learn.<br />Make it interesting.</h1>
            <p>A portfolio you can walk through without actually having to walk anywhere.</p>
            <div className="entry-actions">
              <button className="primary-action" type="button" onClick={() => setEntered(true)}>Enter workspace</button>
              <button className="text-action" type="button" onClick={() => setDirect(true)}>Skip to portfolio →</button>
            </div>
          </div>
          <div className="entry-meta"><span>THREE.JS / REACT</span><span>FORT COLLINS, CO</span></div>
        </div>
      )}

      {entered && focus === 'room' && (
        <div className="workspace-hud">
          <div className="hud-name"><span>SIMON</span><strong>WORKSPACE</strong></div>
          <div className="hud-instructions">{hoverLabel ?? 'Select an object to explore'}</div>
          <button className="skip-button" type="button" onClick={() => setDirect(true)}>Portfolio index</button>
        </div>
      )}

      {entered && focus !== 'room' && focus !== 'monitor' && <FocusPanel focus={focus} onBack={() => setFocus('room')} />}
      {entered && focus === 'monitor' && !monitorReady && <div className="monitor-entering"><span>SB/OS</span><small>connecting to workspace</small></div>}
      {entered && focus === 'monitor' && monitorReady && <SystemOS onClose={() => setFocus('room')} />}

      {entered && focus !== 'room' && focus !== 'monitor' && <div className="focus-vignette" />}
    </div>
  )
}
