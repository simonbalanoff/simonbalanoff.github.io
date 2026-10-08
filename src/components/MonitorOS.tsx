import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { experience, profile, projects, skills } from '../content/portfolio'
import type { AppId } from '../types'

type MonitorOSProps = {
  active: boolean
  onSelect: () => void
  visited: string[]
  onVisit: (id: string) => void
  questComplete: boolean
}

type CanvasWindow = {
  id: AppId
  title: string
  x: number
  y: number
  width: number
  height: number
  z: number
  minimized: boolean
  maximized: boolean
  scroll: number
}

type Hit = {
  x: number
  y: number
  width: number
  height: number
  action: string
  id?: string
}

type DragState = {
  id: AppId
  offsetX: number
  offsetY: number
} | null


type FsFile = { type: 'file'; content: string; app?: AppId; projectId?: string }
type FsDir = { type: 'dir'; children: Record<string, FsNode>; app?: AppId }
type FsNode = FsFile | FsDir

function buildFilesystem(questComplete: boolean): FsDir {
  const projectChildren: Record<string, FsNode> = {}
  projects.forEach((project) => {
    projectChildren[`${project.id}.txt`] = {
      type: 'file',
      projectId: project.id,
      content: `${project.name}\n${project.status}\n\n${project.tagline}\n\n${project.description}\n\nStack: ${project.stack.join(', ')}\n\nHighlights:\n- ${project.highlights.join('\n- ')}`
    }
  })

  const experienceChildren: Record<string, FsNode> = {}
  experience.forEach((item, index) => {
    const name = `${String(index + 1).padStart(2, '0')}-${item.role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.txt`
    experienceChildren[name] = { type: 'file', content: `${item.role}\n${item.organization}\n${item.period}\n\n${item.description}\n\n${item.tags.join(' · ')}` }
  })

  const apps: Record<string, FsNode> = {}
  ;(['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal', 'signal'] as AppId[]).forEach((id) => {
    apps[`${id}.app`] = { type: 'file', app: id, content: `SIMON/OS application\nname: ${appMeta[id].title}\ncommand: open ${id}` }
  })
  if (questComplete) apps['archive.app'] = { type: 'file', app: 'archive', content: 'SIMON/OS hidden application\nname: Hidden Archive\nstatus: unlocked' }

  const simonChildren: Record<string, FsNode> = {
    'about.txt': { type: 'file', content: `${profile.name}\n${profile.title}\n\n${profile.intro}\n\nCurrently:\n- ${profile.currently.join('\n- ')}` },
    'resume.txt': { type: 'file', content: `${profile.name}\n${profile.school} · ${profile.graduation}\n\nEXPERIENCE\n${experience.map((item) => `\n${item.role} — ${item.organization}\n${item.period}\n${item.description}`).join('\n')}\n\nSKILLS\n${skills.join(' · ')}` },
    'contact.txt': { type: 'file', content: `GitHub: ${profile.links.github}\nLinkedIn: ${profile.links.linkedin}\nEmail: ${profile.links.email.replace('mailto:', '')}\nResume: ${profile.links.resume}` },
    'manifesto.txt': { type: 'file', content: 'Build things worth using. Stay curious. Make complicated things understandable.' },
    'projects': { type: 'dir', app: 'projects', children: projectChildren },
    'experience': { type: 'dir', app: 'experience', children: experienceChildren },
    'research': { type: 'dir', app: 'research', children: {
      'bci.txt': { type: 'file', content: 'Brain-computer interfaces\n\nHow can machine learning turn noisy neural signals into reliable intent for prosthetic control?' },
      'adaptive-systems.txt': { type: 'file', content: 'Adaptive systems\n\nA useful model should adapt to one person over time without becoming unpredictable.' },
      'human-control.txt': { type: 'file', content: 'Human control\n\nWhere should autonomous assistance end and direct user control begin?' },
      'trust.txt': { type: 'file', content: 'Trust\n\nA technically accurate system still fails if the person using it cannot understand or trust what it will do.' }
    } },
    'apps': { type: 'dir', children: apps },
    '.quest': { type: 'file', content: questComplete ? '8/8 signals. The archive is unlocked. Try: open archive' : 'The workspace notices curiosity. Explore the apps, ACM, and UTA. There are eight signals.' },
    '.secrets': { type: 'dir', children: {
      'piano.txt': { type: 'file', content: 'Rachmaninoff · Scriabin · Medtner · Chopin. If you found this from the terminal, you are using the site correctly.' },
      'rubber-duck.txt': { type: 'file', content: 'Senior debugging consultant. Compensation: one quack per resolved issue.' },
      ...(questComplete ? { 'archive.txt': { type: 'file' as const, content: 'Achievement unlocked: Actually explored the portfolio.\n\nTry: open archive' } } : {})
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

const WIDTH = 1024
const HEIGHT = 600
const SCALE = 1.5
const TASKBAR_H = 38
const TITLEBAR_H = 31
const requiredSignals = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'acm', 'uta']

const appMeta: Record<AppId, { title: string; icon: string }> = {
  about: { title: 'About Me', icon: 'person' },
  projects: { title: 'Projects', icon: 'folder' },
  experience: { title: 'Experience', icon: 'briefcase' },
  research: { title: 'Research', icon: 'search' },
  resume: { title: 'Resume', icon: 'document' },
  contact: { title: 'Contact', icon: 'mail' },
  terminal: { title: 'Terminal', icon: 'terminal' },
  signal: { title: 'Signal', icon: 'signal' },
  archive: { title: 'Hidden Archive', icon: 'archive' }
}

const defaultRects: Record<AppId, [number, number, number, number]> = {
  about: [160, 88, 600, 390],
  projects: [115, 72, 760, 450],
  experience: [160, 72, 690, 440],
  research: [150, 76, 700, 430],
  resume: [178, 58, 660, 480],
  contact: [220, 110, 570, 350],
  terminal: [170, 100, 690, 360],
  signal: [235, 105, 550, 350],
  archive: [180, 78, 680, 430]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) {
  roundRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

function softPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke = 'rgba(255,255,255,.18)', shadow = 'rgba(14,24,31,.18)') {
  ctx.save()
  ctx.shadowColor = shadow
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  fillRound(ctx, x, y, width, height, radius, fill, stroke)
  ctx.restore()
}

function glassTile(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, hovered = false) {
  ctx.save()
  ctx.shadowColor = 'rgba(15,29,38,.12)'
  ctx.shadowBlur = hovered ? 18 : 12
  ctx.shadowOffsetY = hovered ? 6 : 4
  roundRect(ctx, x, y, width, height, radius)
  const gradient = ctx.createLinearGradient(x, y, x, y + height)
  gradient.addColorStop(0, hovered ? 'rgba(250,252,252,.94)' : 'rgba(242,247,247,.76)')
  gradient.addColorStop(1, hovered ? 'rgba(219,230,232,.94)' : 'rgba(218,228,230,.66)')
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = hovered ? 'rgba(255,255,255,.82)' : 'rgba(255,255,255,.42)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 99) {
  const words = text.split(/\s+/)
  let line = ''
  let lineCount = 0
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight)
      lineCount += 1
      line = words[i]
      if (lineCount >= maxLines) return lineCount
    } else {
      line = test
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight)
    lineCount += 1
  }
  return lineCount
}

