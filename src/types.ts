export type Project = {
  id: string
  name: string
  tagline: string
  description: string
  status: string
  stack: string[]
  highlights: string[]
}

export type Experience = {
  role: string
  organization: string
  period: string
  description: string
  tags: string[]
}

export type AppId = 'about' | 'projects' | 'experience' | 'research' | 'resume' | 'contact' | 'terminal' | 'signal' | 'archive'

export type WindowState = {
  id: AppId
  title: string
  x: number
  y: number
  width: number
  height: number
  z: number
  minimized: boolean
  maximized: boolean
}
