const status = document.querySelector('#viewer-status');
const stage = document.querySelector('#document-stage');
const container = document.querySelector('#document-page');
const header = document.querySelector('.resume-header');
const main = document.querySelector('.resume-viewer-main');
const navigation = document.querySelector('#page-navigation');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const zoomIn = document.querySelector('#zoom-in');
const zoomOut = document.querySelector('#zoom-out');
const fit = document.querySelector('#fit-width');
const fitPage = document.querySelector('#fit-page');
const zoomLevel = document.querySelector('#zoom-level');
const BASE_SCALE = 96 / 72;
const READING_WIDTH = 920;
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const pageData = new Map();
let pdf, library, currentPage = 1, scale = BASE_SCALE, fitMode = 'width', revision = 0;
let chain = Promise.resolve();

function updateControls() {
  const zoom = scale / BASE_SCALE;
  navigation.hidden = !pdf || pdf.numPages === 1;
  previous.disabled = !pdf || currentPage <= 1;
  next.disabled = !pdf || currentPage >= pdf.numPages;
  zoomIn.disabled = !pdf || zoom >= ZOOM_STEPS.at(-1) - 0.001;
  zoomOut.disabled = !pdf || zoom <= ZOOM_STEPS[0] + 0.001;
  fit.disabled = fitPage.disabled = !pdf;
  fit.setAttribute('aria-pressed', String(fitMode === 'width'));
  fitPage.setAttribute('aria-pressed', String(fitMode === 'page'));
  if (pdf) document.querySelector('#page-count').textContent = `Page ${currentPage} of ${pdf.numPages}`;
}

// Detect only blank outer margins, retaining padding around every visible mark.
// The original PDF file, canvas, and text coordinates remain unchanged.
async function getPageData(number) {
  if (!pageData.has(number)) {
    pageData.set(number, (async () => {
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const preview = document.createElement('canvas');
      preview.width = Math.ceil(viewport.width);
      preview.height = Math.ceil(viewport.height);
      const context = preview.getContext('2d', { willReadFrequently: true });
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;
      const { data } = context.getImageData(0, 0, preview.width, preview.height);
      let left = preview.width, top = preview.height, right = -1, bottom = -1;
      for (let y = 0; y < preview.height; y++) {
        for (let x = 0; x < preview.width; x++) {
          const offset = (y * preview.width + x) * 4;
          if (data[offset + 3] > 32 && Math.min(data[offset], data[offset + 1], data[offset + 2]) < 245) {
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
      }
      const padding = 24;
      const crop = right < 0
        ? { left: 0, top: 0, width: viewport.width, height: viewport.height }
        : {
          left: Math.max(0, left - padding),
          top: Math.max(0, top - padding),
          width: Math.min(viewport.width, right + padding + 1) - Math.max(0, left - padding),
          height: Math.min(viewport.height, bottom + padding + 1) - Math.max(0, top - padding)
        };
      preview.width = preview.height = 0;
      const [text, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
      return { page, crop, text, annotations };
    })());
  }
  return pageData.get(number);
}

function getLinkTarget(annotation) {
  if (!annotation.url) return null;
  try {
    const url = new URL(annotation.url);
    if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    if (url.hostname === 'github.com') {
      url.protocol = 'https:';
      const path = url.pathname.replace(/\/$/, '').toLowerCase();
      // Present public work to visitors instead of private or outdated source URLs.
      if (path === '/simonbalanoff/biddly') return { href: 'projects/biddly.html', label: 'Biddly project' };
      if (['/simonbalanoff/umlvisualizer', '/simonbalanoff/uml-visualizer'].includes(path)) {
        return { href: 'projects/uml-visualizer.html', label: 'UML Visualizer project' };
      }
    }
    const external = ['https:', 'http:'].includes(url.protocol);
    const label = url.protocol === 'mailto:' ? `Email ${url.pathname}`
      : url.protocol === 'tel:' ? `Call ${url.pathname}`
      : `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')} (opens in a new tab)`;
    return { href: url.href, label, external };
  } catch { return null; }
}

function createLinks(annotations, viewport) {
  const layer = document.createElement('div');
  layer.className = 'pdf-links';
  annotations.filter(annotation => annotation.subtype === 'Link').forEach(annotation => {
    const target = getLinkTarget(annotation);
    if (!target || !annotation.rect) return;
    const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
    const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
    const link = document.createElement('a');
    link.href = target.href;
    link.setAttribute('aria-label', target.label);
    link.title = target.label;
    if (target.external) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    Object.assign(link.style, {
      left: `${Math.min(x1, x2)}px`, top: `${Math.min(y1, y2)}px`,
      width: `${Math.abs(x2 - x1)}px`, height: `${Math.abs(y2 - y1)}px`
    });
    layer.append(link);
  });
  return layer;
}

function render() {
  const requested = ++revision;
  updateControls();
  stage.setAttribute('aria-busy', 'true');
  chain = chain.catch(() => {}).then(async () => {
    if (requested !== revision) return;
    const { page, crop, text: textContent, annotations } = await getPageData(currentPage);
    if (requested !== revision) return;
    const stageStyle = getComputedStyle(stage);
    const horizontalPadding = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
    const availableWidth = Math.max(1, stage.clientWidth - horizontalPadding - 2);
    if (fitMode === 'width') scale = Math.min(READING_WIDTH, availableWidth) / crop.width;
    if (fitMode === 'page') {
      const mainStyle = getComputedStyle(main);
      const verticalSpacing = parseFloat(mainStyle.marginTop) + parseFloat(mainStyle.marginBottom)
        + parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);
      const availableHeight = Math.max(1, window.innerHeight - header.offsetHeight - verticalSpacing - 1);
      scale = Math.min(availableWidth / crop.width, availableHeight / crop.height);
    }
    const viewport = page.getViewport({ scale });
    // Keep large zoom levels within a reasonable canvas memory budget.
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(12_000_000 / (viewport.width * viewport.height)));
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = Math.ceil(viewport.width * ratio);
    canvas.height = Math.ceil(viewport.height * ratio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0], background: '#ffffff' }).promise;
    if (requested !== revision) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-content';
    wrapper.setAttribute('role', 'document');
    wrapper.setAttribute('aria-label', `Simon Balanoff’s resume, page ${currentPage}`);
    wrapper.style.width = `${crop.width * scale}px`;
    wrapper.style.height = `${crop.height * scale}px`;
    const sheet = document.createElement('div');
    sheet.className = 'pdf-page-sheet';
    sheet.style.setProperty('--scale-factor', viewport.scale);
    sheet.style.setProperty('--total-scale-factor', viewport.scale * page.userUnit);
    Object.assign(sheet.style, {
      width: `${viewport.width}px`, height: `${viewport.height}px`,
      left: `${-crop.left * scale}px`, top: `${-crop.top * scale}px`
    });
    const text = document.createElement('div');
    text.className = 'textLayer';
    sheet.append(canvas, text, createLinks(annotations, viewport));
    wrapper.append(sheet);
    await new library.TextLayer({ textContentSource: textContent, container: text, viewport }).render();
    if (requested !== revision) return;
    container.replaceChildren(wrapper);
    status.textContent = '';
    status.hidden = true;
    stage.setAttribute('aria-busy', 'false');
    zoomLevel.textContent = `${Math.round(scale / BASE_SCALE * 100)}%`;
    updateControls();
  }).catch(error => {
    if (requested !== revision) return;
    console.error('Resume rendering failed:', error);
    status.hidden = false;
    status.textContent = 'The resume could not be displayed. Please reload the page to try again.';
    stage.setAttribute('aria-busy', 'false');
  });
}

