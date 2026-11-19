document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll('.case-toc').forEach(navigation => {
  const entries = [...navigation.querySelectorAll('a[href^="#"]')]
    .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(entry => entry.section);
  if (!entries.length) return;

  let scheduled = false;
  let current;

  function updateCurrentSection() {
    scheduled = false;
    const readingLine = Math.max(40, Math.min(120, window.innerHeight * 0.2));
    let active = entries[0];
    for (const entry of entries) {
      if (entry.section.getBoundingClientRect().top <= readingLine) active = entry;
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = entries.at(-1);
    }
    if (active === current) return;
    current = active;
    entries.forEach(entry => {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrentSection);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  const article = navigation.closest('.case-layout')?.querySelector('.case-content');
  if (article) new ResizeObserver(scheduleUpdate).observe(article);
  updateCurrentSection();
});
