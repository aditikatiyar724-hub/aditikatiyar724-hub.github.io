// Scale the fixed 1440px design canvas to the current viewport width.
(function () {
  const DESIGN_WIDTH = 1440;
  const root = document.documentElement;

  function fit() {
    root.style.setProperty('--scale', root.clientWidth / DESIGN_WIDTH);
  }

  fit();
  window.addEventListener('resize', fit);

  // Sharp versions of zoomable images load after the page, so first paint stays light; swap once decoded.
  window.addEventListener('load', () => {
    document.querySelectorAll('img[data-hd]').forEach((img) => {
      const hd = new Image();
      hd.src = img.dataset.hd;
      hd.decode().then(() => { img.src = hd.src; }, () => {});
    });
  });

  // Inertial smooth scrolling (Lenis): the page glides to a stop, and scroll-driven scenes update in the
  // same frame as the scroll itself, so pinned elements don't shudder. Skipped for reduced motion.
  const lenis = window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches
    ? new window.Lenis({ lerp: 0.07, wheelMultiplier: 0.9 })
    : null;
  if (lenis) {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // The About text inks in once the reveal sequence has finished (last icon: 2.24s delay + .7s).
  const TYPE_START_MS = 3000;

  // Reveal scenes once they scroll into view.
  root.classList.add('js');
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      reveal.unobserve(entry.target);
      const body = entry.target.querySelector('.about-body');
      if (body) setTimeout(() => body.classList.add('typing'), TYPE_START_MS);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.about, .experience, .playground').forEach((el) => reveal.observe(el));

  // Playground: repeat the cards once so the slow sideways drift loops without a gap.
  const playground = document.querySelector('.playground');
  if (playground) {
    [...playground.children].forEach((card) => {
      const copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.tabIndex = -1;
      playground.appendChild(copy);
    });
  }

  // Fireflies: scattered with random size, drift and pulse so none move in sync.
  const rand = (min, max) => min + Math.random() * (max - min);
  const insidePolygon = (x, y, pts) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  function spawnFireflies(layer, { count, drift, area }) {
    // Sample inside the area's bounding box (or the whole layer when no area is given).
    const xs = area ? area.map((p) => p[0]) : [0, layer.offsetWidth];
    const ys = area ? area.map((p) => p[1]) : [0, layer.offsetHeight];
    for (let i = 0; i < count; i++) {
      let x, y;
      do { x = rand(Math.min(...xs), Math.max(...xs)); y = rand(Math.min(...ys), Math.max(...ys)); }
      while (area && !insidePolygon(x, y, area));
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;` +
        `--size:${rand(3, 6).toFixed(1)}px;--dx:${rand(-drift, drift).toFixed(0)}px;--dy:${rand(-drift, drift).toFixed(0)}px;` +
        `--drift:${rand(6, 12).toFixed(1)}s;--pulse:${rand(2.5, 5).toFixed(1)}s;--delay:${rand(-10, 0).toFixed(1)}s`;
      layer.appendChild(f);
    }
  }
  spawnFireflies(document.querySelector('.fireflies'), { count: 28, drift: 70 });
  // Lamp: kept inside the pool of light, a bowl that is wide at the top and narrows under the lamp base.
  spawnFireflies(document.querySelector('.lamp-fireflies'), {
    count: 18, drift: 25,
    area: [[6, 0], [0, 110], [44, 232], [180, 329], [274, 340], [418, 329], [562, 282], [602, 153], [576, 0]],
  });
  // A few strays on the desk, down-left of the lamp base.
  spawnFireflies(document.querySelector('.lamp-fireflies'), {
    count: 3, drift: 15,
    area: [[0, 265], [40, 250], [110, 265], [144, 320], [130, 362], [60, 358], [10, 320]],
  });

  // Work cards: fade up as they enter; cards arriving together are staggered.
  const cardReveal = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((entry, n) => {
      entry.target.style.setProperty('--d', `${n * 0.15}s`);
      entry.target.classList.add('in-view');
      cardReveal.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.work-card').forEach((el) => cardReveal.observe(el));

  // Work cards: the wax seal follows the cursor, centred on it, in the card's unscaled design coordinates.
  document.querySelectorAll('.work-card').forEach((card) => {
    const lift = card.querySelector('.lift');
    const seal = card.querySelector('.seal');
    if (!lift || !seal) return;
    card.addEventListener('pointermove', (e) => {
      const rect = lift.getBoundingClientRect();
      const k = rect.width / lift.offsetWidth;
      const x = (e.clientX - rect.left) / k - (seal.offsetLeft + seal.offsetWidth / 2);
      const y = (e.clientY - rect.top) / k - (seal.offsetTop + seal.offsetHeight / 2);
      card.style.setProperty('--seal-x', `${x}px`);
      card.style.setProperty('--seal-y', `${y}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--seal-x');
      card.style.removeProperty('--seal-y');
    });
  });

  // Headings and subheadings softly materialise (blur -> crisp) when they come into view.
  const appear = (el, delay) => { el.style.setProperty('--appear-delay', `${delay}s`); el.classList.add('appear'); };
  const heroText = [document.querySelector('.hi-pill > span'), document.querySelector('.hero-name'), document.querySelector('.role-chip')];
  heroText.forEach((el, i) => appear(el, 0.2 + i * 0.35));
  requestAnimationFrame(() => heroText.forEach((el) => el.classList.add('shown')));

  const onScroll = new Map();
  document.querySelectorAll('.heading').forEach((h) => onScroll.set(h, [h.querySelector('h2'), h.querySelector('p')]));
  document.querySelectorAll('.work-title').forEach((t) => onScroll.set(t, [t]));
  document.querySelectorAll('.exp-heading').forEach((h) => onScroll.set(h, [h.querySelector('p'), h.querySelector('h2')]));
  onScroll.forEach((els) => els.forEach((el, i) => appear(el, i * 0.35)));

  const appearReveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      appearReveal.unobserve(entry.target);
      onScroll.get(entry.target).forEach((el) => el.classList.add('shown'));
    });
  }, { threshold: 0.6 });
  onScroll.forEach((_, el) => appearReveal.observe(el));

  // Experience history: one scroll timeline drives the whole scene so it always plays in order, however
  // fast the page is scrolled. Timeline position = design px scrolled past the pin point:
  //   reveal  REVEAL.*: lantern, then floor, then paper (starting as the section scrolls in)
  //   zoom    ZOOM_AT.. : the section pins and the map moves stop to stop, one STEP each:
  //           1 island (Cashkaro), 2 mountains (Dentalkart), 3 boat (Board of UX), then a final hold.
  // The rendered position eases after the real one (with a speed cap), so a fast flick still plays the
  // sequence smoothly instead of jumping; only the pin itself follows the scroll exactly.
  const exp = document.querySelector('.experience');
  if (exp) {
    const ZOOM_AT = 400;
    const STEP = 600;
    const PIN = ZOOM_AT + STEP * 4; // must match the space reserved below the section
    const REVEAL = { lantern: [-550, -150], room: [-350, 50], map: [-150, 300] };
    const SMOOTH = 0.16; // seconds for the eased position to close most of the gap
    const MAX_SPEED = 2200; // design px per second
    const ease = (t) => t * t * (3 - 2 * t);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const clamp01 = (t) => Math.min(1, Math.max(0, t));
    const span = ([a, b], v) => clamp01((v - a) / (b - a));
    // Per-stop values taken from the Figma frames (Desktop 25 → 28), relative to the resting layout.
    const STOPS = {
      map: [[0, 0, 1], [-121.95, 126.06, 1.34766], [379.1, 69.38, 1.95229], [-468.43, -211.19, 1.95229]],
      lantern: [[0, 0], [-400.82, 0], [-83.18, -56.14], [-83.18, -56.14]],
      vignette: [[0, 0, 1], [33.34, 0, 1.06031], [33.34, 0, 1.06031], [33.34, -72.33, 1.10708]],
      fadeMid: [1, 1, 1, 0],
      fadeDeep: [0, 0, 0, 1],
      fadeBottom: [1, 0.25, 0.25, 0.25],
      // Section y the view centres on, so short screens still see each stop in full.
      focus: [650, 680, 1100, 1100],
    };
    const room = exp.querySelector('.exp-room');
    const map = exp.querySelector('.exp-map');
    const lantern = exp.querySelector('.exp-lantern');
    const vignette = exp.querySelector('.exp-vignette');
    const fadeMid = exp.querySelector('.exp-fade-mid');
    const fadeDeep = exp.querySelectorAll('.exp-fade-deep');
    const fadeBottom = exp.querySelector('.exp-fade-bottom');
    const pops = [...exp.querySelectorAll('.exp-pop')];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const at = (list, p) => {
      const i = Math.min(Math.floor(p), list.length - 2);
      const t = p - i;
      const a = list[i], b = list[i + 1];
      return Array.isArray(a) ? a.map((v, k) => v + (b[k] - v) * t) : a + (b - a) * t;
    };

    let eased = null;
    let last = 0;
    let looping = false;

    function updateExp(now = performance.now()) {
      const scale = root.clientWidth / DESIGN_WIDTH;
      const vh = window.innerHeight / scale;
      const viewTop = (p) => Math.min(Math.max(at(STOPS.focus, p) - vh / 2, 0), Math.max(1712 - vh, 0));
      const start = viewTop(0);
      const target = window.scrollY / scale - exp.offsetTop - start;

      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (eased === null || reduceMotion) eased = target;
      else {
        const step = (target - eased) * (1 - Math.exp(-dt / SMOOTH));
        const cap = MAX_SPEED * dt;
        eased += Math.max(-cap, Math.min(cap, step));
        if (Math.abs(target - eased) < 0.3) eased = target;
      }

      const u = (eased - ZOOM_AT) / STEP;
      let p = 0;
      for (let k = 0; k < 3; k++) p += ease(clamp01((u - k - 0.15) / 0.6));
      const show = {
        lantern: easeOut(span(REVEAL.lantern, eased)),
        room: easeOut(span(REVEAL.room, eased)),
        map: easeOut(span(REVEAL.map, eased)),
      };

      // Hold the section in place for the pinned stretch, panning down to the current stop.
      const off = Math.min(PIN, Math.max(0, target));
      exp.style.transform = `translateY(${start + off - viewTop(p)}px)`;
      room.style.opacity = show.room;
      room.style.transform = `translateY(${(1 - show.room) * 320}px)`;
      const [mx, my, ms] = at(STOPS.map, p);
      map.style.opacity = show.map;
      map.style.transform = `translate(${mx}px, ${my + (1 - show.map) * 320}px) scale(${ms})`;
      const [lx, ly] = at(STOPS.lantern, p);
      lantern.style.opacity = show.lantern;
      lantern.style.transform = `translate(${lx}px, ${ly - (1 - show.lantern) * 80}px)`;
      const [vx, vy, vs] = at(STOPS.vignette, p);
      vignette.style.transform = `translate(${vx}px, ${vy}px) scaleY(${vs})`;
      fadeMid.style.opacity = at(STOPS.fadeMid, p);
      fadeDeep.forEach((el) => { el.style.opacity = at(STOPS.fadeDeep, p); });
      fadeBottom.style.opacity = at(STOPS.fadeBottom, p);
      pops.forEach((el) => el.classList.toggle('on', show.map === 1 && Math.abs(p - Number(el.dataset.step)) < 0.2));

      // Keep easing frame by frame until the scene has caught up with the scroll.
      if (eased !== target && !looping) {
        looping = true;
        requestAnimationFrame((t) => { looping = false; updateExp(t); });
      }
    }
    let ticking = false;
    const requestExp = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame((t) => { ticking = false; updateExp(t); });
    };
    updateExp();
    if (lenis) lenis.on('scroll', () => updateExp());
    else window.addEventListener('scroll', requestExp, { passive: true });
    window.addEventListener('resize', requestExp);
  }

  // Claude lab: the cards sit close together on the canvas, so they are paced by scroll distance past the
  // heading rather than by their own positions.
  const labHeading = document.getElementById('lab');
  const labCards = [1, 2, 3].map((n) => document.querySelectorAll(`.lab-part[data-lab="${n}"]`));
  function updateLab() {
    const vh = window.innerHeight;
    const passed = vh * 0.75 - labHeading.getBoundingClientRect().top;
    const count = passed < 0 ? 0 : Math.min(labCards.length, 1 + Math.floor(passed / (vh * 0.3)));
    labCards.forEach((parts, i) => parts.forEach((el) => el.classList.toggle('shown', i < count)));
  }
  updateLab();
  window.addEventListener('scroll', updateLab, { passive: true });
  window.addEventListener('resize', updateLab);

  // Scroll-to-top button: shown once the About section is well into view (and through My Work onward).
  const toTop = document.getElementById('to-top');
  const about = document.querySelector('.about');
  if (toTop && about) {
    const updateToTop = () => toTop.classList.toggle('show', about.getBoundingClientRect().top < window.innerHeight * 0.6);
    updateToTop();
    window.addEventListener('scroll', updateToTop, { passive: true });
    window.addEventListener('resize', updateToTop);
    toTop.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0, { duration: 2 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Smooth-scroll in-page links, accounting for the scaled canvas.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    e.preventDefault();
    const target = id && document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 40;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: 'smooth' });
  });
})();

