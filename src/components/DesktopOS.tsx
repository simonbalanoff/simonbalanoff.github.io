import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { experience, profile, projects, skills } from '../content/portfolio'
import type { AppId, Project, WindowState } from '../types'

type DesktopOSProps = {
  active: boolean
  onExit: () => void
  visited: string[]
  onVisit: (id: string) => void
  questComplete: boolean
}

type IconKind = 'user' | 'folder' | 'briefcase' | 'research' | 'document' | 'mail' | 'terminal' | 'signal' | 'archive'

type AppDefinition = {
  id: AppId
  title: string
  desktopTitle: string
  icon: IconKind
  width: number
  height: number
  required?: boolean
  hidden?: boolean
}

const SCREEN_WIDTH = 1024
const SCREEN_HEIGHT = 600
const TASKBAR_HEIGHT = 38

const apps: AppDefinition[] = [
  { id: 'about', title: 'About Simon', desktopTitle: 'About Me', icon: 'user', width: 520, height: 380, required: true },
  { id: 'projects', title: 'Projects', desktopTitle: 'Projects', icon: 'folder', width: 720, height: 440, required: true },
  { id: 'experience', title: 'Experience', desktopTitle: 'Experience', icon: 'briefcase', width: 650, height: 420, required: true },
  { id: 'research', title: 'Research Notes', desktopTitle: 'Research', icon: 'research', width: 650, height: 420, required: true },
  { id: 'resume', title: 'Resume', desktopTitle: 'Resume', icon: 'document', width: 620, height: 435, required: true },
  { id: 'contact', title: 'Contact', desktopTitle: 'Contact', icon: 'mail', width: 540, height: 360, required: true },
  { id: 'terminal', title: 'Terminal', desktopTitle: 'Terminal', icon: 'terminal', width: 590, height: 340 },
  { id: 'signal', title: 'Signal Log', desktopTitle: 'Signal Log', icon: 'signal', width: 470, height: 340, hidden: true },
  { id: 'archive', title: 'Hidden Archive', desktopTitle: 'Hidden Archive', icon: 'archive', width: 620, height: 410, hidden: true }
]

const appMap = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, AppDefinition>
const requiredSignals = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'acm', 'uta']


type FsFile = { type: 'file'; content: string; app?: AppId }
type FsDir = { type: 'dir'; children: Record<string, FsNode>; app?: AppId }
type FsNode = FsFile | FsDir

function buildFilesystem(questComplete: boolean): FsDir {
  const projectChildren: Record<string, FsNode> = {}
  projects.forEach((project) => {
    projectChildren[`${project.id}.txt`] = {
      type: 'file',
      app: 'projects',
      content: `${project.name}\n${project.status}\n\n${project.tagline}\n\n${project.description}\n\nStack: ${project.stack.join(', ')}\n\nHighlights:\n- ${project.highlights.join('\n- ')}`
    }
  })

  const experienceChildren: Record<string, FsNode> = {}
  experience.forEach((item, index) => {
    const name = `${String(index + 1).padStart(2, '0')}-${item.role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.txt`
    experienceChildren[name] = { type: 'file', content: `${item.role}\n${item.organization}\n${item.period}\n\n${item.description}\n\n${item.tags.join(' · ')}` }
  })

  const appChildren: Record<string, FsNode> = {}
  ;(['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal', 'signal'] as AppId[]).forEach((id) => {
    appChildren[`${id}.app`] = { type: 'file', app: id, content: `SIMON/OS application\nname: ${appMap[id].title}\ncommand: open ${id}` }
  })
  if (questComplete) appChildren['archive.app'] = { type: 'file', app: 'archive', content: 'SIMON/OS hidden application\nname: Hidden Archive\nstatus: unlocked' }

  const simonChildren: Record<string, FsNode> = {
    'about.txt': { type: 'file', app: 'about', content: `${profile.name}\n${profile.title}\n\n${profile.intro}\n\nCurrently:\n- ${profile.currently.join('\n- ')}` },
    'resume.txt': { type: 'file', app: 'resume', content: `${profile.name}\n${profile.school} · ${profile.graduation}\n\nEXPERIENCE\n${experience.map((item) => `\n${item.role} — ${item.organization}\n${item.period}\n${item.description}`).join('\n')}\n\nSKILLS\n${skills.join(' · ')}` },
    'contact.txt': { type: 'file', app: 'contact', content: `GitHub: ${profile.links.github}\nLinkedIn: ${profile.links.linkedin}\nEmail: ${profile.links.email.replace('mailto:', '')}\nResume: ${profile.links.resume}` },
    'manifesto.txt': { type: 'file', content: 'Build things worth using. Stay curious. Make complicated things understandable.' },
    projects: { type: 'dir', app: 'projects', children: projectChildren },
    experience: { type: 'dir', app: 'experience', children: experienceChildren },
    research: { type: 'dir', app: 'research', children: {
      'bci.txt': { type: 'file', content: 'Brain-computer interfaces\n\nHow can machine learning turn noisy neural signals into reliable intent for prosthetic control?' },
      'adaptive-systems.txt': { type: 'file', content: 'Adaptive systems\n\nA useful model should adapt to one person over time without becoming unpredictable.' },
      'human-control.txt': { type: 'file', content: 'Human control\n\nWhere should autonomous assistance end and direct user control begin?' },
      'trust.txt': { type: 'file', content: 'Trust\n\nA technically accurate system still fails if the person using it cannot understand or trust what it will do.' }
    } },
    apps: { type: 'dir', children: appChildren },
    '.quest': { type: 'file', content: questComplete ? '8/8 signals. The archive is unlocked. Try: open archive' : 'The workspace notices curiosity. Explore the apps, ACM, and UTA. There are eight signals.' },
    '.secrets': { type: 'dir', children: {
      'piano.txt': { type: 'file', content: 'Rachmaninoff · Scriabin · Medtner · Chopin. If you found this from the terminal, you are using the site correctly.' },
      'rubber-duck.txt': { type: 'file', content: 'Senior debugging consultant. Compensation: one quack per resolved issue.' },
      ...(questComplete ? { 'archive.txt': { type: 'file' as const, app: 'archive' as AppId, content: 'Achievement unlocked: Actually explored the portfolio.\n\nTry: open archive' } } : {})
    } }
  }

  return { type: 'dir', children: { home: { type: 'dir', children: { simon: { type: 'dir', children: simonChildren } } } } }
}

