import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import type { FocusTarget } from '../types'
import { CameraRig } from './CameraRig'
import { DeskScene } from './DeskScene'

type WorkspaceCanvasProps = {
  focus: FocusTarget
  pointer: { x: number; y: number }
  onFocus: (focus: FocusTarget) => void
  onHover: (label: string | null) => void
}

export function WorkspaceCanvas({ focus, pointer, onFocus, onHover }: WorkspaceCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 41, near: 0.1, far: 50, position: [6.5, 4.35, 7.6] }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        gl.outputColorSpace = SRGBColorSpace
      }}
    >
      <Suspense fallback={null}>
        <CameraRig focus={focus} pointer={pointer} />
        <DeskScene focus={focus} onFocus={onFocus} onHover={onHover} />
      </Suspense>
    </Canvas>
  )
}
