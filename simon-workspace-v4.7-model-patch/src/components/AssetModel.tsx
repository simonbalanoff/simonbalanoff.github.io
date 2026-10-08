import * as THREE from 'three'
import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

export const assetPaths = {
  desk: '/models/desk/desk.glb',
  chair: '/models/desk/chair.glb',
  drawerCabinet: '/models/desk/drawer-cabinet.glb',
  monitor: '/models/computer/monitor.glb',
  keyboardMouse: '/models/computer/keyboard-mouse.glb',
  speaker: '/models/computer/speaker.glb',
  headphones: '/models/computer/headphones.glb',
  lamp: '/models/props/desk-lamp.glb',
  plant: '/models/props/plant.glb',
  mug: '/models/props/mug.glb',
  duck: '/models/props/rubber-duck.glb',
  stationery: '/models/props/stationery.glb',
  frame: '/models/props/picture-frame.glb',
  wallClock: '/models/props/wall-clock.glb',
  shelves: '/models/room/shelves.glb',
  armChair: '/models/room/arm-chair.glb',
  piano: '/models/extras/mini-piano.glb',
  floppyDisk: '/models/extras/floppy-disk.glb',
  notebook: '/models/extras/research-notebook.glb'
} as const

export type AssetKey = keyof typeof assetPaths

type AssetModelProps = { asset: AssetKey; mode?: 'all' | 'bezel' } & ThreeElements['group']

function LoadedAssetModel({ asset, mode = 'all', ...props }: AssetModelProps) {
  const { scene } = useGLTF(assetPaths[asset])
  const clone = useMemo(() => {
    const instance = scene.clone(true)
    instance.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      if (asset === 'monitor') {
        if (node.name.startsWith('monitor_neck')) node.position.y += 0.53
        if (node.name.startsWith('monitor_foot')) node.position.y += 0.66
        if (mode === 'bezel') node.visible = node.name.startsWith('bezel_') || node.name.startsWith('power_indicator') || node.name.startsWith('graphite2_')
      }
      node.castShadow = mode !== 'bezel'
      node.receiveShadow = mode !== 'bezel'
    })
    return instance
  }, [asset, mode, scene])
  return (
    <group {...props}>
      <primitive object={clone} />
    </group>
  )
}

export function AssetModel(props: AssetModelProps) {
  return <Suspense fallback={null}><LoadedAssetModel {...props} /></Suspense>
}
