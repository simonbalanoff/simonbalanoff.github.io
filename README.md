# Simon Balanoff — Software Engineering Portfolio

Professional portfolio built with static HTML, CSS, and JavaScript for GitHub Pages. The homepage leads with engineering experience and presents Biddly alongside research, simulation, and developer-tool projects. Five dedicated case studies provide implementation details and documented results.

## Development

```sh
npm ci
npm run dev
```

Visit http://127.0.0.1:5173. `npm run dev` builds and serves `dist/`; rerun the build after editing. `npm run preview` serves the current build. To choose another port, use `node scripts/serve.mjs dist 5174`.

`npm run build` creates the static deployment in `dist/`. The GitHub Actions workflow uses `npm ci`, builds, and deploys `dist/` when changes reach `main`. Set the repository's Pages source to GitHub Actions.

## Content and structure

- `index.html`: introduction, experience, projects, education, leadership, and contact.
- `projects/*.html`: shareable case studies with technical decisions, project evidence, and source links.
- `styles.css`: shared typography, homepage, project layouts, and responsive styles.
- `resume.html`, `resume-viewer.js`, `resume.css`: custom PDF viewer with selectable text, clickable document links, zoom, fit-to-width, and full-page controls. The default desktop reading width is 920px. Only blank outer margins are trimmed in the on-screen presentation, with padding retained around all visible content; the original PDF is unchanged. Single-page navigation is hidden. The viewer’s project links point to public case studies instead of private or outdated source URLs. Replace `assets/simon_balanoff_resume.pdf` to update the document.
- `assets/projects/`: local copies of original screenshots, research figures, and the simulator recording.
- `assets/social-preview.png`, `sitemap.xml`, `robots.txt`, `404.html`: link previews, indexing, and missing-page handling.

The build bundles PDF.js, its worker, fonts, character maps, WebAssembly files, and license. Generated `vendor/` files are ignored in Git and available to source-directory preview servers after a build. No external PDF plugin, CDN, backend, analytics, or tracking script is required.

## Content sources

Experience, education, dates, GPA, and leadership details come from the supplied resume. Project descriptions and results come from the public repositories reviewed November 18, 2026. Do not infer revenue, paid-customer counts, or causal product impact from usage or chapter outcomes. Telemetry results are qualified development findings, not evidence of cross-mission fault recovery.

See [PROJECT_SOURCES.md](PROJECT_SOURCES.md) for the original asset locations. Biddly screenshots use fictional demo data. The simulator video is loaded only on request and does not autoplay.

## Verification

Before deployment, build the site and check internal links, image loading, keyboard navigation, responsive layouts, PDF rendering, and video playback. The revised pages were checked in Chrome at desktop, tablet, and phone widths, with automated WCAG A/AA checks using axe.
