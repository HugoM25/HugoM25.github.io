// Neon portfolio interactions and optimizations
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Halftone background (updated smaller dots + scroll parallax)
  const canvas = document.getElementById('halftone-bg');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr;
    let scrollY = window.scrollY || 0;
    let frame = 0;
    const PARALLAX = 0.35;
    // Tunable halftone intensity constants
    const MAX_ALPHA = 0.16;      // lowered from ~0.55 for subtlety
    const MIN_ALPHA_FACTOR = 0.35; // portion of MAX to keep faint dots visible

    window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; });

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    window.addEventListener('resize', resize);

    function dotColor(x, y, t) {
      const cx = w / 2, cy = h * 0.4 + (scrollY * dpr * PARALLAX * 0.2);
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const maxDist = Math.sqrt((w/2)**2 + (h/2)**2);
      const k = 1 - Math.min(dist / maxDist, 1); // radial falloff 0..1
      // Gentle modulation: baseline + small fluctuation (does not reach 0)
      const wave = 0.5 + 0.5 * Math.sin(t * 0.0005 + dist * 0.002);
      const BASE_ALPHA = 0.12;       // baseline visibility
      const VAR_ALPHA = 0.028;       // small extra brightness
      const alpha = (BASE_ALPHA + VAR_ALPHA * wave) * (0.55 + 0.45 * k); // enhance toward center
      const c1 = [124,252,255];
      const c2 = [168,85,247];
      const mix = 0.25 + 0.75 * k;
      const r = Math.round(c1[0] * mix + c2[0]*(1-mix));
      const g = Math.round(c1[1] * mix + c2[1]*(1-mix));
      const b = Math.round(c1[2] * mix + c2[2]*(1-mix));
      return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    }

    function draw(t) {
      frame++;
      ctx.clearRect(0,0,w,h);
      const gap = 18 * (w / 1600);
      const radiusBase = 1.1 * (w / 1600);
      const yOffset = (scrollY * dpr * PARALLAX) % (gap*2);
      const xOffset = (scrollY * dpr * PARALLAX * 0.6) % (gap*2);
      for (let y = -gap*2; y < h + gap*2; y += gap) {
        for (let x = -gap*2; x < w + gap*2; x += gap) {
          const px = x + xOffset;
          const py = y + yOffset;
          const color = dotColor(px, py, t);
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(px, py, radiusBase, 0, Math.PI*2);
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    }
    resize();
    requestAnimationFrame(draw);
  }

  // Mobile nav toggle
  const navToggle = $('.nav-toggle');
  const navList = $('#nav-list');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Scroll progress bar
  const progress = $('.progress-bar');
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    progress.style.width = `${Math.max(0, Math.min(1, scrolled)) * 100}%`;
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Reveal on scroll with fallback
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    try {
      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        }
      }, { threshold: 0.12 });
      revealEls.forEach(el => observer.observe(el));
    } catch (e) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Magnetic hover effect
  document.addEventListener('pointermove', (e) => {
    $$("[data-magnetic]").forEach(btn => {
      const r = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width * 100;
      const my = (e.clientY - r.top) / r.height * 100;
      btn.style.setProperty('--mx', `${mx}%`);
      btn.style.setProperty('--my', `${my}%`);
    });
  }, { passive: true });

  // 3D tilt card
  const tilt = $('[data-tilt] .card-3d-inner');
  const tiltWrap = $('[data-tilt]');
  if (tilt && tiltWrap) {
    tiltWrap.addEventListener('pointermove', (e) => {
      const r = tiltWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      const rx = y * -10; // rotateX
      const ry = x * 10;  // rotateY
      tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    tiltWrap.addEventListener('pointerleave', () => {
      tilt.style.transform = 'rotateX(0) rotateY(0)';
    });
  }

  // Year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Rotating typewriter roles
  const roles = [
    'Data Scientist',
    'ML Engineer',
    'AI Engineer',
  ];
  const roleEl = $('#rotating-role');
  if (roleEl) {
    let i = 0;
    const typeSpeed = 70;
    const backSpeed = 45;
    const hold = 1200;

    const type = async (text) => {
      roleEl.textContent = '';
      for (let c = 0; c < text.length; c++) {
        roleEl.textContent = text.slice(0, c + 1);
        await new Promise(r => setTimeout(r, typeSpeed));
      }
      await new Promise(r => setTimeout(r, hold));
      for (let c = text.length; c >= 0; c--) {
        roleEl.textContent = text.slice(0, c);
        await new Promise(r => setTimeout(r, backSpeed));
      }
    };

    (async function loop() {
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        await type(roles[i % roles.length]);
        i++;
      }
    })();
  }

  // Dynamic projects loading
  const projectsContainer = document.querySelector('[data-projects]');
  let projectData = [];
  let activeFilter = 'all';

  async function loadProjects() {
    if (!projectsContainer) return;
    try {
      const res = await fetch('data/projects.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Failed to load projects');
      projectData = await res.json();
      // Sort by date descending if date field present (expects YYYY or YYYY-MM or ISO)
      projectData.sort((a,b) => {
        const da = a.date || a.year || '';
        const db = b.date || b.year || '';
        return db.localeCompare(da); // string compare works for ISO-like
      });
      renderProjects();
    } catch (e) {
      console.error(e);
      const empty = $('.projects-empty');
      if (empty) { empty.hidden = false; empty.textContent = 'Failed to load projects.'; }
    }
  }

  function createProjectCard(p) {
    const categories = (p.categories || []).join(' ');
    const tagList = (p.tags || []).map(t => `<li>${t}</li>`).join('');
    const rawDate = p.date || p.year || '';
    let formattedDate = '';
    if (rawDate) {
      // Always show only the 4-digit year (first 4 chars)
      const year = rawDate.slice(0,4);
      if (/^\d{4}$/.test(year)) formattedDate = year;
    }
    return `<article class="project-card reveal" data-tags="${categories}">
      <div class="project-media">
        <div class="dot-grid" aria-hidden="true"></div>
  <img src="${p.image}" alt="${p.alt || (p.title + ' project image')}" loading="lazy" />
      </div>
      <div class="project-content">
  <h3>${p.title}</h3>
  <p class="project-desc">${p.description}</p>
        <ul class="tags">${tagList}</ul>
        <div class="project-links">
          ${p.code ? `<a href="${p.code}" class="project-icon" title="View code" aria-label="View code" target="_blank" rel="noopener">` +
            `<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d='M12 .5A12 12 0 0 0 0 12.6c0 5.3 3.4 9.8 8.2 11.3.6.1.8-.3.8-.6v-2c-3.4.8-4.1-1.6-4.1-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.9 1.4 3.6 1.1.1-.8.4-1.4.7-1.8-2.7-.3-5.6-1.4-5.6-6.2 0-1.4.5-2.6 1.2-3.5-.1-.3-.5-1.7.1-3.5 0 0 1-.3 3.6 1.3 1-.3 2-.4 3.1-.4s2.1.1 3.1.4c2.6-1.6 3.6-1.3 3.6-1.3.6 1.8.2 3.2.1 3.5.8.9 1.2 2.1 1.2 3.5 0 4.8-2.9 5.9-5.6 6.2.4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6 4.8-1.5 8.2-6 8.2-11.3A12 12 0 0 0 12 .5Z'/></svg></a>` : ''}
          ${p.demo ? `<a href="${p.demo}" class="project-icon" title="Live demo" aria-label="Live demo" target="_blank" rel="noopener">` +
            `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M14 3 H21 V10'/><path d='M10 14 L21 3'/><path d='M21 14 V21 H14'/><path d='M3 10 V3 H10'/></svg></a>` : ''}
        </div>
        ${formattedDate ? `<time class="project-date" datetime="${rawDate}">${formattedDate}</time>` : ''}
      </div>
    </article>`;
  }

  function renderProjects() {
    if (!projectsContainer) return;
    const filtered = projectData.filter(p => activeFilter === 'all' || (p.categories || []).includes(activeFilter));
    projectsContainer.innerHTML = filtered.map(createProjectCard).join('');
    const empty = $('.projects-empty');
    if (empty) empty.hidden = filtered.length !== 0;
    // Re-observe reveals for new content
    $$('.reveal', projectsContainer).forEach(el => el.classList.add('is-visible'));
  }

  // Integrate with existing chips
  const chips = $$('.chip');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter || 'all';
    renderProjects();
  }));

  loadProjects();

})();