function drawIcon(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.lineWidth = Math.max(2, s * 0.055)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (kind === 'person') {
    ctx.fillStyle = '#d9b899'
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.32, s * 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#63747d'
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.8, s * 0.28, Math.PI, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'folder') {
    ctx.fillStyle = '#d6a64d'
    fillRound(ctx, s * 0.08, s * 0.28, s * 0.84, s * 0.56, s * 0.1, '#e4b65b')
    fillRound(ctx, s * 0.12, s * 0.17, s * 0.36, s * 0.2, s * 0.07, '#efc66e')
  } else if (kind === 'briefcase') {
    fillRound(ctx, s * 0.08, s * 0.27, s * 0.84, s * 0.58, s * 0.1, '#53646c')
    ctx.strokeStyle = '#e4e8e7'
    ctx.beginPath()
    ctx.rect(s * 0.34, s * 0.15, s * 0.32, s * 0.18)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 0.08, s * 0.5)
    ctx.lineTo(s * 0.92, s * 0.5)
    ctx.stroke()
  } else if (kind === 'search') {
    ctx.strokeStyle = '#5d7c70'
    ctx.beginPath()
    ctx.arc(s * 0.43, s * 0.43, s * 0.25, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 0.61, s * 0.61)
    ctx.lineTo(s * 0.85, s * 0.85)
    ctx.stroke()
  } else if (kind === 'document') {
    fillRound(ctx, s * 0.22, s * 0.08, s * 0.56, s * 0.84, s * 0.05, '#f0efea', '#71808a')
    ctx.strokeStyle = '#778891'
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath()
      ctx.moveTo(s * 0.32, s * (0.3 + i * 0.13))
      ctx.lineTo(s * 0.67, s * (0.3 + i * 0.13))
      ctx.stroke()
    }
  } else if (kind === 'mail') {
    fillRound(ctx, s * 0.08, s * 0.24, s * 0.84, s * 0.58, s * 0.08, '#8da9b4')
    ctx.strokeStyle = '#f4f5f2'
    ctx.beginPath()
    ctx.moveTo(s * 0.12, s * 0.29)
    ctx.lineTo(s * 0.5, s * 0.58)
    ctx.lineTo(s * 0.88, s * 0.29)
    ctx.stroke()
  } else if (kind === 'terminal') {
    fillRound(ctx, s * 0.08, s * 0.12, s * 0.84, s * 0.76, s * 0.13, '#273236')
    ctx.strokeStyle = '#d8e1df'
    ctx.beginPath()
    ctx.moveTo(s * 0.28, s * 0.36)
    ctx.lineTo(s * 0.43, s * 0.5)
    ctx.lineTo(s * 0.28, s * 0.64)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 0.52, s * 0.65)
    ctx.lineTo(s * 0.7, s * 0.65)
    ctx.stroke()
  } else if (kind === 'signal') {
    ctx.strokeStyle = '#c7a759'
    for (let r = 0.16; r <= 0.38; r += 0.11) {
      ctx.beginPath()
      ctx.arc(s * 0.5, s * 0.57, s * r, Math.PI * 1.13, Math.PI * 1.87)
      ctx.stroke()
    }
    ctx.fillStyle = '#c7a759'
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.7, s * 0.055, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'archive') {
    fillRound(ctx, s * 0.14, s * 0.18, s * 0.72, s * 0.68, s * 0.08, '#6c6656')
    ctx.fillStyle = '#d8bc6d'
    ctx.fillRect(s * 0.42, s * 0.18, s * 0.16, s * 0.68)
    ctx.fillStyle = '#f0d685'
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * 0.06, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function hitContains(hit: Hit, x: number, y: number) {
  return x >= hit.x && y >= hit.y && x <= hit.x + hit.width && y <= hit.y + hit.height
}

function useCanvasTextureLabel(lines: string[], width = 512, height = 360, background = 'rgba(0,0,0,0)') {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    return c
  }, [width, height])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    return t
  }, [canvas])

  useEffect(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
    const sizes = [26, 58, 34, 21, 20]
    const weights = [700, 800, 700, 500, 500]
    let y = 58
    lines.forEach((line, index) => {
      ctx.fillStyle = index === 0 ? '#cad6d9' : '#ffffff'
      ctx.font = `${weights[index] ?? 500} ${sizes[index] ?? 20}px Arial`
      ctx.textBaseline = 'top'
      if (index === 4) {
        wrapText(ctx, line, 36, y, width - 72, 28, 4)
      } else {
        ctx.fillText(line, 36, y)
      }
      y += index === 1 ? 74 : index === 2 ? 52 : index === 3 ? 42 : 48
    })
    texture.needsUpdate = true
  }, [canvas, texture, lines, width, height, background])

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

