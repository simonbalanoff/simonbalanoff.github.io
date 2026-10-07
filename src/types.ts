export type FocusTarget = 'room' | 'monitor' | 'notebook' | 'music' | 'acm' | 'phone' | 'whiteboard'

export type Project = {
  name: string
  slug: string
  tagline: string
  description: string
  status: string
  stack: string[]
  highlights: string[]
  github?: string
  live?: string
}

export type Experience = {
  role: string
  organization: string
  period: string
  description: string
  tags: string[]
}
