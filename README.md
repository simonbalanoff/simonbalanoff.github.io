# Simon Workspace Portfolio

An interactive Three.js portfolio built as a cinematic desk workspace with an in-monitor operating system.

## Stack

- React 19
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Lucide React

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Customize your content

Edit `src/content/portfolio.ts` first. That file contains your projects, experience, skills, current focus, piano repertoire, and external links.

Replace the placeholder GitHub, LinkedIn, email, and resume values under `profile.links`.

## GitHub Pages

The included workflow deploys the `dist` directory whenever `main` is pushed.

In your GitHub repository, open Settings → Pages and set Source to GitHub Actions.

If this is your personal `username.github.io` repository, leave `base: '/'` in `vite.config.ts`.

If you deploy to a project repository such as `username.github.io/portfolio`, change the Vite base to:

```ts
base: '/portfolio/'
```

## Main interactions

- Enter Workspace reveals the Three.js desk.
- Click the monitor to enter SB/OS.
- Click the notebook for research interests.
- Click the sheet music for piano repertoire.
- Click the ACM token for leadership.
- Click the phone for contact links.
- Click the whiteboard for current work.
- Press Escape to return to the desk.
- Press Command/Ctrl + K to jump directly into SB/OS.
- Portfolio Index provides a fast non-3D version for recruiters and mobile visitors.

## Art direction

The scene is entirely procedural, so there are no model or texture files to manage. You can later replace any object with GLTF models without changing the navigation architecture.
