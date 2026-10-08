import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { DesktopOS } from './DesktopOS'
import { AssetModel } from './AssetModel'

type SceneFocus = 'overview' | 'monitor' | 'acm' | 'uta'

type DeskSceneProps = {
  focus: SceneFocus
  onFocus: (focus: SceneFocus) => void
  visited: string[]
  onVisit: (id: string) => void
  questComplete: boolean
}

const colors = {
  wall: '#dde1df',
  wallWarm: '#eceae4',
  floor: '#bbb3a8',
  walnut: '#76513a',
  walnutDark: '#4b3328',
  graphite: '#252b2f',
  graphiteLight: '#434a4f',
  silver: '#c7c9c6',
  silverLight: '#ecece7',
  cream: '#f3f1ea',
  warm: '#ffdca8'
}

function CameraRig({ focus }: { focus: SceneFocus }) {
  const { camera, size } = useThree()
  const position = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const desiredLook = useRef(new THREE.Vector3(0, 2, 0))

  useFrame((_, delta) => {
    const narrow = size.width / Math.max(size.height, 1) < 0.9
    if (focus === 'monitor') {
      position.set(0, 3.48, narrow ? 6.5 : 6.0)
      look.set(0, 3.32, 0.08)
    } else if (focus === 'acm') {
      position.set(-5.05, 2.55, narrow ? 6.7 : 5.35)
      look.set(-5.05, 1.72, 0.1)
    } else if (focus === 'uta') {
      position.set(5.05, 2.55, narrow ? 6.7 : 5.35)
      look.set(5.05, 1.72, 0.1)
    } else {
      position.set(0, narrow ? 5.45 : 4.6, narrow ? 11.8 : 9.45)
      look.set(0, 1.9, 0.1)
    }

    const positionAlpha = 1 - Math.exp(-delta * 4.7)
    const lookAlpha = 1 - Math.exp(-delta * 5.5)
    camera.position.lerp(position, positionAlpha)
    desiredLook.current.lerp(look, lookAlpha)
    camera.lookAt(desiredLook.current)
  })

  return null
}

function useCursor(active: boolean) {
  useEffect(() => {
    if (active) document.body.style.cursor = 'pointer'
    return () => { document.body.style.cursor = 'default' }
  }, [active])
}

function Room() {
  return (
    <group>
      <RoundedBox args={[15, 0.32, 11]} radius={0.12} smoothness={4} position={[0, -0.42, 0.5]} receiveShadow><meshStandardMaterial color={colors.floor} roughness={0.82} /></RoundedBox>
      <mesh position={[0, 3.2, -3.35]} receiveShadow><boxGeometry args={[15, 7.2, 0.35]} /><meshStandardMaterial color={colors.wall} roughness={0.92} /></mesh>
      <mesh position={[-7.25, 3.2, 1.6]} receiveShadow><boxGeometry args={[0.35, 7.2, 10]} /><meshStandardMaterial color={colors.wallWarm} roughness={0.95} /></mesh>
      <RoundedBox args={[4.6, 0.12, 2.6]} radius={0.08} smoothness={4} position={[0, -0.21, 2.2]} receiveShadow><meshStandardMaterial color="#8c958b" roughness={0.95} /></RoundedBox>
      <group position={[-4.95, 4.35, -3.08]}><RoundedBox args={[2.2, 1.45, 0.18]} radius={0.08} smoothness={4}><meshStandardMaterial color="#e7e4dc" roughness={0.8} /></RoundedBox><mesh position={[0, 0, 0.1]}><planeGeometry args={[1.92, 1.17]} /><meshBasicMaterial color="#a9bfd0" /></mesh><mesh position={[-0.45, 0.18, 0.115]} rotation={[0, 0, -0.35]}><circleGeometry args={[0.26, 32]} /><meshBasicMaterial color="#d8c6a1" /></mesh><mesh position={[0.33, -0.18, 0.116]} rotation={[0, 0, 0.2]}><planeGeometry args={[0.86, 0.38]} /><meshBasicMaterial color="#6f8793" /></mesh></group>
    </group>
  )
}

function Desk() {
  return <AssetModel asset="desk" position={[0, -0.27, 0]} scale={[2.08, 0.82, 1.49]} />
}

function Speaker({ x }: { x: number }) {
  return <AssetModel asset="speaker" position={[x, 0.84, -0.08]} />
}

function Keyboard() {
  return <AssetModel asset="keyboardMouse" position={[-0.35, 0.84, 1.03]} />
}

function Headphones() {
  return <AssetModel asset="headphones" position={[1.75, 0.84, -1.08]} scale={0.8} rotation={[0, 0.42, 0]} />
}

