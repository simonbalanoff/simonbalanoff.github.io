import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { FocusTarget } from '../types'

type DeskSceneProps = {
  focus: FocusTarget
  onFocus: (focus: FocusTarget) => void
  onHover: (label: string | null) => void
}

type InteractiveGroupProps = {
  label: string
  target: FocusTarget
  onFocus: (focus: FocusTarget) => void
  onHover: (label: string | null) => void
  children: ReactNode
}

function InteractiveGroup({ label, target, onFocus, onHover, children }: InteractiveGroupProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    const desired = hovered ? 1.018 : 1
    const next = ref.current.scale.x + (desired - ref.current.scale.x) * (1 - Math.exp(-delta * 10))
    ref.current.scale.setScalar(next)
  })

  return (
    <group
      ref={ref}
      onPointerEnter={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
        setHovered(true)
        onHover(label)
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'default'
        setHovered(false)
        onHover(null)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onFocus(target)
      }}
    >
      {children}
    </group>
  )
}

function Desk() {
  return (
    <group>
      <RoundedBox args={[9.3, 0.34, 3.5]} radius={0.12} position={[0, 1.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3a2518" roughness={0.62} metalness={0.04} />
      </RoundedBox>
      {[-4.05, 4.05].flatMap((x) => [-1.3, 1.3].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.55, z]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 1.9, 0.25]} />
          <meshStandardMaterial color="#171310" roughness={0.7} />
        </mesh>
      )))}
    </group>
  )
}

function Monitor({ active }: { active: boolean }) {
  const screen = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!screen.current) return
    const material = screen.current.material as MeshStandardMaterial
    material.emissiveIntensity = active ? 1.8 : 1.2 + Math.sin(clock.elapsedTime * 1.3) * 0.06
  })

  return (
    <group position={[0, 2.9, 0.1]}>
      <RoundedBox args={[3.95, 2.35, 0.24]} radius={0.14} castShadow>
        <meshStandardMaterial color="#111217" roughness={0.35} metalness={0.5} />
      </RoundedBox>
      <mesh ref={screen} position={[0, 0.01, 0.132]}>
        <planeGeometry args={[3.55, 1.95]} />
        <meshStandardMaterial color="#101b25" emissive="#24445c" emissiveIntensity={1.25} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.7, 0.22]} />
        <meshStandardMaterial color="#16171a" metalness={0.58} roughness={0.28} />
      </mesh>
      <RoundedBox args={[1.35, 0.12, 0.65]} radius={0.06} position={[0, -1.88, 0.12]} castShadow>
        <meshStandardMaterial color="#16171a" metalness={0.5} roughness={0.3} />
      </RoundedBox>
    </group>
  )
}

function Keyboard() {
  const keys = useMemo(() => Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 12)
    const col = index % 12
    return { x: (col - 5.5) * 0.23, z: (row - 1) * 0.24 }
  }), [])

  return (
    <group position={[0, 1.82, 1.12]} rotation={[-0.08, 0, 0]}>
      <RoundedBox args={[3.25, 0.13, 0.95]} radius={0.07} castShadow receiveShadow>
        <meshStandardMaterial color="#1c1d20" roughness={0.56} />
      </RoundedBox>
      {keys.map((key, index) => (
        <mesh key={index} position={[key.x, 0.085, key.z]} castShadow>
          <boxGeometry args={[0.18, 0.06, 0.18]} />
          <meshStandardMaterial color="#33363a" roughness={0.56} />
        </mesh>
      ))}
    </group>
  )
}

function Notebook() {
  return (
    <group position={[-2.55, 1.84, 0.85]} rotation={[0, -0.18, 0.03]}>
      <RoundedBox args={[1.65, 0.11, 2.1]} radius={0.06} castShadow>
        <meshStandardMaterial color="#d8ccb2" roughness={0.82} />
      </RoundedBox>
      {[0.25, -0.1, -0.45].map((z) => (
        <mesh key={z} position={[0, 0.066, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 0.018]} />
          <meshBasicMaterial color="#8c8170" />
        </mesh>
      ))}
      <mesh position={[-0.56, 0.085, 0]}>
        <boxGeometry args={[0.025, 0.025, 1.75]} />
        <meshStandardMaterial color="#72574b" />
      </mesh>
    </group>
  )
}

function MusicSheet() {
  return (
    <group position={[-4.05, 1.86, 0.3]} rotation={[0, 0.15, -0.02]}>
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.045, 1.8]} />
        <meshStandardMaterial color="#eee9dc" roughness={0.92} />
      </mesh>
      {[-0.52, -0.35, -0.18, 0.08, 0.25, 0.42].map((z) => (
        <mesh key={z} position={[0, 0.028, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.02, 0.012]} />
          <meshBasicMaterial color="#7d7568" />
        </mesh>
      ))}
    </group>
  )
}

function Phone() {
  return (
    <group position={[3.72, 1.88, 0.75]} rotation={[0, -0.28, 0]}>
      <RoundedBox args={[0.72, 0.075, 1.36]} radius={0.12} castShadow>
        <meshStandardMaterial color="#0d0e11" metalness={0.3} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 1.18]} />
        <meshStandardMaterial color="#142532" emissive="#0d2634" emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

