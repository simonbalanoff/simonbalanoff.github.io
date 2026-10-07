import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import type { FocusTarget } from '../types'

type CameraRigProps = {
  focus: FocusTarget
  pointer: { x: number; y: number }
}

const positions: Record<FocusTarget, [number, number, number]> = {
  room: [6.5, 4.35, 7.6],
  monitor: [0, 3.05, 3.15],
  notebook: [-2.4, 2.75, 3.7],
  music: [-4.15, 3.2, 3.8],
  acm: [2.6, 2.85, 3.7],
  phone: [3.9, 2.55, 3.55],
  whiteboard: [-4.5, 4.55, 5.2]
}

const targets: Record<FocusTarget, [number, number, number]> = {
  room: [0, 2.25, 0],
  monitor: [0, 2.95, 0.45],
  notebook: [-2.3, 1.9, 0.45],
  music: [-3.85, 2.0, 0.15],
  acm: [2.45, 2.05, 0.2],
  phone: [3.75, 1.95, 0.45],
  whiteboard: [-3.7, 4.0, -2.45]
}

export function CameraRig({ focus, pointer }: CameraRigProps) {
  const { camera } = useThree()
  const targetPosition = useMemo(() => new Vector3(), [])
  const lookTarget = useMemo(() => new Vector3(), [])
  const currentLook = useMemo(() => new Vector3(0, 2.25, 0), [])

  useFrame((_, delta) => {
    const position = positions[focus]
    const target = targets[focus]
    const parallax = focus === 'room' ? 0.18 : 0.035
    targetPosition.set(position[0] + pointer.x * parallax, position[1] - pointer.y * parallax * 0.55, position[2])
    lookTarget.set(target[0] + pointer.x * parallax * 0.22, target[1] - pointer.y * parallax * 0.12, target[2])
    const factor = 1 - Math.exp(-delta * 3.4)
    camera.position.lerp(targetPosition, factor)
    currentLook.lerp(lookTarget, factor)
    camera.lookAt(currentLook)
  })

  return null
}