function Tower() {
  return <AssetModel asset="drawerCabinet" position={[6.24, -0.28, -1.42]} scale={0.9} />
}

function Lamp() {
  return (
    <group position={[-4.62, 0.84, -0.96]}>
      <AssetModel asset="lamp" />
      <pointLight position={[-0.85, 1.72, 0.1]} intensity={5.2} distance={5.0} color={colors.warm} />
    </group>
  )
}

function Plant() {
  return <AssetModel asset="plant" position={[-3.12, 0.84, -1.1]} scale={0.78} />
}

function Duck({ onDiscover }: { onDiscover: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [quacks, setQuacks] = useState(0)
  useCursor(hovered)
  return (
    <group position={[-2.09, 0.84, -0.95]} scale={0.42}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(true) }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(false) }}
      onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); setQuacks((count) => count + 1); onDiscover() }}>
      <AssetModel asset="duck" />
      {quacks > 0 && <Html position={[0, 1.6, 0]} center style={{ pointerEvents: 'none' }}><div className="duck-bubble">{quacks === 1 ? 'quack.' : `quack × ${quacks}`}</div></Html>}
    </group>
  )
}

function DiscoveryProp({ asset, position, scale, rotation, onDiscover }: {
  asset: 'piano' | 'floppyDisk' | 'notebook'
  position: [number, number, number]
  scale: number
  rotation?: [number, number, number]
  onDiscover: () => void
}) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <group position={position} scale={scale} rotation={rotation}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(true) }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(false) }}
      onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onDiscover() }}>
      <AssetModel asset={asset} />
    </group>
  )
}

function OtherAssets({ onVisit }: { onVisit: (id: string) => void }) {
  return (
    <>
      <AssetModel asset="mug" position={[3.05, 0.84, 1.04]} scale={0.77} rotation={[0, -0.65, 0]} />
      <AssetModel asset="stationery" position={[-4.95, 0.84, 0.99]} scale={0.58} />
      <AssetModel asset="frame" position={[4.38, 0.84, -1.04]} scale={0.68} rotation={[0, -0.22, 0]} />
      <AssetModel asset="chair" position={[5.9, -0.27, 3.18]} scale={0.8} rotation={[0, -0.55, 0]} />
      <AssetModel asset="armChair" position={[-6.2, -0.26, 3.1]} scale={0.8} rotation={[0, 0.4, 0]} />
      <AssetModel asset="shelves" position={[5.8, -0.27, -2.55]} scale={0.86} />
      <AssetModel asset="wallClock" position={[5.55, 4.12, -3.10]} scale={0.85} />
      <DiscoveryProp asset="piano" position={[5.65, 1.56, -2.55]} scale={0.4} onDiscover={() => onVisit('piano')} />
      <DiscoveryProp asset="floppyDisk" position={[-1.32, 0.84, -0.94]} scale={0.32} rotation={[0, -0.45, 0]} onDiscover={() => onVisit('floppy')} />
      <DiscoveryProp asset="notebook" position={[-3.15, 0.84, 0.73]} scale={0.65} rotation={[0, 0.2, 0]} onDiscover={() => onVisit('notebook')} />
    </>
  )
}

function AchievementPlaque({ kind, active, onSelect }: { kind: 'acm' | 'uta'; active: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  const x = kind === 'acm' ? -5.05 : 5.05
  useCursor(hovered)
  const title = kind === 'acm' ? 'ACM @ CSU' : 'CS 214'
  const role = kind === 'acm' ? 'President' : 'Undergraduate TA'
  const note = kind === 'acm' ? 'Leadership · speakers · events · community' : 'Java · testing · mentoring · software design'
  return (
    <group position={[x, 0, 0.42]} onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(true) }} onPointerOut={() => setHovered(false)} onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect() }}>
      <RoundedBox args={[1.78, 1.5, 0.36]} radius={0.13} smoothness={5} position={[0, 1.62, 0]} castShadow><meshPhysicalMaterial color={kind === 'acm' ? '#31445a' : '#5b675e'} roughness={0.34} metalness={0.22} clearcoat={0.3} emissive={hovered || active ? (kind === 'acm' ? '#173d68' : '#234e38') : '#000000'} emissiveIntensity={hovered || active ? 0.22 : 0} /></RoundedBox>
      <RoundedBox args={[1.95, 0.14, 0.82]} radius={0.06} smoothness={4} position={[0, 0.83, 0]} castShadow><meshStandardMaterial color="#a8aaa5" metalness={0.2} roughness={0.45} /></RoundedBox>
      <Html transform position={[0, 1.64, 0.2]} scale={0.22} style={{ pointerEvents: 'none' }}><div className={`achievement-face ${active ? 'expanded' : ''}`}><span>ACHIEVEMENT</span><strong>{title}</strong><b>{role}</b><small>{note}</small>{active && <p>{kind === 'acm' ? 'I organize technical talks, career events, speakers, and community programming for CSU computer science students.' : 'I help students work through testing, object-oriented design, debugging, labs, and software-development assignments.'}</p>}</div></Html>
      <mesh position={[0, 1.62, 0.28]} visible={false}><boxGeometry args={[2.3, 2.0, 0.8]} /><meshBasicMaterial transparent opacity={0} /></mesh>
    </group>
  )
}


