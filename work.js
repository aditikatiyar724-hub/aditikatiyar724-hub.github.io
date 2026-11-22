// All-work page: the same folder behaviour as the home page's Selected Work section, without the home-only scenes.
(function () {
  const DESIGN_WIDTH = 1440;
  const root = document.documentElement;
  const fit = () => root.style.setProperty('--scale', root.clientWidth / DESIGN_WIDTH);
  fit();
  window.addEventListener('resize', fit);

  const lenis = window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches
    ? new window.Lenis({ lerp: 0.07, wheelMultiplier: 0.9 })
    : null;
  if (lenis) {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  root.classList.add('js');

  // Smooth typing: split each .type-in element into one span per letter.
  document.querySelectorAll('.type-in').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) { child.setAttribute('aria-hidden', 'true'); split(child); return; }
        if (child.nodeType !== Node.TEXT_NODE) return;
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((c) => {
          const s = document.createElement('span');
          s.className = 'ch';
          s.setAttribute('aria-hidden', 'true');
          s.style.setProperty('--i', i++);
          s.textContent = c;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      });
    };
    split(el);
  });

  // Fireflies for the hover backdrops.
  const rand = (min, max) => min + Math.random() * (max - min);
  document.querySelectorAll('.work-fireflies').forEach((layer) => {
    const w = layer.offsetWidth, h = layer.offsetHeight;
    for (let i = 0; i < 26; i++) {
      let y;
      do { y = rand(0, h); } while (Math.random() > 0.05 + 0.95 * (y / h) ** 2);
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.cssText = `left:${rand(0, w).toFixed(0)}px;top:${y.toFixed(0)}px;` +
        `--size:${rand(3, 6).toFixed(1)}px;--dx:${rand(-60, 60).toFixed(0)}px;--dy:${rand(-60, 60).toFixed(0)}px;` +
        `--drift:${rand(6, 12).toFixed(1)}s;--pulse:${rand(2.5, 5).toFixed(1)}s;--delay:${rand(-10, 0).toFixed(1)}s`;
      layer.appendChild(f);
    }
  });

  // Folders fade up as they enter; cards arriving together are staggered.
  const cardReveal = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((entry, n) => {
      entry.target.style.setProperty('--d', `${n * 0.15}s`);
      entry.target.classList.add('in-view');
      cardReveal.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.work-card').forEach((card) => {
    cardReveal.observe(card);

    // Mark a card once hovered so leaving it plays the tuck-back animation.
    const touch = () => card.classList.add('touched');
    card.addEventListener('pointerenter', touch);
    card.addEventListener('focusin', touch);

    // Artwork tilts toward the cursor and its glare follows it.
    const art = card.querySelector('.photo-card:is(.work1-art, .work2-art, .work3-art)');
    const lift = card.querySelector('.lift');
    const seal = card.querySelector('.seal');
    card.addEventListener('pointermove', (e) => {
      const r = lift.getBoundingClientRect();
      if (art) {
        const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        const mag = Math.hypot(nx, ny) || 1;
        art.style.setProperty('--tx', (-ny / mag).toFixed(3));
        art.style.setProperty('--ty', (nx / mag).toFixed(3));
        art.style.setProperty('--ta', `${(Math.min(1, Math.hypot(nx, ny)) * 10).toFixed(2)}deg`);
        art.style.setProperty('--px', (-nx).toFixed(3));
        art.style.setProperty('--py', (-ny).toFixed(3));
        const a = art.getBoundingClientRect();
        art.style.setProperty('--gx', `${((e.clientX - a.left) / a.width) * 100}%`);
        art.style.setProperty('--gy', `${((e.clientY - a.top) / a.height) * 100}%`);
      }
      // Wax seal follows the cursor, in the card's unscaled design coordinates.
      if (seal) {
        const k = r.width / lift.offsetWidth;
        card.style.setProperty('--seal-x', `${(e.clientX - r.left) / k - (seal.offsetLeft + seal.offsetWidth / 2)}px`);
        card.style.setProperty('--seal-y', `${(e.clientY - r.top) / k - (seal.offsetTop + seal.offsetHeight / 2)}px`);
      }
    });
    card.addEventListener('pointerleave', () => {
      if (art) ['--tx', '--ty', '--ta', '--px', '--py', '--gx', '--gy'].forEach((v) => art.style.removeProperty(v));
      card.style.removeProperty('--seal-x');
      card.style.removeProperty('--seal-y');
    });
  });

  // Headings and titles materialise (blur -> crisp) when they come into view.
  const appear = (el, delay) => { el.style.setProperty('--appear-delay', `${delay}s`); el.classList.add('appear'); };
  const onScroll = new Map();
  document.querySelectorAll('.heading').forEach((h) => onScroll.set(h, [...h.children]));
  document.querySelectorAll('.work-title').forEach((t) => onScroll.set(t, [t]));
  onScroll.forEach((els) => els.forEach((el, i) => appear(el, i * 0.35)));
  const appearReveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      appearReveal.unobserve(entry.target);
      onScroll.get(entry.target).forEach((el) => el.classList.add('shown'));
    });
  }, { threshold: 0.6 });
  onScroll.forEach((_, el) => appearReveal.observe(el));

  // Placeholder links ("#") stay put instead of jumping to the top.
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
})();
