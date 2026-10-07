import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Code2, FileText, GraduationCap, Mail, Search, Sparkles, Terminal, UserRound, X } from 'lucide-react'
import { experience, profile, projects, skills } from '../content/portfolio'
import type { Project } from '../types'

type SystemOSProps = {
  onClose: () => void
}

type AppName = 'home' | 'projects' | 'experience' | 'about' | 'research' | 'terminal'

const appItems: Array<{ name: AppName; label: string; subtitle: string; icon: typeof Code2 }> = [
  { name: 'projects', label: 'Projects', subtitle: 'Things I build', icon: Code2 },
  { name: 'experience', label: 'Experience', subtitle: 'Work & leadership', icon: BriefcaseBusiness },
  { name: 'research', label: 'Research', subtitle: 'What I am chasing', icon: GraduationCap },
  { name: 'about', label: 'About', subtitle: 'The human part', icon: UserRound }
]

function StatusDot() {
  return <span className="status-dot" aria-hidden="true" />
}

function WindowBar({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose?: () => void }) {
  return (
    <div className="window-bar">
      <div className="window-controls" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="window-title">{title}</div>
      <div className="window-actions">
        {onBack && <button className="icon-button" type="button" onClick={onBack} aria-label="Go back"><ArrowLeft size={16} /></button>}
        {onClose && <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={16} /></button>}
      </div>
    </div>
  )
}