function squareToQuadMatrix(points: Array<{ x: number; y: number }>, width: number, height: number) {
  const [p0, p1, p2, p3] = points
  const dx1 = p1.x - p2.x
  const dx2 = p3.x - p2.x
  const dx3 = p0.x - p1.x + p2.x - p3.x
  const dy1 = p1.y - p2.y
  const dy2 = p3.y - p2.y
  const dy3 = p0.y - p1.y + p2.y - p3.y

  let a: number
  let b: number
  let c: number
  let d: number
  let e: number
  let f: number
  let g: number
  let h: number

  if (Math.abs(dx3) < 0.000001 && Math.abs(dy3) < 0.000001) {
    a = p1.x - p0.x
    b = p3.x - p0.x
    c = p0.x
    d = p1.y - p0.y
    e = p3.y - p0.y
    f = p0.y
    g = 0
    h = 0
  } else {
    const denominator = dx1 * dy2 - dx2 * dy1
    if (Math.abs(denominator) < 0.000001) return null
    g = (dx3 * dy2 - dx2 * dy3) / denominator
    h = (dx1 * dy3 - dx3 * dy1) / denominator
    a = p1.x - p0.x + g * p1.x
    b = p3.x - p0.x + h * p3.x
    c = p0.x
    d = p1.y - p0.y + g * p1.y
    e = p3.y - p0.y + h * p3.y
    f = p0.y
  }

  const h11 = a / width
  const h12 = b / height
  const h13 = c
  const h21 = d / width
  const h22 = e / height
  const h23 = f
  const h31 = g / width
  const h32 = h / height

  return `matrix3d(${h11},${h21},0,${h31},${h12},${h22},0,${h32},0,0,1,0,${h13},${h23},0,1)`
}

function MonitorScreenProjection({ overlayRef, screenAnchorRef, visible }: { overlayRef: RefObject<HTMLDivElement | null>; screenAnchorRef: RefObject<THREE.Group | null>; visible: boolean }) {
  const { camera, size } = useThree()
  const corners = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], [])
  const halfWidth = 2.98
  const halfHeight = 1.70

  useFrame(() => {
    const element = overlayRef.current
    const anchor = screenAnchorRef.current
    if (!element || !anchor) return

    if (!visible) {
      element.style.opacity = '0'
      element.style.visibility = 'hidden'
      return
    }

    camera.updateMatrixWorld()
    anchor.updateWorldMatrix(true, false)

    corners[0].set(-halfWidth, halfHeight, 0.05).applyMatrix4(anchor.matrixWorld).project(camera)
    corners[1].set(halfWidth, halfHeight, 0.05).applyMatrix4(anchor.matrixWorld).project(camera)
    corners[2].set(halfWidth, -halfHeight, 0.05).applyMatrix4(anchor.matrixWorld).project(camera)
    corners[3].set(-halfWidth, -halfHeight, 0.05).applyMatrix4(anchor.matrixWorld).project(camera)

    const points = corners.map((corner) => ({
      x: (corner.x * 0.5 + 0.5) * size.width,
      y: (-corner.y * 0.5 + 0.5) * size.height
    }))

    const area = points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length]
      return sum + point.x * next.y - next.x * point.y
    }, 0) * 0.5

    if (!Number.isFinite(area) || Math.abs(area) < 4) {
      element.style.opacity = '0'
      element.style.visibility = 'hidden'
      return
    }

    const transform = squareToQuadMatrix(points, 1024, 600)
    if (!transform) {
      element.style.opacity = '0'
      element.style.visibility = 'hidden'
      return
    }

    element.style.transform = transform
    element.style.opacity = '1'
    element.style.visibility = 'visible'
  })

  return null
}

