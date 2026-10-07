import { ArrowLeft, Github, Linkedin, Mail } from 'lucide-react'
import { profile, repertoire } from '../content/portfolio'
import type { FocusTarget } from '../types'

type FocusPanelProps = {
  focus: Exclude<FocusTarget, 'room' | 'monitor'>
  onBack: () => void
}

const content = {
  notebook: {
    kicker: 'RESEARCH NOTEBOOK',
    title: 'Questions worth getting stuck on.',
    body: 'I am especially interested in machine learning for brain-computer interfaces and prosthetic control: systems that can infer intent from imperfect biological signals, adapt over time, and remain understandable to the person using them.'
  },
  acm: {
    kicker: 'LEADERSHIP',
    title: 'ACM @ Colorado State University',
    body: 'As president, I organize technical talks, career events, speakers, and community programming. I care about making the computer science department feel smaller, more connected, and easier to navigate.'
  },
  whiteboard: {
    kicker: 'CURRENTLY',
    title: 'What is on the board right now.',
    body: 'This space is intentionally temporary. It should change as my work changes.'
  }
}

export function FocusPanel({ focus, onBack }: FocusPanelProps) {
  return (
    <aside className="focus-panel">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={17} /> Back to desk</button>

      {focus === 'music' && (
        <div>
          <span className="eyebrow">PIANO / AFTER HOURS</span>
          <h2>Romantic music, difficult textures, unreasonable amounts of rubato.</h2>
          <p>Piano is the part of my life that has nothing to do with shipping software and everything to do with patience, structure, sound, and obsession.</p>
          <div className="focus-list">{repertoire.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      )}

      {focus === 'phone' && (
        <div>
          <span className="eyebrow">CONTACT</span>
          <h2>Say hello.</h2>
          <p>For internships, projects, research, ACM, or anything interesting enough to justify a message.</p>
          <div className="contact-links">
            <a href={profile.links.email}><Mail size={18} /> Email</a>
            <a href={profile.links.github} target="_blank" rel="noreferrer"><Github size={18} /> GitHub</a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} /> LinkedIn</a>
          </div>
        </div>
      )}

      {focus === 'whiteboard' && (
        <div>
          <span className="eyebrow">{content.whiteboard.kicker}</span>
          <h2>{content.whiteboard.title}</h2>
          <p>{content.whiteboard.body}</p>
          <div className="focus-list">{profile.currently.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      )}

      {(focus === 'notebook' || focus === 'acm') && (
        <div>
          <span className="eyebrow">{content[focus].kicker}</span>
          <h2>{content[focus].title}</h2>
          <p>{content[focus].body}</p>
        </div>
      )}
    </aside>
  )
}
