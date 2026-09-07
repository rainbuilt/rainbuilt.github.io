(() => {
  const progress = document.querySelector('.reading-progress span');
  const outlineLinks = Array.from(document.querySelectorAll('.outline-nav a[data-target]'));
  const outlineById = new Map(outlineLinks.map((link) => [link.dataset.target, link]));
  const headings = Array.from(document.querySelectorAll('.document h1[id], .document h2[id]'))
    .filter((heading) => outlineById.has(heading.id));

  const updateProgress = () => {
    const root = document.documentElement;
    const max = Math.max(1, root.scrollHeight - root.clientHeight);
    const ratio = Math.min(1, Math.max(0, root.scrollTop / max));
    if (progress) progress.style.width = `${ratio * 100}%`;
  };

  let activeId = '';
  const setActive = (id) => {
    if (!id || id === activeId) return;
    activeId = id;
    outlineLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.target === id));
    const active = outlineById.get(id);
    if (active && active.closest('.page-outline')) {
      active.scrollIntoView({ block: 'nearest' });
    }
  };

  const updateActiveHeading = () => {
    let current = headings[0]?.id || '';
    const threshold = 96;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= threshold) current = heading.id;
      else break;
    }
    setActive(current);
  };

  const onScroll = () => {
    updateProgress();
    updateActiveHeading();
  };

  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  const makeDragScrollable = (element) => {
    let down = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || element.scrollWidth <= element.clientWidth) return;
      down = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = element.scrollLeft;
      startTop = element.scrollTop;
      element.setPointerCapture(event.pointerId);
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      if (!down) return;
      element.scrollLeft = startLeft - (event.clientX - startX);
      element.scrollTop = startTop - (event.clientY - startY);
    });

    const release = (event) => {
      if (!down) return;
      down = false;
      element.classList.remove('is-dragging');
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };

    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', () => {
      down = false;
      element.classList.remove('is-dragging');
    });
  };

  document.querySelectorAll('.diagram-scroll').forEach(makeDragScrollable);
})();
