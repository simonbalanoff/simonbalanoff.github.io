# SIMON/OS v4.7 model integration patch

Apply on top of **v4.6-hybrid**. This patch changes only the 3D scene and adds the 19 original GLB assets. `DesktopOS.tsx` and `src/styles.css` are intentionally untouched.

## Install on macOS

1. Download and unzip `simon-workspace-v4.7-model-patch.zip`.
2. In Terminal, `cd` to your local portfolio repo.
3. Run `ditto ~/Downloads/simon-workspace-v4.7-model-patch/ ./` (adjust the source if your extraction folder has a different name).
4. Run `npm install`, `npm run dev`, and `npm run build`.
5. Commit and push your changes.

The patch contains `src/components/DeskScene.tsx`, `src/components/AssetModel.tsx`, `public/models/...`, and `ASSET_CREDITS.md`. It does not require new npm dependencies because the project already uses `@react-three/drei` and Three.js.

The base WebGL layer renders the monitor housing. The transparent foreground layer renders only the model's front bezel and speakers, preserving the crisp HTML/CSS monitor desktop. The separate physical screen plane and its existing perspective projection logic remain the same.

The duck, tiny piano, floppy disk and notebook are clickable optional Easter eggs. Their discovery IDs are stored using the existing `onVisit` callback; they do not affect the eight required portfolio signals.

The model files were checked with `trimesh` and the source passed a TypeScript transpilation syntax check. A complete production Vite build was not run in the authoring environment because npm dependencies were unavailable offline; please run `npm run build` locally before deployment.
