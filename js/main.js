/* Architect Portfolio — main.js */
(function () {
  // Particles
  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const N = 55;
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    addEventListener('resize', resize); resize();
    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 1.4 + 0.3; this.a = Math.random() * 0.4 + 0.08;
      }
      update() {
        // Interactive attractor from cinematic hero pointer
        const m = window.__MKA_MOUSE__;
        if (m && m.active && m.x != null) {
          const dx = m.x - this.x, dy = m.y - this.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 180) {
            this.vx += (dx / d) * 0.035;
            this.vy += (dy / d) * 0.035;
          }
        }
        this.vx *= 0.99; this.vy *= 0.99;
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${this.a})`; ctx.fill();
      }
    }
    for (let i = 0; i < N; i++) particles.push(new P());
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.06 * (1 - d / 100)})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  // Typing
  const phrases = [
    'Senior Mobile / Android App Architect',
    'Kotlin · Jetpack Compose · Clean Architecture',
    'Offline-First · Multi-module · CI/CD',
    'မိုးကျော်အောင် · Architect by craft'
  ];
  let pi = 0, ci = 0, del = false;
  const typing = document.getElementById('typing');
  function type() {
    if (!typing) return;
    const cur = phrases[pi];
    if (!del) {
      typing.textContent = cur.slice(0, ++ci);
      if (ci === cur.length) { del = true; setTimeout(type, 1600); return; }
    } else {
      typing.textContent = cur.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(type, del ? 35 : 65);
  }
  type();

  // Counters
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const t = +el.dataset.count; let c = 0;
        const step = Math.max(1, Math.floor(t / 35));
        const id = setInterval(() => {
          c += step;
          if (c >= t) { el.textContent = t + (t >= 10 ? '+' : ''); clearInterval(id); }
          else el.textContent = c;
        }, 40);
      });
      obs.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  document.querySelector('.hero-stats') && obs.observe(document.querySelector('.hero-stats'));

  // Skill / bench bars
  const barObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('[data-w]').forEach(el => {
        el.style.width = el.dataset.w + '%';
      });
      barObs.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  document.getElementById('skillBars') && barObs.observe(document.getElementById('skillBars'));
  document.getElementById('benchBars') && barObs.observe(document.getElementById('benchBars'));

  // Fade-up
  const fadeObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));

  // Lang
  let lang = localStorage.getItem('arch-lang') || 'en';
  document.documentElement.setAttribute('data-lang', lang);
  function applyLang(l) {
    document.querySelectorAll('[data-en]').forEach(el => {
      const v = el.getAttribute('data-' + l);
      if (v != null) el.textContent = v;
    });
  }
  applyLang(lang);
  document.getElementById('langToggle')?.addEventListener('click', () => {
    lang = lang === 'en' ? 'my' : 'en';
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('arch-lang', lang);
    applyLang(lang);
    document.getElementById('langToggle').textContent = lang === 'en' ? 'EN / မြန်မာ' : 'မြန်မာ / EN';
  });
  if (document.getElementById('langToggle')) {
    document.getElementById('langToggle').textContent = lang === 'en' ? 'EN / မြန်မာ' : 'မြန်မာ / EN';
  }

  // Menu
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.querySelector('.nav-links')?.classList.remove('open'));
  });

  // AI
  const knowledge = {
    architecture: 'Clean Architecture separates UI, Domain, and Data. Room is the single source of truth; network updates the DB; UI never talks to network directly. Multi-module boundaries keep features independent.',
    compose: 'Jetpack Compose enables declarative UI with unidirectional data flow. Prefer stable types, remember, and derivedStateOf. Profile recomposition and avoid unnecessary reads.',
    offline: 'Offline-first means the app works without network. Use Room + WorkManager for sync, optimistic UI, and conflict resolution. Cache aggressively and queue writes.',
    cicd: 'Typical pipeline: lint → unit tests → instrumented tests → build signed AAB → deploy to internal track. GitHub Actions and Azure DevOps both work well for Android.',
    kotlin: 'Kotlin is the default for modern Android: coroutines, Flow, sealed classes, multiplatform potential, and excellent Compose interop.',
    performance: 'Targets: cold start under 1s on mid devices, 60fps scrolling, memory budgets per screen. Use Baseline Profiles, R8, and Startup library.',
    project: 'Showcase work includes Video Player, Social Dashboard, POS systems, Weather, Job Portal — emphasizing modular architecture and offline capability.',
    contact: 'Phone +95 9 889 000 889 / +959 666 000 050 · moekyawaung@asia.com · GitHub Dev-moe-kyawaung · Tachileik ↔ Bangkok',
    default: 'Ask about Clean Architecture, Compose, offline-first design, CI/CD, performance, Kotlin, or projects. I explain design decisions in plain language.'
  };
  function reply(q) {
    const t = q.toLowerCase();
    if (t.includes('architect') || t.includes('clean') || t.includes('module')) return knowledge.architecture;
    if (t.includes('compose') || t.includes('ui')) return knowledge.compose;
    if (t.includes('offline') || t.includes('sync') || t.includes('room')) return knowledge.offline;
    if (t.includes('ci') || t.includes('cd') || t.includes('pipeline') || t.includes('deploy')) return knowledge.cicd;
    if (t.includes('kotlin')) return knowledge.kotlin;
    if (t.includes('perf') || t.includes('speed') || t.includes('start')) return knowledge.performance;
    if (t.includes('project') || t.includes('app') || t.includes('pos')) return knowledge.project;
    if (t.includes('contact') || t.includes('email') || t.includes('hire') || t.includes('phone')) return knowledge.contact;
    return knowledge.default;
  }
  const panel = document.getElementById('aiPanel');
  const msgs = document.getElementById('aiMessages');
  const input = document.getElementById('aiInput');
  document.getElementById('aiToggle')?.addEventListener('click', () => panel?.classList.toggle('open'));
  document.getElementById('aiClose')?.addEventListener('click', () => panel?.classList.remove('open'));
  function add(text, type) {
    const d = document.createElement('div');
    d.className = 'ai-msg ' + type;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function send() {
    const t = input?.value.trim();
    if (!t) return;
    add(t, 'user');
    input.value = '';
    setTimeout(() => add(reply(t), 'bot'), 350);
  }
  document.getElementById('aiSend')?.addEventListener('click', send);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  // Chart.js Radar — Skills Matrix
  function initSkillRadar() {
    const canvas = document.getElementById('skillRadar');
    if (!canvas || typeof Chart === 'undefined') return;

    const prefersLight = document.documentElement.getAttribute('data-theme') === 'light';
    const labelColor = prefersLight ? '#5a6280' : '#8b90a8';
    const gridColor = prefersLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const angleColor = prefersLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';

    const data = {
      labels: (window.__MKA_RADAR__ && window.__MKA_RADAR__.labels) || ['Mobile', 'Data', 'Cloud', 'Delivery', 'AI / Security', 'Testing'],
      datasets: [{
        label: 'Proficiency',
        data: (window.__MKA_RADAR__ && window.__MKA_RADAR__.values) || [96, 93, 90, 88, 82, 85],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#22d3ee',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };

    const config = {
      type: 'radar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              display: false,
              backdropColor: 'transparent'
            },
            grid: { color: gridColor },
            angleLines: { color: angleColor },
            pointLabels: {
              color: labelColor,
              font: { size: 11, family: "'Inter', system-ui, sans-serif", weight: '500' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 24, 0.92)',
            titleColor: '#e8eaf6',
            bodyColor: '#22d3ee',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.raw}%`
            }
          }
        }
      }
    };

    const chart = new Chart(canvas, config);
    window.__MKA_RADAR_CHART__ = chart;

    // Re-animate when scrolled into view (once)
    let animated = false;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !animated) {
          animated = true;
          chart.update();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkillRadar);
  } else {
    initSkillRadar();
  }

})();