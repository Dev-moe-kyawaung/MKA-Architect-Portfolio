/**
 * Dynamic data layer for MKA.ARCH portfolio
 * - Loads local JSON (projects, skills, config)
 * - Enriches with GitHub API (profile + repos)
 * - Falls back gracefully offline / rate-limited
 */
(function () {
  const CACHE_KEY = 'mka-arch-cache-v1';
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > CACHE_TTL_MS) return null;
      return data.payload;
    } catch {
      return null;
    }
  }

  function writeCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload }));
    } catch { /* quota */ }
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  async function githubJSON(path) {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (res.status === 403 || res.status === 429) {
      console.warn('[MKA] GitHub rate limited');
      return null;
    }
    if (!res.ok) return null;
    return res.json();
  }

  function setStatus(msg, isError) {
    let el = document.getElementById('dataStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dataStatus';
      el.className = 'data-status';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 4000);
  }

  function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid || !projects?.length) return;

    grid.innerHTML = projects.map((p) => {
      const stars = p.stars != null ? `<span class="meta-star">★ ${p.stars}</span>` : '';
      const lang = p.language ? `<span class="meta-lang">${p.language}</span>` : '';
      const tags = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join('');
      const desc = p.description || p.name;
      return `
        <a href="${p.url}" target="_blank" rel="noopener" class="project-card glass">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(desc)}</p>
          <div class="project-meta">${stars}${lang}</div>
          <div class="tags">${tags}</div>
        </a>`;
    }).join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateHeroStats({ publicRepos, followers, years, certs, socials }) {
    const map = {
      projects: publicRepos,
      years,
      certs,
      socials
    };
    // Match existing cards by label text
    document.querySelectorAll('.hero-stats .stat-card').forEach((card) => {
      const label = card.querySelector('.stat-l')?.textContent?.trim().toLowerCase();
      const numEl = card.querySelector('.stat-n');
      if (!numEl || !label) return;
      let val = null;
      if (label.includes('project') && map.projects != null) val = map.projects;
      else if (label.includes('year') && map.years != null) val = map.years;
      else if (label.includes('cert') && map.certs != null) val = map.certs;
      else if (label.includes('social') && map.socials != null) val = map.socials;
      if (val != null) {
        numEl.dataset.count = String(val);
        // If counters already ran, update text directly
        if (numEl.textContent !== '0') {
          numEl.textContent = val + (val >= 10 ? '+' : '');
        }
      }
    });

    // Optional live badge
    let live = document.getElementById('liveGithubBadge');
    if (!live && followers != null) {
      const badgeRow = document.querySelector('.hero .badge');
      if (badgeRow) {
        live = document.createElement('span');
        live.id = 'liveGithubBadge';
        live.className = 'live-badge';
        live.innerHTML = `GitHub · ${followers} followers · live`;
        badgeRow.parentNode.insertBefore(live, badgeRow.nextSibling);
      }
    } else if (live && followers != null) {
      live.innerHTML = `GitHub · ${followers} followers · live`;
    }
  }

  function applySkills(skills) {
    if (!skills) return;
    // Bars
    if (skills.bars?.length) {
      const container = document.getElementById('skillBars');
      if (container) {
        const h3 = container.querySelector('h3');
        const rows = skills.bars.map((b) => `
          <div class="skill-row">
            <div class="skill-top"><span>${escapeHtml(b.name)}</span><span>${b.value}%</span></div>
            <div class="skill-track"><div class="skill-fill" data-w="${b.value}"></div></div>
          </div>`).join('');
        container.innerHTML = (h3 ? h3.outerHTML : '<h3>Core proficiency</h3>') + rows;
        // Re-trigger bar animation
        requestAnimationFrame(() => {
          container.querySelectorAll('[data-w]').forEach((el) => {
            el.style.width = el.dataset.w + '%';
          });
        });
      }
    }
    // Radar values for Chart.js (if already created, update; else store for init)
    if (skills.radar) {
      window.__MKA_RADAR__ = skills.radar;
      if (window.__MKA_RADAR_CHART__) {
        const c = window.__MKA_RADAR_CHART__;
        c.data.labels = skills.radar.labels;
        c.data.datasets[0].data = skills.radar.values;
        c.update();
      }
    }
  }

  async function loadLocalData() {
    const base = new URL('.', document.currentScript?.src || window.location.href);
    // Prefer relative to site root
    const root = window.location.pathname.includes('/pages/') ? '../' : './';
    const [projects, skills, config] = await Promise.all([
      fetchJSON(`${root}data/projects.json`).catch(() => null),
      fetchJSON(`${root}data/skills.json`).catch(() => null),
      fetchJSON(`${root}data/config.json`).catch(() => null)
    ]);
    return { projects, skills, config };
  }

  async function enrichFromGitHub(localProjects, config) {
    const users = config?.githubUsers || ['Dev-moe-kyawaung'];
    const primary = config?.primaryUser || users[0];

    const profile = await githubJSON(`/users/${primary}`);
    let allRepos = [];
    for (const u of users) {
      const repos = await githubJSON(`/users/${u}/repos?per_page=100&sort=updated`);
      if (Array.isArray(repos)) {
        allRepos = allRepos.concat(repos.map((r) => ({ ...r, _owner: u })));
      }
    }

    // Merge curated projects with live star/language data
    let projects = localProjects || [];
    if (allRepos.length) {
      const byFull = Object.fromEntries(allRepos.map((r) => [r.full_name.toLowerCase(), r]));
      const byName = Object.fromEntries(allRepos.map((r) => [r.name.toLowerCase(), r]));

      projects = projects.map((p) => {
        const key = (p.repo || '').toLowerCase();
        const live = byFull[key] || byName[(p.name || '').toLowerCase().replace(/\s+/g, '-')];
        if (!live) return p;
        return {
          ...p,
          description: p.description || live.description || p.name,
          url: p.url || live.html_url,
          stars: live.stargazers_count,
          language: live.language,
          updated: live.updated_at
        };
      });

      // Optionally append top extra repos not already listed
      const listed = new Set(projects.map((p) => (p.repo || '').toLowerCase()));
      const extras = allRepos
        .filter((r) => !r.fork && !listed.has(r.full_name.toLowerCase()))
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 4)
        .map((r) => ({
          name: r.name,
          description: r.description || 'Open-source repository',
          url: r.html_url,
          tags: r.language ? [r.language] : [],
          repo: r.full_name,
          stars: r.stargazers_count,
          language: r.language
        }));
      projects = projects.concat(extras);
    }

    const publicRepos =
      profile?.public_repos ??
      (allRepos.length || config?.stats?.projectsFallback || 40);

    return {
      projects,
      profile: {
        publicRepos,
        followers: profile?.followers,
        following: profile?.following,
        avatar: profile?.avatar_url,
        bio: profile?.bio
      }
    };
  }

  async function boot() {
    setStatus('Loading data…');

    // Cache first for instant paint
    const cached = readCache();
    if (cached?.projects) {
      renderProjects(cached.projects);
      if (cached.skills) applySkills(cached.skills);
      if (cached.profile) {
        updateHeroStats({
          ...cached.profile,
          years: cached.config?.stats?.years ?? 10,
          certs: cached.config?.stats?.certs ?? 82,
          socials: cached.config?.stats?.socials ?? 16
        });
      }
    }

    try {
      const local = await loadLocalData();
      if (local.skills) applySkills(local.skills);

      let projects = local.projects || [];
      let profile = {
        publicRepos: local.config?.stats?.projectsFallback ?? 40,
        followers: null
      };

      try {
        const live = await enrichFromGitHub(projects, local.config);
        projects = live.projects;
        profile = live.profile;
        setStatus('Synced with GitHub');
      } catch (e) {
        console.warn('[MKA] GitHub enrich failed', e);
        setStatus('Using local data (GitHub offline)', true);
      }

      renderProjects(projects);
      updateHeroStats({
        publicRepos: profile.publicRepos,
        followers: profile.followers,
        years: local.config?.stats?.years ?? 10,
        certs: local.config?.stats?.certs ?? 82,
        socials: local.config?.stats?.socials ?? 16
      });

      writeCache({
        projects,
        skills: local.skills,
        profile,
        config: local.config
      });
    } catch (e) {
      console.error('[MKA] Data load failed', e);
      setStatus('Data load failed — showing static content', true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose refresh for AI / debug
  window.MKA_refreshData = boot;
})();