function normalizeFsPath(cwd: string, rawPath = '.') {
  const raw = rawPath.trim() || '.'
  const expanded = raw === '~' ? '/home/simon' : raw.startsWith('~/') ? `/home/simon/${raw.slice(2)}` : raw
  const joined = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`
  const stack: string[] = []
  joined.split('/').forEach((part) => {
    if (!part || part === '.') return
    if (part === '..') stack.pop()
    else stack.push(part)
  })
  return `/${stack.join('/')}`
}

function fsNodeAt(root: FsDir, path: string): FsNode | null {
  if (path === '/') return root
  let node: FsNode = root
  for (const part of path.split('/').filter(Boolean)) {
    if (node.type !== 'dir' || !node.children[part]) return null
    node = node.children[part]
  }
  return node
}

function fsDisplayPath(path: string) {
  if (path === '/home/simon') return '~'
  if (path.startsWith('/home/simon/')) return `~/${path.slice('/home/simon/'.length)}`
  return path
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function initialWindow(app: AppDefinition, order: number): WindowState {
  const stagger = (order % 5) * 20
  return {
    id: app.id,
    title: app.title,
    x: clamp(120 + stagger, 8, SCREEN_WIDTH - app.width - 8),
    y: clamp(64 + stagger, 8, SCREEN_HEIGHT - TASKBAR_HEIGHT - app.height - 8),
    width: app.width,
    height: app.height,
    z: 20 + order,
    minimized: false,
    maximized: false
  }
}

function AppIcon({ kind, small = false }: { kind: IconKind; small?: boolean }) {
  const size = small ? 18 : 38
  const common = { width: size, height: size, viewBox: '0 0 48 48', 'aria-hidden': true as const }
  if (kind === 'user') return <svg className="sos-app-icon" {...common}><circle cx="24" cy="17" r="8" fill="#d7e4ea"/><path d="M10 41c1-10 7-15 14-15s13 5 14 15" fill="#7892a1"/><circle cx="24" cy="17" r="7" fill="#efc9a9"/><path d="M17 16c1-6 4-9 9-8 4 1 6 4 6 8-4-1-10-4-15 0z" fill="#4a3d37"/></svg>
  if (kind === 'folder') return <svg className="sos-app-icon" {...common}><path d="M5 14c0-3 2-5 5-5h11l4 5h13c3 0 5 2 5 5v19c0 3-2 5-5 5H10c-3 0-5-2-5-5z" fill="#d5a85f"/><path d="M6 20h36v18c0 2-2 4-4 4H10c-2 0-4-2-4-4z" fill="#e8bd74"/><path d="M8 21h32" stroke="#f7dda7" strokeWidth="2"/></svg>
  if (kind === 'briefcase') return <svg className="sos-app-icon" {...common}><path d="M17 13V9c0-2 2-4 4-4h7c2 0 4 2 4 4v4" fill="none" stroke="#40515d" strokeWidth="3"/><rect x="5" y="13" width="38" height="28" rx="7" fill="#607783"/><path d="M5 25c11 5 27 5 38 0" fill="none" stroke="#97aab2" strokeWidth="2"/><rect x="21" y="23" width="6" height="7" rx="2" fill="#d7c6a2"/></svg>
  if (kind === 'research') return <svg className="sos-app-icon" {...common}><circle cx="21" cy="21" r="13" fill="#7c9d91"/><path d="M31 31l10 10" stroke="#34454b" strokeWidth="5" strokeLinecap="round"/><path d="M14 22c3-6 8-8 14-4M16 27c5 2 9 1 12-2" fill="none" stroke="#d9ece5" strokeWidth="2" strokeLinecap="round"/></svg>
  if (kind === 'document') return <svg className="sos-app-icon" {...common}><path d="M10 4h22l8 8v32H10z" fill="#f7f7f2" stroke="#81909a"/><path d="M32 4v9h8" fill="#dce8ec" stroke="#81909a"/><path d="M16 20h18M16 26h16M16 32h18M16 38h13" stroke="#71808a" strokeWidth="2" strokeLinecap="round"/></svg>
  if (kind === 'mail') return <svg className="sos-app-icon" {...common}><rect x="5" y="10" width="38" height="28" rx="7" fill="#9ab4c2"/><path d="M8 14l16 13 16-13" fill="none" stroke="#f5f8f8" strokeWidth="3"/><path d="M8 35l12-11M40 35L28 24" stroke="#d9e5e9" strokeWidth="2"/></svg>
  if (kind === 'terminal') return <svg className="sos-app-icon" {...common}><rect x="5" y="7" width="38" height="34" rx="7" fill="#20292f"/><path d="M12 17l7 6-7 6M23 31h12" fill="none" stroke="#d7e6df" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  if (kind === 'signal') return <svg className="sos-app-icon" {...common}><circle cx="24" cy="24" r="18" fill="#2d3940"/><path d="M24 9l3.5 10.5L39 20l-9 6.5L33 38l-9-6.5L15 38l3-11.5L9 20l11.5-.5z" fill="#d9b66d"/></svg>
  return <svg className="sos-app-icon" {...common}><rect x="7" y="8" width="34" height="32" rx="7" fill="#35444d"/><path d="M14 17h20v16H14z" fill="#d5c097"/><path d="M17 20h14M17 25h11M17 30h9" stroke="#675b49" strokeWidth="2" strokeLinecap="round"/><circle cx="37" cy="12" r="6" fill="#d9b66d"/></svg>
}

function DesktopIcon({ app, onOpen }: { app: AppDefinition; onOpen: () => void }) {
  return (
    <button className="sos-desktop-icon" type="button" onDoubleClick={onOpen} onClick={onOpen} aria-label={`Open ${app.desktopTitle}`}>
      <span className="sos-icon-tile"><AppIcon kind={app.icon} /></span>
      <span>{app.desktopTitle}</span>
    </button>
  )
}

function WindowFrame({ state, desktopRef, onFocus, onMove, onClose, onMinimize, onToggleMaximize, children }: {
  state: WindowState
  desktopRef: RefObject<HTMLDivElement | null>
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  children: ReactNode
}) {
  const drag = useRef<{ pointerId: number; startX: number; startY: number; windowX: number; windowY: number } | null>(null)

  if (state.minimized) return null

  const pointerToDesktop = (clientX: number, clientY: number) => {
    const desktop = desktopRef.current
    const projection = desktop?.closest('.monitor-os-projection') as HTMLElement | null
    if (!desktop || !projection) return null
    const transform = window.getComputedStyle(projection).transform
    if (!transform || transform === 'none') return null
    try {
      const inverse = new DOMMatrixReadOnly(transform).inverse()
      const point = new DOMPoint(clientX, clientY, 0, 1).matrixTransform(inverse)
      const w = Math.abs(point.w) > 0.000001 ? point.w : 1
      return { x: point.x / w, y: point.y / w }
    } catch {
      return null
    }
  }

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onFocus()
    if (state.maximized || !desktopRef.current) return
    const local = pointerToDesktop(event.clientX, event.clientY)
    if (!local) return
    drag.current = { pointerId: event.pointerId, startX: local.x, startY: local.y, windowX: state.x, windowY: state.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || state.maximized) return
    const local = pointerToDesktop(event.clientX, event.clientY)
    if (!local) return
    const nextX = drag.current.windowX + (local.x - drag.current.startX)
    const nextY = drag.current.windowY + (local.y - drag.current.startY)
    onMove(clamp(nextX, 0, SCREEN_WIDTH - state.width), clamp(nextY, 0, SCREEN_HEIGHT - TASKBAR_HEIGHT - 30))
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <section className={`sos-window ${state.maximized ? 'maximized' : ''}`} style={state.maximized ? { zIndex: state.z } : { left: state.x, top: state.y, width: state.width, height: state.height, zIndex: state.z }} onPointerDown={onFocus}>
      <div className="sos-titlebar" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onDoubleClick={onToggleMaximize}>
        <div className="sos-title"><AppIcon kind={appMap[state.id].icon} small /><strong>{state.title}</strong></div>
        <div className="sos-window-controls">
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onMinimize} aria-label={`Minimize ${state.title}`}>−</button>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onToggleMaximize} aria-label={`${state.maximized ? 'Restore' : 'Maximize'} ${state.title}`}>{state.maximized ? '↙' : '□'}</button>
          <button type="button" className="close" onPointerDown={(event) => event.stopPropagation()} onClick={onClose} aria-label={`Close ${state.title}`}>×</button>
        </div>
      </div>
      <div className="sos-window-body" onWheel={(event) => event.stopPropagation()}>{children}</div>
    </section>
  )
}

function AboutApp() {
  return (
    <div className="sos-app-page sos-about">
      <div className="sos-profile-row">
        <div className="sos-avatar">SB</div>
        <div><span className="sos-kicker">ABOUT</span><h2>{profile.name}</h2><p>{profile.title}</p></div>
      </div>
      <p className="sos-lede">{profile.intro}</p>
      <div className="sos-fact-grid">
        <div><span>School</span><strong>{profile.school}</strong></div>
        <div><span>Graduation</span><strong>{profile.graduation}</strong></div>
        <div><span>Focus</span><strong>AI / Machine Learning</strong></div>
        <div><span>Also</span><strong>Pianist · Teacher · Builder</strong></div>
      </div>
      <div className="sos-chip-wrap">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
    </div>
  )
}

function ProjectsApp() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Project | null>(null)
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return projects
    return projects.filter((project) => `${project.name} ${project.tagline} ${project.stack.join(' ')}`.toLowerCase().includes(text))
  }, [query])

  if (selected) {
    return (
      <div className="sos-app-page sos-project-detail">
        <button className="sos-text-button" type="button" onClick={() => setSelected(null)}>← All projects</button>
        <div className="sos-project-hero"><div><span className="sos-status-dot" />{selected.status}</div><h2>{selected.name}</h2><p>{selected.tagline}</p></div>
        <p>{selected.description}</p>
        <div className="sos-chip-wrap">{selected.stack.map((item) => <span key={item}>{item}</span>)}</div>
        <div className="sos-section"><span className="sos-kicker">SELECTED WORK</span>{selected.highlights.map((highlight) => <div className="sos-highlight" key={highlight}><span>↗</span><p>{highlight}</p></div>)}</div>
      </div>
    )
  }

  return (
    <div className="sos-projects-layout">
      <aside className="sos-sidebar"><strong>Projects</strong><span>{projects.length} selected builds</span><div className="sos-sidebar-rule"/><small>Tip: every folder opens.</small></aside>
      <div className="sos-projects-main">
        <div className="sos-toolbar"><label><span>Search</span><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="name or technology" /></label></div>
        <div className="sos-project-grid">{filtered.map((project) => <button type="button" key={project.id} onClick={() => setSelected(project)}><AppIcon kind="folder"/><span><strong>{project.name}</strong><small>{project.tagline}</small></span></button>)}</div>
      </div>
    </div>
  )
}

function ExperienceApp() {
  return (
    <div className="sos-app-page">
      <span className="sos-kicker">WORK / LEAD / TEACH</span>
      <h2>Experience</h2>
      <div className="sos-timeline">{experience.map((item) => <article key={`${item.role}-${item.organization}`}><div className="sos-timeline-dot"/><div className="sos-timeline-date">{item.period}</div><div><h3>{item.role}</h3><strong>{item.organization}</strong><p>{item.description}</p><div className="sos-chip-wrap compact">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}</div>
    </div>
  )
}

function ResearchApp() {
  const [note, setNote] = useState(0)
  const notes = [
    ['Brain-computer interfaces', 'How can machine learning turn noisy neural signals into reliable intent for prosthetic control?'],
    ['Adaptive systems', 'A useful model should adapt to one person over time without becoming unpredictable.'],
    ['Human control', 'Where should autonomous assistance end and direct user control begin?'],
    ['Trust', 'A technically accurate system still fails if the person using it cannot understand or trust what it will do.']
  ]
  return (
    <div className="sos-research-layout">
      <aside>{notes.map(([title], index) => <button type="button" className={index === note ? 'active' : ''} key={title} onClick={() => setNote(index)}>{title}</button>)}</aside>
      <div className="sos-app-page"><span className="sos-kicker">RESEARCH NOTEBOOK</span><h2>{notes[note][0]}</h2><p className="sos-lede">{notes[note][1]}</p><div className="sos-note-card"><strong>Long-term pull</strong><p>I want to work on intelligent assistive systems that feel less like commanding a machine and more like extending the body.</p></div></div>
    </div>
  )
}

function ResumeApp() {
  return (
    <div className="sos-resume-scroll">
      <article className="sos-resume-paper">
        <header><div><h2>{profile.name}</h2><p>Computer Science · AI & Machine Learning</p></div><span>Colorado State University · {profile.graduation}</span></header>
        <section><h3>Experience</h3>{experience.map((item) => <div className="sos-resume-row" key={`${item.role}-${item.organization}`}><div><strong>{item.role}</strong><span>{item.organization}</span></div><time>{item.period}</time><p>{item.description}</p></div>)}</section>
        <section><h3>Selected Projects</h3>{projects.slice(0, 4).map((project) => <div className="sos-resume-row" key={project.id}><div><strong>{project.name}</strong><span>{project.stack.join(' · ')}</span></div><p>{project.tagline}</p></div>)}</section>
        <section><h3>Skills</h3><p>{skills.join(' · ')}</p></section>
      </article>
    </div>
  )
}

function ContactApp() {
  const links = [
    ['GitHub', profile.links.github, 'github.com/simonbalanoff'],
    ['LinkedIn', profile.links.linkedin, profile.links.linkedin.includes('REPLACE_ME') ? 'add your LinkedIn URL in portfolio.ts' : 'LinkedIn profile'],
    ['Email', profile.links.email, profile.links.email.includes('REPLACE_ME') ? 'add your email in portfolio.ts' : profile.links.email.replace('mailto:', '')],
    ['Resume', profile.links.resume, profile.links.resume === '#' ? 'add your resume URL in portfolio.ts' : 'Open resume']
  ]
  return (
    <div className="sos-app-page">
      <span className="sos-kicker">CONTACT</span><h2>Say hello.</h2><p className="sos-lede">Internships, research, projects, ACM, or anything interesting enough to justify a message.</p>
      <div className="sos-contact-list">{links.map(([label, href, detail]) => href === '#' || href.includes('REPLACE_ME') ? <div className="disabled" key={label}><strong>{label}</strong><span>{detail}</span></div> : <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"><strong>{label}</strong><span>{detail}</span><b>↗</b></a>)}</div>
    </div>
  )
}

function TerminalApp({ onOpenApp, questComplete }: { onOpenApp: (id: AppId) => void; questComplete: boolean }) {
  const [history, setHistory] = useState<string[]>(['SIMON/OS terminal', 'Type help for commands.'])
  const [value, setValue] = useState('')
  const [cwd, setCwd] = useState('/home/simon')
  const inputRef = useRef<HTMLInputElement>(null)
  const commandHistory = useRef<string[]>([])
  const historyIndex = useRef(0)

  const appAliases: Record<string, AppId> = {
    about: 'about', projects: 'projects', experience: 'experience', research: 'research', resume: 'resume', contact: 'contact', terminal: 'terminal', signal: 'signal', archive: 'archive'
  }

  const runCommand = (entered: string) => {
    const raw = entered.trim()
    if (!raw) return
    commandHistory.current.push(raw)
    historyIndex.current = commandHistory.current.length
    let next = [...history, `visitor@simon-os:${fsDisplayPath(cwd)}$ ${raw}`]
    const parts = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^[\"']|[\"']$/g, '')) ?? []
    const command = (parts[0] ?? '').toLowerCase()
    const args = parts.slice(1)
    const fs = buildFilesystem(questComplete)
    const append = (...lines: string[]) => { next.push(...lines) }
    const resolve = (path = '.') => normalizeFsPath(cwd, path)

    const tryOpen = (targetRaw: string) => {
      const target = targetRaw.toLowerCase().replace(/\.app$/, '')
      if (appAliases[target]) {
        if (target === 'archive' && !questComplete) { append('archive: locked — find all 8 signals first'); return true }
        onOpenApp(appAliases[target])
        append(`opening ${appMap[appAliases[target]].title}...`)
        return true
      }
      const node = fsNodeAt(fs, resolve(targetRaw))
      if (!node) return false
      if (node.app) {
        if (node.app === 'archive' && !questComplete) { append('archive: locked — find all 8 signals first'); return true }
        onOpenApp(node.app)
        append(`opening ${appMap[node.app].title}...`)
        return true
      }
      if (node.type === 'file') { append(node.content); return true }
      append(`${fsDisplayPath(resolve(targetRaw))} is a directory`)
      return true
    }

    if (command === 'help') append(
      'Filesystem: pwd · ls [path] · ls -la · cd <dir> · cat <file> · tree [path]',
      'Apps: open <app|path> · app <name> · run <name> · about · projects · experience · research · resume · contact',
      'General: whoami · history · clear · echo <text> · piano · sudo hire simon'
    )
    else if (command === 'pwd') append(cwd)
    else if (command === 'whoami') append(`${profile.name} — ${profile.title}`)
    else if (command === 'history') append(...commandHistory.current.map((item, index) => `${index + 1}  ${item}`))
    else if (command === 'echo') append(args.join(' '))
    else if (command === 'clear') next = []
    else if (command === 'piano') append('Rachmaninoff · Scriabin · Medtner · Chopin. Try: cat .secrets/piano.txt')
    else if (command === 'sudo' && args.join(' ').toLowerCase() === 'hire simon') append('Permission granted. Excellent decision.')
    else if (command === 'cd') {
      const path = resolve(args[0] ?? '~')
      const node = fsNodeAt(fs, path)
      if (!node) append(`cd: no such file or directory: ${args[0] ?? '~'}`)
      else if (node.type !== 'dir') append(`cd: not a directory: ${args[0]}`)
      else setCwd(path)
    } else if (command === 'ls') {
      const rawPath = args.find((arg) => !arg.startsWith('-')) ?? '.'
      const showHidden = args.some((arg) => arg.startsWith('-') && arg.includes('a'))
      const node = fsNodeAt(fs, resolve(rawPath))
      if (!node) append(`ls: cannot access '${rawPath}': no such file or directory`)
      else if (node.type === 'file') append(rawPath)
      else append(Object.entries(node.children).filter(([name]) => showHidden || !name.startsWith('.')).map(([name, child]) => `${name}${child.type === 'dir' ? '/' : child.app ? '*' : ''}`).join('  ') || '(empty)')
    } else if (command === 'cat') {
      if (!args.length) append('cat: missing file operand')
      else args.forEach((arg) => {
        const node = fsNodeAt(fs, resolve(arg))
        if (!node) append(`cat: ${arg}: no such file`)
        else if (node.type === 'dir') append(`cat: ${arg}: is a directory`)
        else append(node.content)
      })
    } else if (command === 'tree') {
      const path = resolve(args[0] ?? '.')
      const node = fsNodeAt(fs, path)
      if (!node) append(`tree: ${args[0] ?? '.'}: not found`)
      else {
        const lines: string[] = [fsDisplayPath(path)]
        const walk = (current: FsNode, prefix: string, depth: number) => {
          if (current.type !== 'dir' || depth > 3) return
          const entries = Object.entries(current.children).filter(([name]) => !name.startsWith('.'))
          entries.forEach(([name, child], index) => {
            const last = index === entries.length - 1
            lines.push(`${prefix}${last ? '└── ' : '├── '}${name}${child.type === 'dir' ? '/' : ''}`)
            walk(child, `${prefix}${last ? '    ' : '│   '}`, depth + 1)
          })
        }
        walk(node, '', 0)
        append(...lines)
      }
    } else if (command === 'open' || command === 'app' || command === 'run') {
      if (!args[0]) append(`${command}: missing target`)
      else if (!tryOpen(args.join(' '))) append(`${command}: cannot open ${args.join(' ')}`)
    } else if (appAliases[command]) {
      if (command === 'archive' && !questComplete) append('archive: locked — find all 8 signals first')
      else { onOpenApp(appAliases[command]); append(`opening ${appMap[appAliases[command]].title}...`) }
    } else if (raw.startsWith('./')) {
      if (!tryOpen(raw)) append(`${raw}: no such executable`)
    } else append(`command not found: ${command}. Type help.`)

    setHistory(next.slice(-100))
    setValue('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    runCommand(value)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!commandHistory.current.length) return
      historyIndex.current = Math.max(0, historyIndex.current - 1)
      setValue(commandHistory.current[historyIndex.current] ?? '')
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      historyIndex.current = Math.min(commandHistory.current.length, historyIndex.current + 1)
      setValue(commandHistory.current[historyIndex.current] ?? '')
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const options = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal', 'signal', ...(questComplete ? ['archive'] : [])]
      const match = options.find((option) => option.startsWith(value.toLowerCase()))
      if (match) setValue(match)
    }
  }

  return (
    <div className="sos-terminal" onClick={() => inputRef.current?.focus()}>
      <div>{history.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      <form onSubmit={submit}><span>visitor@simon-os:{fsDisplayPath(cwd)}$</span><input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} aria-label="Terminal command" autoFocus /></form>
    </div>
  )
}

function SignalApp({ visited, complete }: { visited: string[]; complete: boolean }) {
  return (
    <div className="sos-app-page">
      <span className="sos-kicker">ANOMALOUS SIGNAL</span><h2>{complete ? 'Signal complete.' : 'Something is hiding in here.'}</h2>
      <p className="sos-lede">{complete ? 'You explored the whole workspace. A new file has appeared on the desktop.' : 'The computer seems to notice when you explore. There are eight signals to find.'}</p>
      <div className="sos-signal-grid">{requiredSignals.map((signal) => <div className={visited.includes(signal) ? 'found' : ''} key={signal}><span>{visited.includes(signal) ? '✦' : '·'}</span><strong>{visited.includes(signal) ? signal.toUpperCase() : '???'}</strong></div>)}</div>
    </div>
  )
}

function ArchiveApp({ party, onParty }: { party: boolean; onParty: () => void }) {
  const [duckCount, setDuckCount] = useState(0)
  const [openProject, setOpenProject] = useState(false)
  return (
    <div className="sos-app-page sos-archive">
      <span className="sos-kicker">YOU FOUND IT</span><h2>Simon's hidden archive</h2><p>You actually clicked through the portfolio. Respect.</p>
      <div className="sos-easter-grid">
        <button type="button" onClick={() => setDuckCount((value) => value + 1)}><strong>rubber_duck.exe</strong><span>{duckCount ? `quack count: ${duckCount}` : 'debugging assistant'}</span></button>
        <button type="button" onClick={() => setOpenProject((value) => !value)}><strong>unfinished_projects.zip</strong><span>{openProject ? 'too many ideas, not enough weekends' : 'classified-ish'}</span></button>
        <button type="button" onClick={onParty}><strong>party_mode.sys</strong><span>{party ? 'enabled ✦' : 'do not press'}</span></button>
        <button type="button" onClick={() => window.open(profile.links.github, '_blank', 'noopener,noreferrer')}><strong>source_code.url</strong><span>the least secret file here</span></button>
      </div>
      <div className="sos-final-note">Achievement unlocked: <strong>Actually explored the portfolio</strong></div>
    </div>
  )
}

export function DesktopOS({ active, onExit, visited, onVisit, questComplete }: DesktopOSProps) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const [windows, setWindows] = useState<WindowState[]>([])
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [time, setTime] = useState(() => new Date())
  const [party, setParty] = useState(false)
  const [showSeconds, setShowSeconds] = useState(false)
  const [konamiIndex, setKonamiIndex] = useState(0)
  const maxZ = useRef(30)
  const visibleApps = apps.filter((app) => !app.hidden)
  const discoveredSignals = requiredSignals.filter((signal) => visited.includes(signal)).length

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    const handler = (event: KeyboardEvent) => {
      if (!active) return
      const expected = sequence[konamiIndex]
      if (event.key === expected) {
        const next = konamiIndex + 1
        if (next === sequence.length) {
          setParty(true)
          setKonamiIndex(0)
          openApp('archive', true)
        } else setKonamiIndex(next)
      } else setKonamiIndex(event.key === sequence[0] ? 1 : 0)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, konamiIndex])

  const focusWindow = (id: AppId) => {
    maxZ.current += 1
    setWindows((current) => current.map((windowState) => windowState.id === id ? { ...windowState, z: maxZ.current, minimized: false } : windowState))
  }

  const openApp = (id: AppId, force = false) => {
    if (!active && !force) return
    if (requiredSignals.includes(id)) onVisit(id)
    setLauncherOpen(false)
    setWindows((current) => {
      const existing = current.find((windowState) => windowState.id === id)
      maxZ.current += 1
      if (existing) return current.map((windowState) => windowState.id === id ? { ...windowState, minimized: false, z: maxZ.current } : windowState)
      return [...current, { ...initialWindow(appMap[id], current.length), z: maxZ.current }]
    })
  }

  const updateWindow = (id: AppId, patch: Partial<WindowState>) => setWindows((current) => current.map((windowState) => windowState.id === id ? { ...windowState, ...patch } : windowState))
  const closeWindow = (id: AppId) => setWindows((current) => current.filter((windowState) => windowState.id !== id))
  const activeWindow = windows.filter((windowState) => !windowState.minimized).sort((a, b) => b.z - a.z)[0]

  return (
    <div ref={desktopRef} className={`sos-desktop ${active ? 'is-active' : ''} ${party ? 'party-mode' : ''}`} onWheel={(event) => event.stopPropagation()}>
      <div className="sos-wallpaper" aria-hidden="true"><span className="mountain one"/><span className="mountain two"/><span className="sun"/>{party && Array.from({ length: 18 }).map((_, index) => <i key={index} style={{ '--i': index } as CSSProperties}>✦</i>)}</div>
      <div className="sos-desktop-icons">{visibleApps.map((app) => <DesktopIcon key={app.id} app={app} onOpen={() => openApp(app.id)} />)}{questComplete && <DesktopIcon app={appMap.archive} onOpen={() => openApp('archive')} />}</div>
      <button type="button" className="sos-status-card" onClick={() => openApp('about')}><span>SIMON/OS</span><strong>workspace online</strong><small>CS · AI/ML · building things</small></button>

      {windows.map((state) => (
        <WindowFrame key={state.id} state={state} desktopRef={desktopRef} onFocus={() => focusWindow(state.id)} onMove={(x, y) => updateWindow(state.id, { x, y })} onClose={() => closeWindow(state.id)} onMinimize={() => updateWindow(state.id, { minimized: true })} onToggleMaximize={() => updateWindow(state.id, { maximized: !state.maximized })}>
          {state.id === 'about' && <AboutApp />}
          {state.id === 'projects' && <ProjectsApp />}
          {state.id === 'experience' && <ExperienceApp />}
          {state.id === 'research' && <ResearchApp />}
          {state.id === 'resume' && <ResumeApp />}
          {state.id === 'contact' && <ContactApp />}
          {state.id === 'terminal' && <TerminalApp onOpenApp={(id) => openApp(id, true)} questComplete={questComplete} />}
          {state.id === 'signal' && <SignalApp visited={visited} complete={questComplete} />}
          {state.id === 'archive' && <ArchiveApp party={party} onParty={() => setParty((value) => !value)} />}
        </WindowFrame>
      ))}

      {launcherOpen && (
        <div className="sos-launcher">
          <header><div className="sos-avatar small">SB</div><div><strong>Simon Balanoff</strong><span>portfolio workspace</span></div></header>
          <div className="sos-launcher-grid">{visibleApps.map((app) => <button type="button" key={app.id} onClick={() => openApp(app.id)}><AppIcon kind={app.icon} small/><span><strong>{app.desktopTitle}</strong><small>{app.title}</small></span></button>)}</div>
          <footer><button type="button" onClick={onExit}>Return to room</button></footer>
        </div>
      )}

      <div className="sos-taskbar">
        <button type="button" className="sos-launcher-button" onClick={() => setLauncherOpen((value) => !value)} aria-label="Open launcher"><span>S</span><strong>Apps</strong></button>
        <div className="sos-task-buttons">{windows.map((windowState) => <button type="button" className={activeWindow?.id === windowState.id && !windowState.minimized ? 'active' : ''} key={windowState.id} onClick={() => windowState.minimized ? focusWindow(windowState.id) : activeWindow?.id === windowState.id ? updateWindow(windowState.id, { minimized: true }) : focusWindow(windowState.id)}><AppIcon kind={appMap[windowState.id].icon} small/><span>{windowState.title}</span></button>)}</div>
        <div className="sos-tray">
          {discoveredSignals > 0 && <button type="button" className={questComplete ? 'complete' : ''} onClick={() => openApp('signal')} title="Something unusual is happening">✦ {discoveredSignals}/8</button>}
          <button type="button" className="sos-clock" onClick={() => setShowSeconds((value) => !value)} title="Toggle seconds">{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: showSeconds ? '2-digit' : undefined })}</button>
        </div>
      </div>
    </div>
  )
}
