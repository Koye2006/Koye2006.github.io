(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Theme ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const syncThemeMeta = () => {
    if (themeMeta) themeMeta.content = root.dataset.theme === 'light' ? '#f6f5f1' : '#0a0a0f';
  };
  syncThemeMeta();

  $('.theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncThemeMeta();
    window.dispatchEvent(new Event('themechange'));
  });

  /* ---------- Split hero name into animated letters ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;

    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    let i = 0;
    text.split(' ').forEach((word, wi, words) => {
      const w = document.createElement('span');
      w.className = 'word';
      [...word].forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        c.style.setProperty('--i', i++);
        w.appendChild(c);
      });
      visual.appendChild(w);
      if (wi < words.length - 1) visual.appendChild(document.createTextNode(' '));
    });

    el.replaceChildren(label, visual);
  });

  /* ---------- Typewriter ---------- */
  const typed = $('.typed');
  if (typed) {
    const words = JSON.parse(typed.dataset.words || '[]');
    if (reduceMotion || words.length === 0) {
      typed.textContent = words[0] || '';
    } else {
      let w = 0;
      let c = 0;
      let deleting = false;
      const tick = () => {
        const word = words[w];
        c += deleting ? -1 : 1;
        typed.textContent = word.slice(0, c);
        let delay = deleting ? 38 : 80 + Math.random() * 50;
        if (!deleting && c === word.length) {
          deleting = true;
          delay = 1800;
        } else if (deleting && c === 0) {
          deleting = false;
          w = (w + 1) % words.length;
          delay = 350;
        }
        setTimeout(tick, delay);
      };
      setTimeout(tick, 1300);
    }
  }

  /* ---------- Nav: scrolled state, hide on scroll down, progress bar ---------- */
  const nav = $('.nav');
  const progress = $('.progress');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 20);
    const menuOpen = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav__links a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObserver.observe(s));

  /* ---------- Mobile menu ---------- */
  const menuToggle = $('.menu-toggle');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.classList.remove('is-hidden');
  };
  menuToggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Count-up stats ---------- */
  const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (reduceMotion) { el.textContent = target; return; }
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  $$('.marquee__track').forEach((track) => {
    [...track.children].forEach((item) => track.appendChild(item.cloneNode(true)));
  });

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        showToast('✓ Email copied to clipboard');
      } catch (e) {
        showToast(value);
      }
    });
  });

  /* ---------- Pointer effects (desktop only) ---------- */
  // Spotlight on cards works everywhere a pointer hovers.
  $$('.spotlight, .project').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  if (finePointer && !reduceMotion) {
    // Ambient glow that trails the cursor
    const glow = $('.cursor-glow');
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
    let glowRunning = false;
    const glowLoop = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.setProperty('--x', `${gx}px`);
      glow.style.setProperty('--y', `${gy}px`);
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
        requestAnimationFrame(glowLoop);
      } else {
        glowRunning = false;
      }
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add('is-active');
      if (!glowRunning) {
        glowRunning = true;
        requestAnimationFrame(glowLoop);
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-active'));

    // 3D tilt on project cards
    $$('.project').forEach((card) => {
      const max = card.classList.contains('project--featured') ? 3 : 6;
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1100px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });

    // Magnetic buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Hero particle constellation ---------- */
  const canvas = $('.hero__canvas');
  const hero = $('.hero');
  if (canvas && hero && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const LINK_DIST = 130;
    const MOUSE_DIST = 170;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, particles = [], raf = 0, visible = true;
    let colorA = '', colorB = '';

    const readColors = () => {
      const s = getComputedStyle(root);
      colorA = s.getPropertyValue('--accent-rgb').trim();
      colorB = s.getPropertyValue('--accent-2-rgb').trim();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.floor((w * h) / 13000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.6,
        alt: Math.random() < 0.3,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Gentle push away from the cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_DIST * MOUSE_DIST) {
          const d = Math.sqrt(d2) || 1;
          const f = ((MOUSE_DIST - d) / MOUSE_DIST) * 0.9;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.28;
            ctx.strokeStyle = `rgba(${colorA}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Lines to the cursor
        const mx = a.x - mouse.x;
        const my = a.y - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < MOUSE_DIST + 40) {
          ctx.strokeStyle = `rgba(${colorB}, ${(1 - md / (MOUSE_DIST + 40)) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `rgba(${p.alt ? colorB : colorA}, 0.85)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    readColors();
    resize();
    start();

    let resizeTimer;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }).observe(hero);

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }).observe(hero);

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    window.addEventListener('themechange', readColors);

    hero.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
  }
})();
