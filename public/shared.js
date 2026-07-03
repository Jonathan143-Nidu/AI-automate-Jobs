// shared.js — page transition engine for PrismOps multi-page site

// Mark active nav link
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === page) a.classList.add('nav-active');
  });

  // Scroll reveal
  const io = new IntersectionObserver(e => {
    e.forEach(el => { if (el.isIntersecting) { el.target.classList.add('visible'); io.unobserve(el.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(r => io.observe(r));

  // Sticky nav
  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
  });

  // Hamburger
  const ham = document.querySelector('.hamburger');
  if (ham) ham.addEventListener('click', () => document.getElementById('nav').classList.toggle('open'));

  // Animate page in
  document.body.classList.add('page-enter');
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('page-visible')));
});

// Smooth page transition out before navigating
function navigate(href) {
  document.body.classList.remove('page-visible');
  document.body.classList.add('page-exit');
  setTimeout(() => { location.href = href; }, 320);
}

// Intercept all internal links
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#') || href.startsWith('tel')) return;
  if (a.target === '_blank') return;
  e.preventDefault();
  navigate(href);
});