function ProjectView({ project, onBack }: { project: Project; onBack: () => void }) {
  return (
    <section className="os-window project-detail-window">
      <WindowBar title={`projects/${project.slug}`} onBack={onBack} />
      <div className="project-detail">
        <div className="eyebrow"><StatusDot /> {project.status}</div>
        <h2>{project.name}</h2>
        <p className="project-lede">{project.tagline}</p>
        <p className="muted-copy">{project.description}</p>
        <div className="chip-row">
          {project.stack.map((item) => <span className="chip" key={item}>{item}</span>)}
        </div>
        <div className="detail-section">
          <span className="section-kicker">Selected work</span>
          {project.highlights.map((highlight) => (
            <div className="highlight-row" key={highlight}><span>↗</span><p>{highlight}</p></div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TerminalApp({ onNavigate }: { onNavigate: (app: AppName) => void }) {
  const [history, setHistory] = useState<string[]>(['SB/OS terminal 1.0', 'Type help to see available commands.'])
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const run = (raw: string) => {
    const command = raw.trim().toLowerCase()
    if (!command) return
    const next = [...history, `visitor@sb-os ~ % ${raw}`]
    if (command === 'help') next.push('projects  experience  about  research  clear  whoami')
    else if (command === 'whoami') next.push(`${profile.name} — ${profile.title}`)
    else if (command === 'clear') setHistory([])
    else if (['projects', 'experience', 'about', 'research'].includes(command)) {
      setHistory([...next, `Opening ${command}...`])
      onNavigate(command as AppName)
      setValue('')
      return
    } else next.push(`command not found: ${command}`)
    if (command !== 'clear') setHistory(next)
    setValue('')
  }

  return (
    <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-history">
        {history.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); run(value) }} className="terminal-line">
        <span>visitor@sb-os ~ %</span>
        <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} autoFocus aria-label="Terminal command" />
      </form>
    </div>
  )
}

export function SystemOS({ onClose }: SystemOSProps) {
  const [app, setApp] = useState<AppName>('home')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [time, setTime] = useState(() => new Date())
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return projects
    return projects.filter((project) => [project.name, project.tagline, project.stack.join(' ')].join(' ').toLowerCase().includes(normalized))
  }, [query])

  const navigate = (next: AppName) => {
    setSelectedProject(null)
    setApp(next)
  }

  return (
    <div className="os-shell" role="dialog" aria-modal="true" aria-label="SB OS portfolio">
      <div className="os-topbar">
        <button className="brand-button" type="button" onClick={() => navigate('home')}>SB/OS</button>
        <div className="os-status"><StatusDot /> available for Summer 2027</div>
        <div className="os-time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <button className="exit-os" type="button" onClick={onClose}>Exit workspace</button>
      </div>

      {app === 'home' && (
        <main className="os-home">
          <div className="os-hero">
            <span className="eyebrow">SIMON BALANOFF / SYSTEM ONLINE</span>
            <h1>I build things I don't know how to build yet.</h1>
            <p>{profile.intro}</p>
          </div>
          <div className="app-grid">
            {appItems.map((item) => {
              const Icon = item.icon
              return (
                <button className="app-tile" type="button" key={item.name} onClick={() => navigate(item.name)}>
                  <span className="app-icon"><Icon size={22} /></span>
                  <span><strong>{item.label}</strong><small>{item.subtitle}</small></span>
                  <span className="app-arrow">↗</span>
                </button>
              )
            })}
          </div>
          <div className="home-bottom-grid">
            <button type="button" className="terminal-launch" onClick={() => navigate('terminal')}>
              <Terminal size={18} />
              <span><strong>Terminal</strong><small>For the curious</small></span>
              <span>CLI</span>
            </button>
            <div className="currently-card">
              <span className="section-kicker">CURRENTLY</span>
              <div className="currently-list">{profile.currently.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </div>
        </main>
      )}

      {app === 'projects' && !selectedProject && (
        <section className="os-window">
          <WindowBar title="Projects" onBack={() => navigate('home')} />
          <div className="window-content">
            <div className="window-heading">
              <div><span className="section-kicker">BUILD</span><h2>Selected projects</h2></div>
              <label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></label>
            </div>
            <div className="project-list">
              {filteredProjects.map((project) => (
                <button className="project-row" type="button" key={project.slug} onClick={() => setSelectedProject(project)}>
                  <div><span className="project-status"><StatusDot /> {project.status}</span><h3>{project.name}</h3><p>{project.tagline}</p></div>
                  <div className="mini-stack">{project.stack.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
                  <span className="row-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {app === 'projects' && selectedProject && <ProjectView project={selectedProject} onBack={() => setSelectedProject(null)} />}

      {app === 'experience' && (
        <section className="os-window">
          <WindowBar title="Experience" onBack={() => navigate('home')} />
          <div className="window-content">
            <span className="section-kicker">WORK / LEAD / TEACH</span>
            <h2>Experience</h2>
            <div className="timeline">
              {experience.map((item) => (
                <article className="timeline-item" key={`${item.organization}-${item.role}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-period">{item.period}</div>
                  <div><h3>{item.role}</h3><strong>{item.organization}</strong><p>{item.description}</p><div className="chip-row compact">{item.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {app === 'about' && (
        <section className="os-window">
          <WindowBar title="About" onBack={() => navigate('home')} />
          <div className="window-content about-layout">
            <div className="about-copy"><span className="section-kicker">ABOUT</span><h2>{profile.name}</h2><p className="project-lede">{profile.intro}</p><p className="muted-copy">I'm a Computer Science student at Colorado State University concentrating in AI and Machine Learning. The common thread across my work is that I like systems: software systems, organizations, products, and the process of making complicated things feel understandable.</p></div>
            <div className="about-meta">
              <div><span>School</span><strong>{profile.school}</strong></div>
              <div><span>Graduation</span><strong>{profile.graduation}</strong></div>
              <div><span>Focus</span><strong>AI / Machine Learning</strong></div>
              <div><span>Also</span><strong>Pianist · Teacher · Builder</strong></div>
            </div>
            <div className="skills-block"><span className="section-kicker">TOOLKIT</span><div className="chip-row">{skills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div></div>
          </div>
        </section>
      )}

      {app === 'research' && (
        <section className="os-window">
          <WindowBar title="Research" onBack={() => navigate('home')} />
          <div className="window-content research-layout">
            <div><span className="section-kicker">NEXT FRONTIER</span><h2>Brain-computer interfaces + AI</h2><p className="project-lede">I want to understand how machine learning can turn neural signals into useful control systems for assistive technology.</p><p className="muted-copy">The long-term idea that pulls me in most is prosthetic control from brain activity: decoding noisy signals, learning intent, adapting to users, and making the interface feel less like commanding a machine and more like extending the body.</p></div>
            <div className="research-card"><Sparkles size={20} /><span>Questions I keep coming back to</span><strong>How should a model adapt to one person's changing neural signals?</strong><strong>How do you make an intelligent prosthetic predictable enough to trust?</strong><strong>Where should autonomy end and direct user control begin?</strong></div>
          </div>
        </section>
      )}

      {app === 'terminal' && (
        <section className="os-window terminal-window">
          <WindowBar title="Terminal" onBack={() => navigate('home')} />
          <TerminalApp onNavigate={navigate} />
        </section>
      )}

      <div className="os-dock" aria-label="Quick links">
        <button type="button" onClick={() => navigate('projects')} aria-label="Projects"><Code2 size={18} /></button>
        <button type="button" onClick={() => navigate('experience')} aria-label="Experience"><BriefcaseBusiness size={18} /></button>
        <button type="button" onClick={() => navigate('about')} aria-label="About"><UserRound size={18} /></button>
        <a href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Code2 size={18} /></a>
        <a href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><BriefcaseBusiness size={18} /></a>
        <a href={profile.links.email} aria-label="Email"><Mail size={18} /></a>
        <a href={profile.links.resume} aria-label="Resume"><FileText size={18} /></a>
      </div>
    </div>
  )
}
