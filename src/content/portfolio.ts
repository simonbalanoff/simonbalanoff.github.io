import type { Experience, Project } from '../types'

export const profile = {
  name: 'Simon Balanoff',
  title: 'Computer Science · AI/ML · Builder',
  school: 'Colorado State University',
  graduation: 'May 2028',
  intro: 'I build software, lead technical communities, teach computer science, and keep chasing problems that are a little bigger than what I already know how to solve.',
  currently: [
    'Building Biddly',
    'Studying AI & Machine Learning',
    'Leading ACM @ CSU',
    'Teaching CS 214',
    'Exploring brain-computer interfaces'
  ],
  links: {
    github: 'https://github.com/simonbalanoff',
    linkedin: 'https://www.linkedin.com/in/REPLACE_ME',
    email: 'mailto:REPLACE_ME@example.com',
    resume: '#'
  }
}

export const projects: Project[] = [
  {
    id: 'biddly',
    name: 'Biddly',
    tagline: 'Recruitment software designed like a modern product, not a spreadsheet.',
    description: 'A multi-tenant SaaS platform for fraternity and sorority recruitment with chapter workspaces, configurable candidate forms, scoring, events, comments, invitations, and export workflows.',
    status: 'ACTIVE',
    stack: ['Next.js', 'TypeScript', 'Fastify', 'PostgreSQL', 'Prisma'],
    highlights: ['Multi-tenant chapter architecture', 'Role-based chapter permissions', 'Custom recruitment forms and term workflows']
  },
  {
    id: 'fuel',
    name: 'Fuel',
    tagline: 'A nutrition app that treats consistency like a system.',
    description: 'An iOS-first calorie and macro tracker designed around simple daily goals, fast logging, and optional accountability mechanisms.',
    status: 'EXPERIMENT',
    stack: ['Swift', 'iOS', 'APIs', 'Product Design'],
    highlights: ['Native iOS experience', 'Daily calorie and macro goals', 'Behavior-focused product ideas']
  },
  {
    id: 'resident-feedback',
    name: 'ResidentFeedback',
    tagline: 'A full-stack feedback workflow for residents and staff.',
    description: 'A client-facing application for collecting structured resident feedback with an iOS frontend and backend API.',
    status: 'SHIPPED',
    stack: ['Swift', 'Node.js', 'Express', 'MongoDB', 'JWT'],
    highlights: ['Mobile-first interface', 'Authenticated API', 'End-to-end product ownership']
  },
  {
    id: 'uml-visualizer',
    name: 'UML Visualizer',
    tagline: 'Turn program structure into something you can actually see.',
    description: 'A developer tool focused on extracting and visualizing relationships in object-oriented code.',
    status: 'BUILT',
    stack: ['Java', 'Parsing', 'Visualization'],
    highlights: ['Static code analysis', 'Relationship mapping', 'Developer-focused UX']
  },
  {
    id: 'acm-site',
    name: 'ACM @ CSU Website',
    tagline: 'A useful home for a technical community.',
    description: 'The web presence for CSU ACM, built around events, resources, officer information, projects, and student discovery.',
    status: 'LIVE',
    stack: ['Web', 'WordPress', 'Content Systems'],
    highlights: ['Event discovery', 'Student resources', 'Organization identity']
  }
]

export const experience: Experience[] = [
  {
    role: 'COPE Software Engineering Intern',
    organization: 'Summer 2026',
    period: 'May 2026 — Aug 2026',
    description: 'Worked in a production engineering environment using Angular and modern software development practices.',
    tags: ['Angular', 'TypeScript', 'Software Engineering']
  },
  {
    role: 'President',
    organization: 'ACM @ Colorado State University',
    period: 'May 2025 — Present',
    description: 'Lead the student ACM chapter, organize technical and career events, coordinate speakers, and build community across the computer science department.',
    tags: ['Leadership', 'Events', 'Community']
  },
  {
    role: 'Undergraduate Teaching Assistant',
    organization: 'CS 214 — Software Development',
    period: '2026 — Present',
    description: 'Help students learn testing, object-oriented design, debugging, and practical software development through labs, assignments, and direct support.',
    tags: ['Java', 'JUnit', 'Mentoring']
  }
]

export const skills = ['TypeScript', 'Java', 'Python', 'C++', 'JavaScript', 'Swift', 'React', 'Next.js', 'Angular', 'Node.js', 'Fastify', 'PostgreSQL', 'MongoDB', 'AWS', 'Three.js']
