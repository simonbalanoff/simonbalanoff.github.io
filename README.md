# Simon Workspace Portfolio v4.6

This version uses a hybrid monitor renderer: the workspace and physical desk are WebGL, while SIMON/OS is crisp HTML/CSS perspective-mapped to the monitor. A transparent foreground WebGL pass renders the monitor bezel and speakers above the UI so physical objects correctly occlude it.

## Run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

The included workflow deploys `dist/` to GitHub Pages on pushes to `main`.

## Edit portfolio content

Update `src/content/portfolio.ts` for projects, experience, links, skills, and current focus.

## Terminal

The terminal supports filesystem-style commands such as `pwd`, `ls`, `ls -la`, `cd`, `cat`, `tree`, `open`, `app`, `run`, `history`, and direct app commands. Hidden files and quest content are available through normal filesystem navigation.