// Smooth typing: split each .type-in element into one span per letter so it can type itself out.
// Nested elements (e.g. a styled <span>) are kept; only their text is split, numbered in reading order.
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

// Pocket watch on the About desk: always shows Indian Standard Time (Asia/Kolkata, UTC+5:30, no DST).
// It starts from the device clock, then corrects for any device clock drift using a time server.
(function () {
  const watch = document.getElementById('ist-watch');
  if (!watch) return;
  const [hour, minute, second] = ['hour', 'minute', 'second'].map((c) => watch.querySelector('.' + c));
  const IST_OFFSET_MS = 5.5 * 3600 * 1000;
  let drift = 0;

  function render() {
    const ist = new Date(Date.now() + drift + IST_OFFSET_MS);
    const s = ist.getUTCSeconds(), m = ist.getUTCMinutes() + s / 60, h = (ist.getUTCHours() % 12) + m / 60;
    hour.style.setProperty('--a', h * 30 + 'deg');
    minute.style.setProperty('--a', m * 6 + 'deg');
    second.style.setProperty('--a', s * 6 + 'deg');
    const hh = ist.getUTCHours(), mm = ist.getUTCMinutes();
    watch.setAttribute('aria-label', `Current time in India: ${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`);
  }

  render();
  setTimeout(function tick() { render(); setTimeout(tick, 1000 - ((Date.now() + drift) % 1000)); }, 1000 - (Date.now() % 1000));

  const sent = Date.now();
  fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      const received = Date.now();
      drift = d.unixtime * 1000 + (received - sent) / 2 - received;
      if (Math.abs(drift) < 2000) drift = 0; // within network jitter: trust the device clock
      render();
    })
    .catch(() => {}); // offline or blocked: the device clock is already showing IST
})();
