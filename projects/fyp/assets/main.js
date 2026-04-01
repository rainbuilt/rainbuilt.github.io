
const sections = [...document.querySelectorAll('section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a[data-section]')];
const progress = document.querySelector('.progress-bar');
const reveals = [...document.querySelectorAll('.reveal')];

function updateProgress() {
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const ratio = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progress.style.width = `${ratio}%`;
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.dataset.section === id);
      });
    }
  });
}, { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 });

sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach((item) => revealObserver.observe(item));
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

const lightbox = document.querySelector('.lightbox');
if (lightbox) {
  const lightboxImg = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeButton = lightbox.querySelector('.lightbox-close');
  const openers = [...document.querySelectorAll('[data-lightbox]')];

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
  };

  openers.forEach((opener) => {
    opener.classList.add('is-clickable');
    opener.addEventListener('click', () => {
      const img = opener.querySelector('img');
      const caption = opener.querySelector('figcaption');
      if (!img) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      lightboxCaption.textContent = caption ? caption.textContent : '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
}