function Monitor({ active, onSelect, screenAnchorRef }: { active: boolean; onSelect: () => void; screenAnchorRef: RefObject<THREE.Group | null> }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered && !active)
  return (
    <group position={[0, 0, -0.55]} onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); if (!active) setHovered(true) }} onPointerOut={() => setHovered(false)} onClick={(event: ThreeEvent<MouseEvent>) => { if (!active) { event.stopPropagation(); onSelect() } }}>
      <AssetModel asset="monitor" />
      <group ref={screenAnchorRef} position={[0, 3.37, 0.245]}>
        <RoundedBox args={[6.18, 3.62, 0.08]} radius={0.1} smoothness={5}><meshStandardMaterial color="#78909a" roughness={0.4} emissive="#38515f" emissiveIntensity={0.34} /></RoundedBox>
      </group>
      <mesh position={[0, 3.37, 0.34]} visible={false}><boxGeometry args={[6.48, 3.92, 0.52]} /><meshBasicMaterial transparent opacity={0} /></mesh>
      <pointLight position={[0, 3.35, 0.7]} intensity={active ? 2.2 : 1.0} distance={4.4} color="#7ba4bd" />
      {!active && <Html transform position={[0, 5.72, 0.24]} scale={0.18} style={{ pointerEvents: 'none' }}><div className={`monitor-callout ${hovered ? 'hovered' : ''}`}><strong>Portfolio computer</strong><span>click to use it</span></div></Html>}
    </group>
  )
}

function ForegroundBezel() {
  return (
    <group position={[0, 0, -0.55]}>
      <AssetModel asset="monitor" mode="bezel" />
    </group>
  )
}

function ForegroundScene({ focus }: { focus: SceneFocus }) {
  return (
    <>
      <hemisphereLight args={['#f7fbff', '#806d58', 2.2]} />
      <ambientLight intensity={1.12} />
      <directionalLight position={[5, 8, 8]} intensity={3.1} color="#f8fbff" />
      <CameraRig focus={focus} />
      <ForegroundBezel />
      <Speaker x={-3.56} />
      <Speaker x={3.56} />
    </>
  )
}

function Scene({ focus, onFocus, visited, onVisit, questComplete, screenOverlayRef, screenAnchorRef }: DeskSceneProps & { screenOverlayRef: RefObject<HTMLDivElement | null>; screenAnchorRef: RefObject<THREE.Group | null> }) {
  return (
    <>
      <color attach="background" args={['#cfd6d4']} />
      <hemisphereLight args={['#f7fbff', '#806d58', 2.2]} />
      <ambientLight intensity={1.12} />
      <directionalLight position={[5, 8, 8]} intensity={3.1} color="#f8fbff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-near={0.1} shadow-camera-far={30} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-3} />
      <pointLight position={[-5.8, 5.6, 4.5]} intensity={3.2} distance={12} color="#fff1d6" />
      <CameraRig focus={focus} />
      <MonitorScreenProjection overlayRef={screenOverlayRef} screenAnchorRef={screenAnchorRef} visible={focus === 'overview' || focus === 'monitor'} />
      <Room />
      <Desk />
      <Monitor active={focus === 'monitor'} onSelect={() => onFocus(focus === 'monitor' ? 'overview' : 'monitor')} screenAnchorRef={screenAnchorRef} />
      <Speaker x={-3.56} />
      <Speaker x={3.56} />
      <Keyboard />
      <Headphones />
      <Tower />
      <Lamp />
      <Plant />
      <Duck onDiscover={() => onVisit('duck')} />
      <OtherAssets onVisit={onVisit} />
      <AchievementPlaque kind="acm" active={focus === 'acm'} onSelect={() => onFocus('acm')} />
      <AchievementPlaque kind="uta" active={focus === 'uta'} onSelect={() => onFocus('uta')} />
    </>
  )
}

export function DeskScene(props: DeskSceneProps) {
  const screenOverlayRef = useRef<HTMLDivElement>(null)
  const screenAnchorRef = useRef<THREE.Group>(null)
  const screenVisible = props.focus === 'overview' || props.focus === 'monitor'

  return (
    <div className="workspace-stage">
      <Canvas className="workspace-canvas workspace-canvas-base" shadows="basic" dpr={[1, 1.8]} camera={{ position: [0, 4.6, 9.45], fov: 40, near: 0.1, far: 100 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.22 }} onPointerMissed={() => props.focus !== 'monitor' && props.onFocus('overview')}>
        <Scene {...props} screenOverlayRef={screenOverlayRef} screenAnchorRef={screenAnchorRef} />
      </Canvas>
      <div ref={screenOverlayRef} className={`monitor-os-projection ${props.focus === 'monitor' ? 'interactive' : ''}`} aria-hidden={!screenVisible}>
        <div className="monitor-os-surface">
          <DesktopOS active={props.focus === 'monitor'} onExit={() => props.onFocus('overview')} visited={props.visited} onVisit={props.onVisit} questComplete={props.questComplete} />
        </div>
      </div>
      <Canvas className="workspace-canvas workspace-foreground" dpr={[1, 1.8]} camera={{ position: [0, 4.6, 9.45], fov: 40, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.22 }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <ForegroundScene focus={props.focus} />
      </Canvas>
    </div>
  )
}
