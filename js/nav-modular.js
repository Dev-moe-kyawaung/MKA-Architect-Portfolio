/**
 * Modular navigation — theme, language (EN / Myanmar / Thai), currency
 * + cinematic hero particle mouse interaction
 */
(function () {
  const I18N = {
    en: {
      nav_home: 'Home',
      nav_skills: 'Skills',
      nav_roadmap: 'Roadmap',
      nav_compose: 'Compose',
      nav_arch: 'Architecture',
      nav_perf: 'Perf',
      nav_cicd: 'CI/CD',
      nav_projects: 'Projects',
      nav_lab: 'Lab',
      nav_contact: 'Contact',
      hero_badge: 'OPEN TO ARCHITECT ROLES',
      hero_desc:
        'Senior Mobile/Android App Architect designing scalable, offline-first systems with Kotlin, Jetpack Compose, Clean Architecture, and production CI/CD. Bridging Myanmar and global tech.',
      currency_hint: 'Rates display: {cur} · for freelance estimates',
      lang_label: 'EN'
    },
    my: {
      nav_home: 'ပင်မ',
      nav_skills: 'ကျွမ်းကျင်မှု',
      nav_roadmap: 'လမ်းကြောင်း',
      nav_compose: 'Compose',
      nav_arch: 'ဗိသုကာ',
      nav_perf: 'စွမ်းဆောင်ရည်',
      nav_cicd: 'CI/CD',
      nav_projects: 'ပရောဂျက်',
      nav_lab: 'Lab',
      nav_contact: 'ဆက်သွယ်ရန်',
      hero_badge: 'ARCHITECT အခန်းကဏ္ဍ ဖွင့်ထားသည်',
      hero_desc:
        'Kotlin၊ Jetpack Compose၊ Clean Architecture နှင့် production CI/CD ဖြင့် scalable offline-first စနစ်များကို ဒီဇိုင်းဆွဲသော Senior Mobile/Android App Architect။ မြန်မာနှင့် ကမ္ဘာ့နည်းပညာကို ချိတ်ဆက်သည်။',
      currency_hint: 'ငွေကြေးပြသမှု: {cur} · freelance ခန့်မှန်းချက်များအတွက်',
      lang_label: 'မြန်မာ'
    },
    th: {
      nav_home: 'หน้าแรก',
      nav_skills: 'ทักษะ',
      nav_roadmap: 'เส้นทาง',
      nav_compose: 'Compose',
      nav_arch: 'สถาปัตยกรรม',
      nav_perf: 'ประสิทธิภาพ',
      nav_cicd: 'CI/CD',
      nav_projects: 'โปรเจกต์',
      nav_lab: 'Lab',
      nav_contact: 'ติดต่อ',
      hero_badge: 'เปิดรับบทบาทสถาปนิก',
      hero_desc:
        'สถาปนิกแอป Android/มือถือระดับซีเนียร์ ออกแบบระบบ offline-first ที่ขยายได้ด้วย Kotlin, Jetpack Compose, Clean Architecture และ CI/CD — เชื่อมเมียนมาร์กับเทคโนโลยีโลก',
      currency_hint: 'แสดงอัตรา: {cur} · สำหรับประมาณการงานฟรีแลนซ์',
      lang_label: 'ไทย'
    }
  };

  // Approx display rates vs USD (illustrative for portfolio UI only)
  const RATES = {
    USD: { symbol: '$', label: 'USD', rate: 1 },
    MMK: { symbol: 'K', label: 'MMK', rate: 2100 },
    THB: { symbol: '฿', label: 'THB', rate: 35 },
    EUR: { symbol: '€', label: 'EUR', rate: 0.92 }
  };

  const state = {
    lang: localStorage.getItem('mka-lang') || 'en',
    theme: localStorage.getItem('mka-theme') || 'dark',
    currency: localStorage.getItem('mka-currency') || 'USD'
  };

  function applyLang(lang) {
    state.lang = lang;
    localStorage.setItem('mka-lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.lang = lang === 'my' ? 'my' : lang === 'th' ? 'th' : 'en';

    const t = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });

    // Existing data-en / data-my attributes (legacy)
    document.querySelectorAll('[data-en]').forEach((el) => {
      if (lang === 'my' && el.hasAttribute('data-my')) {
        const v = el.getAttribute('data-my');
        if (v.includes('<br')) el.innerHTML = v;
        else el.textContent = v;
      } else if (lang === 'en' && el.hasAttribute('data-en')) {
        const v = el.getAttribute('data-en');
        if (v.includes('<br')) el.innerHTML = v;
        else el.textContent = v;
      } else if (lang === 'th' && el.hasAttribute('data-en')) {
        // Thai uses i18n map for key strings; fall back to EN for unmarked
        el.textContent = el.getAttribute('data-en');
      }
    });

    // Hero desc override from I18N
    const desc = document.querySelector('.hero-desc');
    if (desc && t.hero_desc) desc.textContent = t.hero_desc;

    const badge = document.querySelector('.badge');
    if (badge && t.hero_badge) {
      const dot = badge.querySelector('.badge-dot');
      badge.innerHTML = '';
      if (dot) badge.appendChild(dot);
      badge.appendChild(document.createTextNode(' ' + t.hero_badge));
    }

    const langBtn = document.getElementById('langBtn');
    if (langBtn) langBtn.textContent = '🌐 ' + t.lang_label;

    document.querySelectorAll('#langDropdown [data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    updateCurrencyHint();
  }

  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('mka-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☾' : '☀';
  }

  function applyCurrency(code) {
    state.currency = code;
    localStorage.setItem('mka-currency', code);
    const info = RATES[code] || RATES.USD;
    const btn = document.getElementById('currencyBtn');
    if (btn) btn.textContent = '💱 ' + info.label;
    document.querySelectorAll('#currencyDropdown [data-currency]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-currency') === code);
    });
    updateCurrencyHint();
    // Dispatch for any pricing widgets
    window.dispatchEvent(
      new CustomEvent('mka-currency', { detail: { code, ...info } })
    );
  }

  function updateCurrencyHint() {
    const hint = document.getElementById('currencyHint');
    const label = document.getElementById('currencyLabel');
    const t = I18N[state.lang] || I18N.en;
    const info = RATES[state.currency] || RATES.USD;
    if (label) label.textContent = info.label + ' ' + info.symbol;
    if (hint && t.currency_hint) {
      // Keep structure with strong tag
      const strong = hint.querySelector('strong');
      if (strong) strong.textContent = info.label + ' ' + info.symbol;
    }
  }

  function setupDropdown(id) {
    const root = document.getElementById(id);
    if (!root) return;
    const btn = root.querySelector('.nav-dropdown-btn');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.nav-dropdown.open').forEach((d) => {
        if (d !== root) d.classList.remove('open');
      });
      root.classList.toggle('open');
      btn.setAttribute('aria-expanded', root.classList.contains('open'));
    });
  }

  function setupParticleMouse() {
    const canvas = document.getElementById('particles');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    // Soft attractor point for existing particle loop if exposed
    window.__MKA_MOUSE__ = { x: null, y: null, active: false };

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      window.__MKA_MOUSE__.x = e.clientX;
      window.__MKA_MOUSE__.y = e.clientY;
      window.__MKA_MOUSE__.active = true;
      // Parallax morph panels
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      document.querySelectorAll('.morph-panel').forEach((p, i) => {
        const depth = (i + 1) * 12;
        p.style.transform = `translate(${mx * depth}px, ${my * depth}px)`;
      });
    });
    hero.addEventListener('pointerleave', () => {
      window.__MKA_MOUSE__.active = false;
      document.querySelectorAll('.morph-panel').forEach((p) => {
        p.style.transform = '';
      });
    });
  }

  function init() {
    applyLang(state.lang);
    applyTheme(state.theme);
    applyCurrency(state.currency);

    setupDropdown('langDropdown');
    setupDropdown('currencyDropdown');

    document.querySelectorAll('#langDropdown [data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLang(btn.getAttribute('data-lang'));
        document.getElementById('langDropdown')?.classList.remove('open');
      });
    });

    document.querySelectorAll('#currencyDropdown [data-currency]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyCurrency(btn.getAttribute('data-currency'));
        document.getElementById('currencyDropdown')?.classList.remove('open');
      });
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
    });

    // Scroll shadow on nav
    const nav = document.getElementById('mainNav');
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu (reuse existing)
    document.getElementById('menuBtn')?.addEventListener('click', () => {
      document.getElementById('navLinks')?.classList.toggle('open');
      document.querySelector('.nav-links')?.classList.toggle('open');
    });

    setupParticleMouse();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.MKA_nav = { applyLang, applyTheme, applyCurrency, RATES, I18N };
})();
