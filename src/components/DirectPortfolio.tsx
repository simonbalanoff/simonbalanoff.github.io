import { BriefcaseBusiness, Code2, Mail } from 'lucide-react'
import { experience, profile, projects, skills } from '../content/portfolio'

export function DirectPortfolio({ onClose }: { onClose: () => void }) {
  return (
    <div className="direct-shell">
      <button className="direct-close" type="button" onClick={onClose}>Return to workspace</button>
      <main className="direct-main">
        <section className="direct-hero">
          <span className="eyebrow">SIMON BALANOFF</span>
          <h1>I build software, communities, and whatever I need to learn next.</h1>
          <p>{profile.intro}</p>
          <div className="contact-links horizontal">
            <a href={profile.links.github} target="_blank" rel="noreferrer"><Code2 size={17} /> GitHub</a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer"><BriefcaseBusiness size={17} /> LinkedIn</a>
            <a href={profile.links.email}><Mail size={17} /> Email</a>
          </div>
        </section>
        <section className="direct-section"><span className="section-kicker">PROJECTS</span>{projects.map((project) => <article className="direct-project" key={project.slug}><div><span>{project.status}</span><h2>{project.name}</h2><p>{project.description}</p></div><div className="chip-row compact">{project.stack.map((item) => <span className="chip" key={item}>{item}</span>)}</div></article>)}</section>
        <section className="direct-section"><span className="section-kicker">EXPERIENCE</span>{experience.map((item) => <article className="direct-experience" key={`${item.organization}-${item.role}`}><span>{item.period}</span><div><h3>{item.role}</h3><strong>{item.organization}</strong><p>{item.description}</p></div></article>)}</section>
        <section className="direct-section"><span className="section-kicker">TOOLKIT</span><div className="chip-row">{skills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div></section>
      </main>
    </div>
  )
}