function changePage(direction) {
  if (!pdf) return;
  const number = currentPage + direction;
  if (number < 1 || number > pdf.numPages) return;
  currentPage = number;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  stage.scrollLeft = 0;
}
previous.addEventListener('click', () => changePage(-1));
next.addEventListener('click', () => changePage(1));
zoomIn.addEventListener('click', () => {
  const zoom = scale / BASE_SCALE;
  const step = ZOOM_STEPS.find(value => value > zoom + 0.03)
    ?? ZOOM_STEPS.find(value => value > zoom + 0.001);
  if (step) { fitMode = 'custom'; scale = step * BASE_SCALE; render(); }
});
zoomOut.addEventListener('click', () => {
  const zoom = scale / BASE_SCALE;
  const step = ZOOM_STEPS.findLast(value => value < zoom - 0.03)
    ?? ZOOM_STEPS.findLast(value => value < zoom - 0.001);
  if (step) { fitMode = 'custom'; scale = step * BASE_SCALE; render(); }
});
fit.addEventListener('click', () => { fitMode = 'width'; render(); stage.scrollLeft = 0; });
fitPage.addEventListener('click', () => {
  fitMode = 'page'; render(); stage.scrollLeft = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });
});
let resizeTimer;
function scheduleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (pdf && fitMode !== 'custom') render(); }, 100);
}
let lastWidth = 0;
new ResizeObserver(entries => {
  const width = entries[0].contentRect.width;
  if (Math.abs(width - lastWidth) < 0.5) return;
  lastWidth = width;
  scheduleResize();
}).observe(stage);
new ResizeObserver(scheduleResize).observe(header);
window.addEventListener('resize', scheduleResize);

try {
  library = await import('./vendor/pdfjs/pdf.js');
  library.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.js', import.meta.url).href;
  pdf = await library.getDocument({
    url: new URL('./assets/simon_balanoff_resume.pdf', import.meta.url).href,
    cMapUrl: new URL('./vendor/pdfjs/cmaps/', import.meta.url).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('./vendor/pdfjs/standard_fonts/', import.meta.url).href,
    wasmUrl: new URL('./vendor/pdfjs/wasm/', import.meta.url).href
  }).promise;
  render();
} catch (error) {
  console.error('Resume loading failed:', error);
  status.textContent = 'The resume could not be loaded. Please reload the page to try again.';
  stage.setAttribute('aria-busy', 'false');
}