export function MonitorOS({ active, onSelect, visited, onVisit, questComplete }: MonitorOSProps) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = WIDTH * SCALE
    c.height = HEIGHT * SCALE
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.anisotropy = 8
    return t
  }, [canvas])
  const shaderRef = useRef<THREE.ShaderMaterial>(null)
  const windowsRef = useRef<CanvasWindow[]>([])
  const hitsRef = useRef<Hit[]>([])
  const dragRef = useRef<DragState>(null)
  const zRef = useRef(10)
  const terminalFocused = useRef(false)
  const [windows, setWindows] = useState<CanvasWindow[]>([])
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [researchNote, setResearchNote] = useState(0)
  const [archiveDuck, setArchiveDuck] = useState(0)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [party, setParty] = useState(false)
  const [terminalHistory, setTerminalHistory] = useState<string[]>(['SIMON/OS terminal', 'Type help for commands.'])
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalCwd, setTerminalCwd] = useState('/home/simon')
  const commandHistoryRef = useRef<string[]>([])
  const commandHistoryIndexRef = useRef(-1)
  const [showSeconds, setShowSeconds] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [hoverKey, setHoverKey] = useState('')

  useEffect(() => {
    windowsRef.current = windows
  }, [windows])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const focusWindow = (id: AppId) => {
    zRef.current += 1
    setWindows((current) => current.map((item) => item.id === id ? { ...item, z: zRef.current, minimized: false } : item))
  }

  const openApp = (id: AppId) => {
    if (requiredSignals.includes(id)) onVisit(id)
    setLauncherOpen(false)
    const existing = windowsRef.current.find((item) => item.id === id)
    if (existing) {
      focusWindow(id)
      return
    }
    zRef.current += 1
    const [x, y, width, height] = defaultRects[id]
    setWindows((current) => [...current, { id, title: appMeta[id].title, x, y, width, height, z: zRef.current, minimized: false, maximized: false, scroll: 0 }])
  }

  const closeWindow = (id: AppId) => {
    terminalFocused.current = false
    setWindows((current) => current.filter((item) => item.id !== id))
  }

  const toggleMinimize = (id: AppId) => {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, minimized: !item.minimized } : item))
  }

  const toggleMaximize = (id: AppId) => {
    focusWindow(id)
    setWindows((current) => current.map((item) => item.id === id ? { ...item, maximized: !item.maximized } : item))
  }

  const runTerminal = (raw: string) => {
    const entered = raw.trim()
    if (!entered) return
    commandHistoryRef.current.push(entered)
    commandHistoryIndexRef.current = commandHistoryRef.current.length
    const prompt = `visitor@simon-os:${fsDisplayPath(terminalCwd)}$ ${entered}`
    let next = [...terminalHistory, prompt]
    const parts = entered.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^['"]|['"]$/g, '')) ?? []
    const command = (parts[0] ?? '').toLowerCase()
    const args = parts.slice(1)
    const fs = buildFilesystem(questComplete)
    const append = (...lines: string[]) => { next.push(...lines) }
    const resolve = (rawPath = '.') => normalizeFsPath(terminalCwd, rawPath)

    const appAliases: Record<string, AppId> = {
      about: 'about', projects: 'projects', experience: 'experience', research: 'research', resume: 'resume', contact: 'contact', terminal: 'terminal', signal: 'signal', archive: 'archive'
    }

    const tryOpen = (targetRaw: string) => {
      const target = targetRaw.toLowerCase().replace(/\.app$/, '')
      if (appAliases[target]) {
        if (target === 'archive' && !questComplete) { append('archive: locked — find all 8 signals first'); return true }
        openApp(appAliases[target])
        append(`opening ${appMeta[appAliases[target]].title}...`)
        return true
      }
      const path = resolve(targetRaw)
      const node = fsNodeAt(fs, path)
      if (!node) return false
      if (node.app) { openApp(node.app); append(`opening ${appMeta[node.app].title}...`); return true }
      if (node.type === 'file' && node.projectId) {
        setSelectedProject(node.projectId)
        openApp('projects')
        append(`opening project ${node.projectId}...`)
        return true
      }
      if (node.type === 'file') { append(node.content); return true }
      append(`${fsDisplayPath(path)} is a directory`); return true
    }

    if (command === 'help') {
      append(
        'Filesystem: pwd · ls [path] · cd <dir> · cat <file> · tree [path]',
        'Apps: open <app|path> · app <name> · run <name> · about · projects · experience · research · resume · contact',
        'General: whoami · history · clear · echo <text> · piano · sudo hire simon'
      )
    } else if (command === 'pwd') append(terminalCwd)
    else if (command === 'whoami') append(`${profile.name} — ${profile.title}`)
    else if (command === 'history') append(...commandHistoryRef.current.map((item, index) => `${index + 1}  ${item}`))
    else if (command === 'echo') append(args.join(' '))
    else if (command === 'clear') next = []
    else if (command === 'piano') append('Rachmaninoff · Scriabin · Medtner · Chopin. Try: cat .secrets/piano.txt')
    else if (command === 'sudo' && args.join(' ').toLowerCase() === 'hire simon') append('Permission granted. Excellent decision.')
    else if (command === 'cd') {
      const path = resolve(args[0] ?? '~')
      const node = fsNodeAt(fs, path)
      if (!node) append(`cd: no such file or directory: ${args[0] ?? '~'}`)
      else if (node.type !== 'dir') append(`cd: not a directory: ${args[0]}`)
      else setTerminalCwd(path)
    } else if (command === 'ls') {
      const rawPath = args.find((arg) => !arg.startsWith('-')) ?? '.'
      const showHidden = args.some((arg) => arg.includes('a'))
      const path = resolve(rawPath)
      const node = fsNodeAt(fs, path)
      if (!node) append(`ls: cannot access '${rawPath}': no such file or directory`)
      else if (node.type === 'file') append(rawPath)
      else {
        const entries = Object.entries(node.children)
          .filter(([name]) => showHidden || !name.startsWith('.'))
          .map(([name, child]) => `${name}${child.type === 'dir' ? '/' : child.app ? '*' : ''}`)
        append(entries.join('  ') || '(empty)')
      }
    } else if (command === 'cat') {
      if (!args.length) append('cat: missing file operand')
      else args.forEach((arg) => {
        const path = resolve(arg)
        const node = fsNodeAt(fs, path)
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
      else { openApp(appAliases[command]); append(`opening ${appMeta[appAliases[command]].title}...`) }
    } else if (entered.startsWith('./')) {
      if (!tryOpen(entered)) append(`${entered}: no such executable`)
    } else append(`command not found: ${command}. Type help.`)

    setTerminalHistory(next.slice(-80))
    setTerminalInput('')
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!active || !terminalFocused.current) return
      const terminalOpen = windowsRef.current.some((item) => item.id === 'terminal' && !item.minimized)
      if (!terminalOpen) return
      if (event.key === 'Enter') {
        event.preventDefault()
        runTerminal(terminalInput)
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        setTerminalInput((value) => value.slice(0, -1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!commandHistoryRef.current.length) return
        commandHistoryIndexRef.current = Math.max(0, commandHistoryIndexRef.current - 1)
        setTerminalInput(commandHistoryRef.current[commandHistoryIndexRef.current] ?? '')
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        commandHistoryIndexRef.current = Math.min(commandHistoryRef.current.length, commandHistoryIndexRef.current + 1)
        setTerminalInput(commandHistoryRef.current[commandHistoryIndexRef.current] ?? '')
      } else if (event.key === 'Tab') {
        event.preventDefault()
        const options = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal', 'signal', ...(questComplete ? ['archive'] : [])]
        const match = options.find((option) => option.startsWith(terminalInput.toLowerCase()))
        if (match) setTerminalInput(match)
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        setTerminalInput((value) => `${value}${event.key}`.slice(0, 120))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, terminalInput, terminalHistory, terminalCwd, questComplete])

  const drawDesktop = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    hitsRef.current = []

    const wallpaper = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    if (party) {
      wallpaper.addColorStop(0, '#1c2440')
      wallpaper.addColorStop(0.48, '#4e4564')
      wallpaper.addColorStop(1, '#805a73')
    } else {
      wallpaper.addColorStop(0, '#14242e')
      wallpaper.addColorStop(0.52, '#496979')
      wallpaper.addColorStop(1, '#a8b6ae')
    }
    ctx.fillStyle = wallpaper
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    const glow = ctx.createRadialGradient(825, 112, 6, 825, 112, 180)
    glow.addColorStop(0, party ? 'rgba(244,198,255,.62)' : 'rgba(255,226,170,.62)')
    glow.addColorStop(0.35, party ? 'rgba(207,165,236,.22)' : 'rgba(255,218,155,.18)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(630, 0, 394, 290)

    ctx.globalAlpha = 0.42
    ctx.fillStyle = party ? '#bf9dc8' : '#b7c5c3'
    ctx.beginPath()
    ctx.moveTo(0, 390)
    ctx.lineTo(155, 298)
    ctx.lineTo(305, 390)
    ctx.lineTo(480, 245)
    ctx.lineTo(650, 395)
    ctx.lineTo(835, 280)
    ctx.lineTo(1024, 372)
    ctx.lineTo(1024, 600)
    ctx.lineTo(0, 600)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = 0.74
    ctx.fillStyle = party ? '#806b86' : '#71857f'
    ctx.beginPath()
    ctx.moveTo(0, 440)
    ctx.lineTo(120, 392)
    ctx.lineTo(285, 455)
    ctx.lineTo(462, 382)
    ctx.lineTo(650, 454)
    ctx.lineTo(798, 398)
    ctx.lineTo(1024, 458)
    ctx.lineTo(1024, 600)
    ctx.lineTo(0, 600)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.fillStyle = 'rgba(255,255,255,.9)'
    ctx.beginPath()
    ctx.arc(826, 110, 34, 0, Math.PI * 2)
    ctx.fill()

    softPanel(ctx, 824, 18, 174, 64, 14, 'rgba(242,247,247,.73)', 'rgba(255,255,255,.42)', 'rgba(8,20,28,.16)')
    ctx.fillStyle = '#6b7a82'
    ctx.font = '800 9px Arial'
    ctx.fillText('SIMON/OS', 840, 36)
    ctx.fillStyle = '#203139'
    ctx.font = '700 16px Arial'
    ctx.fillText('workspace online', 840, 54)
    ctx.fillStyle = '#6c7c83'
    ctx.font = '10px Arial'
    ctx.fillText('CS · AI/ML · building things', 840, 70)

    const desktopApps: AppId[] = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal']
    if (questComplete) desktopApps.push('archive')
    desktopApps.forEach((id, index) => {
      const x = 34 + index * 70
      const y = 24
      const hovered = hoverKey === `open-app:${id}`
      glassTile(ctx, x, y, 42, 42, 12, hovered)
      drawIcon(ctx, appMeta[id].icon, x + 7, y + 7, 28)
      ctx.font = '600 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#eaf0ef'
      const label = appMeta[id].title
      ctx.shadowColor = 'rgba(8,18,24,.7)'
      ctx.shadowBlur = 5
      const words = id === 'archive' ? ['Hidden', 'Archive'] : [label]
      words.forEach((word, line) => ctx.fillText(word, x + 21, y + 56 + line * 11))
      ctx.shadowBlur = 0
      ctx.textAlign = 'left'
      hitsRef.current.push({ x: x - 7, y: y - 5, width: 56, height: id === 'archive' ? 82 : 72, action: 'open-app', id })
    })

    if (launcherOpen) {
      softPanel(ctx, 18, 300, 272, 236, 18, 'rgba(237,243,242,.95)', 'rgba(255,255,255,.54)', 'rgba(8,21,29,.22)')
      ctx.fillStyle = '#74838a'
      ctx.font = '800 9px Arial'
      ctx.fillText('SIMON/OS', 34, 322)
      ctx.fillStyle = '#26373f'
      ctx.font = '700 15px Arial'
      ctx.fillText('Applications', 34, 344)
      const launcherApps: AppId[] = ['about', 'projects', 'experience', 'research', 'resume', 'contact', 'terminal', 'signal']
      if (questComplete) launcherApps.push('archive')
      launcherApps.forEach((id, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const x = 30 + col * 126
        const y = 358 + row * 41
        const hovered = hoverKey === `open-app:${id}`
        fillRound(ctx, x, y, 116, 34, 9, hovered ? '#dbe7e4' : 'rgba(255,255,255,.42)')
        drawIcon(ctx, appMeta[id].icon, x + 7, y + 5, 24)
        ctx.fillStyle = '#34464d'
        ctx.font = '600 10px Arial'
        ctx.fillText(appMeta[id].title, x + 37, y + 21)
        hitsRef.current.push({ x, y, width: 116, height: 34, action: 'open-app', id })
      })
    }

    const drawWindow = (win: CanvasWindow) => {
      if (win.minimized) return
      const x = win.maximized ? 12 : win.x
      const y = win.maximized ? 12 : win.y
      const width = win.maximized ? WIDTH - 24 : win.width
      const height = win.maximized ? HEIGHT - TASKBAR_H - 26 : win.height
      ctx.save()
      ctx.shadowColor = 'rgba(7,17,23,.28)'
      ctx.shadowBlur = 26
      ctx.shadowOffsetY = 12
      fillRound(ctx, x, y, width, height, 14, 'rgba(246,249,248,.985)', 'rgba(255,255,255,.52)')
      ctx.restore()
      const titleGradient = ctx.createLinearGradient(x, y, x + width, y)
      titleGradient.addColorStop(0, '#24353d')
      titleGradient.addColorStop(1, '#334b55')
      roundRect(ctx, x, y, width, TITLEBAR_H + 2, 14)
      ctx.fillStyle = titleGradient
      ctx.fill()
      ctx.fillRect(x, y + TITLEBAR_H - 10, width, 12)
      ctx.fillStyle = '#eff5f3'
      ctx.font = '700 10px Arial'
      ctx.fillText(win.title, x + 13, y + 20)
      hitsRef.current.push({ x, y, width, height, action: 'focus-window', id: win.id })
      hitsRef.current.push({ x, y, width: width - 94, height: TITLEBAR_H, action: 'drag-window', id: win.id })

      const controls = [
        { action: 'minimize-window', glyph: '—', offset: 68 },
        { action: 'maximize-window', glyph: '□', offset: 44 },
        { action: 'close-window', glyph: '×', offset: 20 }
      ]
      controls.forEach((control) => {
        const cx = x + width - control.offset
        const hovered = hoverKey === `${control.action}:${win.id}`
        ctx.beginPath()
        ctx.arc(cx + 7, y + 15, 7, 0, Math.PI * 2)
        ctx.fillStyle = control.action === 'close-window' ? (hovered ? '#d46d67' : '#a85e59') : (hovered ? '#6f8790' : '#50656e')
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.92)'
        ctx.font = control.glyph === '×' ? '700 11px Arial' : '700 8px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(control.glyph, cx + 7, y + 18)
        ctx.textAlign = 'left'
        hitsRef.current.push({ x: cx, y: y + 8, width: 16, height: 16, action: control.action, id: win.id })
      })

      const contentX = x + 16
      const contentY = y + TITLEBAR_H + 10
      const contentW = width - 32
      const contentH = height - TITLEBAR_H - 22
      ctx.save()
      ctx.beginPath()
      ctx.rect(contentX, contentY, contentW, contentH)
      ctx.clip()
      ctx.translate(0, -win.scroll)
      const baseY = contentY
      ctx.fillStyle = '#2f3b40'

      if (win.id === 'about') {
        ctx.fillStyle = '#748188'
        ctx.font = '700 10px Arial'
        ctx.fillText('ABOUT', contentX, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 34px Arial'
        ctx.fillText(profile.name, contentX, baseY + 52)
        ctx.fillStyle = '#536168'
        ctx.font = '18px Arial'
        wrapText(ctx, profile.intro, contentX, baseY + 86, contentW - 20, 25, 4)
        const cards = [
          ['School', profile.school],
          ['Graduation', profile.graduation],
          ['Focus', 'AI / Machine Learning'],
          ['Also', 'Pianist · Teacher · Builder']
        ]
        cards.forEach(([label, value], index) => {
          const cy = baseY + 200 + index * 48
          ctx.fillStyle = '#89949a'
          ctx.font = '700 10px Arial'
          ctx.fillText(label.toUpperCase(), contentX, cy)
          ctx.fillStyle = '#314047'
          ctx.font = '600 14px Arial'
          ctx.fillText(value, contentX + 110, cy)
        })
        ctx.fillStyle = '#89949a'
        ctx.font = '700 10px Arial'
        ctx.fillText('TOOLKIT', contentX, baseY + 410)
        let chipX = contentX
        let chipY = baseY + 430
        skills.forEach((skill) => {
          ctx.font = '600 10px Arial'
          const sw = ctx.measureText(skill).width + 18
          if (chipX + sw > contentX + contentW) {
            chipX = contentX
            chipY += 30
          }
          fillRound(ctx, chipX, chipY, sw, 23, 11, '#e2e7e5')
          ctx.fillStyle = '#526067'
          ctx.fillText(skill, chipX + 9, chipY + 15)
          chipX += sw + 7
        })
      } else if (win.id === 'projects') {
        if (selectedProject) {
          const project = projects.find((item) => item.id === selectedProject)
          if (project) {
            fillRound(ctx, contentX, baseY + 2, 88, 28, 9, '#e1e7e5')
            ctx.fillStyle = '#526067'
            ctx.font = '700 11px Arial'
            ctx.fillText('← Projects', contentX + 11, baseY + 20)
            hitsRef.current.push({ x: contentX, y: baseY + 2 - win.scroll, width: 88, height: 28, action: 'projects-back' })
            ctx.fillStyle = '#7e8a90'
            ctx.font = '700 10px Arial'
            ctx.fillText(project.status, contentX, baseY + 58)
            ctx.fillStyle = '#26343a'
            ctx.font = '800 36px Arial'
            ctx.fillText(project.name, contentX, baseY + 100)
            ctx.fillStyle = '#526067'
            ctx.font = '18px Arial'
            wrapText(ctx, project.tagline, contentX, baseY + 130, contentW - 10, 24, 3)
            ctx.fillStyle = '#69777d'
            ctx.font = '14px Arial'
            wrapText(ctx, project.description, contentX, baseY + 210, contentW - 10, 21, 7)
            ctx.fillStyle = '#809097'
            ctx.font = '700 10px Arial'
            ctx.fillText('STACK', contentX, baseY + 365)
            let px = contentX
            project.stack.forEach((item) => {
              ctx.font = '600 10px Arial'
              const w = ctx.measureText(item).width + 18
              fillRound(ctx, px, baseY + 382, w, 23, 11, '#e2e7e5')
              ctx.fillStyle = '#526067'
              ctx.fillText(item, px + 9, baseY + 397)
              px += w + 7
            })
          }
        } else {
          ctx.fillStyle = '#79868c'
          ctx.font = '700 10px Arial'
          ctx.fillText('SELECTED BUILDS', contentX, baseY + 10)
          projects.forEach((project, index) => {
            const py = baseY + 34 + index * 75
            fillRound(ctx, contentX, py, contentW, 63, 11, '#edf0ef', '#d8dedc')
            drawIcon(ctx, 'folder', contentX + 10, py + 12, 38)
            ctx.fillStyle = '#2f3d43'
            ctx.font = '700 15px Arial'
            ctx.fillText(project.name, contentX + 60, py + 22)
            ctx.fillStyle = '#718087'
            ctx.font = '11px Arial'
            wrapText(ctx, project.tagline, contentX + 60, py + 40, contentW - 85, 15, 2)
            hitsRef.current.push({ x: contentX, y: py - win.scroll, width: contentW, height: 63, action: 'project-open', id: project.id })
          })
        }
      } else if (win.id === 'experience') {
        ctx.fillStyle = '#7d898f'
        ctx.font = '700 10px Arial'
        ctx.fillText('WORK / LEAD / TEACH', contentX, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 34px Arial'
        ctx.fillText('Experience', contentX, baseY + 52)
        experience.forEach((item, index) => {
          const ey = baseY + 92 + index * 122
          ctx.fillStyle = '#8a969b'
          ctx.font = '700 10px Arial'
          ctx.fillText(item.period, contentX, ey)
          ctx.fillStyle = '#2f3d43'
          ctx.font = '700 16px Arial'
          ctx.fillText(item.role, contentX, ey + 27)
          ctx.fillStyle = '#607077'
          ctx.font = '600 12px Arial'
          ctx.fillText(item.organization, contentX, ey + 47)
          ctx.fillStyle = '#6f7c82'
          ctx.font = '12px Arial'
          wrapText(ctx, item.description, contentX, ey + 68, contentW - 20, 17, 3)
        })
      } else if (win.id === 'research') {
        const notes = [
          ['Brain-computer interfaces', 'How can machine learning turn noisy neural signals into reliable intent for prosthetic control?'],
          ['Adaptive systems', 'A useful model should adapt to one person over time without becoming unpredictable.'],
          ['Human control', 'Where should autonomous assistance end and direct user control begin?'],
          ['Trust', 'A technically accurate system still fails if the person using it cannot understand or trust what it will do.']
        ]
        const sidebarW = 185
        fillRound(ctx, contentX, baseY, sidebarW, 290, 10, '#e8ecea')
        notes.forEach(([title], index) => {
          const ny = baseY + 12 + index * 58
          fillRound(ctx, contentX + 8, ny, sidebarW - 16, 46, 8, index === researchNote ? '#d5dfdb' : 'rgba(255,255,255,0)')
          ctx.fillStyle = index === researchNote ? '#304239' : '#637169'
          ctx.font = '600 11px Arial'
          wrapText(ctx, title, contentX + 18, ny + 15, sidebarW - 38, 14, 2)
          hitsRef.current.push({ x: contentX + 8, y: ny - win.scroll, width: sidebarW - 16, height: 46, action: 'research-note', id: String(index) })
        })
        ctx.fillStyle = '#7f8c91'
        ctx.font = '700 10px Arial'
        ctx.fillText('RESEARCH NOTEBOOK', contentX + sidebarW + 24, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 27px Arial'
        wrapText(ctx, notes[researchNote][0], contentX + sidebarW + 24, baseY + 48, contentW - sidebarW - 34, 32, 2)
        ctx.fillStyle = '#536168'
        ctx.font = '16px Arial'
        wrapText(ctx, notes[researchNote][1], contentX + sidebarW + 24, baseY + 125, contentW - sidebarW - 34, 23, 5)
        fillRound(ctx, contentX + sidebarW + 24, baseY + 245, contentW - sidebarW - 34, 105, 12, '#e4e9e7')
        ctx.fillStyle = '#536168'
        ctx.font = '700 11px Arial'
        ctx.fillText('LONG-TERM PULL', contentX + sidebarW + 40, baseY + 270)
        ctx.font = '13px Arial'
        wrapText(ctx, 'I want to work on intelligent assistive systems that feel less like commanding a machine and more like extending the body.', contentX + sidebarW + 40, baseY + 294, contentW - sidebarW - 66, 18, 4)
      } else if (win.id === 'resume') {
        fillRound(ctx, contentX + 34, baseY, contentW - 68, 720, 3, '#ffffff', '#d9dddc')
        const rx = contentX + 58
        const rw = contentW - 116
        ctx.fillStyle = '#1f2c31'
        ctx.font = '800 30px Arial'
        ctx.fillText(profile.name, rx, baseY + 48)
        ctx.fillStyle = '#657278'
        ctx.font = '12px Arial'
        ctx.fillText('Computer Science · AI & Machine Learning', rx, baseY + 70)
        ctx.font = '700 10px Arial'
        ctx.fillText(`${profile.school} · ${profile.graduation}`, rx, baseY + 90)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 14px Arial'
        ctx.fillText('EXPERIENCE', rx, baseY + 130)
        experience.forEach((item, index) => {
          const ey = baseY + 158 + index * 112
          ctx.font = '700 13px Arial'
          ctx.fillText(item.role, rx, ey)
          ctx.fillStyle = '#6b777c'
          ctx.font = '11px Arial'
          ctx.fillText(`${item.organization} · ${item.period}`, rx, ey + 18)
          ctx.font = '11px Arial'
          wrapText(ctx, item.description, rx, ey + 39, rw, 15, 3)
          ctx.fillStyle = '#26343a'
        })
        ctx.font = '800 14px Arial'
        ctx.fillText('SKILLS', rx, baseY + 510)
        ctx.fillStyle = '#68757a'
        ctx.font = '11px Arial'
        wrapText(ctx, skills.join(' · '), rx, baseY + 535, rw, 17, 5)
      } else if (win.id === 'contact') {
        ctx.fillStyle = '#7f8b90'
        ctx.font = '700 10px Arial'
        ctx.fillText('CONTACT', contentX, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 34px Arial'
        ctx.fillText('Say hello.', contentX, baseY + 52)
        ctx.fillStyle = '#59676d'
        ctx.font = '15px Arial'
        wrapText(ctx, 'Internships, research, projects, ACM, or anything interesting enough to justify a message.', contentX, baseY + 84, contentW - 10, 22, 3)
        const links = [
          ['GitHub', profile.links.github, 'github.com/simonbalanoff'],
          ['LinkedIn', profile.links.linkedin, profile.links.linkedin.includes('REPLACE_ME') ? 'add your LinkedIn URL in portfolio.ts' : 'LinkedIn profile'],
          ['Email', profile.links.email, profile.links.email.includes('REPLACE_ME') ? 'add your email in portfolio.ts' : profile.links.email.replace('mailto:', '')],
          ['Resume', profile.links.resume, profile.links.resume === '#' ? 'add your resume URL in portfolio.ts' : 'Open resume']
        ]
        links.forEach(([label, href, detail], index) => {
          const ly = baseY + 170 + index * 58
          const disabled = href === '#' || href.includes('REPLACE_ME')
          fillRound(ctx, contentX, ly, contentW, 48, 10, disabled ? '#eceeed' : '#e5ebe8', '#d3d9d7')
          ctx.fillStyle = disabled ? '#9ca4a5' : '#33443c'
          ctx.font = '700 13px Arial'
          ctx.fillText(label, contentX + 14, ly + 19)
          ctx.fillStyle = '#758186'
          ctx.font = '10px Arial'
          ctx.fillText(detail, contentX + 120, ly + 19)
          if (!disabled) hitsRef.current.push({ x: contentX, y: ly - win.scroll, width: contentW, height: 48, action: 'open-link', id: href })
        })
      } else if (win.id === 'terminal') {
        ctx.fillStyle = '#131a1d'
        ctx.fillRect(contentX, baseY, contentW, contentH + win.scroll)
        ctx.fillStyle = '#b9c8c3'
        ctx.font = '12px monospace'
        let ty = baseY + 18
        terminalHistory.slice(-28).forEach((line) => {
          wrapText(ctx, line, contentX + 12, ty, contentW - 24, 17, 2)
          ty += 19
        })
        ctx.fillStyle = '#87a89b'
        ctx.fillText(`visitor@simon-os:${fsDisplayPath(terminalCwd)}$`, contentX + 12, ty + 4)
        ctx.fillStyle = '#ffffff'
        const promptWidth = ctx.measureText(`visitor@simon-os:${fsDisplayPath(terminalCwd)}$`).width
        ctx.fillText(terminalInput || (terminalFocused.current ? '▌' : 'click here to type'), contentX + 18 + promptWidth, ty + 4)
        hitsRef.current.push({ x: contentX, y: contentY, width: contentW, height: contentH, action: 'focus-terminal' })
      } else if (win.id === 'signal') {
        const count = requiredSignals.filter((signal) => visited.includes(signal)).length
        ctx.fillStyle = '#7d898e'
        ctx.font = '700 10px Arial'
        ctx.fillText('ANOMALOUS SIGNAL', contentX, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 31px Arial'
        ctx.fillText(questComplete ? 'Signal complete.' : 'Something is hiding in here.', contentX, baseY + 52)
        ctx.fillStyle = '#5d6b71'
        ctx.font = '14px Arial'
        wrapText(ctx, questComplete ? 'You explored the whole workspace. A new file has appeared on the desktop.' : 'The computer seems to notice when you explore. There are eight signals to find.', contentX, baseY + 84, contentW - 10, 20, 4)
        requiredSignals.forEach((signal, index) => {
          const sx = contentX + (index % 4) * 112
          const sy = baseY + 160 + Math.floor(index / 4) * 64
          fillRound(ctx, sx, sy, 102, 52, 10, visited.includes(signal) ? '#d9e3d7' : '#eaedeb')
          ctx.fillStyle = visited.includes(signal) ? '#4f6c50' : '#9ca4a5'
          ctx.font = '800 18px Arial'
          ctx.fillText(visited.includes(signal) ? '✦' : '·', sx + 12, sy + 26)
          ctx.font = '700 9px Arial'
          ctx.fillText(visited.includes(signal) ? signal.toUpperCase() : '???', sx + 36, sy + 25)
        })
        ctx.fillStyle = '#7c888d'
        ctx.font = '700 11px Arial'
        ctx.fillText(`${count}/8 signals found`, contentX, baseY + 315)
      } else if (win.id === 'archive') {
        ctx.fillStyle = '#8f7950'
        ctx.font = '700 10px Arial'
        ctx.fillText('YOU FOUND IT', contentX, baseY + 12)
        ctx.fillStyle = '#26343a'
        ctx.font = '800 31px Arial'
        ctx.fillText("Simon's hidden archive", contentX, baseY + 52)
        ctx.fillStyle = '#5e6b70'
        ctx.font = '13px Arial'
        ctx.fillText('You actually clicked through the portfolio. Respect.', contentX, baseY + 80)
        const items = [
          ['rubber_duck.exe', archiveDuck ? `quack count: ${archiveDuck}` : 'debugging assistant', 'archive-duck'],
          ['unfinished_projects.zip', archiveOpen ? 'too many ideas, not enough weekends' : 'classified-ish', 'archive-projects'],
          ['party_mode.sys', party ? 'enabled ✦' : 'do not press', 'archive-party'],
          ['source_code.url', 'the least secret file here', 'archive-source']
        ]
        items.forEach(([label, detail, action], index) => {
          const ax = contentX + (index % 2) * ((contentW - 12) / 2 + 12)
          const ay = baseY + 120 + Math.floor(index / 2) * 94
          const aw = (contentW - 12) / 2
          fillRound(ctx, ax, ay, aw, 82, 12, '#e7ebe8', '#d3d9d6')
          ctx.fillStyle = '#33423b'
          ctx.font = '700 13px monospace'
          ctx.fillText(label, ax + 13, ay + 28)
          ctx.fillStyle = '#77837f'
          ctx.font = '11px Arial'
          wrapText(ctx, detail, ax + 13, ay + 50, aw - 26, 15, 2)
          hitsRef.current.push({ x: ax, y: ay - win.scroll, width: aw, height: 82, action })
        })
        fillRound(ctx, contentX, baseY + 330, contentW, 46, 10, '#dce7d9')
        ctx.fillStyle = '#4b684c'
        ctx.font = '700 12px Arial'
        ctx.fillText('Achievement unlocked: Actually explored the portfolio', contentX + 14, baseY + 358)
      }
      ctx.restore()
    }

    windows.filter((item) => !item.minimized).sort((a, b) => a.z - b.z).forEach(drawWindow)

    softPanel(ctx, 10, HEIGHT - TASKBAR_H - 7, WIDTH - 20, TASKBAR_H, 13, 'rgba(25,38,45,.90)', 'rgba(255,255,255,.13)', 'rgba(5,14,20,.24)')
    const launcherHover = hoverKey === 'toggle-launcher:'
    fillRound(ctx, 18, HEIGHT - TASKBAR_H, 70, TASKBAR_H - 14, 8, launcherOpen || launcherHover ? '#58707a' : '#40545d')
    fillRound(ctx, 24, HEIGHT - TASKBAR_H + 5, 18, 18, 6, '#dbe5e2')
    ctx.fillStyle = '#2a3b42'
    ctx.font = '800 10px Arial'
    ctx.fillText('S', 30, HEIGHT - 19)
    ctx.fillStyle = '#f0f5f3'
    ctx.font = '700 10px Arial'
    ctx.fillText('Apps', 48, HEIGHT - 19)
    hitsRef.current.push({ x: 18, y: HEIGHT - TASKBAR_H, width: 70, height: TASKBAR_H - 14, action: 'toggle-launcher' })

    let taskX = 98
    windows.slice().sort((a, b) => a.z - b.z).forEach((win) => {
      const tw = Math.min(112, Math.max(72, 38 + ctx.measureText(win.title).width))
      const hovered = hoverKey === `task-window:${win.id}`
      fillRound(ctx, taskX, HEIGHT - TASKBAR_H, tw, TASKBAR_H - 14, 8, win.minimized ? '#34474f' : hovered ? '#6a818a' : '#536972')
      drawIcon(ctx, appMeta[win.id].icon, taskX + 7, HEIGHT - TASKBAR_H + 4, 18)
      ctx.fillStyle = '#edf3f1'
      ctx.font = '600 9px Arial'
      ctx.fillText(win.title, taskX + 30, HEIGHT - 19)
      hitsRef.current.push({ x: taskX, y: HEIGHT - TASKBAR_H, width: tw, height: TASKBAR_H - 14, action: 'task-window', id: win.id })
      taskX += tw + 5
    })

    const signalCount = requiredSignals.filter((signal) => visited.includes(signal)).length
    const signalHover = hoverKey === 'open-app:signal'
    fillRound(ctx, WIDTH - 154, HEIGHT - TASKBAR_H, 66, TASKBAR_H - 14, 8, signalHover ? '#53676f' : 'rgba(255,255,255,.055)')
    ctx.fillStyle = '#e5ca79'
    ctx.font = '700 10px Arial'
    ctx.fillText(`✦ ${signalCount}/8`, WIDTH - 141, HEIGHT - 19)
    hitsRef.current.push({ x: WIDTH - 154, y: HEIGHT - TASKBAR_H, width: 66, height: TASKBAR_H - 14, action: 'open-app', id: 'signal' })
    ctx.fillStyle = '#dfe8e5'
    ctx.font = '10px Arial'
    const timeText = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: showSeconds ? '2-digit' : undefined })
    ctx.textAlign = 'right'
    ctx.fillText(timeText, WIDTH - 24, HEIGHT - 19)
    ctx.textAlign = 'left'
    hitsRef.current.push({ x: WIDTH - 84, y: HEIGHT - TASKBAR_H, width: 66, height: TASKBAR_H - 14, action: 'toggle-seconds' })

    texture.needsUpdate = true
  }

  useEffect(drawDesktop, [windows, launcherOpen, selectedProject, researchNote, archiveDuck, archiveOpen, party, terminalHistory, terminalInput, terminalCwd, showSeconds, now, visited, questComplete, hoverKey])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  const pointerToCanvas = (event: ThreeEvent<PointerEvent | MouseEvent | WheelEvent>) => {
    if (!event.uv) return null
    return { x: event.uv.x * WIDTH, y: (1 - event.uv.y) * HEIGHT }
  }

  const handleAction = (hit: Hit) => {
    const id = hit.id as AppId | undefined
    if (hit.action === 'open-app' && id) openApp(id)
    else if (hit.action === 'toggle-launcher') setLauncherOpen((value) => !value)
    else if (hit.action === 'focus-window' && id) focusWindow(id)
    else if (hit.action === 'close-window' && id) closeWindow(id)
    else if (hit.action === 'minimize-window' && id) toggleMinimize(id)
    else if (hit.action === 'maximize-window' && id) toggleMaximize(id)
    else if (hit.action === 'task-window' && id) {
      const win = windowsRef.current.find((item) => item.id === id)
      if (win?.minimized) focusWindow(id)
      else if (win && win.z === Math.max(...windowsRef.current.map((item) => item.z))) toggleMinimize(id)
      else focusWindow(id)
    } else if (hit.action === 'project-open' && hit.id) setSelectedProject(hit.id)
    else if (hit.action === 'projects-back') setSelectedProject(null)
    else if (hit.action === 'research-note' && hit.id) setResearchNote(Number(hit.id))
    else if (hit.action === 'focus-terminal') terminalFocused.current = true
    else if (hit.action === 'toggle-seconds') setShowSeconds((value) => !value)
    else if (hit.action === 'open-link' && hit.id) {
      if (hit.id.startsWith('mailto:')) window.location.href = hit.id
      else window.open(hit.id, '_blank', 'noopener,noreferrer')
    } else if (hit.action === 'archive-duck') setArchiveDuck((value) => value + 1)
    else if (hit.action === 'archive-projects') setArchiveOpen((value) => !value)
    else if (hit.action === 'archive-party') setParty((value) => !value)
    else if (hit.action === 'archive-source') window.open(profile.links.github, '_blank', 'noopener,noreferrer')
  }

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (!active) {
      onSelect()
      return
    }
    const point = pointerToCanvas(event)
    if (!point) return
    const hits = hitsRef.current
    const hit = [...hits].reverse().find((candidate) => hitContains(candidate, point.x, point.y))
    if (!hit) {
      terminalFocused.current = false
      setLauncherOpen(false)
      return
    }
    if (hit.action === 'drag-window' && hit.id) {
      const win = windowsRef.current.find((item) => item.id === hit.id)
      if (win && !win.maximized) {
        focusWindow(win.id)
        dragRef.current = { id: win.id, offsetX: point.x - win.x, offsetY: point.y - win.y }
        const target = event.target as unknown as { setPointerCapture?: (pointerId: number) => void }
        target.setPointerCapture?.(event.pointerId)
      }
      return
    }
    handleAction(hit)
  }

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!active) return
    const point = pointerToCanvas(event)
    if (!point) return
    if (!dragRef.current) {
      const hit = [...hitsRef.current].reverse().find((candidate) => hitContains(candidate, point.x, point.y))
      const nextKey = hit ? `${hit.action}:${hit.id ?? ''}` : ''
      setHoverKey((current) => current === nextKey ? current : nextKey)
      document.body.style.cursor = hit ? (hit.action === 'drag-window' ? 'grab' : 'pointer') : 'default'
      return
    }
    const drag = dragRef.current
    setWindows((current) => current.map((item) => {
      if (item.id !== drag.id || item.maximized) return item
      const x = Math.max(6, Math.min(WIDTH - item.width - 6, point.x - drag.offsetX))
      const y = Math.max(6, Math.min(HEIGHT - TASKBAR_H - item.height - 6, point.y - drag.offsetY))
      return { ...item, x, y }
    }))
  }

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    dragRef.current = null
    const target = event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }
    target.releasePointerCapture?.(event.pointerId)
  }

  const onWheel = (event: ThreeEvent<WheelEvent>) => {
    if (!active) return
    event.stopPropagation()
    const point = pointerToCanvas(event)
    if (!point) return
    const candidates = windowsRef.current.filter((win) => !win.minimized).sort((a, b) => b.z - a.z)
    const win = candidates.find((item) => {
      const x = item.maximized ? 12 : item.x
      const y = item.maximized ? 12 : item.y
      const width = item.maximized ? WIDTH - 24 : item.width
      const height = item.maximized ? HEIGHT - TASKBAR_H - 26 : item.height
      return point.x >= x && point.x <= x + width && point.y >= y + TITLEBAR_H && point.y <= y + height
    })
    if (!win) return
    setWindows((current) => current.map((item) => item.id === win.id ? { ...item, scroll: Math.max(0, Math.min(600, item.scroll + event.deltaY * 0.7)) } : item))
  }

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 }
  }), [texture])

  return (
    <mesh
      position={[0, 3.37, 0.305]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      onPointerOver={() => { document.body.style.cursor = active ? 'default' : 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default'; setHoverKey('') }}
    >
      <planeGeometry args={[5.76, 3.375]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D uTexture;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            float radius = 0.026;
            vec2 q = abs(vUv - vec2(0.5)) - vec2(0.5 - radius);
            float rounded = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
            if (rounded > 0.0) discard;
            vec3 color = texture2D(uTexture, vUv).rgb;
            float vignette = 1.0 - smoothstep(0.34, 0.76, distance(vUv, vec2(0.5)));
            float scan = 0.997 + 0.003 * sin((vUv.y + uTime * 0.0015) * 1100.0);
            float glass = pow(max(0.0, 1.0 - distance(vUv, vec2(0.82, 0.08)) * 2.1), 5.0) * 0.025;
            color = color * mix(0.988, 1.012, vignette) * scan + glass;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        depthTest
        depthWrite
        toneMapped={false}
      />
    </mesh>
  )
}

export { useCanvasTextureLabel }