function AcmToken() {
  return (
    <group position={[2.55, 1.92, 0.55]} rotation={[-Math.PI / 2, 0, 0.12]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.09, 48]} />
        <meshStandardMaterial color="#205f88" metalness={0.25} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.052, 0]}>
        <torusGeometry args={[0.29, 0.035, 16, 48]} />
        <meshStandardMaterial color="#d9e5ec" metalness={0.25} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Mug() {
  return (
    <group position={[4.05, 2.0, -0.72]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.38, 0.34, 0.72, 32]} />
        <meshStandardMaterial color="#d6d0c2" roughness={0.5} />
      </mesh>
      <mesh position={[0.45, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.065, 16, 32, Math.PI * 1.5]} />
        <meshStandardMaterial color="#d6d0c2" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Lamp() {
  return (
    <group position={[3.55, 1.82, -1.15]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.55, 0.12, 32]} />
        <meshStandardMaterial color="#1c1b1a" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.15, 16]} />
        <meshStandardMaterial color="#22211f" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[-0.2, 2.07, 0]} rotation={[0, 0, 0.38]} castShadow>
        <coneGeometry args={[0.62, 0.8, 32, 1, true]} />
        <meshStandardMaterial color="#2b2926" side={2} metalness={0.4} roughness={0.32} />
      </mesh>
      <pointLight position={[-0.35, 1.88, 0.12]} intensity={52} distance={7} decay={2} color="#ffd7a3" castShadow />
    </group>
  )
}

function Whiteboard() {
  return (
    <group position={[-3.75, 4.0, -2.82]}>
      <RoundedBox args={[3.1, 1.95, 0.11]} radius={0.08} castShadow>
        <meshStandardMaterial color="#dad8d0" roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[3.32, 2.17, 0.06]} radius={0.08} position={[0, 0, -0.07]}>
        <meshStandardMaterial color="#292a2d" metalness={0.35} roughness={0.4} />
      </RoundedBox>
      {[-0.55, -0.18, 0.19, 0.56].map((y, index) => (
        <mesh key={y} position={[-0.5 + index * 0.18, y, 0.065]}>
          <boxGeometry args={[1.55 - index * 0.12, 0.035, 0.012]} />
          <meshBasicMaterial color={index === 0 ? '#537a8f' : '#777d7e'} />
        </mesh>
      ))}
    </group>
  )
}

function Room() {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[16, 0.1, 12]} />
        <meshStandardMaterial color="#171411" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.25, -3.4]} receiveShadow>
        <boxGeometry args={[16, 8.5, 0.12]} />
        <meshStandardMaterial color="#1e1d1c" roughness={0.88} />
      </mesh>
      <mesh position={[-6.8, 4.25, 0]} receiveShadow>
        <boxGeometry args={[0.12, 8.5, 7]} />
        <meshStandardMaterial color="#20201f" roughness={0.88} />
      </mesh>
      <group position={[4.9, 4.75, -3.25]}>
        <RoundedBox args={[3.0, 2.7, 0.08]} radius={0.06}>
          <meshStandardMaterial color="#10161c" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.72, 2.42]} />
          <meshStandardMaterial color="#0c1821" emissive="#101f2d" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <boxGeometry args={[0.08, 2.42, 0.02]} />
          <meshStandardMaterial color="#34373b" />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <boxGeometry args={[2.72, 0.08, 0.02]} />
          <meshStandardMaterial color="#34373b" />
        </mesh>
      </group>
    </group>
  )
}

export function DeskScene({ focus, onFocus, onHover }: DeskSceneProps) {
  return (
    <>
      <color attach="background" args={['#09090b']} />
      <fog attach="fog" args={['#09090b', 9, 19]} />
      <ambientLight intensity={0.65} color="#92a9bc" />
      <directionalLight position={[-4, 8, 5]} intensity={1.15} color="#8fa9c0" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 3.2, 2.6]} intensity={18} distance={7} decay={2} color="#6d9aba" />
      <Room />
      <Desk />
      <Keyboard />
      <Lamp />
      <Mug />
      <InteractiveGroup label="Open SB/OS" target="monitor" onFocus={onFocus} onHover={onHover}>
        <Monitor active={focus === 'monitor'} />
      </InteractiveGroup>
      <InteractiveGroup label="Open research notebook" target="notebook" onFocus={onFocus} onHover={onHover}>
        <Notebook />
      </InteractiveGroup>
      <InteractiveGroup label="Explore piano repertoire" target="music" onFocus={onFocus} onHover={onHover}>
        <MusicSheet />
      </InteractiveGroup>
      <InteractiveGroup label="ACM leadership" target="acm" onFocus={onFocus} onHover={onHover}>
        <AcmToken />
      </InteractiveGroup>
      <InteractiveGroup label="Contact Simon" target="phone" onFocus={onFocus} onHover={onHover}>
        <Phone />
      </InteractiveGroup>
      <InteractiveGroup label="What I'm doing now" target="whiteboard" onFocus={onFocus} onHover={onHover}>
        <Whiteboard />
      </InteractiveGroup>
    </>
  )
}
