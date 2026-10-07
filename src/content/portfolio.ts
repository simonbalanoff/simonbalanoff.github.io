import type { Experience, Project } from '../types'

export const profile = {
  name: 'Simon Balanoff',
  title: 'Software Engineer · Computer Science · AI / ML',
  shortTitle: 'Software Engineer',
  location: 'Colorado',
  school: 'Colorado State University',
  graduation: 'May 2028',
  intro: 'I build software, lead technical communities, teach computer science, and chase ideas that are just difficult enough to be interesting.',
  currently: [
    'Building Biddly',
    'Studying AI & Machine Learning',
    'Leading ACM @ CSU',
    'Teaching CS 214',
    'Exploring brain-computer interfaces'
  ],
  links: {
    github: 'https://github.com/',
    linkedin: 'https://www.linkedin.com/',
    email: 'mailto:replace-me@example.com',
    resume: '#'
  }
}

export const projects: Project[] = [
  {
    name: 'Biddly',
    slug: 'biddly',
    tagline: 'Recruitment software built for real chapter workflows.',
    description: 'A multi-tenant SaaS platform for fraternity and sorority recruitment with chapter-level configuration, candidate tracking, scoring, custom forms, events, roles, and invitations.',
    status: 'Active development',
    stack: ['TypeScript', 'Next.js', 'Fastify', 'PostgreSQL', 'Prisma', 'JWT'],
    highlights: [
      'Designed a multi-tenant data model around chapters and recruitment terms',
      'Built configurable PNM forms, ratings, event tracking, roles, and invitation flows',
      'Structured the app as a pnpm monorepo with shared contracts and database packages'
    ]
  },
  {
    name: 'ResidentFeedback',
    slug: 'resident-feedback',
    tagline: 'A native iOS feedback system backed by a custom API.',
    description: 'An iOS application and backend for capturing structured resident feedback and turning it into actionable data.',
    status: 'Shipped',
    stack: ['Swift', 'Node.js', 'Express', 'MongoDB', 'AWS S3'],
    highlights: [
      'Built the mobile client and supporting REST API',
      'Implemented authentication and structured feedback workflows',
      'Used cloud object storage for uploaded media'
    ]
  },
  {
    name: 'UML Visualizer',
    slug: 'uml-visualizer',
    tagline: 'Turning source structure into an explorable visual model.',
    description: 'A developer tool focused on making software architecture easier to inspect through generated UML-style visualizations.',
    status: 'Project',
    stack: ['Java', 'Parsing', 'Graph Visualization'],
    highlights: [
      'Modeled relationships between software entities',
      'Converted code structure into visual graph representations',
      'Focused on clarity for larger object-oriented codebases'
    ]
  },
  {
    name: 'Fuel',
    slug: 'fuel',
    tagline: 'Nutrition tracking with consequences for missed goals.',
    description: 'A premium-feeling nutrition and macro tracking concept designed around simple pricing, clean UX, and stronger behavioral accountability.',
    status: 'Prototype',
    stack: ['Swift', 'iOS', 'APIs', 'Product Design'],
    highlights: [
      'Designed a low-friction calorie and macro tracking experience',
      'Explored Screen Time integrations for user-defined accountability',
      'Built toward a no-ads, no-subscription product model'
    ]
  }
]

export const experience: Experience[] = [
  {
    role: 'President',
    organization: 'ACM @ Colorado State University',
    period: '2025 — Present',
    description: 'Lead the university ACM chapter, organize technical and career events, coordinate speakers, and build programming that connects students with the broader computing community.',
    tags: ['Leadership', 'Community', 'Events']
  },
  {
    role: 'Undergraduate Teaching Assistant',
    organization: 'CS 214 — Software Development',
    period: '2026 — Present',
    description: 'Support students learning software design, Java, testing, debugging, and core development practices through labs, grading, and hands-on help.',
    tags: ['Java', 'Teaching', 'Software Design']
  },
  {
    role: 'Software Engineering Intern',
    organization: 'COPE',
    period: 'Summer 2026',
    description: 'Worked on production web software with Angular and contributed to a professional engineering workflow in a collaborative development environment.',
    tags: ['Angular', 'TypeScript', 'Engineering']
  }
]

export const skills = [
  'TypeScript',
  'Java',
  'Python',
  'C++',
  'JavaScript',
  'Swift',
  'React',
  'Next.js',
  'Angular',
  'Node.js',
  'Fastify',
  'PostgreSQL',
  'MongoDB',
  'AWS'
]

export const repertoire = [
  'Rachmaninoff — Cello Sonata, I & III',
  'Chopin — Berceuse, Op. 57',
  'Rachmaninoff — Prelude, Op. 23 No. 4',
  'Scriabin — Sonata No. 2, I',
  'Scriabin — Étude, Op. 8 No. 12',
  'Medtner — Tale, Op. 20 No. 1'
]
